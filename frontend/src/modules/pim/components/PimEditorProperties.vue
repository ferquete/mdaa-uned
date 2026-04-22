<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { PIM_NODE_METADATA, PIM_MODIFIABLE_PARAMS } from '../utils/pim-node-metadata'
import { usePimStore } from '../stores/pimStore'

const store = usePimStore()

const props = defineProps<{
  nodeId?: string
  availableCimComponents?: { id: string; name: string; type: string }[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete-node', nodeId: string): void
  (e: 'replicate-node', nodeId: string): void
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
const errors = ref<Record<string, string>>({})
const localOthers = ref<any[]>([])
const localParamRefs = ref<Record<string, string[]>>({})
const localPorts = ref<Record<string, any>>({})

// Confirmación de borrado de nodo
const showDeleteConfirm = ref(false)

/**
 * Configuración de parámetros por tipo para renderizado dinámico.
 */
const NODE_PARAMS_BY_TYPE: Record<string, any> = {
  stereo: { label: 'Estéreo', type: 'boolean', description: 'Habilita procesado de 2 canales' },
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
    options: [{ label: '12 dB/oct', value: '12dB/oct' }, { label: '24 dB/oct', value: '24dB/oct' }, { label: '48 dB/oct', value: '48dB/oct' }]
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
    options: [{ label: 'Soft Clipping', value: 'soft-clipping' }, { label: 'Hard Clipping', value: 'hard-clipping' }, { label: 'Bitcrush', value: 'bitcrush' }]
  },
  outputLevel: { label: 'Nivel de Salida', type: 'number', min: 0, max: 1, step: 0.01 },
  depth: { label: 'Profundidad (Depth)', type: 'number', min: 0, max: 1, step: 0.01 },
  mix: { label: 'Mezcla Final', type: 'number', min: 0, max: 1, step: 0.01 },
  threshold: { label: 'Umbral (Threshold)', type: 'number', min: -60, max: 0, step: 0.1, unit: 'dB' },
  ratio: { label: 'Relación (Ratio)', type: 'number', min: 1, max: 20, step: 0.1 },
  makeupGain: { label: 'Ganancia de Compensación', type: 'number', min: 0, max: 24, step: 0.1, unit: 'dB' },
  bandFrequency: { label: 'Frecuencia de Banda', type: 'number', min: 20, max: 20000, step: 1, unit: 'Hz' },
  bandwidth: { label: 'Ancho de Banda (Q)', type: 'number', min: 0.1, max: 10, step: 0.1 }
};

function validateAll(): boolean {
  errors.value = {}
  
  // 1. Validar Nodo Raíz
  if (!localName.value || localName.value.length > 20) {
    errors.value.name = 'El nombre es obligatorio (máx. 20 caracteres).'
  }
  if (localDescription.value && localDescription.value.length > 600) {
    errors.value.description = 'La descripción excede los 600 caracteres.'
  }

  // 2. Validar Parámetros Otros (Dinámicos)
  localOthers.value.forEach((o, index) => {
    if (!o.name || o.name.length > 20) {
      errors.value[`other_${index}_name`] = 'Nombre obligatorio (máx. 20).'
    }
    if (!o.initialValue || o.initialValue.length > 100) {
      errors.value[`other_${index}_val`] = 'Valor obligatorio (máx. 100).'
    }
    if (o.description && o.description.length > 600) {
      errors.value[`other_${index}_desc`] = 'Descripción máx. 600.'
    }
  })

  return Object.keys(errors.value).length === 0
}

function updateNode() {
  const node = props.nodeId ? findNode(props.nodeId) : null
  if (!node) return

  const isVal = validateAll()

  const finalParams: Record<string, any> = {
    name: localName.value,
    description: localDescription.value,
    ids_references: [...localRefs.value],
    others: JSON.parse(JSON.stringify(localOthers.value)),
    _isModifiable: {} as Record<string, boolean>
  }

  Object.entries(localParams.value).forEach(([k, v]) => {
    finalParams[k] = {
      ...v,
      ids_references: [...(localParamRefs.value[k] || [])]
    }
    // Alimentar el mapa _isModifiable que rige la visibilidad de los puertos
    if (v.isModifiable !== undefined) {
      finalParams._isModifiable[k] = v.isModifiable
    }
  })

  // Volcar puertos
  Object.entries(localPorts.value).forEach(([k, v]) => {
    finalParams[k] = {
      ...v,
      ids_references: [...(localParamRefs.value[k] || [])]
    }
  })

  node.data = { ...node.data, name: localName.value, description: localDescription.value, parameters: finalParams, isValid: isVal }
}

/**
 * Alterna el estado de modulación y entrada externa de un parámetro.
 * Orquestador principal de la reactividad del diagrama.
 */
function toggleModifiable(pName: string) {
  const machineId = store.selectedMachine?.id
  if (!machineId || !props.nodeId) return

  const param = localParams.value[pName]
  if (!param || typeof param !== 'object') return

  const newVal = !(param.isModifiable !== false)
  param.isModifiable = newVal

  // Integridad: si no es modulable, tampoco externalizable
  if (!newVal) {
    param.isExternalInput = false
    emit('remove-edges-for-param', props.nodeId, pName)
  }

  // Notificar al store para poda de aristas pesada
  store.handleParamModifiabilityChange(machineId, props.nodeId, pName, newVal)
  
  updateNode()
}

/**
 * Extrae valor primitivo para mostrar en UI.
 */
const extractValue = (raw: any): any => {
  if (raw !== null && typeof raw === 'object' && 'initialValue' in raw) return extractValue(raw.initialValue)
  return raw
}

async function syncNodeData(nodeId: string | undefined) {
  if (!nodeId) return
  const node = findNode(nodeId)
  if (!node) return
  
  const data = node.data
  localName.value = String(data.name || '')
  localDescription.value = String(data.description || '')
  localRefs.value = [...(data.parameters?.ids_references || [])]
  localOthers.value = JSON.parse(JSON.stringify(data.parameters?.others || []))

  const rawParams = data.parameters || {}
  const processedParams: Record<string, any> = {}
  const refs: Record<string, string[]> = {}

  Object.entries(rawParams).forEach(([k, v]) => {
    if (['others', '_isModifiable', 'name', 'description', 'ids_references'].includes(k)) return
    
    // Almacenamos el OBJETO completo para tener isModifiable e isExternalInput a mano
    if (v && typeof v === 'object' && !Array.isArray(v)) {
        processedParams[k] = { ...v }
        refs[k] = [...(v as any).ids_references || []]
    } else {
        processedParams[k] = { initialValue: v, isModifiable: true, isExternalInput: false }
        refs[k] = []
    }
  })

  localParams.value = processedParams
  localParamRefs.value = refs

  // Sincronizar puertos
  const processedPorts: Record<string, any> = {}
  Object.entries(rawParams).forEach(([k, v]) => {
    if (k.startsWith('input_') || k.startsWith('output')) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        processedPorts[k] = { ...v }
        localParamRefs.value[k] = [...(v as any).ids_references || []]
      }
    }
  })

  // Especial para Mixer: Si no hay inputs, inicializar 2
  if (nodeType.value === 'mixer') {
    const inputsNum = Object.keys(processedPorts).filter(k => k.startsWith('input_')).length
    if (inputsNum < 2) {
      for (let i = 1; i <= 2; i++) {
        const k = `input_${i}`
        if (!processedPorts[k]) {
          processedPorts[k] = { id: crypto.randomUUID(), ids_references: [], isExternalInput: false, description: '' }
          localParamRefs.value[k] = []
        }
      }
    }
  }

  localPorts.value = processedPorts

  // Sincronizar referencias de los parámetros dinámicos (others)
  localOthers.value.forEach(o => {
    if (o.id) {
        localParamRefs.value[o.id] = [...(o.ids_references || [])]
    }
  })

  validateAll()
}

