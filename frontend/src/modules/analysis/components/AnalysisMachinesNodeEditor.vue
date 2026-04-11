<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'
import RelationSelector from '@/shared/components/forms/RelationSelector.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { ANALYSIS_RULES } from '../utils/analysisMachinesValidation'
import type { CimGenerator, CimModificator, CimDocument } from '@/shared/types'

const store = useAnalysisMachinesStore()
const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

const localData = ref<CimGenerator | CimModificator>({ 
  id: '', 
  name: '', 
  description: '', 
  inputs: '', 
  outputs: '', 
  params: '',
  refs: [],
  rels: [] 
} as any)
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
  validate('inputs', localData.value.inputs)
  validate('outputs', localData.value.outputs)
  validate('params', localData.value.params)

  // Validaciones de relaciones
  const validateRel = (arr: any[], prefix: string) => {
    arr?.forEach(r => {
      const v = r.description || ''
      if (v.length < RULES.description.min || v.length > RULES.description.max) {
        errs[`${prefix}_${r.id}`] = `Requerido (10-300)`
      }
    })
  }

  if (isGenerator.value) validateRel((localData.value as any).rels || [], 'rel')
  validateRel(localData.value.refs || [], 'ref')

  return errs
})

const isFormValid = computed(() => Object.keys(validationErrors.value).length === 0)

const nodeInfo = computed(() => {
  const id = store.selectedNodeId
  if (!id || typeof id !== 'string') return null
  if (id.startsWith('new-m-')) {
    const parts = id.split('-');
    return { machineId: Number(parts[2]), type: parts[3] as 'g' | 'mod', subId: localData.value?.id || 'new', isNew: true }
  }
  if (!id.startsWith('m-')) return null
  const parts = id.split('-');
  return { machineId: Number(parts[1]), type: parts[2] as 'g' | 'mod', subId: parts.slice(3).join('-'), isNew: false }
})

const isGenerator = computed(() => nodeInfo.value?.type === 'g')

let isInitializing = false

watch(() => store.selectedSubNode, (newNode) => {
  if (newNode && !isSaving.value) {
    isInitializing = true
    const rawData = JSON.parse(JSON.stringify(newNode))
    const mapRel = (r: any) => (typeof r === 'object' ? { id: r.id?.ref || r.id || '', description: r.description || '' } : { id: r || '', description: '' })
    if (rawData.refs) rawData.refs = rawData.refs.map(mapRel)
    if (rawData.rels) rawData.rels = rawData.rels.map(mapRel)
    localData.value = rawData as any
    if (isGenerator.value && !(localData.value as any).rels) (localData.value as any).rels = []
    if (!localData.value.refs) localData.value.refs = []
    clearUnsavedState()
    setTimeout(() => { isInitializing = false }, 50)
  }
}, { immediate: true })

const options = computed(() => {
  if (!store.selectedNode) return { generators: [], modificators: [] }
  const doc = store.parsedDocs[store.selectedNode.id] as CimDocument
  if (!doc) return { generators: [], modificators: [] }
  return {
    generators: doc.generators.map(g => ({ id: g.id, name: g.name })),
    modificators: doc.modificators.map(m => ({ id: m.id, name: m.name }))
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

const toggleRel = (array: any[] | undefined, id: string) => {
  if (!array) return
  const idx = array.findIndex(a => a.id === id)
  if (idx === -1) array.push({ id, description: '' })
  else array.splice(idx, 1)
}
</script>

<template>
  <div v-if="nodeInfo" class="analysis-node-editor h-full flex flex-col bg-geist-bg">
    <!-- Header -->
    <div class="px-8 py-6 border-b border-geist-border bg-geist-accents-1/20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
          :class="isGenerator ? 'bg-node-generator shadow-node-generator' : 'bg-node-modificator shadow-node-modificator'">
          <i :class="isGenerator ? 'fa-solid fa-wave-square' : 'fa-solid fa-wand-magic-sparkles'"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-geist-fg">{{ isGenerator ? 'Generador' : 'Modificador' }}: <span class="font-mono text-geist-accents-5">{{ localData.name || 'Nuevo' }}</span></h2>
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
            <div class="space-y-2" v-for="field in ['name', 'inputs', 'outputs' , 'params']" :key="field">
              <label class="text-[11px] font-bold uppercase text-geist-accents-5 flex justify-between">
                {{ field.charAt(0).toUpperCase() + field.slice(1) }}
                <span v-if="validationErrors[field]" class="text-geist-error normal-case">{{ validationErrors[field] }}</span>
              </label>
              <input v-model="(localData as any)[field]" type="text" class="geist-input w-full" :class="{'border-geist-error/50': validationErrors[field]}">
            </div>
            <div class="md:col-span-2 space-y-2">
              <label class="text-[11px] font-bold uppercase text-geist-accents-5 flex justify-between">
                Descripción
                <span v-if="validationErrors.description" class="text-geist-error normal-case">{{ validationErrors.description }}</span>
              </label>
              <textarea v-model="localData.description" rows="3" class="geist-input w-full resize-none" :class="{'border-geist-error/50': validationErrors.description}"></textarea>
            </div>
          </div>
        </section>

        <!-- Use Generic RelationSelector -->
        <RelationSelector v-if="isGenerator" 
          title="Relaciones (rel)" 
          subtitle="Generadores vinculados dinámicamente"
          :options="options.generators.filter(g => g.id !== localData.id)"
          :selected="(localData as any).rels"
          color-class="text-node-generator"
          bg-class="bg-node-generator/10"
          ring-class="ring-node-generator/30"
          :validation-error="(id) => validationErrors[`rel_${id}`]"
          @toggle="(id) => toggleRel((localData as any).rels, id)"
          @update-description="(id, val) => { const r = (localData as any).rels?.find((r:any) => r.id === id); if(r) r.description = val }"
        />

        <RelationSelector 
          title="Referencias (ref)" 
          subtitle="Dependencias estáticas de otros componentes"
          :options="[...options.generators.map(g => ({...g, name: `[GEN] ${g.name}`})), ...options.modificators.map(m => ({...m, name: `[MOD] ${m.name}`}))]"
          :selected="localData.refs!"
          color-class="text-geist-fg"
          bg-class="bg-geist-accents-2"
          :validation-error="(id) => validationErrors[`ref_${id}`]"
          @toggle="(id) => toggleRel(localData.refs, id)"
          @update-description="(id, val) => { const r = localData.refs?.find(r => r.id === id); if(r) r.description = val }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-geist-accents-2); border-radius: 10px; }
</style>
