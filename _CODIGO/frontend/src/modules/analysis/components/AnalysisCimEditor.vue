<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'
import { validateCimRelations } from '../utils/analysisCimValidation'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'

const store = useAnalysisMachinesStore()
const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

const formData = ref({
  description: '',
  relations: [] as any[]
})

const isSaving = ref(false)
const saveMessage = ref('')

// Mapear máquinas del proyecto para los selectores
const availableMachines = computed(() => {
  return store.machines.map(m => {
    const doc = store.parsedDocs[m.id]
    const hasExternalOutput = doc?.elements?.some((e: any) => e.externalOutput?.hasExternalOutput) || false;
    const hasExternalInput = doc?.elements?.some((e: any) => e.externalInput?.hasExternalInput) || false;
    return {
      id: doc?.id, // Business UUID
      name: doc?.name || `Máquina ${m.id}`,
      dbId: m.id,
      hasExternalOutput,
      hasExternalInput
    }
  }).filter(m => m.id)
})

const getValidSources = (destId: string) => {
  let list = availableMachines.value.filter(m => m.hasExternalOutput);
  if (destId) list = list.filter(m => m.id !== destId);
  return list;
}

const getValidDestinations = (sourceId: string) => {
  let list = availableMachines.value.filter(m => m.hasExternalInput);
  if (sourceId) list = list.filter(m => m.id !== sourceId);
  return list;
}

// Cargar datos iniciales
watch(() => store.parsedCimRelations, (newVal) => {
  formData.value.description = newVal.description || ''
  formData.value.relations = JSON.parse(JSON.stringify(newVal.relations || []))
}, { immediate: true })

const validationErrors = computed(() => {
  const validMachines = availableMachines.value.map(m => ({
    id: m.id as string,
    hasExternalOutput: m.hasExternalOutput,
    hasExternalInput: m.hasExternalInput
  }))
  return validateCimRelations(formData.value, validMachines)
})

const isValid = computed(() => validationErrors.value.length === 0)

// Guard de cambios sin guardar
watch([formData, isValid], () => {
  const original = JSON.stringify(store.parsedCimRelations)
  const current = JSON.stringify(formData.value)
  const isDirty = original !== current

  if (isDirty) {
    setUnsavedState(true, isValid.value, async () => {
      await handleSave()
      return true
    })
  } else {
    clearUnsavedState()
  }
}, { deep: true })

