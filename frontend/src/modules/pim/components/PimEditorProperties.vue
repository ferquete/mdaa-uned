<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { PIM_NODE_METADATA, PIM_MODIFIABLE_PARAMS } from '../utils/pim-node-metadata'

const props = defineProps<{
  nodeId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { findNode, nodes } = useVueFlow()

const selectedNode = computed(() => {
  if (!props.nodeId) return null
  return findNode(props.nodeId)
})

const nodeType = computed(() => selectedNode.value?.data.type || '')
const metadata = computed(() => PIM_NODE_METADATA[nodeType.value])

// --- Estado local para edición ---
const localName = ref('')
const localDescription = ref('')
const localParams = ref<Record<string, any>>({})
const errors = ref<Record<string, string>>({})

// Sincronizar estado local cuando cambia el nodo seleccionado
watch(() => props.nodeId, (newId) => {
  if (newId && selectedNode.value) {
    const data = selectedNode.value.data
    localName.value = data.name || ''
    localDescription.value = data.description || ''
    // Inicializar parámetros si no existen
    localParams.value = JSON.parse(JSON.stringify(data.parameters || {}))
    validateAll()
  }
}, { immediate: true })

const updateNode = () => {
  if (!selectedNode.value) return
  
  // Actualizar el nodo en Vue Flow
  selectedNode.value.data = {
    ...selectedNode.value.data,
    name: localName.value,
    description: localDescription.value,
    parameters: {
      ...localParams.value,
      name: localName.value,
      description: localDescription.value
    },
    isValid: Object.keys(errors.value).length === 0
  }
}

// --- Validaciones ---
const validateField = (field: string, value: any) => {
  delete errors.value[field]

  if (field === 'name') {
    if (!value || value.length < 1) errors.value.name = 'El nombre es obligatorio'
    if (value.length > 20) errors.value.name = 'Máximo 20 caracteres'
  }

  // Validaciones técnicas basadas en dsl/pim.md
  if (field === 'frequency' && (value < 0 || value > 20000)) {
    errors.value.frequency = 'Rango: 0 - 20,000 Hz'
  }
  if (field === 'pan' && (value < -1 || value > 1)) {
    errors.value.pan = 'Rango: -1 a 1'
  }
  if ((field === 'gain' || field === 'amplitude' || field === 'roomSize' || field === 'damping' || field === 'dryWet') && (value < 0 || value > 1)) {
    errors.value.field = 'Rango: 0 a 1'
  }
  if (field === 'resonance' && (value < 0 || value > 10)) {
    errors.value.resonance = 'Rango: 0 a 10'
  }

  updateNode()
}

const validateAll = () => {
  errors.value = {}
  validateField('name', localName.value)
  Object.entries(localParams.value).forEach(([k, v]) => validateField(k, v))
}

const isModifiable = (paramName: string) => {
  const modifiables = PIM_MODIFIABLE_PARAMS[nodeType.value] || []
  return modifiables.includes(paramName)
}

const toggleModifiable = (paramName: string) => {
  if (!localParams.value[paramName]) return
  // En el JSON PIM, los parámetros son objetos { initialValue, isModifiable, ... }
  // Pero aquí estamos simplificando para el editor visual. 
  // En la persistencia final (handleSave en PimVisualEditor) se reconstruirá la estructura completa.
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
            <label class="text-[10px] font-bold text-geist-accents-5 uppercase tracking-widest">Descripción</label>
            <textarea 
              v-model="localDescription"
              @input="updateNode"
              rows="3"
              class="geist-input w-full text-xs resize-none"
              placeholder="Añade una descripción técnica..."
            ></textarea>
          </div>
        </div>

        <div class="h-px bg-geist-border"></div>

        <!-- Parámetros Técnicos (Ejemplos basados en tipos comunes) -->
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
          </div>

          <!-- Ganancia / Amplitud / Dry-Wet (0 a 1) -->
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
            </div>
          </div>

          <!-- Selects (Waveform, FilterType, etc) -->
          <div v-if="'waveform' in localParams" class="space-y-1.5">
            <label class="text-[10px] font-medium text-geist-fg">Forma de Onda</label>
            <select v-model="localParams.waveform" @change="updateNode" class="geist-input w-full text-xs cursor-pointer">
              <option value="sine">Sinusoidal</option>
              <option value="square">Cuadrada</option>
              <option value="sawtooth">Diente de Sierra</option>
              <option value="triangle">Triangular</option>
              <option value="noise">Ruido</option>
            </select>
          </div>

          <div v-if="'filterType' in localParams" class="space-y-1.5">
            <label class="text-[10px] font-medium text-geist-fg">Tipo de Filtro</label>
            <select v-model="localParams.filterType" @change="updateNode" class="geist-input w-full text-xs cursor-pointer">
              <option value="LPF">Low Pass (Pasa-Bajos)</option>
              <option value="HPF">High Pass (Pasa-Altos)</option>
              <option value="BPF">Band Pass (Pasa-Banda)</option>
            </select>
          </div>
        </div>

        <!-- Info Técnica -->
        <div class="mt-8 p-3 rounded-lg bg-geist-accents-1 border border-geist-border italic">
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
