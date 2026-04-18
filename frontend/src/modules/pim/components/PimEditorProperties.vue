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

// --- Validaciones (Definidas antes de syncNodeData por el watch immediate) ---
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
  if (field.startsWith('other_name_')) {
    if (!value || value.length < 1) errors.value[field] = 'Mínimo 1 carácter'
    if (value && value.length > 20) errors.value[field] = 'Máximo 20 caracteres'
  }
  if (field.startsWith('other_value_')) {
    if (!value || value.length < 1) errors.value[field] = 'Mínimo 1 carácter'
    if (value && value.length > 100) errors.value[field] = 'Máximo 100 caracteres'
  }
  
  if (field === 'frequency' && (value < 0 || value > 20000)) {
    errors.value.frequency = 'Rango: 0 - 20,000 Hz'
  }
  if (field === 'pan' && (value < -1 || value > 1)) {
    errors.value.pan = 'Rango: -1 a 1'
  }
  if ((field === 'gain' || field === 'amplitude' || field === 'roomSize' || field === 'damping' || field === 'dryWet') && (value < 0 || value > 1)) {
    errors.value[field] = 'Rango: 0 a 1'
  }
  if (field === 'resonance' && (value < 0 || value > 10)) {
    errors.value.resonance = 'Rango: 0 a 10'
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
          
          <!-- Frecuencia -->
          <div v-if="'frequency' in localParams" class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-[10px] font-medium text-geist-fg">Frecuencia</label>
              <span class="text-[10px] font-mono font-bold">{{ localParams.frequency }} Hz</span>
            </div>
            <input 
              v-model.number="localParams.frequency"
              @input="validateField('frequency', localParams.frequency)"
              type="range" min="0" max="20000" step="1"
              class="w-full accent-geist-fg h-1 rounded-full cursor-pointer"
            >
            <span v-if="errors.frequency" class="text-[9px] text-geist-error font-medium">{{ errors.frequency }}</span>
            
            <!-- Selector de Referencias e Input Externo para Frecuencia -->
            <div class="mt-2 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">CIM Refs</span>
                <div class="flex items-center gap-1.5 cursor-pointer" @click="localExternalInputs.frequency = !localExternalInputs.frequency; updateNode()">
                  <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">Entrada Externa</span>
                  <div 
                    class="w-6 h-3 rounded-full border transition-colors relative"
                    :class="localExternalInputs.frequency ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
                  >
                    <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white transition-transform" :class="localExternalInputs.frequency ? 'translate-x-[12px]' : 'translate-x-[1px]'"></div>
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                <button 
                  v-for="comp in props.availableCimComponents" :key="comp.id"
                  @click="toggleParamRef('frequency', comp.id)"
                  class="text-[7px] px-1 py-0.5 rounded border transition-all truncate max-w-[60px]"
                  :class="localParamRefs['frequency']?.includes(comp.id) 
                    ? 'bg-geist-fg text-geist-bg border-geist-fg' 
                    : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border hover:border-geist-accents-3'"
                  :title="comp.name"
                >
                  {{ comp.name.split('] ')[1] || comp.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- Rate (frecuencia LFO) -->
          <div v-if="'rate' in localParams" class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-[10px] font-medium text-geist-fg">Rate (Velocidad)</label>
              <span class="text-[10px] font-mono font-bold">{{ localParams.rate }} Hz</span>
            </div>
            <input 
              v-model.number="localParams.rate"
              @input="validateField('rate', localParams.rate)"
              type="range" min="0" max="20" step="0.1"
              class="w-full accent-geist-fg h-1 rounded-full cursor-pointer"
            >

            <!-- Selector de Referencias e Input Externo para Rate -->
            <div class="mt-2 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">CIM Refs</span>
                <div class="flex items-center gap-1.5 cursor-pointer" @click="localExternalInputs.rate = !localExternalInputs.rate; updateNode()">
                  <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">Entrada Externa</span>
                  <div 
                    class="w-6 h-3 rounded-full border transition-colors relative"
                    :class="localExternalInputs.rate ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
                  >
                    <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white transition-transform" :class="localExternalInputs.rate ? 'translate-x-[12px]' : 'translate-x-[1px]'"></div>
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                <button 
                  v-for="comp in props.availableCimComponents" :key="comp.id"
                  @click="toggleParamRef('rate', comp.id)"
                  class="text-[7px] px-1 py-0.5 rounded border transition-all truncate max-w-[60px]"
                  :class="localParamRefs['rate']?.includes(comp.id) 
                    ? 'bg-geist-fg text-geist-bg border-geist-fg' 
                    : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border hover:border-geist-accents-3'"
                  :title="comp.name"
                >
                  {{ comp.name.split('] ')[1] || comp.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- Ganancia / Amplitud / Dry-Wet / Pan (0 a 1 / -1 a 1) -->
          <div v-for="param in ['gain', 'amplitude', 'dryWet', 'pan']" :key="param">
            <div v-if="param in localParams" class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="text-[10px] font-medium text-geist-fg capitalize">{{ param }}</label>
                <span class="text-[10px] font-mono font-bold">{{ localParams[param] }}</span>
              </div>
              <input 
                v-model.number="localParams[param]"
                @input="validateField(param, localParams[param])"
                type="range" :min="param === 'pan' ? -1 : 0" max="1" step="0.01"
                class="w-full accent-geist-fg h-1 rounded-full cursor-pointer"
              >

              <!-- Selector de Referencias e Input Externo para Params genéricos -->
              <div class="mt-2 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">CIM Refs</span>
                  <div class="flex items-center gap-1.5 cursor-pointer" @click="localExternalInputs[param] = !localExternalInputs[param]; updateNode()">
                    <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">Entrada Externa</span>
                    <div 
                      class="w-6 h-3 rounded-full border transition-colors relative"
                      :class="localExternalInputs[param] ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
                    >
                      <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white transition-transform" :class="localExternalInputs[param] ? 'translate-x-[12px]' : 'translate-x-[1px]'"></div>
                    </div>
                  </div>
                </div>
                <div class="flex flex-wrap gap-1">
                  <button 
                    v-for="comp in props.availableCimComponents" :key="comp.id"
                    @click="toggleParamRef(param, comp.id)"
                    class="text-[7px] px-1 py-0.5 rounded border transition-all truncate max-w-[60px]"
                    :class="localParamRefs[param]?.includes(comp.id) 
                      ? 'bg-geist-fg text-geist-bg border-geist-fg' 
                      : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border hover:border-geist-accents-3'"
                    :title="comp.name"
                  >
                    {{ comp.name.split('] ')[1] || comp.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Selects -->
          <div v-if="'waveform' in localParams" class="space-y-1.5">
            <label class="text-[10px] font-medium text-geist-fg">Forma de Onda</label>
            <select v-model="localParams.waveform" @change="updateNode" class="geist-input w-full text-xs cursor-pointer">
              <option value="sine">Sinusoidal</option>
              <option value="square">Cuadrada</option>
              <option value="sawtooth">Diente de Sierra</option>
              <option value="triangle">Triangular</option>
              <option value="noise">Ruido</option>
            </select>

            <!-- Selector de Referencias e Input Externo para Waveform -->
            <div class="mt-2 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">CIM Refs</span>
                <div class="flex items-center gap-1.5 cursor-pointer" @click="localExternalInputs.waveform = !localExternalInputs.waveform; updateNode()">
                  <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">Entrada Externa</span>
                  <div 
                    class="w-6 h-3 rounded-full border transition-colors relative"
                    :class="localExternalInputs.waveform ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
                  >
                    <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white transition-transform" :class="localExternalInputs.waveform ? 'translate-x-[12px]' : 'translate-x-[1px]'"></div>
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                <button 
                  v-for="comp in props.availableCimComponents" :key="comp.id"
                  @click="toggleParamRef('waveform', comp.id)"
                  class="text-[7px] px-1 py-0.5 rounded border transition-all truncate max-w-[60px]"
                  :class="localParamRefs['waveform']?.includes(comp.id) 
                    ? 'bg-geist-fg text-geist-bg border-geist-fg' 
                    : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border hover:border-geist-accents-3'"
                  :title="comp.name"
                >
                  {{ comp.name.split('] ')[1] || comp.name }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="'filterType' in localParams" class="space-y-1.5">
            <label class="text-[10px] font-medium text-geist-fg">Tipo de Filtro</label>
            <select v-model="localParams.filterType" @change="updateNode" class="geist-input w-full text-xs cursor-pointer">
              <option value="LPF">Low Pass (Pasa-Bajos)</option>
              <option value="HPF">High Pass (Pasa-Altos)</option>
              <option value="BPF">Band Pass (Pasa-Banda)</option>
            </select>

            <!-- Selector de Referencias e Input Externo para FilterType -->
            <div class="mt-2 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">CIM Refs</span>
                <div class="flex items-center gap-1.5 cursor-pointer" @click="localExternalInputs.filterType = !localExternalInputs.filterType; updateNode()">
                  <span class="text-[7px] font-bold text-geist-accents-4 uppercase tracking-tighter">Entrada Externa</span>
                  <div 
                    class="w-6 h-3 rounded-full border transition-colors relative"
                    :class="localExternalInputs.filterType ? 'bg-emerald-500 border-emerald-600' : 'bg-geist-accents-2 border-geist-border'"
                  >
                    <div class="absolute top-[1px] w-2 h-2 rounded-full bg-white transition-transform" :class="localExternalInputs.filterType ? 'translate-x-[12px]' : 'translate-x-[1px]'"></div>
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                <button 
                  v-for="comp in props.availableCimComponents" :key="comp.id"
                  @click="toggleParamRef('filterType', comp.id)"
                  class="text-[7px] px-1 py-0.5 rounded border transition-all truncate max-w-[60px]"
                  :class="localParamRefs['filterType']?.includes(comp.id) 
                    ? 'bg-geist-fg text-geist-bg border-geist-fg' 
                    : 'bg-geist-accents-1 text-geist-accents-4 border-geist-border hover:border-geist-accents-3'"
                  :title="comp.name"
                >
                  {{ comp.name.split('] ')[1] || comp.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

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
