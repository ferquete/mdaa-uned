<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { PIM_NODE_METADATA, PIM_MODIFIABLE_PARAMS } from '../utils/pim-node-metadata'

const props = defineProps<{
  nodeId?: string
  availableCimComponents?: { id: string; name: string; type: string }[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete-node', nodeId: string): void
  (e: 'remove-edges-for-param', nodeId: string, paramName: string): void
}>()

const { findNode } = useVueFlow({ id: 'pim-flow' })

const selectedNode = computed(() => {
  if (!props.nodeId) return null
  return findNode(props.nodeId)
})

const nodeType = computed(() => selectedNode.value?.data.type || '')
const metadata = computed(() => PIM_NODE_METADATA[nodeType.value])

// --- Estado local para edición ---
const localName = ref('')
const localDescription = ref('')
const localRefs = ref<string[]>([])
const localParams = ref<Record<string, any>>({})
const localModifiable = ref<Record<string, boolean>>({})
const localExternalInputs = ref<Record<string, boolean>>({})
const errors = ref<Record<string, string>>({})
const localOthers = ref<any[]>([])
const localParamRefs = ref<Record<string, string[]>>({})

// Confirmación de borrado de nodo
const showDeleteConfirm = ref(false)

/**
 * Configuración de parámetros por tipo para renderizado dinámico.
 * Define rangos, opciones y comportamiento de cada propiedad técnica.
 */
const NODE_PARAMS_BY_TYPE: Record<string, any> = {
  // Comunes
  stereo: { label: 'Estéreo', type: 'boolean', description: 'Habilita procesado de 2 canales' },
  ping_pong: { label: 'Ping Pong', type: 'boolean', description: 'Alternancia de canales' },
  
  // Generadores
  waveform: { 
    label: 'Forma de Onda', 
    type: 'select', 
    options: [
      { label: 'Sinusoidal', value: 'sine' },
      { label: 'Cuadrada', value: 'square' },
      { label: 'Diente de Sierra', value: 'sawtooth' },
      { label: 'Triangular', value: 'triangle' },
      { label: 'Pulso', value: 'pulse' },
      { label: 'Matriz', value: 'matrix' }
    ]
  },
  frequency: { label: 'Frecuencia', type: 'number', min: 0, max: 20000, step: 1, unit: 'Hz' },
  pulseWidth: { label: 'Ancho de Pulso', type: 'number', min: 0, max: 1, step: 0.01 },
  gain: { label: 'Ganancia', type: 'number', min: 0, max: 1, step: 0.01 },
  phase: { label: 'Fase', type: 'number', min: 0, max: 6.283, step: 0.001, unit: 'rad' },
  pan: { label: 'Paneo', type: 'number', min: -1, max: 1, step: 0.01 },
  noiseType: { 
    label: 'Tipo de Ruido', 
    type: 'select', 
    options: [
      { label: 'Blanco', value: 'white' },
      { label: 'Rosa', value: 'pink' },
      { label: 'Browniano', value: 'brownian' }
    ]
  },
  amplitude: { label: 'Amplitud', type: 'number', min: 0, max: 1, step: 0.01 },
  file: { label: 'Archivo de Audio', type: 'string', showRefs: false, canBeExternal: false },
  loop: { label: 'Bucle', type: 'boolean', description: 'Repetición infinita' },
  
  // Modificadores de Control
  rate: { label: 'Velocidad (Rate)', type: 'number', min: 0.01, max: 50, step: 0.01, unit: 'Hz' },
  sync: { label: 'Sincronizar Tempo', type: 'boolean', description: 'Ajuste al reloj global' },
  envelopeType: { 
    label: 'Tipo de Envolvente', 
    type: 'select', 
    options: [
      { label: 'ADSR', value: 'ADSR' },
      { label: 'ADR', value: 'ADR' },
      { label: 'AR', value: 'AR' },
      { label: 'DAHDSR', value: 'DAHDSR' }
    ]
  },
  attack: { label: 'Ataque', type: 'number', min: 0, max: 10, step: 0.001, unit: 's' },
  decay: { label: 'Caída (Decay)', type: 'number', min: 0, max: 10, step: 0.001, unit: 's' },
  sustain: { label: 'Sostenido', type: 'number', min: 0, max: 1, step: 0.01 },
  release: { label: 'Relajación', type: 'number', min: 0, max: 10, step: 0.001, unit: 's' },
  delay: { label: 'Retraso (Pre-Delay)', type: 'number', min: 0, max: 5, step: 0.001, unit: 's' },
  hold: { label: 'Mantenimiento (Hold)', type: 'number', min: 0, max: 5, step: 0.001, unit: 's' },
  curve: { 
    label: 'Curva de Respuesta', 
    type: 'select', 
    options: [
      { label: 'Lineal', value: 'linear' },
      { label: 'Exponencial', value: 'exponential' },
      { label: 'Logarítmica', value: 'logarithmic' }
    ]
  },

  // Efectos
  filterType: { 
    label: 'Tipo de Filtro', 
    type: 'select', 
    options: [
      { label: 'Pasa-Bajos (LPF)', value: 'LPF' },
      { label: 'Pasa-Altos (HPF)', value: 'HPF' },
      { label: 'Pasa-Banda (BPF)', value: 'BPF' },
      { label: 'Notch (Rechaza-Banda)', value: 'Notch' }
    ]
  },
  cutoff: { label: 'Corte (Cutoff)', type: 'number', min: 20, max: 20000, step: 1, unit: 'Hz' },
  resonance: { label: 'Resonancia (Q)', type: 'number', min: 0, max: 10, step: 0.1 },
  slope: { 
    label: 'Pendiente', 
    type: 'select', 
    options: [
      { label: '12 dB/oct', value: '12dB/oct' },
      { label: '24 dB/oct', value: '24dB/oct' },
      { label: '48 dB/oct', value: '48dB/oct' }
    ]
  },
  roomSize: { label: 'Tamaño de Sala', type: 'number', min: 0, max: 1, step: 0.01 },
  damping: { label: 'Amortiguación', type: 'number', min: 0, max: 1, step: 0.01 },
  decayTime: { label: 'Tiempo de Decaimiento', type: 'number', min: 0, max: 20, step: 0.1, unit: 's' },
  dryWet: { label: 'Mezcla Dry/Wet', type: 'number', min: 0, max: 1, step: 0.01 },
  delayTime: { label: 'Tiempo de Retraso', type: 'number', min: 0, max: 5, step: 0.001, unit: 's' },
  feedback: { label: 'Retroalimentación', type: 'number', min: 0, max: 1, step: 0.01 },
  lowPassCutoff: { label: 'LPF Interno', type: 'number', min: 20, max: 20000, step: 1, unit: 'Hz' },
  highPassCutoff: { label: 'HPF Interno', type: 'number', min: 20, max: 20000, step: 1, unit: 'Hz' },
  drive: { label: 'Saturación (Drive)', type: 'number', min: 0, max: 1, step: 0.01 },
  tone: { label: 'Tono (Brillo)', type: 'number', min: 0, max: 1, step: 0.01 },
  distType: { 
    label: 'Tipo de Distorsión', 
    type: 'select', 
    options: [
      { label: 'Soft Clipping', value: 'soft-clipping' },
      { label: 'Hard Clipping', value: 'hard-clipping' },
      { label: 'Bitcrush', value: 'bitcrush' }
    ]
  },
  outputLevel: { label: 'Nivel de Salida', type: 'number', min: 0, max: 1, step: 0.01 },
  depth: { label: 'Profundidad (Depth)', type: 'number', min: 0, max: 1, step: 0.01 },
  mix: { label: 'Mezcla Final', type: 'number', min: 0, max: 1, step: 0.01 },
  threshold: { label: 'Umbral (Threshold)', type: 'number', min: -60, max: 0, step: 0.1, unit: 'dB' },
  ratio: { label: 'Relación (Ratio)', type: 'number', min: 1, max: 20, step: 0.1 },
  makeupGain: { label: 'Ganancia de Compensación', type: 'number', min: 0, max: 24, step: 0.1, unit: 'dB' },
  bandFrequency: { label: 'Frecuencia de Banda', type: 'number', min: 20, max: 20000, step: 1, unit: 'Hz' },
  bandwidth: { label: 'Ancho de Banda (Q)', type: 'number', min: 0.1, max: 10, step: 0.1 },
  
  // Mezcla
  inputs_number: { label: 'Número de Entradas', type: 'number', min: 1, max: 10, step: 1 }
};

function validateAll() {
  errors.value = {}
  validateField('name', localName.value)
  Object.entries(localParams.value).forEach(([k, v]) => validateField(k, v))
  localOthers.value.forEach((other, index) => {
    validateField(`other_name_${index}`, other.name)
    validateField(`other_value_${index}`, other.initialValue)
  })
}

function validateField(field: string, value: any) {
  delete errors.value[field]

  if (field === 'name') {
    if (!value || value.length < 1) errors.value.name = 'El nombre es obligatorio'
    if (value.length > 20) errors.value.name = 'Máximo 20 caracteres'
  }
  
  // Validación dinámica según configuración
  const config = NODE_PARAMS_BY_TYPE[field]
  if (config && config.type === 'number') {
    if (config.min !== undefined && value < config.min) {
      errors.value[field] = `Mínimo: ${config.min}${config.unit || ''}`
    }
    if (config.max !== undefined && value > config.max) {
      errors.value[field] = `Máximo: ${config.max}${config.unit || ''}`
    }
  }

  if (field.startsWith('other_name_')) {
    if (!value || value.length < 1) errors.value[field] = 'Mínimo 1 carácter'
    if (value && value.length > 20) errors.value[field] = 'Máximo 20 caracteres'
  }
  if (field.startsWith('other_value_')) {
    if (!value || value.length < 1) errors.value[field] = 'Mínimo 1 carácter'
    if (value && value.length > 100) errors.value[field] = 'Máximo 100 caracteres'
  }

  updateNode()
}

/**
 * Gestiona la visibilidad de puertos estéreo y limpia aristas huérfanas.
 */
function handleStereoChange() {
  const isStereo = localParams.value.stereo === true
  
  if (!isStereo) {
    // Si pasamos a mono, eliminar puertos secundarios de la estructura de datos
    delete localParams.value.output_2
    delete localParams.value.input_2
    delete localParams.value.ping_pong
    
    // Notificar al padre que limpie las aristas que pudieran estar conectadas a estos puertos
    if (props.nodeId) {
      emit('remove-edges-for-param', props.nodeId, 'output_2')
      emit('remove-edges-for-param', props.nodeId, 'input_2')
      emit('remove-edges-for-param', props.nodeId, 'ping_pong')
    }
  } else {
    // Si pasamos a estéreo, asegurar que existan los objetos ConnectionPoint
    if (!localParams.value.output_2) localParams.value.output_2 = { id: crypto.randomUUID(), ids_references: [] }
    if (!localParams.value.input_2 && nodeType.value !== 'oscillator' && nodeType.value !== 'noise') {
        localParams.value.input_2 = { id: crypto.randomUUID(), ids_references: [] }
    }
    if (!localParams.value.ping_pong) localParams.value.ping_pong = { initialValue: false, isModifiable: true }
  }
  
  updateNode()
}

async function syncNodeData(nodeId: string | undefined) {
  if (!nodeId) return
  
  let node = findNode(nodeId)
  
  if (!node) {
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 50))
      node = findNode(nodeId)
      if (node) break
    }
  }
  
  if (!node) return
  
  const data = node.data

  const extractValue = (raw: any): any => {
    if (raw !== null && typeof raw === 'object' && 'initialValue' in raw) {
      return extractValue(raw.initialValue)
    }
    return raw
  }

  const rawName = data.name
  localName.value = (typeof rawName === 'string' ? rawName : String(rawName ?? ''))
  localDescription.value = typeof data.description === 'string' ? data.description : ''
  localRefs.value = [...(data.parameters?.ids_references || [])]
  localOthers.value = JSON.parse(JSON.stringify(data.parameters?.others || []))

  const rawParams = data.parameters || {}
  const flatParams: Record<string, any> = {}
  const refs: Record<string, string[]> = {}
  
  const reservedKeys = ['others', '_isModifiable', 'name', 'description', 'ids_references']
  
  Object.entries(rawParams).forEach(([k, v]) => {
    if (reservedKeys.includes(k)) return
    
    flatParams[k] = extractValue(v)
    if (v && typeof v === 'object' && 'ids_references' in v && Array.isArray((v as any).ids_references)) {
      refs[k] = [...(v as any).ids_references]
    } else {
      refs[k] = []
    }
  })
  
  flatParams._isModifiable = rawParams._isModifiable
  
  // Asegurar que todos los puertos del metadata existan como objetos en localParams
  if (data.type && PIM_NODE_METADATA[data.type]) {
    const meta = PIM_NODE_METADATA[data.type]
    const allPortIds = [...meta.inputs.map(i => i.id), ...meta.outputs.map(o => o.id)]
    allPortIds.forEach(id => {
      if (!flatParams[id] || typeof flatParams[id] !== 'object') {
        flatParams[id] = flatParams[id] || {}
        if (typeof flatParams[id] !== 'object') {
           // Si por algún error era un primitivo, lo convertimos
           flatParams[id] = { id: crypto.randomUUID(), ids_references: [] }
        }
      }
      // Garantizar que tenga id e ids_references
      if (!flatParams[id].id) flatParams[id].id = crypto.randomUUID()
      if (!flatParams[id].ids_references) flatParams[id].ids_references = []
    })
  }

  localParams.value = flatParams
  localParamRefs.value = refs
  
  const modParams = PIM_MODIFIABLE_PARAMS[data.type] || []
  const modFlags: Record<string, boolean> = {}
  modParams.forEach(p => {
    const existingFlags = rawParams._isModifiable
    const wrappedModifiable = (rawParams[p] && typeof rawParams[p] === 'object') ? rawParams[p].isModifiable : undefined
    if (existingFlags && typeof existingFlags === 'object' && p in existingFlags) {
      modFlags[p] = existingFlags[p]
    } else if (wrappedModifiable !== undefined) {
      modFlags[p] = wrappedModifiable
    } else {
      modFlags[p] = true
    }
  })
  localModifiable.value = modFlags
  
  // Sincronizar flags de externalización para parámetros
  const extFlags: Record<string, boolean> = {}
  Object.keys(flatParams).forEach(k => {
    if (reservedKeys.includes(k)) return
    const paramObj = rawParams[k]
    if (paramObj && typeof paramObj === 'object') {
      extFlags[k] = paramObj.isExternalInput === true
    } else {
      extFlags[k] = false
    }
  })
  localExternalInputs.value = extFlags
  
  validateAll()
}

