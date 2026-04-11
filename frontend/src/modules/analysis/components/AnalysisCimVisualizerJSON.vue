<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseJSONEditor from '@/shared/components/editors/BaseJSONEditor.vue'
import BaseDiffEditor from '@/shared/components/editors/BaseDiffEditor.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'
import { validateCimRelations } from '../utils/analysisCimValidation'
import { CIM_RELATIONS_SCHEMA } from '../utils/cim-relations-schema'

const store = useAnalysisMachinesStore()
const localJson = ref('')
const isSyntaxValid = ref(true)
const businessErrors = ref<any[]>([])
const isSaving = ref(false)
const saveMessage = ref('')
const isDiffEnabled = ref(false)

const originalPrettyJson = computed(() => {
  if (!store.currentCim?.machinesRelations) return '{}'
  try {
    const parsed = JSON.parse(store.currentCim.machinesRelations)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return store.currentCim.machinesRelations
  }
})

const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

const errors = computed(() => {
  const errs: any[] = []
  if (!isSyntaxValid.value) errs.push({ message: 'Error de sintaxis JSON' })
  businessErrors.value.forEach(e => errs.push(e))
  return errs
})

const isValid = computed(() => errors.value.length === 0)

const validateInternal = (val: string) => {
  try {
    const parsed = JSON.parse(val)
    isSyntaxValid.value = true
    const machineUuids = Object.values(store.machineUuids)
    businessErrors.value = validateCimRelations(parsed, machineUuids)
  } catch (e: any) {
    isSyntaxValid.value = false
    businessErrors.value = []
  }
}

watch(() => store.currentCim?.machinesRelations, (newVal) => {
  if (!newVal || newVal === localJson.value) return
  try {
    const parsed = JSON.parse(newVal)
    localJson.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    localJson.value = newVal
  }
  validateInternal(localJson.value)
}, { immediate: true })

watch([localJson, isValid], () => {
  if (!store.currentCim || isSaving.value) return
  const isDirty = localJson.value.replace(/\s/g, '') !== store.currentCim.machinesRelations.replace(/\s/g, '')
  
  if (isDirty) {
    setUnsavedState(true, isValid.value, async () => {
      await handleSave()
      return true
    })
  } else {
    clearUnsavedState()
  }
})

const handleSave = async () => {
  if (!isValid.value || !store.currentCim) return
  isSaving.value = true
  const result = await store.updateCimRelations(localJson.value)
  isSaving.value = false
  if (result.success) {
    saveMessage.value = 'Guardado con éxito'
    clearUnsavedState()
    setTimeout(() => saveMessage.value = '', 3000)
    isDiffEnabled.value = false
  } else {
    saveMessage.value = 'Error: ' + result.message
  }
}
</script>

<template>
  <div class="analysis-cim-visualizer-json h-full flex flex-col bg-geist-bg">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-geist-border bg-geist-accents-1/20">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-geist-fg/5 flex items-center justify-center text-geist-accents-4 border border-geist-border">
          <i class="fa-solid fa-code text-sm"></i>
        </div>
        <div>
          <span class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-[0.2em] block leading-none mb-1">Editor CIM</span>
          <span class="text-xs font-mono font-medium text-geist-fg">Análisis Raw JSON</span>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <span v-if="saveMessage" class="text-[10px] font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">{{ saveMessage }}</span>
        
        <button 
          @click="isDiffEnabled = !isDiffEnabled"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-geist-border bg-geist-bg text-[10px] uppercase font-bold text-geist-accents-5 hover:text-geist-fg transition-all"
          :class="{ 'bg-geist-accents-2 text-geist-fg': isDiffEnabled }"
        >
          <i class="fa-solid fa-code-compare"></i>
          {{ isDiffEnabled ? 'Editor' : 'Comparar' }}
        </button>

        <button 
          @click="handleSave"
          :disabled="!isValid || isSaving"
          class="geist-button-primary !px-6 !py-2 gap-2 text-[10px] font-bold uppercase transition-all"
          :class="{ 'opacity-50 grayscale cursor-not-allowed': !isValid || isSaving }"
        >
          <i class="fa-solid" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          {{ isSaving ? 'Guardando...' : 'Aplicar Cambios' }}
        </button>
      </div>
    </div>

    <!-- Editor -->
    <div class="flex-1 min-h-0 relative">
      <BaseJSONEditor 
        v-if="!isDiffEnabled"
        v-model="localJson"
        :schema="CIM_RELATIONS_SCHEMA"
        @change="validateInternal"
      />
      <div v-else class="w-full h-full">
        <BaseDiffEditor 
          :original="originalPrettyJson" 
          :modified="localJson" 
        />
      </div>
    </div>

    <!-- Errors -->
    <div v-if="errors.length > 0" class="bg-geist-error/5 border-t border-geist-error/20 p-3 px-6 animate-in slide-in-from-bottom-2">
      <div class="flex items-start gap-4">
        <i class="fa-solid fa-circle-exclamation text-geist-error mt-0.5"></i>
        <div class="flex-1 overflow-hidden">
          <p class="text-[10px] font-bold text-geist-error uppercase tracking-widest mb-1">Errores de Validación</p>
          <div class="flex flex-wrap gap-x-4 gap-y-1">
            <div v-for="(err, idx) in errors.slice(0, 3)" :key="idx" class="flex items-center gap-2">
              <span class="text-[10px] font-mono text-geist-accents-4" v-if="err.nodeId">[{{ err.nodeId }}]</span>
              <span class="text-[10px] font-mono text-geist-error">{{ err.message }}</span>
            </div>
            <span v-if="errors.length > 3" class="text-[10px] font-mono text-geist-accents-3 italic">...y {{ errors.length - 3 }} más</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
