<script setup lang="ts">
import RelationSelector from '@/shared/components/forms/RelationSelector.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import type { CimDocument, CimGenerator, CimModificator } from '@/shared/types'
import { computed, ref, watch } from 'vue'
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'
import { ANALYSIS_RULES } from '../utils/analysisMachinesValidation'

const store = useAnalysisMachinesStore()
const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

const localData = ref<any>({ 
  id: '', 
  name: '', 
  description: '', 
  params: '',
  sendTo: [],
  externalOutput: { hasExternalOutput: false, description: '' },
  externalInput: { hasExternalInput: false, description: '' }
})
const isSaving = ref(false)
const saveMessage = ref('')

const RULES = ANALYSIS_RULES

const validationErrors = computed(() => {
  const errs: Record<string, string> = {}
  const validate = (key: keyof typeof RULES, value: string | undefined) => {
    const val = value || ''
    if (val.length < RULES[key].min) errs[key] = `Mínimo ${RULES[key].min}`
    else if (val.length > RULES[key].max) errs[key] = `Máximo ${RULES[key].max}`
  }

  validate('name', localData.value.name)
  validate('description', localData.value.description)
  validate('params', localData.value.params)

  if (localData.value.externalOutput?.description && localData.value.externalOutput.description.length > 600) {
    errs['extOutDesc'] = 'Máximo 600 caracteres'
  }
  if (localData.value.externalInput?.description && localData.value.externalInput.description.length > 600) {
    errs['extInDesc'] = 'Máximo 600 caracteres'
  }

  // Validaciones de relaciones sendTo
  localData.value.sendTo?.forEach((s: any) => {
    const v = s.description || ''
    if (v.length < 10 || v.length > 600) {
      errs[`sendTo_${s.idRef}`] = `Requerido (10-600)`
    }
  })

  return errs
})

const isFormValid = computed(() => Object.keys(validationErrors.value).length === 0)

const nodeInfo = computed(() => {
  const id = store.selectedNodeId
  if (!id || typeof id !== 'string') return null
  if (id.startsWith('new-m-')) {
    const parts = id.split('-');
    return { machineId: Number(parts[2]), type: parts[3] as 'el', subId: localData.value?.id || 'new', isNew: true }
  }
  if (!id.startsWith('m-')) return null
  const parts = id.split('-');
  return { machineId: Number(parts[1]), type: parts[2] as 'el', subId: parts.slice(3).join('-'), isNew: false }
})

let isInitializing = false

watch(() => store.selectedSubNode, (newNode) => {
  if (newNode && !isSaving.value) {
    isInitializing = true
    const rawData = JSON.parse(JSON.stringify(newNode))
    
    // Normalizar sendTo y externals
    if (rawData.sendTo) {
      rawData.sendTo = rawData.sendTo.map((s: any) => ({
        id: s.id || crypto.randomUUID(),
        idRef: s.idRef || '',
        description: s.description || ''
      }))
    } else {
      rawData.sendTo = []
    }
    
    if (!rawData.externalOutput) rawData.externalOutput = { hasExternalOutput: false, description: '' };
    if (!rawData.externalInput) rawData.externalInput = { hasExternalInput: false, description: '' };

    localData.value = rawData as any
    clearUnsavedState()
    setTimeout(() => { isInitializing = false }, 50)
  }
}, { immediate: true })

const options = computed(() => {
  if (!store.selectedNode) return { elements: [] }
  const doc = store.parsedDocs[store.selectedNode.id] as CimDocument
  if (!doc) return { elements: [] }
  return {
    elements: (doc.elements || []).map(e => ({ id: e.id, name: e.name }))
  }
})

const handleSave = async (): Promise<boolean> => {
  if (!nodeInfo.value) return false
  isSaving.value = true
  const result = await store.updateSubNodeData(nodeInfo.value.machineId, nodeInfo.value.subId, nodeInfo.value.type, localData.value, nodeInfo.value.isNew)
  isSaving.value = false
  if (result.success) {
    clearUnsavedState()
    saveMessage.value = 'Guardado'
    setTimeout(() => saveMessage.value = '', 3000)
    return true
  } else {
    saveMessage.value = 'Error: ' + result.message
    return false
  }
}

watch([localData, isFormValid], () => {
  if (isInitializing || isSaving.value) return
  setUnsavedState(true, isFormValid.value, handleSave)
}, { deep: true })

const toggleSendTo = (idRef: string) => {
  if (!localData.value.sendTo) localData.value.sendTo = []
  const idx = localData.value.sendTo.findIndex(s => s.idRef === idRef)
  if (idx === -1) {
    localData.value.sendTo.push({ 
      id: crypto.randomUUID(), 
      idRef, 
      description: '' 
    })
  } else {
    localData.value.sendTo.splice(idx, 1)
  }
}
</script>