watch(() => props.nodeId, syncNodeData, { immediate: true })

function updateNode() {
  const node = props.nodeId ? findNode(props.nodeId) : null
  if (!node) return
  
  node.data = {
    ...node.data,
    name: localName.value,
    description: localDescription.value,
    parameters: {
      ...localParams.value,
      name: localName.value,
      description: localDescription.value,
      ids_references: [...localRefs.value],
      others: JSON.parse(JSON.stringify(localOthers.value)),
      _isModifiable: { ...localModifiable.value },
      // Inject ids_references back into structured parameter objects, only for non-reserved keys
      ...Object.fromEntries(
        Object.entries(localParamRefs.value)
          .filter(([k]) => !['others', '_isModifiable', 'name', 'description', 'ids_references'].includes(k))
          .map(([k, refs]) => {
            const currentVal = localParams.value[k]
            const original = (selectedNode.value?.data.parameters || {})[k] || {}
            
            if (currentVal && typeof currentVal === 'object' && !Array.isArray(currentVal) && !('initialValue' in currentVal)) {
              // Caso de ConnectionPoint: es un objeto pero no tiene un valor inicial escalar propio
              return [k, { ...original, ...currentVal, ids_references: [...refs] }]
            } else {
              // Caso de parámetro escalar o parámetro ya estructurado/corrupto
              // Extraer el valor real si accidentalmente recibimos un objeto estructurado aquí
              let scalar = currentVal
              if (currentVal && typeof currentVal === 'object' && 'initialValue' in currentVal) {
                scalar = currentVal.initialValue
              }
              // Si scalar sigue siendo un objeto (como el caso corrupto "0": "s"), intentar sanearlo
              if (scalar && typeof scalar === 'object' && '0' in scalar) {
                scalar = Object.values(scalar).filter(v => typeof v === 'string' && v.length === 1).join('')
              }

              return [k, { 
                ...original, 
                ids_references: [...refs], 
                initialValue: scalar,
                isExternalInput: localExternalInputs.value[k] === true
              }]
            }
          })
      )
    },
    isValid: Object.keys(errors.value).length === 0
  }
}

