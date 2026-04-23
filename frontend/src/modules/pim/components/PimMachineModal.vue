<script setup lang="ts">
import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  show: boolean
  title: string
  confirmText: string
  initialData?: {
    name: string
    description: string
    ids_cim_reference: string[]
  } | null
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'confirm'])

const analysisStore = useAnalysisMachinesStore()

const name = ref('')
const description = ref('')
const selectedCimIds = ref<string[]>([])

const nameError = computed(() => {
  if (name.value.length === 0) return 'El nombre es obligatorio'
  if (name.value.length > 20) return 'Máximo 20 caracteres'
  return ''
})

const descriptionError = computed(() => {
  if (description.value.length === 0) return 'La descripción es obligatoria'
  if (description.value.length < 20) return 'Mínimo 20 caracteres'
  if (description.value.length > 600) return 'Máximo 600 caracteres'
  return ''
})

const isValid = computed(() => {
  return !nameError.value && !descriptionError.value && selectedCimIds.value.length > 0
})

watch(() => props.show, (isShowing) => {
  if (isShowing) {
    if (props.initialData) {
      name.value = props.initialData.name
      description.value = props.initialData.description
      selectedCimIds.value = [...props.initialData.ids_cim_reference]
    } else {
      name.value = ''
      description.value = ''
      selectedCimIds.value = []
    }
  }
})

const toggleCim = (uuid: string) => {
  const index = selectedCimIds.value.indexOf(uuid)
  if (index === -1) {
    selectedCimIds.value.push(uuid)
  } else {
    selectedCimIds.value.splice(index, 1)
  }
}

const handleConfirm = () => {
  if (isValid.value) {
    emit('confirm', name.value, description.value, selectedCimIds.value)
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && props.show && isValid.value) {
    // Evitar que el Enter se procese en textareas (permite saltos de línea)
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
    handleConfirm()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// Mapeo de IDs de máquinas de análisis a sus nombres
const availableCimMachines = computed(() => {
  return analysisStore.machines.map(m => {
    const doc = analysisStore.parsedDocs[m.id]
    return {
      uuid: doc?.id || String(m.id),
      name: doc?.name || `Máquina ${m.id}`,
      description: doc?.description || ''
    }
  })
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-geist-bg/80 backdrop-blur-sm" @click="emit('close')"></div>
        
        <!-- Modal Content -->
        <div class="relative w-full max-w-lg bg-geist-bg border border-geist-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-geist-border flex items-center justify-between bg-geist-accents-1/50">
            <h2 class="text-sm font-bold uppercase tracking-widest text-geist-fg">{{ title }}</h2>
            <button @click="emit('close')" class="text-geist-accents-4 hover:text-geist-fg transition-colors">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 text-geist-fg">
            
            <!-- Nombre -->
            <div class="space-y-1.5">
              <label class="text-[10px] uppercase font-bold text-geist-accents-5 tracking-wider px-1">Nombre de la Máquina PIM</label>
              <input 
                v-model="name"
                type="text"
                placeholder="Ej: Mezclador Principal"
                class="w-full bg-geist-accents-1 border border-geist-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-geist-fg/5 transition-all text-geist-fg"
                maxlength="20"
              />
              <div class="flex justify-between px-1">
                <span v-if="nameError" class="text-[10px] text-geist-error font-medium">{{ nameError }}</span>
                <span class="text-[10px] text-geist-accents-4 ml-auto">{{ name.length }}/20</span>
              </div>
            </div>

            <!-- Descripción -->
            <div class="space-y-1.5">
              <label class="text-[10px] uppercase font-bold text-geist-accents-5 tracking-wider px-1">Descripción Conceptual</label>
              <textarea 
                v-model="description"
                placeholder="Describe el propósito de esta máquina en el diseño conceptual..."
                rows="4"
                class="w-full bg-geist-accents-1 border border-geist-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-geist-fg/5 transition-all text-geist-fg resize-none font-mono text-[11px] leading-relaxed"
              ></textarea>
              <div class="flex justify-between px-1">
                <span v-if="descriptionError" class="text-[10px] text-geist-error font-medium">{{ descriptionError }}</span>
                <span class="text-[10px] text-geist-accents-4 ml-auto">{{ description.length }}/600</span>
              </div>
            </div>

            <!-- Referencias de Análisis (CIM) -->
            <div class="space-y-2.5">
              <label class="text-[10px] uppercase font-bold text-geist-accents-5 tracking-wider px-1">Referencias a Máquinas de Análisis</label>
              
              <div v-if="availableCimMachines.length === 0" class="p-4 rounded-xl border border-dashed border-geist-border bg-geist-accents-1/30 text-center">
                <p class="text-[10px] text-geist-accents-4 italic">No hay máquinas de análisis definidas en este proyecto.</p>
              </div>

              <div v-else class="grid grid-cols-1 gap-2">
                <button 
                  v-for="cim in availableCimMachines" 
                  :key="cim.uuid"
                  @click="toggleCim(cim.uuid)"
                  class="group relative flex items-center p-3 rounded-xl border transition-all text-left overflow-hidden"
                  :class="selectedCimIds.includes(cim.uuid) 
                    ? 'bg-geist-success/5 border-geist-success/30 text-geist-fg shadow-sm' 
                    : 'bg-geist-accents-1/50 border-geist-border text-geist-accents-5 hover:border-geist-accents-4 hover:bg-geist-accents-1'"
                >
                  <!-- Glass indicator -->
                  <div 
                    v-if="selectedCimIds.includes(cim.uuid)" 
                    class="absolute inset-y-0 left-0 w-1 bg-geist-success shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                  ></div>

                  <div class="flex-1 min-w-0 mr-3">
                    <h4 class="text-xs font-bold truncate">{{ cim.name }}</h4>
                    <p class="text-[10px] opacity-60 truncate font-mono mt-0.5">{{ cim.description }}</p>
                  </div>

                  <div class="flex-shrink-0">
                    <div 
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      :class="selectedCimIds.includes(cim.uuid) 
                        ? 'border-geist-success bg-geist-success text-geist-bg' 
                        : 'border-geist-accents-3 group-hover:border-geist-accents-5'"
                    >
                      <i v-if="selectedCimIds.includes(cim.uuid)" class="fa-solid fa-check text-[10px]"></i>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-geist-accents-1/50 border-t border-geist-border flex items-center justify-end gap-3 font-bold">
            <button 
              @click="emit('close')"
              class="px-5 py-2 rounded-xl text-xs text-geist-accents-5 hover:text-geist-fg transition-colors"
            >
              Cancelar
            </button>
            <button 
              @click="handleConfirm"
              :disabled="!isValid"
              class="px-6 py-2 rounded-xl text-xs transition-all shadow-lg overflow-hidden relative group"
              :class="isValid 
                ? 'bg-geist-fg text-geist-bg hover:scale-[1.02] active:scale-[0.98]' 
                : 'bg-geist-accents-2 text-geist-accents-4 cursor-not-allowed opacity-50'"
            >
              <div v-if="isValid" class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

textarea::-webkit-scrollbar { width: 4px; }
textarea::-webkit-scrollbar-track { background: transparent; }
textarea::-webkit-scrollbar-thumb { background: var(--color-geist-border); border-radius: 10px; }
</style>