<template>
  <div v-if="nodeInfo" class="analysis-node-editor h-full flex flex-col bg-geist-bg">
    <!-- Header -->
    <div class="px-8 py-6 border-b border-geist-border bg-geist-accents-1/20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-node-generator shadow-node-generator">
          <i class="fa-solid fa-cube"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-geist-fg">Elemento: <span class="font-mono text-geist-accents-5">{{ localData.name || 'Nuevo' }}</span></h2>
          <p class="text-[10px] font-mono text-geist-accents-4 uppercase tracking-widest">ID: {{ localData.id }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span v-if="saveMessage" class="text-xs font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">{{ saveMessage }}</span>
        <button @click="handleSave" :disabled="isSaving || !isFormValid" class="geist-button-primary !px-8 !py-2.5 gap-2">
          <i class="fa-solid" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          {{ isSaving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <div class="max-w-4xl mx-auto space-y-12">
        <section class="space-y-6">
          <div class="flex items-center gap-2">
            <h3 class="text-xs uppercase tracking-widest font-bold text-geist-accents-4">General</h3>
            <div class="h-px flex-1 bg-geist-border opacity-50"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-2">
              <label class="text-[11px] font-bold uppercase text-geist-accents-5 flex justify-between">
                Nombre
                <div class="flex items-center gap-2">
                  <span v-if="validationErrors.name" class="text-geist-error normal-case">{{ validationErrors.name }}</span>
                  <span class="text-[10px] font-mono opacity-50">{{ localData.name?.length || 0 }}/{{ RULES.name.max }}</span>
                </div>
              </label>
              <input v-model="localData.name" type="text" :maxlength="RULES.name.max" class="geist-input w-full" :class="{'border-geist-error/50': validationErrors.name}">
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-bold uppercase text-geist-accents-5 flex justify-between">
                Parámetros
                <div class="flex items-center gap-2">
                  <span v-if="validationErrors.params" class="text-geist-error normal-case">{{ validationErrors.params }}</span>
                  <span class="text-[10px] font-mono opacity-50">{{ localData.params?.length || 0 }}/{{ RULES.params.max }}</span>
                </div>
              </label>
              <textarea v-model="localData.params" rows="2" :maxlength="RULES.params.max" class="geist-input w-full resize-none py-2" :class="{'border-geist-error/50': validationErrors.params}"></textarea>
            </div>
            <div class="md:col-span-2 space-y-2">
              <label class="text-[11px] font-bold uppercase text-geist-accents-5 flex justify-between">
                Descripción
                <div class="flex items-center gap-2">
                  <span v-if="validationErrors.description" class="text-geist-error normal-case">{{ validationErrors.description }}</span>
                  <span class="text-[10px] font-mono opacity-50">{{ localData.description?.length || 0 }}/{{ RULES.description.max }}</span>
                </div>
              </label>
              <textarea v-model="localData.description" rows="3" :maxlength="RULES.description.max" class="geist-input w-full resize-none" :class="{'border-geist-error/50': validationErrors.description}"></textarea>
            </div>
          </div>
        </section>

        <!-- Interfaz Externa -->
        <section class="space-y-6">
          <div class="flex items-center gap-2">
            <h3 class="text-xs uppercase tracking-widest font-bold text-geist-accents-4">Interfaz Externa</h3>
            <div class="h-px flex-1 bg-geist-border opacity-50"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- External Input -->
            <div class="space-y-4 bg-geist-accents-1/30 p-4 rounded-xl border border-geist-border">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="localData.externalInput.hasExternalInput" class="rounded text-geist-success focus:ring-geist-success">
                <span class="text-sm font-bold text-geist-fg">Permite Entrada Externa</span>
              </label>
              <div class="space-y-2" :class="{ 'opacity-50 pointer-events-none': !localData.externalInput.hasExternalInput }">
                <label class="text-[11px] font-bold uppercase text-geist-accents-5 flex justify-between">
                  Descripción Entrada
                  <div class="flex items-center gap-2">
                    <span v-if="validationErrors.extInDesc" class="text-geist-error normal-case">{{ validationErrors.extInDesc }}</span>
                    <span class="text-[10px] font-mono opacity-50">{{ localData.externalInput.description?.length || 0 }}/600</span>
                  </div>
                </label>
                <textarea v-model="localData.externalInput.description" rows="3" maxlength="600" class="geist-input w-full resize-none" :class="{'border-geist-error/50': validationErrors.extInDesc}" placeholder="Describe el puerto de entrada externo..."></textarea>
              </div>
            </div>
            
            <!-- External Output -->
            <div class="space-y-4 bg-geist-accents-1/30 p-4 rounded-xl border border-geist-border">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="localData.externalOutput.hasExternalOutput" class="rounded text-geist-success focus:ring-geist-success">
                <span class="text-sm font-bold text-geist-fg">Ofrece Salida Externa</span>
              </label>
              <div class="space-y-2" :class="{ 'opacity-50 pointer-events-none': !localData.externalOutput.hasExternalOutput }">
                <label class="text-[11px] font-bold uppercase text-geist-accents-5 flex justify-between">
                  Descripción Salida
                  <div class="flex items-center gap-2">
                    <span v-if="validationErrors.extOutDesc" class="text-geist-error normal-case">{{ validationErrors.extOutDesc }}</span>
                    <span class="text-[10px] font-mono opacity-50">{{ localData.externalOutput.description?.length || 0 }}/600</span>
                  </div>
                </label>
                <textarea v-model="localData.externalOutput.description" rows="3" maxlength="600" class="geist-input w-full resize-none" :class="{'border-geist-error/50': validationErrors.extOutDesc}" placeholder="Describe el puerto de salida externo..."></textarea>
              </div>
            </div>
          </div>
        </section>

        <!-- Use Unified RelationSelector for sendTo -->
        <RelationSelector 
          title="Modifica los siguientes elementos" 
          subtitle="Componentes vinculados a los cuales envía información interna"
          :options="options.elements.map(e => ({...e, name: `[EL] ${e.name}`})).filter(o => o.id !== localData.id)"
          :selected="localData.sendTo?.map((s: any) => ({ id: s.idRef, description: s.description })) || []"
          color-class="text-geist-fg"
          bg-class="bg-geist-accents-2"
          :validation-error="(idRef) => validationErrors[`sendTo_${idRef}`]"
          @toggle="(idRef) => toggleSendTo(idRef)"
          @update-description="(idRef, val) => { const s = localData.sendTo?.find((s: any) => s.idRef === idRef); if(s) s.description = val }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-geist-accents-2); border-radius: 10px; }
</style>
