<script setup lang="ts">
import BaseDiffEditor from '@/shared/components/editors/BaseDiffEditor.vue'
import BaseJSONEditor from '@/shared/components/editors/BaseJSONEditor.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { computed, ref, watch } from 'vue'
import { usePimStore } from '../stores/pimStore'
import { PIM_MACHINE_SCHEMA } from '../utils/pim-machine-schema'
import { PIM_RELATIONS_SCHEMA } from '../utils/pim-relations-schema'

const store = usePimStore()
const localJson = ref('')
const isSyntaxValid = ref(true)
const businessErrors = ref<any[]>([])
const schemaMarkers = ref<any[]>([])
const isSaving = ref(false)
const saveMessage = ref('')
const isDiffEnabled = ref(false)

const isMachineView = computed(() => store.selectedMachine !== null)

const editorPath = computed(() => {
  if (isMachineView.value) return `pim-machine-${store.selectedMachine?.id}.json`
  return 'pim-relations.json'
})

const originalJsonStr = computed(() => {
  if (isMachineView.value) {
    return store.selectedMachine?.machine || '{}'
  }
  return store.currentPim?.machinesRelations || '{}'
})

const originalPrettyJson = computed(() => {
  try {
    const parsed = JSON.parse(originalJsonStr.value)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return originalJsonStr.value
  }
})

const currentSchema = computed(() => {
  return isMachineView.value ? PIM_MACHINE_SCHEMA : PIM_RELATIONS_SCHEMA
})

const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

const errors = computed(() => {
  const errs: any[] = []
  if (!isSyntaxValid.value) errs.push({ message: 'Error de sintaxis JSON' })
  businessErrors.value.forEach(e => errs.push(e))
  
  // Añadir errores de esquema (Monaco severity >= 4 captura Advertencias y Errores)
  schemaMarkers.value.forEach(m => {
    if (m.severity >= 4) {
      errs.push({ message: `${m.message} (línea ${m.startLineNumber})` })
    }
  })
  
  return errs
})

const isValid = computed(() => errors.value.length === 0)

const validateInternal = (val: string) => {
  try {
    const parsed = JSON.parse(val)
    isSyntaxValid.value = true
    const manualErrors: any[] = []
    
    // Validación manual rápida de campos obligatorios como respaldo a Monaco
    if (isMachineView.value) {
      if (!parsed.id) manualErrors.push({ message: 'Estructura: Falta el campo "id"' })
      if (!parsed.name) manualErrors.push({ message: 'Estructura: Falta el campo "name"' })
      // La descripción es opcional en PIM, el esquema ya valida su formato si se incluye
    } else {
      // Relaciones
      if (!parsed.relations) manualErrors.push({ message: 'Estructura: Falta el campo "relations"' })
    }
    
    businessErrors.value = manualErrors
  } catch (e: any) {
    isSyntaxValid.value = false
    businessErrors.value = []
  }
}

const handleValidationChange = (markers: any[]) => {
  schemaMarkers.value = markers
}

// Watcher para detectar cambio de nodo o carga inicial
watch(originalJsonStr, (newVal) => {
  if (newVal === undefined) return
  try {
    const parsed = JSON.parse(newVal || '{}')
    
    // Asegurar que name esté presente si es una máquina y falta
    const machine = store.selectedMachine
    if (machine && !parsed.name) {
      parsed.name = machine.name
    }
    
    localJson.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    localJson.value = newVal || ''
  }
  validateInternal(localJson.value)
  schemaMarkers.value = [] // Limpiar al cambiar de documento
  clearUnsavedState()
}, { immediate: true })

watch([localJson, isValid], () => {
  if ((!store.currentPim && !isMachineView.value) || isSaving.value) return
  const currentClean = localJson.value.replace(/\s/g, '')
  const originalClean = originalJsonStr.value.replace(/\s/g, '')
  const isDirty = currentClean !== originalClean
  
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
  if (!isValid.value) return
  if (!store.currentPim && !isMachineView.value) return

  isSaving.value = true
  let result;
  
  if (isMachineView.value) {
    result = await store.updateMachineRawJson(store.selectedMachine!.id, localJson.value)
  } else {
    result = await store.updatePimRelations(localJson.value)
  }
  
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
  <div class="pim-visualizer-json h-full flex flex-col bg-geist-bg">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-geist-border bg-geist-accents-1/20">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-geist-fg/5 flex items-center justify-center text-geist-accents-4 border border-geist-border">
          <i class="fa-solid fa-code text-sm"></i>
        </div>
        <div class="flex flex-col">
          <span class="text-[9px] uppercase font-bold tracking-widest text-geist-accents-5">Editor JSON</span>
          <span class="text-[10px] font-mono text-geist-accents-4">{{ isMachineView ? 'Máquina' : 'Relaciones' }}</span>
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
          class="geist-button-primary !px-6 !py-2 gap-2 text-[10px] font-bold uppercase transition-all shadow-sm"
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
        :schema="currentSchema"
        :path="editorPath"
        @change="validateInternal"
        @validation-change="handleValidationChange"
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
              <span class="text-[10px] font-mono text-geist-error">{{ err.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
