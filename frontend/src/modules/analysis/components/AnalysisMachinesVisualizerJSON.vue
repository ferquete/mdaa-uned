<script setup lang="ts">
import BaseDiffEditor from '@/shared/components/editors/BaseDiffEditor.vue'
import BaseJSONEditor from '@/shared/components/editors/BaseJSONEditor.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import type { CimMachine } from '@/shared/types'
import { computed, ref, watch } from 'vue'
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'
import { validateCimDocument } from '../utils/analysisMachinesValidation'
import { CIM_MACHINE_SCHEMA } from '../utils/machine-schema'

const props = defineProps<{
  machine: CimMachine | null
}>()

const store = useAnalysisMachinesStore()
const localJson = ref('')
const isSyntaxValid = ref(true)
const businessErrors = ref<any[]>([])
const isSaving = ref(false)
const saveMessage = ref('')
const isDiffEnabled = ref(false)
const originalPrettyJson = computed(() => {
  if (!props.machine?.machine) return ''
  try {
    const parsed = JSON.parse(props.machine.machine)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return props.machine.machine
  }
})

const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

interface DisplayError {
  message: string
  nodeId?: string
}

const errors = computed<DisplayError[]>(() => {
  const errs: DisplayError[] = []
  if (!isSyntaxValid.value) errs.push({ message: 'Error de sintaxis JSON' })
  businessErrors.value.forEach(e => errs.push(e as DisplayError))
  return errs
})

const isValid = computed(() => errors.value.length === 0)

const validateInternal = (val: string) => {
  try {
    const parsed = JSON.parse(val)
    isSyntaxValid.value = true
    businessErrors.value = validateCimDocument(parsed, store.machineUuids, props.machine?.id)
  } catch (e: any) {
    isSyntaxValid.value = false
    businessErrors.value = []
  }
}

watch(() => props.machine?.machine, (newVal) => {
  if (!newVal || newVal === localJson.value) {
    if (!newVal) localJson.value = ''
    return
  }
  
  try {
    const parsed = JSON.parse(newVal)
    localJson.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    localJson.value = newVal
  }
  validateInternal(localJson.value)
}, { immediate: true })

// Notificar cambios sin guardar
watch([localJson, isValid], () => {
  if (!props.machine || isSaving.value) return
  
  let isDirty = false
  try {
    // Comprobamos si el JSON parseado es realmente diferente
    const originalNormalized = JSON.stringify(JSON.parse(props.machine.machine))
    const currentNormalized = JSON.stringify(JSON.parse(localJson.value))
    isDirty = originalNormalized !== currentNormalized
  } catch (e) {
    // Si falla el parseo, comparamos como string
    isDirty = localJson.value !== props.machine.machine
  }
  
  if (isDirty) {
    setUnsavedState(true, isValid.value, async () => {
      await handleSave()
      return true
    })
  } else {
    clearUnsavedState()
  }
})

const onEditorDidMount = (editor: any, monaco: any) => {
  // Funcionalidad de salto a definición eliminada a petición del usuario
}

const handleSave = async () => {
  if (!isValid.value || !props.machine) return
  
  isSaving.value = true
  const result = await store.updateMachineRawJson(props.machine.id, localJson.value)
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
  <div class="analysis-visualizer-json h-full flex flex-col bg-geist-bg">
    <!-- Editor Header -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-geist-border bg-geist-accents-1/20">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-geist-fg/5 flex items-center justify-center text-geist-accents-4 border border-geist-border">
          <i class="fa-solid fa-code text-sm"></i>
        </div>
        <div>
          <span class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-[0.2em] block leading-none mb-1">Raw Mode</span>
          <span class="text-xs font-mono font-medium text-geist-fg">Editor</span>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <span v-if="saveMessage" class="text-[10px] font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">{{ saveMessage }}</span>
        
        <!-- Toggle Diff (Pendiente de implementación de componente Diff) -->
        <button 
          v-if="machine"
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

    <!-- Main Editor -->
    <div class="flex-1 min-h-0 relative">
      <BaseJSONEditor 
        v-if="!isDiffEnabled"
        v-model="localJson"
        :schema="CIM_MACHINE_SCHEMA"
        @change="validateInternal"
        @editor-did-mount="onEditorDidMount"
      />
      <div v-else class="w-full h-full">
        <BaseDiffEditor 
          :original="originalPrettyJson" 
          :modified="localJson" 
        />
      </div>
    </div>

    <!-- Error Bar -->
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