watch(() => props.nodeId, syncNodeData, { immediate: true })

const addOther = () => {
  localOthers.value.push({ id: crypto.randomUUID(), name: 'Param', initialValue: 'Val', description: '', isModifiable: true, isExternalInput: false, ids_references: [] })
  updateNode()
}

const toggleParamRef = (pName: string, id: string) => {
    if (!localParamRefs.value[pName]) localParamRefs.value[pName] = []
    const idx = localParamRefs.value[pName].indexOf(id)
    if (idx === -1) localParamRefs.value[pName].push(id)
    else localParamRefs.value[pName].splice(idx, 1)
    updateNode()
}

const removeOther = (index: number) => {
  localOthers.value.splice(index, 1)
  updateNode()
}

const replicateNode = () => { if (props.nodeId) emit('replicate-node', props.nodeId) }
const confirmDeleteNode = () => { if (props.nodeId) emit('delete-node', props.nodeId) }

/**
 * Gestión dinámica de inputs para el Mixer
 */
const mixerInputsCount = computed({
  get: () => Object.keys(localPorts.value).filter(k => k.startsWith('input_')).length,
  set: (newVal) => {
    const current = Object.keys(localPorts.value).filter(k => k.startsWith('input_')).length
    if (newVal > current) {
      for (let i = current + 1; i <= newVal; i++) {
        const k = `input_${i}`
        localPorts.value[k] = { id: crypto.randomUUID(), ids_references: [], isExternalInput: false, description: '' }
        localParamRefs.value[k] = []
      }
    } else if (newVal < current) {
      for (let i = current; i > newVal; i--) {
        const k = `input_${i}`
        delete localPorts.value[k]
        delete localParamRefs.value[k]
        if (props.nodeId) emit('remove-edges-for-param', props.nodeId, k)
      }
    }
    updateNode()
  }
})

