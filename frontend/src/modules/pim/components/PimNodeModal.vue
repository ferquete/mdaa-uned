<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue';
import { computed, ref, watch } from 'vue';

interface Option {
  id: string
  name: string
  type: 'g' | 'mod' | 'edge'
}

interface Props {
  show: boolean
  title: string
  confirmText: string
  availableCimComponents: Option[]
  initialData?: { 
    name: string, 
    description: string, 
    ids_references: string[] 
  } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', name: string, description: string, ids_references: string[]): void
}>()

const localName = ref('')
const localDescription = ref('')
const selectedRefs = ref<string[]>([])

watch(() => props.show, (isShowing) => {
  if (isShowing) {
    if (props.initialData) {
      localName.value = props.initialData.name
      localDescription.value = props.initialData.description
      selectedRefs.value = [...(props.initialData.ids_references || [])]
    } else {
      localName.value = ''
      localDescription.value = ''
      selectedRefs.value = []
    }
  }
}, { immediate: true })

const isValid = computed(() => {
  return localName.value.trim().length >= 1 && localName.value.trim().length <= 20
})

const toggleRef = (id: string) => {
  const idx = selectedRefs.value.indexOf(id)
  if (idx === -1) {
    selectedRefs.value.push(id)
  } else {
    selectedRefs.value.splice(idx, 1)
  }
}

const handleConfirm = () => {
  if (isValid.value) {
    emit('confirm', localName.value.trim(), localDescription.value.trim(), selectedRefs.value)
  }
}

const handleClose = () => {
  emit('close')
}

const getIcon = (type: string) => {
  switch (type) {
    case 'g': return 'fa-wave-square text-node-generator'
    case 'mod': return 'fa-wand-magic-sparkles text-node-modificator'
    case 'edge': return 'fa-link text-geist-success'
    default: return 'fa-circle-dot'
  }
}
</script>

<template>
  <BaseModal :show="show" :title="title" maxWidth="max-w-3xl" @close="handleClose">
    <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <!-- Nombre -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <label class="text-[10px] font-bold uppercase tracking-widest text-geist-accents-5">Nombre del Nodo</label>
          <span 
            class="text-[10px] font-mono"
            :class="localName.length > 20 ? 'text-geist-error' : 'text-geist-accents-4'"
          >
            {{ localName.length }}/20
          </span>
        </div>
        <input 
          v-model="localName"
          type="text" 
          placeholder="Ej: Filtro de Entrada"
          class="geist-input w-full"
          maxlength="20"
        >
      </div>

      <!-- Descripción -->
      <div class="space-y-2">
        <label class="text-[10px] font-bold uppercase tracking-widest text-geist-accents-5">Descripción (Opcional)</label>
        <textarea 
          v-model="localDescription"
          placeholder="Describe el propósito técnico de este nodo..."
          rows="3"
          class="geist-input w-full resize-none py-2"
        ></textarea>
      </div>

      <!-- Referencias CIM -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-geist-accents-5">Referencias a elementos de Análisis de las máquinas de análisis seleccionadas</label>
          <div class="h-px flex-1 bg-geist-border opacity-30"></div>
        </div>
        
        <div v-if="availableCimComponents.length === 0" class="p-4 border-2 border-dashed border-geist-border rounded-xl bg-geist-accents-1/30 text-center">
          <p class="text-[10px] text-geist-accents-4 italic">No hay componentes CIM disponibles en las máquinas referenciadas.</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-2">
          <button 
            v-for="opt in availableCimComponents" 
            :key="opt.id"
            @click="toggleRef(opt.id)"
            class="flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left group"
            :class="selectedRefs.includes(opt.id) 
              ? 'bg-geist-fg text-geist-bg border-transparent shadow-md' 
              : 'bg-geist-accents-1/50 border-geist-border text-geist-fg hover:border-geist-accents-4'"
          >
            <div 
              class="w-7 h-7 rounded-lg flex items-center justify-center border border-geist-border/20 shadow-sm transition-colors"
              :class="selectedRefs.includes(opt.id) ? 'bg-white/10' : 'bg-geist-bg'"
            >
              <i :class="['fa-solid', getIcon(opt.type), 'text-[11px]', selectedRefs.includes(opt.id) ? '!text-white' : '']"></i>
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold truncate">{{ opt.name }}</span>
                <span class="text-[8px] font-mono opacity-40 ml-2">{{ opt.id.substring(0, 8) }}...</span>
              </div>
              <span class="text-[8px] uppercase tracking-tighter opacity-60 font-mono">
                {{ opt.type === 'g' ? 'Generador' : opt.type === 'mod' ? 'Modificador' : 'Conexión' }}
              </span>
            </div>

            <div class="flex-shrink-0">
              <i 
                class="fa-solid transition-all duration-300" 
                :class="[
                  selectedRefs.includes(opt.id) ? 'fa-circle-check text-geist-bg' : 'fa-circle-plus opacity-20 group-hover:opacity-60'
                ]"
              ></i>
            </div>
          </button>
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex gap-3 pt-4 sticky bottom-0 bg-geist-bg pb-1">
        <button 
          class="geist-button-secondary flex-1" 
          @click="handleClose"
        >
          Cancelar
        </button>
        <button 
          class="geist-button-primary flex-1" 
          :disabled="!isValid"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-geist-accents-2);
  border-radius: 10px;
}
</style>
