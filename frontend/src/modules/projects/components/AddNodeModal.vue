<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  show: boolean
  existingNames?: string[]
  initialData?: { name: string, description: string } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', name: string, description: string): void
}>()

const nodeName = ref('')
const nodeDescription = ref('')

const isEditMode = computed(() => !!props.initialData)
const modalTitle = computed(() => isEditMode.value ? 'Editar Máquina' : 'Nueva Máquina')

watch(() => props.show, (isShowing) => {
  if (isShowing && props.initialData) {
    nodeName.value = props.initialData.name
    nodeDescription.value = props.initialData.description
  } else if (!isShowing) {
    nodeName.value = ''
    nodeDescription.value = ''
  }
}, { immediate: true })

const isDuplicate = computed(() => {
  const name = nodeName.value.trim().toLowerCase()
  if (!name || !props.existingNames) return false
  
  // Si estamos editando y el nombre es el mismo que el original, no es duplicado
  if (isEditMode.value && name === props.initialData?.name.trim().toLowerCase()) {
    return false
  }
  
  return props.existingNames.some(existing => existing.trim().toLowerCase() === name)
})

const isValid = computed(() => {
  const nameLen = nodeName.value.trim().length
  const descLen = nodeDescription.value.trim().length
  return nameLen >= 1 && nameLen <= 20 && descLen >= 1 && descLen <= 600 && !isDuplicate.value
})

const handleConfirm = () => {
  if (isValid.value) {
    emit('confirm', nodeName.value.trim(), nodeDescription.value.trim())
    nodeName.value = ''
    nodeDescription.value = ''
  }
}

const handleClose = () => {
  nodeName.value = ''
  nodeDescription.value = ''
  emit('close')
}
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="handleClose">
    <div class="space-y-6">
      <!-- Nombre -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <label for="node-name" class="text-xs font-mono uppercase tracking-widest text-geist-accents-5">
            Nombre del Análisis
          </label>
          <span 
            class="text-[10px] font-mono tracking-tighter"
            :class="nodeName.length >= 20 ? 'text-geist-error font-bold animate-pulse' : 'text-geist-accents-4'"
          >
            {{ nodeName.length }}/20
          </span>
        </div>
        <input 
          id="node-name"
          v-model="nodeName"
          type="text" 
          placeholder="Ej. Motor principal..."
          maxlength="20"
          class="geist-input w-full"
          :class="{ 'border-geist-error focus:ring-geist-error/20': isDuplicate }"
          @keyup.enter="handleConfirm"
          v-focus
        >
        <p v-if="isDuplicate" class="text-[10px] text-geist-error font-mono flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <i class="fa-solid fa-circle-exclamation"></i>
          Este nombre ya está en uso en el proyecto
        </p>
      </div>

      <!-- Descripción -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <label for="node-description" class="text-xs font-mono uppercase tracking-widest text-geist-accents-5">
            Descripción
          </label>
          <span 
            class="text-[10px] font-mono tracking-tighter"
            :class="nodeDescription.length >= 600 ? 'text-geist-error font-bold animate-pulse' : 'text-geist-accents-4'"
          >
            {{ nodeDescription.length }}/600
          </span>
        </div>
        <textarea 
          id="node-description"
          v-model="nodeDescription"
          placeholder="Describe el propósito de esta máquina..."
          maxlength="600"
          rows="4"
          class="geist-input w-full min-h-[100px] resize-none py-2"
        ></textarea>
        <p class="text-[10px] text-geist-accents-3 font-mono">
          Explica brevemente qué realizará esta máquina.
        </p>
      </div>

      <!-- Acciones -->
      <div class="flex gap-3 pt-2">
        <button 
          class="geist-button-secondary flex-1" 
          @click="handleClose"
        >
          Cancelar
        </button>
        <button 
          class="geist-button-primary flex-1" 
          :disabled="!isValid"
          @click="handleConfirm"
        >
          {{ isEditMode ? 'Guardar Cambios' : 'Crear Máquina' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>
