<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAnalysisStore } from '../stores/analysisStore'
import BaseJSONEditor from '@/shared/components/editors/BaseJSONEditor.vue'
import { validateCimDocument } from '../utils/analysis-validation'
import type { CimMachine } from '@/shared/types'

const props = defineProps<{
  machine: CimMachine
}>()

const store = useAnalysisStore()
const localJson = ref('')
const isSyntaxValid = ref(true)
const businessErrors = ref<any[]>([])
const isSaving = ref(false)
const saveMessage = ref('')

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
    businessErrors.value = validateCimDocument(parsed)
  } catch (e: any) {
    isSyntaxValid.value = false
    businessErrors.value = []
  }
}

watch(() => props.machine.machine, (newVal) => {
  if (newVal === localJson.value) return
  
  try {
    const parsed = JSON.parse(newVal)
    localJson.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    localJson.value = newVal
  }
  validateInternal(localJson.value)
}, { immediate: true })

const handleSave = async () => {
  if (!isValid.value) return
  
  isSaving.value = true
  const result = await store.updateMachineRawJson(props.machine.id, localJson.value)
  isSaving.value = false
  
  if (result.success) {
    saveMessage.value = 'Guardado con éxito'
    setTimeout(() => saveMessage.value = '', 3000)
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
          <span class="text-xs font-mono font-medium text-geist-fg">Editor de Máquina CIM</span>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <span v-if="saveMessage" class="text-[10px] font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">{{ saveMessage }}</span>
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
    <div class="flex-1 min-h-0">
      <BaseJSONEditor 
        v-model="localJson"
        @change="validateInternal"
      />
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
