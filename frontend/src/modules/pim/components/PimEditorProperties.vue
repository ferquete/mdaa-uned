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

// Confirmación de borrado de nodo
const showDeleteConfirm = ref(false)

/**
 * Configuración de parámetros por tipo para renderizado dinámico.
 */
const NODE_PARAMS_BY_TYPE: Record<string, any> = {
  stereo: { label: 'Estéreo', type: 'boolean', description: 'Habilita procesado de 2 canales' },
  ping_pong: { label: 'Ping Pong', type: 'boolean', description: 'Alternancia de canales' },
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
  bandwidth: { label: 'Ancho de Banda (Q)', type: 'number', min: 0.1, max: 10, step: 0.1 },
  inputs_number: { label: 'Número de Entradas', type: 'number', min: 1, max: 10, step: 1 }
};

function validateAll() {
  errors.value = {}
  validateField('name', localName.value)
  Object.entries(localParams.value).forEach(([k, v]) => validateField(k, v))
}

function validateField(field: string, value: any) {
  // Simplificado para el saneamiento
  updateNode()
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
}

watch(() => props.nodeId, syncNodeData, { immediate: true })

function updateNode() {
  const node = props.nodeId ? findNode(props.nodeId) : null
  if (!node) return

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

  node.data = { ...node.data, name: localName.value, parameters: finalParams }
}

const addOther = () => {
  localOthers.value.push({ id: crypto.randomUUID(), name: 'Param', initialValue: 'Val', isModifiable: true, isExternalInput: false, ids_references: [] })
  updateNode()
}

const toggleParamRef = (pName: string, id: string) => {
    if (!localParamRefs.value[pName]) localParamRefs.value[pName] = []
    const idx = localParamRefs.value[pName].indexOf(id)
    if (idx === -1) localParamRefs.value[pName].push(id)
    else localParamRefs.value[pName].splice(idx, 1)
    updateNode()
}

const confirmDeleteNode = () => { if (props.nodeId) emit('delete-node', props.nodeId) }
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
        <!-- Identificación -->
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-[9px] font-bold text-geist-accents-5 uppercase tracking-widest pl-1">Nombre</label>
            <input v-model="localName" @input="updateNode" type="text" class="geist-input w-full text-xs">
          </div>
          <div class="space-y-1.5">
            <label class="text-[9px] font-bold text-geist-accents-5 uppercase tracking-widest pl-1">Refs CIM</label>
            <div class="flex flex-wrap gap-1 p-2 border border-geist-border rounded-lg bg-geist-accents-1/30">
              <label v-for="comp in props.availableCimComponents" :key="comp.id" class="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-geist-accents-2 cursor-pointer transition-colors">
                <input type="checkbox" :value="comp.id" v-model="localRefs" @change="updateNode" class="accent-emerald-500 w-3 h-3">
                <span class="text-[8px] text-geist-fg truncate max-w-[100px]">{{ comp.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border opacity-50"></div>

        <!-- Parámetros Técnicos -->
        <div class="space-y-6">
          <h4 class="text-[9px] font-bold text-geist-accents-4 uppercase tracking-[0.2em] pl-1">Parámetros</h4>
          
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

              <!-- Fila 2: Control de Edición -->
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

              <!-- Fila 3: Refs Parámetro -->
              <div v-if="pConfig.showRefs !== false" class="flex flex-wrap gap-1">
                <button v-for="comp in props.availableCimComponents" :key="comp.id" @click="toggleParamRef(pName, comp.id)" class="text-[6px] px-1 py-0.5 rounded border transition-all" :class="localParamRefs[pName]?.includes(comp.id) ? 'bg-geist-fg text-geist-bg border-geist-fg' : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border'">
                  {{ comp.name.split('] ')[1] || comp.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="h-px bg-geist-border opacity-50"></div>

        <!-- Borrado -->
        <button @click="showDeleteConfirm = !showDeleteConfirm" class="w-full py-2 rounded-lg border border-geist-error/30 text-geist-error hover:bg-geist-error hover:text-white transition-all text-[9px] font-bold uppercase">
          Eliminar Nodo
        </button>
        <div v-if="showDeleteConfirm" class="p-3 bg-geist-error/5 rounded-lg border border-geist-error/20 flex flex-col gap-2">
            <span class="text-[8px] text-geist-error text-center font-bold">¿CONFIRMAR ELIMINACIÓN?</span>
            <div class="flex gap-2">
                <button @click="showDeleteConfirm = false" class="flex-1 py-1 bg-geist-accents-2 text-[9px] rounded">NO</button>
                <button @click="confirmDeleteNode" class="flex-1 py-1 bg-geist-error text-white text-[9px] rounded">SÍ, BORRAR</button>
            </div>
        </div>
      </div>
    </div>
  </aside>
</template>