/**
 * Alterna el flag isModifiable de un parámetro.
 * Si se desactiva, solicita la eliminación de las aristas de modulación entrantes.
 */
const handleToggleModifiable = (paramName: string) => {
  const wasMod = localModifiable.value[paramName]
  localModifiable.value[paramName] = !wasMod
  updateNode()

  // Si pasó de true → false, eliminar aristas de modulación vinculadas
  if (wasMod && props.nodeId) {
    emit('remove-edges-for-param', props.nodeId, paramName)
  }
}

const modifiableParamsList = computed(() => PIM_MODIFIABLE_PARAMS[nodeType.value] || [])

// --- Otros Parámetros ---
const addOther = () => {
  localOthers.value.push({
    id: crypto.randomUUID(),
    name: 'Nuevo Control',
    initialValue: 'Valor inicial',
    isModifiable: true,
    ids_references: []
  })
  validateAll()
  updateNode()
}

const removeOther = (index: number) => {
  localOthers.value.splice(index, 1)
  validateAll()
  updateNode()
}

const toggleParamRef = (paramKey: string, cimId: string) => {
  if (!localParamRefs.value[paramKey]) {
    localParamRefs.value[paramKey] = []
  }
  const idx = localParamRefs.value[paramKey].indexOf(cimId)
  if (idx === -1) {
    localParamRefs.value[paramKey].push(cimId)
  } else {
    localParamRefs.value[paramKey].splice(idx, 1)
  }
  updateNode()
}

