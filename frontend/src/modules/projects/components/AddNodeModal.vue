<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '@/shared/components/BaseModal.vue'

const props = defineProps<{
  show: boolean
  existingNames?: string[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', name: string): void
}>()

const nodeName = ref('')

const isDuplicate = computed(() => {
  const name = nodeName.value.trim().toLowerCase()
  if (!name || !props.existingNames) return false
  return props.existingNames.some(existing => existing.trim().toLowerCase() === name)
})

const isValid = computed(() => {
  const len = nodeName.value.trim().length
  return len >= 1 && len <= 20 && !isDuplicate.value
})

const handleConfirm = () => {
  if (isValid.value) {
    emit('confirm', nodeName.value.trim())
    nodeName.value = ''
  }
}

const handleClose = () => {
  nodeName.value = ''
  emit('close')
}
</script>

<template>
  <BaseModal :show="show" title="Nueva Máquina" @close="handleClose">
    <div class="space-y-4">
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
          Aceptar
        </button>
      </div>
    </div>
  </BaseModal>
</template>
