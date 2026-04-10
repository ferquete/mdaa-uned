<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectStore } from '@/modules/projects/stores/projectStore'
import type { CimGenerator, CimModificator, CimDocument } from '@/shared/types'

const store = useProjectStore()

const localData = ref<CimGenerator | CimModificator>({ id: '', name: '', description: '', inputs: '', outputs: '', params: '' } as any)
const isSaving = ref(false)
const saveMessage = ref('')

// Reglas de validación (sincronizadas con mda-audio-cim-validator.ts)
const RULES = {
  name: { min: 1, max: 20 },
  description: { min: 10, max: 300 },
  inputs: { min: 10, max: 300 },
  outputs: { min: 10, max: 300 },
  params: { min: 10, max: 300 }
}

const validationErrors = computed(() => {
  const errs: Record<string, string> = {}
  
  const validate = (key: keyof typeof RULES, value: string | undefined) => {
    const val = value || ''
    if (val.length < RULES[key].min) {
      errs[key] = `Mínimo ${RULES[key].min} caracteres (actual: ${val.length})`
    } else if (val.length > RULES[key].max) {
      errs[key] = `Máximo ${RULES[key].max} caracteres (actual: ${val.length})`
    }
  }

  validate('name', localData.value.name)
  validate('description', localData.value.description)
  validate('inputs', localData.value.inputs)
  validate('outputs', localData.value.outputs)
  validate('params', localData.value.params)

  // Validaciones de relaciones (mandatory description 10-300)
  if (isGenerator.value && (localData.value as any).rels) {
    ;(localData.value as any).rels.forEach((rel: {id: string, description: string}) => {
      const v = rel.description || ''
      if (v.length < RULES.description.min || v.length > RULES.description.max) {
        errs[`rel_${rel.id}`] = `Mínimo ${RULES.description.min}, máximo ${RULES.description.max} caract. (actual: ${v.length})`
      }
    })
  }

  if (localData.value.refs) {
    localData.value.refs.forEach((ref: {id: string, description: string}) => {
      const v = ref.description || ''
      if (v.length < RULES.description.min || v.length > RULES.description.max) {
        errs[`ref_${ref.id}`] = `Mínimo ${RULES.description.min}, máximo ${RULES.description.max} caract. (actual: ${v.length})`
      }
    })
  }

  return errs
})

const isFormValid = computed(() => Object.keys(validationErrors.value).length === 0)

// Determinar el tipo y la máquina padre
const nodeInfo = computed(() => {
  const id = store.selectedNodeId
  if (!id || typeof id !== 'string') return null
  
  if (id.startsWith('new-m-')) {
    const parts = id.split('-');
    return {
      machineId: Number(parts[2]),
      type: parts[3] as 'g' | 'mod',
      subId: localData.value?.id || 'new',
      isNew: true
    }
  }

  if (!id.startsWith('m-')) return null
  
  const firstDash = id.indexOf('-');
  const secondDash = id.indexOf('-', firstDash + 1);
  const thirdDash = id.indexOf('-', secondDash + 1);
  
  if (secondDash === -1 || thirdDash === -1) return null;

  return {
    machineId: Number(id.substring(firstDash + 1, secondDash)),
    type: id.substring(secondDash + 1, thirdDash) as 'g' | 'mod',
    subId: id.substring(thirdDash + 1),
    isNew: false
  }
})

const isGenerator = computed(() => nodeInfo.value?.type === 'g')

import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'

const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

let isInitializing = false

