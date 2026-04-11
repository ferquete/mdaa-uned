<script setup lang="ts">
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { computed, ref, watch } from 'vue'
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'
import { ANALYSIS_RULES } from '../utils/analysisMachinesValidation'

const store = useAnalysisMachinesStore()
const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

const localDescription = ref('')
const isSaving = ref(false)
const saveMessage = ref('')

const RULES = ANALYSIS_RULES.cim_description

const validationError = computed(() => {
  const val = localDescription.value || ''
  if (val.length < RULES.min) return `Mínimo ${RULES.min} caracteres`
  if (val.length > RULES.max) return `Máximo ${RULES.max} caracteres`
  return null
})

const isValid = computed(() => !validationError.value)

let isInitializing = false

// Inicializar datos al cargar
watch(() => store.currentCim, (newCim) => {
  if (newCim && !isSaving.value) {
    isInitializing = true
    localDescription.value = newCim.description
    clearUnsavedState()
    setTimeout(() => { isInitializing = false }, 50)
  }
}, { immediate: true })

const handleSave = async (): Promise<boolean> => {
  if (!isValid.value) return false
  isSaving.value = true
  const result = await store.updateCimCentral(localDescription.value)
  isSaving.value = false
  
  if (result.success) {
    clearUnsavedState()
    saveMessage.value = 'Guardado con éxito'
    setTimeout(() => saveMessage.value = '', 3000)
    return true
  } else {
    saveMessage.value = 'Error: ' + result.message
    return false
  }
}

// Control de cambios sin guardar
watch(localDescription, (newVal) => {
  if (isInitializing || isSaving.value || !store.currentCim) return
  
  const isDirty = newVal !== store.currentCim.description
  setUnsavedState(isDirty, isValid.value, handleSave)
})
</script>

<template>
  <div class="analysis-cim-editor h-full flex flex-col bg-geist-bg">
    <!-- Header -->
    <div class="px-8 py-6 border-b border-geist-border bg-geist-accents-1/20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-geist-fg flex items-center justify-center text-geist-bg shadow-lg">
          <i class="fa-solid fa-microscope"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-geist-fg">Configuración Central de Análisis</h2>
          <p class="text-[10px] font-mono text-geist-accents-4 uppercase tracking-widest">Entidad CIM: ID {{ store.currentCim?.id }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span v-if="saveMessage" class="text-xs font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">{{ saveMessage }}</span>
        <button 
          @click="handleSave" 
          :disabled="isSaving || !isValid" 
          class="geist-button-primary !px-8 !py-2.5 gap-2"
        >
          <i class="fa-solid" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-8">
      <div class="max-w-3xl mx-auto space-y-8">
        <div class="bg-geist-accents-1/30 border border-geist-border p-6 rounded-2xl space-y-4">
          <div class="flex items-center gap-2 mb-2">
            <i class="fa-solid fa-circle-info text-geist-accents-4 text-xs"></i>
            <h3 class="text-xs uppercase tracking-widest font-bold text-geist-accents-4">Descripción del Sistema</h3>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between items-end">
              <label class="text-[11px] font-bold uppercase text-geist-accents-5">Descripción Central (CIM)</label>
              <span v-if="validationError" class="text-[10px] text-geist-error font-medium">{{ validationError }}</span>
              <span v-else class="text-[10px] text-geist-accents-4 font-mono">{{ localDescription.length }} / {{ RULES.max }}</span>
            </div>
            <textarea 
              v-model="localDescription" 
              rows="8" 
              class="geist-input w-full resize-none text-sm leading-relaxed" 
              :class="{'border-geist-error/50': validationError}"
              placeholder="Describe el propósito general de este análisis de síntesis de audio..."
            ></textarea>
            <p class="text-[11px] text-geist-accents-4 italic">Esta descripción se utiliza como contexto base para todas las máquinas y sus relaciones.</p>
          </div>
        </div>

        </div>
      </div>
    </div>
</template>

<style scoped>
textarea:focus {
  background: var(--color-geist-bg);
}
</style>