/**
 * Lógica de visibilidad de puertos en el panel de propiedades.
 */
const showPort = (pName: string) => {
  if (!props.nodeId) return false
  const node = findNode(props.nodeId)
  if (!node) return false

  const isStereo = localParams.value.stereo?.initialValue === true || localParams.value.stereo === true
  
  // Mixer es especial: entradas dependen de visibilidad directa en localPorts
  if (nodeType.value === 'mixer') {
    if (pName.startsWith('input_')) {
      return !!localPorts.value[pName]
    }
  }

  // Comportamiento estándar para el resto
  if (pName === 'input_2' || pName === 'output_2') return isStereo
  return true
}
</script>

<template>
  <aside class="pim-editor-properties w-80 border-l border-geist-border bg-geist-bg flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.03)]">
    <div class="px-4 h-12 flex items-center justify-between border-b border-geist-border bg-geist-accents-1/30">
      <h3 class="text-[10px] font-bold uppercase tracking-[0.15em] text-geist-accents-5">Propiedades</h3>
      <button @click="emit('close')" class="text-geist-accents-4 hover:text-geist-fg transition-colors w-6 h-6 flex items-center justify-center rounded-md hover:bg-geist-accents-2"><i class="fa-solid fa-xmark text-xs"></i></button>
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
      <div v-if="!nodeId" class="text-center opacity-40 py-20">Selecciona un nodo</div>
      
      <div v-else class="space-y-6">
        <!-- Acciones Rápidas (ARRIBA) -->
        <div class="space-y-2">
            <div class="grid grid-cols-2 gap-2">
                <button @click="replicateNode" class="flex items-center justify-center gap-2 py-2 rounded-lg border border-blue-500/30 bg-blue-500/5 text-blue-600 hover:bg-blue-500 hover:text-white transition-all text-[9px] font-bold uppercase">
                    <i class="fa-solid fa-copy text-[10px]"></i>
                    Replicar
                </button>
                <button @click="showDeleteConfirm = !showDeleteConfirm" class="flex items-center justify-center gap-2 py-2 rounded-lg border border-geist-error/30 text-geist-error hover:bg-geist-error hover:text-white transition-all text-[9px] font-bold uppercase" :class="{ 'bg-geist-error text-white': showDeleteConfirm }">
                    <i class="fa-solid fa-trash-can text-[10px]"></i>
                    Eliminar
                </button>
            </div>
            
            <transition name="slide-down">
                <div v-if="showDeleteConfirm" class="p-3 bg-geist-error/5 rounded-lg border border-geist-error/20 flex flex-col gap-2">
                    <span class="text-[8px] text-geist-error text-center font-bold">¿CONFIRMAR ELIMINACIÓN DEFINITIVA?</span>
                    <div class="flex gap-2">
                        <button @click="showDeleteConfirm = false" class="flex-1 py-1.5 bg-geist-accents-2 text-[9px] font-bold rounded hover:bg-geist-accents-3">CANCELAR</button>
                        <button @click="confirmDeleteNode" class="flex-1 py-1.5 bg-geist-error text-white text-[9px] font-bold rounded hover:bg-geist-error-600 shadow-sm">SÍ, BORRAR</button>
                    </div>
                </div>
            </transition>
        </div>

        <div class="h-px bg-geist-border opacity-50"></div>

        <!-- Identificación -->
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-[9px] font-bold text-geist-accents-5 uppercase tracking-widest pl-1">Nombre</label>
            <input v-model="localName" @input="updateNode" type="text" class="geist-input w-full text-xs" :class="{ 'border-geist-error/50 bg-geist-error/5 text-geist-error': errors.name }">
            <span v-if="errors.name" class="text-[8px] text-geist-error font-medium px-1">{{ errors.name }}</span>
          </div>
          <div class="space-y-1.5">
            <label class="text-[9px] font-bold text-geist-accents-5 uppercase tracking-widest pl-1">Descripción</label>
            <textarea v-model="localDescription" @input="updateNode" class="geist-input w-full text-xs min-h-[60px] resize-none" :class="{ 'border-geist-error/50 bg-geist-error/5 text-geist-error': errors.description }" placeholder="Propósito conceptual del nodo..."></textarea>
            <span v-if="errors.description" class="text-[8px] text-geist-error font-medium px-1">{{ errors.description }}</span>
          </div>
          <div class="space-y-1.5">
            <label class="text-[9px] font-bold text-geist-accents-5 uppercase tracking-widest pl-1">Referencias Análisis</label>
            <div class="flex flex-wrap gap-1 p-2 border border-geist-border rounded-lg bg-geist-accents-1/30">
              <label v-for="comp in props.availableCimComponents" :key="comp.id" class="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-geist-accents-2 cursor-pointer transition-colors">
                <input type="checkbox" :value="comp.id" v-model="localRefs" @change="updateNode" class="accent-emerald-500 w-3 h-3">
                <span class="text-[8px] text-geist-fg">{{ comp.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border opacity-50"></div>

        <!-- Parámetros Técnicos -->
        <div class="space-y-6">
          <h4 class="text-[9px] font-bold text-geist-accents-4 uppercase tracking-[0.2em] pl-1">Parámetros</h4>
          
          <!-- Slider especial para Mixer Inputs -->
          <div v-if="nodeType === 'mixer'" class="p-3 border border-geist-border rounded-xl bg-geist-accents-1/20 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-geist-fg flex flex-col">
                NÚMERO DE ENTRADAS
                <span class="text-[8px] text-geist-accents-4 font-mono font-medium">{{ mixerInputsCount }} Canales</span>
              </span>
            </div>
            <input v-model.number="mixerInputsCount" type="range" min="2" max="10" step="1" class="w-full accent-blue-500 h-1 rounded-full cursor-pointer">
          </div>

          <div v-for="(pConfig, pName) in NODE_PARAMS_BY_TYPE" :key="pName">
            <div v-if="pName in localParams" class="p-3 border border-geist-border rounded-xl bg-geist-accents-1/20 space-y-4">
              
              <!-- Fila 1: Label y Flags de Reactividad -->
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-geist-fg flex flex-col">
                  {{ pConfig.label }}
                  <span v-if="typeof extractValue(localParams[pName]) !== 'boolean'" class="text-[8px] text-geist-accents-4 font-mono font-medium">
                    {{ extractValue(localParams[pName]) }} {{ pConfig.unit || '' }}
                  </span>
                </span>
                
                <div v-if="pName !== 'stereo'" class="flex items-center gap-3">
                  <!-- Modifable -->
                  <div class="flex flex-col items-center gap-0.5" title="Habilitar Puerto de Modulación">
                    <span class="text-[6px] font-bold text-geist-accents-4 uppercase">Modulable</span>
                    <button @click="toggleModifiable(pName)" class="w-6 h-3 rounded-full border transition-all relative" :class="localParams[pName].isModifiable !== false ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'">
                      <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white shadow-sm transition-transform" :class="localParams[pName].isModifiable !== false ? 'translate-x-3' : 'translate-x-0.5'"></div>
                    </button>
                  </div>
                  <!-- External -->
                  <div class="flex flex-col items-center gap-0.5" :class="{ 'opacity-30 pointer-events-none': localParams[pName].isModifiable === false }" title="Externalizar a la Máquina Superior">
                    <span class="text-[6px] font-bold text-geist-accents-4 uppercase">Externo</span>
                    <button @click="localParams[pName].isExternalInput = !localParams[pName].isExternalInput; updateNode()" :disabled="localParams[pName].isModifiable === false" class="w-6 h-3 rounded-full border transition-all relative" :class="localParams[pName].isExternalInput ? 'bg-blue-500 border-blue-600' : 'bg-geist-accents-2 border-geist-border'">
                      <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white shadow-sm transition-transform" :class="localParams[pName].isExternalInput ? 'translate-x-3' : 'translate-x-0.5'"></div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Fila 2: Descripción -->
              <div class="space-y-1">
                <textarea v-model="localParams[pName].description" @input="updateNode" 
                  class="bg-transparent border-none p-0 text-[8px] text-geist-accents-4 focus:ring-0 w-full resize-none min-h-[30px] placeholder:text-geist-accents-2" 
                  placeholder="Descripción del parámetro..."></textarea>
              </div>

              <!-- Fila 3: Control de Edición -->
              <div class="pt-1">
                <input v-if="pConfig.type === 'number'" v-model.number="localParams[pName].initialValue" @input="updateNode" type="range" :min="pConfig.min" :max="pConfig.max" :step="pConfig.step" class="w-full accent-emerald-500 h-1 rounded-full cursor-pointer">
                <select v-else-if="pConfig.type === 'select'" v-model="localParams[pName].initialValue" @change="updateNode" class="geist-input w-full text-[10px] py-1 bg-geist-bg">
                  <option v-for="opt in pConfig.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <div v-else-if="pConfig.type === 'boolean'" class="flex justify-center">
                  <button @click="localParams[pName].initialValue = !localParams[pName].initialValue; updateNode()" class="px-3 py-1 rounded-md text-[9px] font-bold transition-all border" :class="localParams[pName].initialValue ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border'">
                    {{ localParams[pName].initialValue ? 'ACTIVADO' : 'DESACTIVADO' }}
                  </button>
                </div>
              </div>

              <!-- Fila 4: Refs Parámetro -->
              <div v-if="pConfig.showRefs !== false" class="flex flex-wrap gap-1">
                <button v-for="comp in props.availableCimComponents" :key="comp.id" @click="toggleParamRef(pName, comp.id)" class="text-[6px] px-1 py-0.5 rounded border transition-all" :class="localParamRefs[pName]?.includes(comp.id) ? 'bg-geist-fg text-geist-bg border-geist-fg' : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border'">
                  {{ comp.name.split('] ')[1] || comp.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border opacity-50"></div>

        <!-- Parámetros Creados -->
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h4 class="text-[9px] font-bold text-geist-accents-4 uppercase tracking-[0.2em] pl-1">Parámetros Creados</h4>
            <button @click="addOther" class="w-5 h-5 flex items-center justify-center rounded-md bg-geist-accents-1 border border-geist-border hover:bg-geist-accents-2 transition-colors text-geist-accents-5">
              <i class="fa-solid fa-plus text-[8px]"></i>
            </button>
          </div>

          <div v-if="localOthers.length === 0" class="text-center py-4 border border-dashed border-geist-border rounded-xl opacity-40">
            <span class="text-[8px] uppercase tracking-widest font-medium">No hay parámetros extra</span>
          </div>

          <div v-for="(other, index) in localOthers" :key="other.id" class="p-3 border border-geist-border rounded-xl bg-geist-accents-1/20 space-y-4 relative group">
            <!-- Botón Borrar -->
            <button @click="removeOther(index)" class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-geist-bg border border-geist-border text-geist-accents-3 hover:text-geist-error hover:border-geist-error/30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm z-10 scale-90 hover:scale-100">
              <i class="fa-solid fa-xmark text-[8px]"></i>
            </button>

            <!-- Fila 1: Nombre, Flags y Descripción -->
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 space-y-1">
                    <input v-model="other.name" @input="updateNode" type="text" placeholder="Nombre" 
                        class="bg-transparent border-none p-0 text-[10px] font-bold text-geist-fg focus:ring-0 w-full placeholder:text-geist-accents-3"
                        :class="{ 'text-geist-error placeholder:text-geist-error/40': errors[`other_${index}_name`] }">
                    <textarea v-model="other.description" @input="updateNode" placeholder="Descripción del parámetro..." 
                        class="bg-transparent border-none p-0 text-[9px] text-geist-accents-4 focus:ring-0 w-full resize-none min-h-[40px] placeholder:text-geist-accents-2"
                        :class="{ 'text-geist-error placeholder:text-geist-error/40': errors[`other_${index}_desc`] }"></textarea>
                </div>
                
                <div class="flex items-center gap-3 pt-0.5">
                  <!-- Modifable -->
                  <div class="flex flex-col items-center gap-0.5" title="Habilitar Puerto de Modulación">
                    <span class="text-[6px] font-bold text-geist-accents-4 uppercase">Modulable</span>
                    <button @click="other.isModifiable = !other.isModifiable; if(!other.isModifiable) other.isExternalInput = false; updateNode()" class="w-6 h-3 rounded-full border transition-all relative" :class="other.isModifiable ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'">
                      <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white shadow-sm transition-transform" :class="other.isModifiable ? 'translate-x-3' : 'translate-x-0.5'"></div>
                    </button>
                  </div>
                  <!-- External -->
                  <div class="flex flex-col items-center gap-0.5" :class="{ 'opacity-30 pointer-events-none': !other.isModifiable }" title="Externalizar a la Máquina Superior">
                    <span class="text-[6px] font-bold text-geist-accents-4 uppercase">Externo</span>
                    <button @click="other.isExternalInput = !other.isExternalInput; updateNode()" :disabled="!other.isModifiable" class="w-6 h-3 rounded-full border transition-all relative" :class="other.isExternalInput ? 'bg-blue-500 border-blue-600' : 'bg-geist-accents-2 border-geist-border'">
                      <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white shadow-sm transition-transform" :class="other.isExternalInput ? 'translate-x-3' : 'translate-x-0.5'"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="errors[`other_${index}_name`] || errors[`other_${index}_desc`]" class="flex flex-col gap-0.5">
                <span v-if="errors[`other_${index}_name`]" class="text-[7px] text-geist-error font-bold tracking-tighter uppercase">{{ errors[`other_${index}_name`] }}</span>
                <span v-if="errors[`other_${index}_desc`]" class="text-[7px] text-geist-error font-bold tracking-tighter uppercase">{{ errors[`other_${index}_desc`] }}</span>
              </div>
            </div>

            <!-- Fila 2: Valor -->
            <div class="space-y-1 border-t border-geist-border/40 pt-3">
              <label class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-widest pl-0.5">Valor Inicial</label>
              <input v-model="other.initialValue" @input="updateNode" type="text" maxlength="100" class="geist-input w-full text-[10px] py-1" :class="{ 'border-geist-error/50 bg-geist-error/5 text-geist-error': errors[`other_${index}_val`] }">
              <span v-if="errors[`other_${index}_val`]" class="text-[7px] text-geist-error font-bold tracking-tighter uppercase px-0.5">{{ errors[`other_${index}_val`] }}</span>
            </div>

            <!-- Fila 3: Refs Parámetro -->
            <div class="flex flex-wrap gap-1">
              <button v-for="comp in props.availableCimComponents" :key="comp.id" @click="toggleParamRef(other.id, comp.id)" class="text-[6px] px-1 py-0.5 rounded border transition-all" 
                :class="localParamRefs[other.id]?.includes(comp.id) ? 'bg-geist-fg text-geist-bg border-geist-fg' : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border'">
                {{ comp.name.split('] ')[1] || comp.name }}
              </button>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border opacity-50"></div>

        <!-- Puertos de Señal -->
        <div class="space-y-6">
          <h4 class="text-[9px] font-bold text-geist-accents-4 uppercase tracking-[0.2em] pl-1">Puertos de Señal</h4>
          
          <div v-for="(pData, pName) in localPorts" :key="pName">
            <div v-if="showPort(String(pName))" class="p-3 border border-geist-border rounded-xl bg-geist-accents-1/20 space-y-4">
              
              <!-- Fila 1: Label y Flag External -->
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-geist-fg flex flex-col">
                  {{ String(pName).replace('_', ' ').toUpperCase() }}
                  <span class="text-[8px] text-geist-accents-4 font-medium italic">
                    {{ String(pName).startsWith('input') ? 'Entrada de Señal' : 'Salida de Señal' }}
                  </span>
                </span>
                
                <div class="flex items-center gap-3">
                  <div class="flex flex-col items-center gap-0.5" title="Externalizar puerto al contenedor superior">
                    <span class="text-[6px] font-bold text-geist-accents-4 uppercase">Externo</span>
                    <button v-if="String(pName).startsWith('input')" 
                      @click="localPorts[pName].isExternalInput = !localPorts[pName].isExternalInput; updateNode()" 
                      class="w-6 h-3 rounded-full border transition-all relative" 
                      :class="localPorts[pName].isExternalInput ? 'bg-blue-500 border-blue-600' : 'bg-geist-accents-2 border-geist-border'">
                      <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white shadow-sm transition-transform" :class="localPorts[pName].isExternalInput ? 'translate-x-3' : 'translate-x-0.5'"></div>
                    </button>
                    <button v-else 
                      @click="localPorts[pName].isExternalOutput = !localPorts[pName].isExternalOutput; updateNode()" 
                      class="w-6 h-3 rounded-full border transition-all relative" 
                      :class="localPorts[pName].isExternalOutput ? 'bg-blue-500 border-blue-600' : 'bg-geist-accents-2 border-geist-border'">
                      <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white shadow-sm transition-transform" :class="localPorts[pName].isExternalOutput ? 'translate-x-3' : 'translate-x-0.5'"></div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Fila 2: Descripción -->
              <div class="space-y-1">
                <textarea v-model="localPorts[pName].description" @input="updateNode" 
                  class="bg-transparent border-none p-0 text-[8px] text-geist-accents-4 focus:ring-0 w-full resize-none min-h-[30px] placeholder:text-geist-accents-2" 
                  placeholder="Descripción del puerto..."></textarea>
              </div>

              <!-- Fila 3: Refs Parámetro -->
              <div class="flex flex-wrap gap-1">
                <button v-for="comp in props.availableCimComponents" :key="comp.id" @click="toggleParamRef(String(pName), comp.id)" class="text-[6px] px-1 py-0.5 rounded border transition-all" :class="localParamRefs[String(pName)]?.includes(comp.id) ? 'bg-geist-fg text-geist-bg border-geist-fg' : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border'">
                  {{ comp.name.split('] ')[1] || comp.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border opacity-50"></div>

      </div>
    </div>
  </aside>
</template>