const toggleOtherRef = (otherIndex: number, cimId: string) => {
  const other = localOthers.value[otherIndex]
  if (!other.ids_references) other.ids_references = []
  const idx = other.ids_references.indexOf(cimId)
  if (idx === -1) {
    other.ids_references.push(cimId)
  } else {
    other.ids_references.splice(idx, 1)
  }
  updateNode()
}

/**
 * Confirma el borrado del nodo actual.
 */
const confirmDeleteNode = () => {
  if (props.nodeId) {
    emit('delete-node', props.nodeId)
    showDeleteConfirm.value = false
  }
}
</script>

<template>
  <aside class="pim-editor-properties w-80 border-l border-geist-border bg-geist-bg flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.03)] selection:bg-geist-accents-2">
    <!-- Header -->
    <div class="px-4 h-12 flex items-center justify-between border-b border-geist-border bg-geist-accents-1/30">
      <div class="flex items-center gap-2">
        <div 
          v-if="metadata"
          class="w-6 h-6 rounded bg-geist-bg border border-geist-border flex items-center justify-center"
        >
          <i :class="['fa-solid', metadata.icon, metadata.colorClass, 'text-[10px]']"></i>
        </div>
        <h3 class="text-[10px] font-bold uppercase tracking-[0.15em] text-geist-accents-5">
          Propiedades
        </h3>
      </div>
      <button 
        @click="emit('close')"
        class="text-geist-accents-4 hover:text-geist-fg transition-colors w-6 h-6 flex items-center justify-center rounded-md hover:bg-geist-accents-2"
      >
        <i class="fa-solid fa-xmark text-xs"></i>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div v-if="!nodeId" class="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
        <div class="w-16 h-16 rounded-2xl bg-geist-accents-1 flex items-center justify-center mx-auto mb-4 border border-geist-border">
          <i class="fa-solid fa-mouse-pointer text-2xl"></i>
        </div>
        <p class="text-[10px] font-medium text-geist-accents-5 max-w-[180px]">
          Selecciona un nodo en el lienzo para editar sus parámetros técnicos
        </p>
      </div>
      
      <div v-else class="p-4 space-y-6">
        <!-- Identificación -->
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-geist-accents-5 uppercase tracking-widest">Nombre del Nodo</label>
            <input 
              v-model="localName"
              @input="validateField('name', localName)"
              type="text"
              class="geist-input w-full text-xs"
              :class="{ 'border-geist-error focus:ring-geist-error/20': errors.name }"
            >
            <span v-if="errors.name" class="text-[9px] text-geist-error font-medium">{{ errors.name }}</span>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-geist-accents-5 uppercase tracking-widest">Referencias CIM del Nodo</label>
            <div v-if="(props.availableCimComponents || []).length === 0" class="p-2 border border-dashed border-geist-border rounded-lg bg-geist-accents-1/50">
              <p class="text-[9px] text-geist-accents-4 italic">Sin componentes CIM disponibles</p>
            </div>
            <div v-else class="space-y-1 max-h-32 overflow-y-auto custom-scrollbar border border-geist-border rounded-lg p-2 bg-geist-accents-1/30">
              <label 
                v-for="comp in props.availableCimComponents" 
                :key="comp.id"
                class="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-geist-accents-1/50 rounded px-1 transition-colors"
              >
                <input 
                  type="checkbox" 
                  :value="comp.id" 
                  v-model="localRefs"
                  @change="updateNode"
                  class="accent-emerald-500 w-3 h-3 rounded"
                >
                <span class="text-[9px] text-geist-fg truncate">{{ comp.name }}</span>
                <span class="text-[7px] px-1 py-0.5 rounded-full ml-auto flex-shrink-0"
                  :class="comp.type === 'g' ? 'bg-rose-500/10 text-rose-500' : comp.type === 'mod' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'"
                >{{ comp.type === 'g' ? 'GEN' : comp.type === 'mod' ? 'MOD' : 'EDGE' }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border"></div>

        <!-- Parámetros Técnicos -->
        <div class="space-y-5">
          <h4 class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-[0.2em] mb-4">Parámetros de {{ metadata?.label }}</h4>
          
          <!-- Renderizado Dinámico de Parámetros -->
          <div v-for="(pConfig, pName) in NODE_PARAMS_BY_TYPE" :key="pName">
            <div v-if="pName in localParams" class="space-y-3 pb-2 border-b border-geist-accents-1 last:border-0">
              
              <!-- Header del Parámetro -->
              <div class="flex justify-between items-center">
                <label class="text-[10px] font-medium text-geist-fg">
                  {{ pConfig.label }}
                  <span v-if="pConfig.unit" class="text-geist-accents-4 lowercase">({{ pConfig.unit }})</span>
                </label>
                <div class="flex items-center gap-3">
                  <span class="text-[10px] font-mono font-bold">
                    {{ typeof localParams[pName] === 'boolean' ? (localParams[pName] ? 'Activado' : 'Desactivado') : localParams[pName] }}
                  </span>
                  
                  <div v-if="pConfig.canBeExternal !== false" class="flex items-center gap-1.5" title="Hacer este parámetro visible desde fuera de la máquina">
                    <span class="text-[8px] font-bold text-geist-accents-4 uppercase tracking-tighter">Entrada Externa</span>
                    <button 
                      @click="localExternalInputs[pName] = !localExternalInputs[pName]; updateNode()"
                      class="w-6 h-3 rounded-full border transition-colors relative"
                      :class="localExternalInputs[pName] ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
                    >
                      <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white transition-transform" :class="localExternalInputs[pName] ? 'translate-x-[12px]' : 'translate-x-[1px]'"></div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Control según tipo -->
              
              <!-- 1. Deslizadores (Number) -->
              <div v-if="pConfig.type === 'number'" class="space-y-1">
                <input 
                  v-model.number="localParams[pName]"
                  @input="validateField(pName, localParams[pName])"
                  type="range" :min="pConfig.min" :max="pConfig.max" :step="pConfig.step || 1"
                  class="w-full accent-geist-fg h-1 rounded-full cursor-pointer"
                >
                <div class="flex justify-between text-[7px] text-geist-accents-3 uppercase font-bold">
                  <span>{{ pConfig.min }}{{ pConfig.unit || '' }}</span>
                  <span>{{ pConfig.max }}{{ pConfig.unit || '' }}</span>
                </div>
              </div>

              <!-- 2. Selectores (Enum) -->
              <div v-else-if="pConfig.type === 'select'" class="space-y-1">
                <select v-model="localParams[pName]" @change="updateNode" class="geist-input w-full text-[10px] py-1 cursor-pointer">
                  <option v-for="opt in pConfig.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <!-- 3. Toggles (Boolean) -->
              <div v-else-if="pConfig.type === 'boolean'" class="flex items-center justify-between">
                <span class="text-[9px] text-geist-accents-4">{{ pConfig.description }}</span>
                <button 
                  @click="localParams[pName] = !localParams[pName]; updateNode(); if(pName === 'stereo') handleStereoChange()"
                  class="relative w-8 h-[18px] rounded-full transition-colors duration-200 border"
                  :class="localParams[pName] ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
                >
                  <div class="absolute top-[2px] w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200" :class="localParams[pName] ? 'translate-x-[16px]' : 'translate-x-[2px]'"></div>
                </button>
              </div>

              <!-- 4. Texto (String) -->
              <div v-else class="space-y-1">
                <input 
                  v-model="localParams[pName]"
                  @input="updateNode"
                  type="text"
                  class="geist-input w-full text-[10px] py-1"
                >
              </div>

              <!-- Selector de Referencias CIM para el parámetro -->
              <div v-if="pConfig.showRefs !== false" class="pt-1">
                <div class="flex flex-wrap gap-1">
                  <button 
                    v-for="comp in props.availableCimComponents" :key="comp.id"
                    @click="toggleParamRef(pName, comp.id)"
                    class="text-[7px] px-1 py-0.5 rounded border transition-all truncate max-w-[60px]"
                    :class="localParamRefs[pName]?.includes(comp.id) 
                      ? 'bg-geist-fg text-geist-bg border-geist-fg' 
                      : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border hover:border-geist-accents-3'"
                    :title="comp.name"
                  >
                    {{ comp.name.split('] ')[1] || comp.name }}
                  </button>
                </div>
              </div>

              <span v-if="errors[pName]" class="text-[8px] text-geist-error font-medium block mt-1">{{ errors[pName] }}</span>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border"></div>

        <!-- Otros Parámetros Dinámicos -->

        <div class="h-px bg-geist-border"></div>

        <!-- Otros Parámetros Dinámicos -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-[0.2em]">Otros Parámetros</h4>
            <button @click="addOther" class="w-5 h-5 flex items-center justify-center rounded bg-geist-accents-2 hover:bg-geist-fg hover:text-geist-bg transition-colors text-geist-fg text-[10px]">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          
          <div v-if="localOthers.length === 0" class="p-3 border border-dashed border-geist-border rounded-lg bg-geist-accents-1/30 text-center">
            <span class="text-[9px] text-geist-accents-4 italic">No hay parámetros personalizados</span>
          </div>

          <div v-for="(other, index) in localOthers" :key="other.id" class="p-3 border border-geist-border rounded-lg bg-geist-accents-1/30 space-y-3 relative group">
            <button @click="removeOther(index)" class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-geist-accents-3 hover:text-geist-error hover:bg-geist-error/10 transition-colors opacity-0 group-hover:opacity-100">
              <i class="fa-solid fa-trash-can text-[10px]"></i>
            </button>
            <div class="space-y-1.5 pr-6">
              <label class="text-[9px] font-bold text-geist-accents-5 uppercase">Nombre</label>
              <input type="text" v-model="other.name" @input="validateField(`other_name_${index}`, other.name)" class="geist-input w-full text-[10px] py-1" :class="{ 'border-geist-error': errors[`other_name_${index}`] }">
              <span v-if="errors[`other_name_${index}`]" class="text-[8px] text-geist-error font-medium">{{ errors[`other_name_${index}`] }}</span>
            </div>
            <div class="space-y-1.5">
              <label class="text-[9px] font-bold text-geist-accents-5 uppercase">Valor Inicial (String)</label>
              <input type="text" v-model="other.initialValue" @input="validateField(`other_value_${index}`, other.initialValue)" class="geist-input w-full text-[10px] py-1" :class="{ 'border-geist-error': errors[`other_value_${index}`] }">
              <span v-if="errors[`other_value_${index}`]" class="text-[8px] text-geist-error font-medium">{{ errors[`other_value_${index}`] }}</span>
            </div>

            <!-- Selector de Referencias para Otros Parámetros -->
            <div>
              <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter block mb-1">CIM Refs</span>
              <div class="flex flex-wrap gap-1">
                <button 
                  v-for="comp in props.availableCimComponents" :key="comp.id"
                  @click="toggleOtherRef(index, comp.id)"
                  class="text-[7px] px-1 py-0.5 rounded border transition-all truncate max-w-[60px]"
                  :class="other.ids_references?.includes(comp.id) 
                    ? 'bg-geist-fg text-geist-bg border-geist-fg' 
                    : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border hover:border-geist-accents-3'"
                  :title="comp.name"
                >
                  {{ comp.name.split('] ')[1] || comp.name }}
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <span class="text-[9px] font-medium text-geist-accents-5">Modulable</span>
              <button 
                @click="other.isModifiable = !other.isModifiable; updateNode()"
                class="relative w-7 h-4 rounded-full transition-colors duration-200 border"
                :class="other.isModifiable ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
              >
                <div class="absolute top-[1px] w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-transform duration-200" :class="other.isModifiable ? 'translate-x-[14px]' : 'translate-x-[1px]'"></div>
              </button>
            </div>

            <div class="flex items-center justify-between pt-0.5">
              <span class="text-[9px] font-medium text-geist-accents-5">Entrada Externa</span>
              <button 
                @click="other.isExternalInput = !other.isExternalInput; updateNode()"
                class="relative w-7 h-4 rounded-full transition-colors duration-200 border"
                :class="other.isExternalInput ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
              >
                <div class="absolute top-[1px] w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-transform duration-200" :class="other.isExternalInput ? 'translate-x-[14px]' : 'translate-x-[1px]'"></div>
              </button>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border"></div>

        <!-- Conexiones Externas (Inputs/Outputs) -->
        <div v-if="metadata && (metadata.inputs.length > 0 || metadata.outputs.length > 0)" class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-[0.2em]">Externalización</h4>
            <div class="h-px flex-1 bg-geist-border opacity-30"></div>
          </div>
          <p class="text-[8px] text-geist-accents-4 italic leading-relaxed -mt-1">
            Define qué puertos son visibles desde fuera de la máquina PIM.
          </p>
          
          <!-- Entradas -->
          <div v-if="metadata.inputs.length > 0" class="space-y-1.5">
            <span class="text-[7px] font-bold text-geist-accents-3 uppercase tracking-widest pl-1">Entradas</span>
            <div 
              v-for="input in metadata.inputs" 
              :key="input.id"
              class="flex items-center justify-between py-1.5 px-2 rounded-lg bg-geist-accents-1/30 border border-transparent hover:border-geist-border transition-all"
            >
              <span class="text-[10px] font-medium text-geist-fg">{{ input.name }}</span>
              <button 
                @click="localParams[input.id].isExternalInput = !localParams[input.id].isExternalInput; updateNode()"
                class="relative w-8 h-[18px] rounded-full transition-colors duration-200 border"
                :class="localParams[input.id]?.isExternalInput !== false ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
              >
                <div 
                  class="absolute top-[2px] w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="localParams[input.id]?.isExternalInput !== false ? 'translate-x-[16px]' : 'translate-x-[2px]'"
                ></div>
              </button>
            </div>
          </div>

          <!-- Salidas -->
          <div v-if="metadata.outputs.length > 0" class="space-y-1.5">
            <span class="text-[7px] font-bold text-geist-accents-3 uppercase tracking-widest pl-1">Salidas</span>
            <div 
              v-for="output in metadata.outputs" 
              :key="output.id"
              class="flex items-center justify-between py-1.5 px-2 rounded-lg bg-geist-accents-1/30 border border-transparent hover:border-geist-border transition-all"
            >
              <span class="text-[10px] font-medium text-geist-fg">{{ output.name }}</span>
              <button 
                @click="localParams[output.id].isExternalOutput = !localParams[output.id].isExternalOutput; updateNode()"
                class="relative w-8 h-[18px] rounded-full transition-colors duration-200 border"
                :class="localParams[output.id]?.isExternalOutput !== false ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
              >
                <div 
                  class="absolute top-[2px] w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="localParams[output.id]?.isExternalOutput !== false ? 'translate-x-[16px]' : 'translate-x-[2px]'"
                ></div>
              </button>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border"></div>

        <!-- Flags isModifiable -->
        <div v-if="modifiableParamsList.length > 0" class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-[0.2em]">Modulabilidad</h4>
            <div class="h-px flex-1 bg-geist-border opacity-30"></div>
          </div>
          <p class="text-[8px] text-geist-accents-4 italic leading-relaxed -mt-1">
            Controla qué parámetros aceptan modulación externa (LFO, Envolvente, etc.)
          </p>
          <div 
            v-for="paramName in modifiableParamsList" 
            :key="paramName"
            class="flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors"
            :class="localModifiable[paramName] ? 'bg-emerald-500/5' : 'bg-geist-accents-1/50'"
          >
            <div class="flex items-center gap-2">
              <i 
                class="fa-solid text-[9px]" 
                :class="localModifiable[paramName] ? 'fa-link text-emerald-500' : 'fa-link-slash text-geist-accents-3'"
              ></i>
              <span class="text-[10px] font-medium capitalize" :class="localModifiable[paramName] ? 'text-geist-fg' : 'text-geist-accents-4'">{{ paramName }}</span>
            </div>
            <button 
              @click="handleToggleModifiable(paramName)"
              class="relative w-8 h-[18px] rounded-full transition-colors duration-200 border"
              :class="localModifiable[paramName] ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
            >
              <div 
                class="absolute top-[2px] w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200"
                :class="localModifiable[paramName] ? 'translate-x-[16px]' : 'translate-x-[2px]'"
              ></div>
            </button>
          </div>
        </div>

        <!-- Zona peligrosa: Eliminar Nodo -->
        <div class="mt-4 pt-4 border-t border-geist-border">
          <div v-if="!showDeleteConfirm">
            <button
              @click="showDeleteConfirm = true"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-geist-error/30 bg-geist-error/5 text-geist-error text-[10px] font-bold uppercase tracking-wider hover:bg-geist-error/10 transition-all"
            >
              <i class="fa-solid fa-trash-can text-[11px]"></i>
              Eliminar Nodo
            </button>
          </div>
          <div v-else class="space-y-2">
            <p class="text-[9px] text-geist-accents-4 text-center leading-relaxed">
              ¿Seguro? También se eliminarán todas las aristas conectadas.
            </p>
            <div class="flex gap-2">
              <button
                @click="showDeleteConfirm = false"
                class="flex-1 px-2 py-1.5 rounded-lg border border-geist-border text-[9px] font-bold uppercase text-geist-accents-5 hover:border-geist-accents-4 transition-all"
              >
                Cancelar
              </button>
              <button
                @click="confirmDeleteNode"
                class="flex-1 px-2 py-1.5 rounded-lg bg-geist-error text-white text-[9px] font-bold uppercase hover:bg-geist-error/90 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>

        <!-- Info Técnica -->
        <div class="p-3 rounded-lg bg-geist-accents-1 border border-geist-border italic">
          <p class="text-[9px] text-geist-accents-5 leading-relaxed">
            * Los cambios se aplican al vuelo sobre el lienzo y se guardarán de forma permanente al pulsar el botón "Guardar" en la barra superior.
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.pim-editor-properties {
  z-index: 20;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-geist-accents-2);
  border-radius: 10px;
}

input[type="range"] {
  background: var(--color-geist-accents-2);
}
</style>
