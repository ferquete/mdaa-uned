<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  show: boolean
  title: string
  confirmText: string
  sourceLabel?: string
  destinationLabel?: string
  initialData?: {
    id: string
    description: string
  } | null
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'confirm'])

const description = ref('')

const descriptionError = computed(() => {
  if (description.value.length === 0) return 'La descripción es obligatoria'
  if (description.value.length < 10) return 'Mínimo 10 caracteres'
  if (description.value.length > 600) return 'Máximo 600 caracteres'
  return ''
})

const isValid = computed(() => !descriptionError.value)

watch(() => props.show, (isShowing) => {
  if (isShowing) {
    description.value = props.initialData?.description || ''
  }
})

const handleConfirm = () => {
  if (isValid.value) {
    emit('confirm', {
      id: props.initialData?.id || crypto.randomUUID(),
      description: description.value
    })
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-geist-bg/80 backdrop-blur-sm" @click="emit('close')"></div>
        
        <div class="relative w-full max-w-md bg-geist-bg border border-geist-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-geist-border flex items-center justify-between bg-geist-accents-1/50">
            <h2 class="text-xs font-bold uppercase tracking-widest text-geist-fg">{{ title }}</h2>
            <button @click="emit('close')" class="text-geist-accents-4 hover:text-geist-fg transition-colors">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="p-6 space-y-6 text-geist-fg">
            <!-- Contexto de la conexión -->
            <div v-if="sourceLabel && destinationLabel" class="flex items-center justify-between gap-4 p-3 rounded-xl bg-geist-accents-1 border border-geist-border/50 shadow-inner overflow-hidden">
               <div class="flex-1 min-w-0">
                  <p class="text-[8px] uppercase font-bold text-geist-accents-4 mb-0.5 tracking-tighter">Origen</p>
                  <p class="text-[9px] font-mono text-geist-fg truncate">{{ sourceLabel }}</p>
               </div>
               <div class="flex-shrink-0 text-geist-accents-3">
                  <i class="fa-solid fa-arrow-right-long text-xs"></i>
               </div>
               <div class="flex-1 min-w-0 text-right">
                  <p class="text-[8px] uppercase font-bold text-geist-accents-4 mb-0.5 tracking-tighter">Destino</p>
                  <p class="text-[9px] font-mono text-geist-fg truncate">{{ destinationLabel }}</p>
               </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] uppercase font-bold text-geist-accents-5 tracking-wider px-1">Descripción de la Relación</label>
              <textarea 
                v-model="description"
                placeholder="Explica el propósito de esta interconexión entre máquinas..."
                rows="4"
                class="w-full bg-geist-accents-1 border border-geist-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-geist-fg/5 transition-all text-geist-fg resize-none font-mono text-[11px] leading-relaxed"
              ></textarea>
              <div class="flex justify-between px-1">
                <span v-if="descriptionError" class="text-[10px] text-geist-error font-medium">{{ descriptionError }}</span>
                <span class="text-[10px] text-geist-accents-4 ml-auto">{{ description.length }}/600</span>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-geist-accents-1/50 border-t border-geist-border flex items-center justify-end gap-3 font-bold">
            <button @click="emit('close')" class="px-5 py-2 rounded-xl text-xs text-geist-accents-5 hover:text-geist-fg transition-colors">
              Cancelar
            </button>
            <button 
              @click="handleConfirm"
              :disabled="!isValid"
              class="px-6 py-2 rounded-xl text-xs transition-all shadow-lg overflow-hidden relative group"
              :class="isValid ? 'bg-geist-fg text-geist-bg hover:scale-[1.02]' : 'bg-geist-accents-2 text-geist-accents-4 cursor-not-allowed'"
            >
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
</style>