// Cargar datos iniciales con mapeo de relaciones para la UI
watch(() => store.selectedSubNode, (newNode) => {
  if (newNode && !isSaving.value) {
    isInitializing = true
    // Hacemos una copia profunda
    const rawData = JSON.parse(JSON.stringify(newNode));
    
    // Convertimos las relaciones a su objeto completo ({id, description})
    const mapRelation = (r: any) => {
      if (typeof r === 'object' && r !== null) {
        return { id: r.id?.ref || r.id || '', description: r.description || '' }
      }
      return { id: r || '', description: '' }
    }

    if (rawData.refs) {
      rawData.refs = rawData.refs.map(mapRelation);
    }
    if (rawData.rels) {
      rawData.rels = rawData.rels.map(mapRelation);
    }

    localData.value = rawData as any;

    // Inicializar arrays si no existen
    if (newNode.$type === 'Generator' || nodeInfo.value?.type === 'g') {
      if (!(localData.value as any).rels) (localData.value as any).rels = [];
      if (!localData.value.refs) localData.value.refs = [];
    } else {
      if (!localData.value.refs) localData.value.refs = [];
    }
    
    clearUnsavedState()
    setTimeout(() => { isInitializing = false }, 50)
  }
}, { immediate: true })

// Obtener todas las opciones disponibles de la máquina padre
const options = computed(() => {
  if (!store.selectedNode) return { generators: [], modificators: [] }
  const doc = store.parsedDocs[store.selectedNode.id as number] as CimDocument;
  if (!doc) return { generators: [], modificators: [] }
  return {
    generators: doc.generators.map(g => ({ id: g.id, name: g.name })),
    modificators: doc.modificators.map(m => ({ id: m.id, name: m.name }))
  }
})

// Filtrar "otros" generadores para rel (excluyendo el actual)
const otherGenerators = computed(() => {
  return options.value.generators.filter(g => g.id !== nodeInfo.value?.subId)
})

const handleSave = async (): Promise<boolean> => {
  if (!nodeInfo.value) return false
  
  isSaving.value = true
  saveMessage.value = ''
  
  // Mapeamos los datos de vuelta al formato del DSL (ya son objetos con id y description)
  const dataToSave = JSON.parse(JSON.stringify(localData.value));

  const result = await store.updateSubNodeData(
    nodeInfo.value.machineId,
    nodeInfo.value.subId,
    nodeInfo.value.type,
    dataToSave,
    nodeInfo.value.isNew
  )
  
  isSaving.value = false
  if (result.success) {
    clearUnsavedState()
    saveMessage.value = 'Cambios guardados correctamente'
    setTimeout(() => saveMessage.value = '', 3000)
    return true
  } else {
    saveMessage.value = 'Error al guardar: ' + result.message
    return false
  }
}

watch([localData, isFormValid], () => {
  if (isInitializing || isSaving.value) return
  setUnsavedState(true, isFormValid.value, handleSave)
}, { deep: true })

const toggleSelection = (array: any[], id: string) => {
  const index = array.findIndex(a => a.id === id)
  if (index === -1) {
    array.push({ id, description: '' })
  } else {
    array.splice(index, 1)
  }
}

// Helpers para UI
const getRelation = (array: any[], id: string) => array?.find(a => a.id === id)
const isSelected = (array: any[], id: string) => !!getRelation(array, id)
</script>