const addRelation = () => {
  formData.value.relations.push({
    id: crypto.randomUUID(),
    source: '',
    destination: '',
    description: ''
  })
  
  nextTick(() => {
    const index = formData.value.relations.length - 1
    const el = document.getElementById(`relation-box-${index}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.querySelector('select')?.focus()
    }
  })
}

const removeRelation = (index: number) => {
  formData.value.relations.splice(index, 1)
}

const handleSave = async () => {
  if (!isValid.value) return
  isSaving.value = true
  const result = await store.updateCimRelations(JSON.stringify(formData.value))
  isSaving.value = false
  if (result.success) {
    saveMessage.value = 'Guardado con éxito'
    clearUnsavedState()
    setTimeout(() => saveMessage.value = '', 3000)
  } else {
    saveMessage.value = 'Error: ' + result.message
  }
}
</script>

<template>
  <div class="analysis-cim-editor h-full flex flex-col bg-geist-bg overflow-y-auto custom-scrollbar">
    <div class="max-w-5xl mx-auto w-full p-8 space-y-8">
      <!-- Section Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-geist-fg flex items-center justify-center text-geist-bg shadow-xl">
            <i class="fa-solid fa-rectangle-list text-xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-geist-fg tracking-tight">Editor de Relaciones</h2>
            <p class="text-sm text-geist-accents-5">Gestiona las interconexiones globales del sistema</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <span v-if="saveMessage" class="text-xs font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">{{ saveMessage }}</span>
          <button 
            @click="handleSave"
            :disabled="!isValid || isSaving"
            class="geist-button-primary !px-8 !py-2.5 gap-2 text-xs font-bold uppercase transition-all shadow-lg"
            :class="{ 'opacity-50 grayscale cursor-not-allowed': !isValid || isSaving }"
          >
             <i class="fa-solid" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
             {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>

      <!-- Description Field -->
      <div class="space-y-3">
        <label class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-[0.2em] px-1">Descripción General del Análisis</label>
        <textarea 
          v-model="formData.description"
          maxlength="1000"
          placeholder="Escribe el propósito de este análisis de relaciones..."
          class="w-full bg-geist-accents-1 border border-geist-border rounded-xl p-4 text-sm text-geist-fg focus:border-geist-fg transition-colors min-h-[100px] outline-none"
        ></textarea>
        <div class="flex justify-end px-1">
          <span class="text-[9px] font-mono text-geist-accents-4 uppercase" :class="{ 'text-geist-error': formData.description.length >= 1000 }">
            {{ formData.description.length }} / 1000
          </span>
        </div>
      </div>

      <!-- Relations Management -->
      <div class="space-y-6">
        <div class="flex items-center justify-between border-b border-geist-border pb-4">
          <div class="flex items-center gap-3">
            <h3 class="text-sm font-bold text-geist-fg uppercase tracking-widest">Relaciones entre Máquinas</h3>
            <span class="bg-geist-accents-2 text-geist-accents-6 text-[10px] px-2 py-0.5 rounded-full font-bold">{{ formData.relations.length }}</span>
          </div>
          <button 
            @click="addRelation"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-geist-accents-2 text-geist-fg text-[10px] uppercase font-bold hover:bg-geist-accents-3 transition-all border border-geist-border"
          >
            <i class="fa-solid fa-plus"></i> Añadir Relación
          </button>
        </div>

        <div v-if="formData.relations.length === 0" class="py-12 text-center bg-geist-accents-1/30 rounded-2xl border-2 border-dashed border-geist-border">
          <div class="text-geist-accents-2 mb-3"><i class="fa-solid fa-link-slash text-4xl"></i></div>
          <p class="text-xs text-geist-accents-4 font-medium uppercase tracking-widest">No hay relaciones definidas</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-4">
          <div 
            v-for="(rel, index) in formData.relations" 
            :key="index"
            :id="`relation-box-${index}`"
            class="group bg-geist-bg border border-geist-border rounded-2xl p-6 hover:border-geist-accents-4 transition-all shadow-sm relative overflow-hidden"
          >
            <!-- Background Decoration -->
            <div class="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
              <i class="fa-solid fa-link text-8xl"></i>
            </div>

            <div class="flex flex-col lg:flex-row gap-8 items-start relative z-10">
              <!-- Grid columns for clean layout -->
              <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Source Machine -->
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-widest flex items-center gap-2">
                    <i class="fa-solid fa-circle-arrow-right text-geist-success"></i> Máquina Origen
                  </label>
                  <select 
                    v-model="rel.source"
                    class="w-full bg-geist-accents-1 border border-geist-border rounded-xl px-4 py-3 text-sm text-geist-fg focus:border-geist-fg outline-none appearance-none"
                  >
                    <option value="" disabled>Selecciona máquina origen...</option>
                    <option v-for="m in getValidSources(rel.destination)" :key="m.id" :value="m.id">{{ m.name }}</option>
                  </select>
                </div>

                <!-- Destination Machine -->
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-widest flex items-center gap-2">
                    <i class="fa-solid fa-circle-arrow-left text-geist-error"></i> Máquina Destino
                  </label>
                  <select 
                    v-model="rel.destination"
                    class="w-full bg-geist-accents-1 border border-geist-border rounded-xl px-4 py-3 text-sm text-geist-fg focus:border-geist-fg outline-none appearance-none"
                  >
                    <option value="" disabled>Selecciona máquina destino...</option>
                    <option v-for="m in getValidDestinations(rel.source)" :key="m.id" :value="m.id">{{ m.name }}</option>
                  </select>
                </div>

                <!-- Description -->
                <div class="col-span-1 md:col-span-2 space-y-2">
                  <label class="text-[10px] font-bold text-geist-accents-4 uppercase tracking-widest">Naturaleza de la Relación</label>
                  <div class="relative">
                    <textarea 
                      v-model="rel.description"
                      maxlength="1000"
                      placeholder="Describe por qué están conectadas..."
                      class="w-full bg-geist-accents-1 border border-geist-border rounded-xl px-4 py-3 text-sm text-geist-fg focus:border-geist-fg transition-colors min-h-[80px] outline-none"
                    ></textarea>
                    <div class="flex justify-end mt-1 px-1">
                      <span class="text-[9px] font-mono text-geist-accents-4 uppercase" :class="{ 'text-geist-error': rel.description.length < 10 || rel.description.length >= 1000 }">
                        {{ rel.description.length }} / 1000
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Delete Button -->
              <button 
                @click="removeRelation(index)"
                class="lg:mt-6 p-3 rounded-xl bg-geist-error/5 text-geist-error border border-geist-error/10 hover:bg-geist-error hover:text-white transition-all shadow-sm"
                title="Eliminar relación"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
            
            <!-- Specific Error for this relation -->
            <div 
              v-if="validationErrors.find(e => e.nodeId === `Relación #${index + 1}`)" 
              class="mt-4 pt-4 border-t border-geist-error/10 flex items-center gap-2 text-geist-error"
            >
              <i class="fa-solid fa-triangle-exclamation text-xs"></i>
              <span class="text-[10px] font-bold uppercase tracking-widest">Error: {{ validationErrors.find(e => e.nodeId === `Relación #${index + 1}`)?.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Global Errors Footer -->
      <div v-if="validationErrors.length > 0" class="p-6 bg-geist-error/5 border border-geist-error/10 rounded-2xl flex items-start gap-4">
        <i class="fa-solid fa-circle-exclamation text-geist-error text-xl mt-1"></i>
        <div>
          <h4 class="text-xs font-bold text-geist-error uppercase tracking-widest mb-1">Hay problemas en el formulario</h4>
          <ul class="space-y-1">
            <li v-for="(err, idx) in validationErrors.slice(0, 3)" :key="idx" class="text-[11px] text-geist-error/80 font-medium">
              <span v-if="err.nodeId" class="font-bold opacity-70">[{{ err.nodeId }}]</span> {{ err.message }}
            </li>
            <li v-if="validationErrors.length > 3" class="text-[10px] text-geist-error/60 italic">...y {{ validationErrors.length - 3 }} errores más</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appearance-none {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
}
</style>