<template>
  <div v-if="nodeInfo" class="node-editor h-full flex flex-col bg-geist-bg animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="px-8 py-6 border-b border-geist-border bg-geist-accents-1/20">
      <div class="flex items-center justify-between mb-2" v-if="localData">
        <div class="flex items-center gap-3">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
            :class="isGenerator ? 'bg-node-generator shadow-node-generator' : 'bg-node-modificator shadow-node-modificator'"
          >
            <i :class="isGenerator ? 'fa-solid fa-wave-square' : 'fa-solid fa-wand-magic-sparkles'"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold tracking-tight text-geist-fg">
              {{ isGenerator ? 'Generador' : 'Modificador' }}: <span class="font-mono text-geist-accents-5">{{ localData.name || 'Nuevo' }}</span>
            </h2>
            <p class="text-[10px] font-mono uppercase tracking-widest text-geist-accents-4">ID: {{ localData.id }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <transition name="fade">
            <span v-if="saveMessage" class="text-xs font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">
              {{ saveMessage }}
            </span>
          </transition>
          <button 
            @click="handleSave"
            :disabled="isSaving || !isFormValid"
            class="geist-button-primary !px-8 !py-2.5 gap-2 group transition-all"
            :class="(!isFormValid && !isSaving) ? 'opacity-50 cursor-not-allowed grayscale' : ''"
          >
            <i class="fa-solid" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
            {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <div class="max-w-4xl mx-auto space-y-10">
        
        <!-- Basic Info Section -->
        <section>
          <div class="flex items-center gap-2 mb-6">
            <h3 class="text-xs uppercase tracking-[0.2em] font-bold text-geist-accents-4">Información General</h3>
            <div class="h-px flex-1 bg-geist-border opacity-50"></div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-2">
              <label class="text-[11px] font-bold uppercase tracking-wider text-geist-accents-5 ml-1 flex justify-between">
                Nombre
                <span v-if="validationErrors.name" class="text-[9px] text-geist-error normal-case font-mono animate-pulse">{{ validationErrors.name }}</span>
              </label>
              <input 
                v-model="localData.name" 
                type="text" 
                class="geist-input !text-base transition-colors" 
                :class="{ 'border-geist-error/50 bg-geist-error/[0.02]': validationErrors.name }"
                placeholder="Ej: Oscilador Principal"
              >
            </div>

            <div class="space-y-2">
              <label class="text-[11px] font-bold uppercase tracking-wider text-geist-accents-5 ml-1 flex justify-between">
                Inputs
                <span v-if="validationErrors.inputs" class="text-[9px] text-geist-error normal-case font-mono animate-pulse">{{ validationErrors.inputs }}</span>
              </label>
              <input 
                v-model="localData.inputs" 
                type="text" 
                class="geist-input !font-mono transition-colors" 
                :class="{ 'border-geist-error/50 bg-geist-error/[0.02]': validationErrors.inputs }"
                placeholder="Ej: audioIn, ctrl"
              >
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-bold uppercase tracking-wider text-geist-accents-5 ml-1 flex justify-between">
                Outputs
                <span v-if="validationErrors.outputs" class="text-[9px] text-geist-error normal-case font-mono animate-pulse">{{ validationErrors.outputs }}</span>
              </label>
              <input 
                v-model="localData.outputs" 
                type="text" 
                class="geist-input !font-mono transition-colors" 
                :class="{ 'border-geist-error/50 bg-geist-error/[0.02]': validationErrors.outputs }"
                placeholder="Ej: audioOut"
              >
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-bold uppercase tracking-wider text-geist-accents-5 ml-1 flex justify-between">
                Parámetros
                <span v-if="validationErrors.params" class="text-[9px] text-geist-error normal-case font-mono animate-pulse">{{ validationErrors.params }}</span>
              </label>
              <input 
                v-model="localData.params" 
                type="text" 
                class="geist-input !font-mono transition-colors" 
                :class="{ 'border-geist-error/50 bg-geist-error/[0.02]': validationErrors.params }"
                placeholder="Ej: freq:440, amp:0.5"
              >
            </div>
            <div class="md:col-span-2 space-y-2">
              <label class="text-[11px] font-bold uppercase tracking-wider text-geist-accents-5 ml-1 flex justify-between">
                Descripción
                <span v-if="validationErrors.description" class="text-[9px] text-geist-error normal-case font-mono animate-pulse">{{ validationErrors.description }}</span>
              </label>
              <textarea 
                v-model="localData.description" 
                rows="3" 
                class="geist-input !text-base resize-none py-3 transition-colors" 
                :class="{ 'border-geist-error/50 bg-geist-error/[0.02]': validationErrors.description }"
                placeholder="Describe el propósito de este componente..."
              ></textarea>
            </div>
          </div>
        </section>

        <!-- Relationships Section (Rel) - Only for Generators -->
        <section v-if="isGenerator">
          <div class="flex items-center gap-2 mb-6">
            <h3 class="text-xs uppercase tracking-[0.2em] font-bold text-geist-accents-4">Relaciones (rel)</h3>
            <div class="h-px flex-1 bg-geist-border opacity-50"></div>
          </div>
          
          <p class="text-xs text-geist-accents-4 mb-4 font-mono italic">Selecciona otros generadores relacionados con este componente.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div 
              v-for="gen in otherGenerators" 
              :key="gen.id"
              class="flex flex-col border rounded-lg transition-all overflow-hidden w-full"
              :class="isSelected((localData as CimGenerator).rels!, gen.id) 
                ? 'bg-node-generator/5 border-node-generator ring-1 ring-node-generator/30' 
                : 'bg-geist-accents-1 border-geist-border'"
            >
              <button 
                @click="toggleSelection((localData as CimGenerator).rels!, gen.id)"
                class="flex items-center gap-2 p-3 text-xs font-medium text-left hover:bg-geist-accents-2 transition-colors w-full"
                :class="isSelected((localData as CimGenerator).rels!, gen.id) ? 'text-node-generator' : 'text-geist-accents-5'"
              >
                <i class="fa-solid transition-transform duration-300" :class="isSelected((localData as CimGenerator).rels!, gen.id) ? 'fa-check-circle scale-110' : 'fa-circle-plus opacity-40'"></i>
                <span class="truncate">{{ gen.name }}</span>
              </button>

              <div v-if="isSelected((localData as CimGenerator).rels!, gen.id)" class="px-3 pb-3 pt-1 border-t border-node-generator/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <label class="text-[9px] font-bold uppercase tracking-wider text-node-generator mb-1 flex justify-between">
                  Descripción
                  <span v-if="validationErrors[`rel_${gen.id}`]" class="text-[9px] text-geist-error normal-case font-mono">{{ validationErrors[`rel_${gen.id}`] }}</span>
                </label>
                <textarea 
                  v-model="getRelation((localData as CimGenerator).rels!, gen.id)!.description"
                  rows="2"
                  class="geist-input !text-[11px] !py-1.5 resize-none transition-colors"
                  :class="{'border-geist-error bg-geist-error/10': validationErrors[`rel_${gen.id}`]}"
                  placeholder="Obligatorio (min 10 chars)..."
                ></textarea>
              </div>
            </div>

            <div v-if="otherGenerators.length === 0" class="col-span-full py-8 border-2 border-dashed border-geist-border rounded-xl flex flex-col items-center justify-center bg-geist-accents-1/30">
              <i class="fa-solid fa-ghost text-geist-accents-2 text-2xl mb-2"></i>
              <p class="text-xs text-geist-accents-4 font-mono">No hay otros generadores disponibles.</p>
            </div>
          </div>
        </section>

        <!-- References Section (Ref) -->
        <section>
          <div class="flex items-center gap-2 mb-6">
            <h3 class="text-xs uppercase tracking-[0.2em] font-bold text-geist-accents-4">Referencias (ref)</h3>
            <div class="h-px flex-1 bg-geist-border opacity-50"></div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Generators Column -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 px-1">
                <i class="fa-solid fa-volume-high text-[10px] text-node-generator"></i>
                <h4 class="text-[10px] uppercase tracking-widest font-bold text-geist-accents-5">Generadores</h4>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="gen in options.generators" :key="gen.id" class="flex flex-col border rounded-lg overflow-hidden transition-all"
                  :class="isSelected(localData.refs!, gen.id) ? 'bg-node-generator/5 border-node-generator shadow-sm relative' : 'bg-geist-bg border-geist-border hover:bg-geist-accents-1'"
                >
                  <button 
                    @click="toggleSelection(localData.refs!, gen.id)"
                    class="flex items-center gap-3 p-3 text-xs font-medium text-left group w-full"
                  >
                    <div class="w-5 h-5 rounded-md flex items-center justify-center border transition-all"
                      :class="isSelected(localData.refs!, gen.id) ? 'bg-node-generator border-node-generator text-white' : 'border-geist-border bg-geist-accents-1 group-hover:border-geist-accents-3'"
                    >
                      <i v-if="isSelected(localData.refs!, gen.id)" class="fa-solid fa-check text-[10px]"></i>
                    </div>
                    <span class="truncate" :class="isSelected(localData.refs!, gen.id) ? 'text-node-generator' : 'text-geist-accents-5'">{{ gen.name }}</span>
                    <span class="ml-auto text-[10px] font-mono opacity-40" :class="isSelected(localData.refs!, gen.id) ? 'text-node-generator' : ''">{{ gen.id }}</span>
                  </button>
                  
                  <div v-if="isSelected(localData.refs!, gen.id)" class="px-3 pb-3 pt-1 border-t border-node-generator/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label class="text-[9px] font-bold uppercase tracking-wider text-node-generator mb-1 flex justify-between">
                      Descripción
                      <span v-if="validationErrors[`ref_${gen.id}`]" class="text-[9px] text-geist-error normal-case font-mono">{{ validationErrors[`ref_${gen.id}`] }}</span>
                    </label>
                    <textarea 
                      v-model="getRelation(localData.refs!, gen.id)!.description"
                      rows="2"
                      class="geist-input !text-[11px] !py-1.5 resize-none transition-colors"
                      :class="{'border-geist-error bg-geist-error/10': validationErrors[`ref_${gen.id}`]}"
                      placeholder="Obligatorio (min 10 chars)..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modificators Column -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 px-1">
                <i class="fa-solid fa-sliders text-[10px] text-node-modificator"></i>
                <h4 class="text-[10px] uppercase tracking-widest font-bold text-geist-accents-5">Modificadores</h4>
              </div>
              <div class="flex flex-col gap-3">
                <div v-for="mod in options.modificators" :key="mod.id" class="flex flex-col border rounded-lg overflow-hidden transition-all"
                  :class="isSelected(localData.refs!, mod.id) ? 'bg-node-modificator/5 border-node-modificator shadow-sm relative' : 'bg-geist-bg border-geist-border hover:bg-geist-accents-1'"
                >
                  <button 
                    @click="toggleSelection(localData.refs!, mod.id)"
                    class="flex items-center gap-3 p-3 text-xs font-medium text-left group w-full"
                  >
                    <div class="w-5 h-5 rounded-md flex items-center justify-center border transition-all"
                      :class="isSelected(localData.refs!, mod.id) ? 'bg-node-modificator border-node-modificator text-white' : 'border-geist-border bg-geist-accents-1 group-hover:border-geist-accents-3'"
                    >
                      <i v-if="isSelected(localData.refs!, mod.id)" class="fa-solid fa-check text-[10px]"></i>
                    </div>
                    <span class="truncate" :class="isSelected(localData.refs!, mod.id) ? 'text-node-modificator' : 'text-geist-accents-5'">{{ mod.name }}</span>
                    <span class="ml-auto text-[10px] font-mono opacity-40" :class="isSelected(localData.refs!, mod.id) ? 'text-node-modificator' : ''">{{ mod.id }}</span>
                  </button>

                  <div v-if="isSelected(localData.refs!, mod.id)" class="px-3 pb-3 pt-1 border-t border-node-modificator/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label class="text-[9px] font-bold uppercase tracking-wider text-node-modificator mb-1 flex justify-between">
                      Descripción
                      <span v-if="validationErrors[`ref_${mod.id}`]" class="text-[9px] text-geist-error normal-case font-mono">{{ validationErrors[`ref_${mod.id}`] }}</span>
                    </label>
                    <textarea 
                      v-model="getRelation(localData.refs!, mod.id)!.description"
                      rows="2"
                      class="geist-input !text-[11px] !py-1.5 resize-none transition-colors"
                      :class="{'border-geist-error bg-geist-error/10': validationErrors[`ref_${mod.id}`]}"
                      placeholder="Obligatorio (min 10 chars)..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped>
.node-editor {
  box-shadow: inset 0 1px 0 0 var(--color-geist-border);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-geist-accents-2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-geist-accents-3);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
