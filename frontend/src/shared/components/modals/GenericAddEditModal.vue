<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue';
import { computed, ref, watch } from 'vue';

interface Props {
  show: boolean
  title: string
  entityLabel: string
  confirmText: string
  existingNames?: string[]
  initialData?: { name: string, description: string } | null
  nameMaxLength?: number
  descMaxLength?: number
  descMinLength?: number
  showNameField?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  nameMaxLength: 20,
  descMaxLength: 600,
  descMinLength: 1,
  showNameField: true
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', name: string, description: string): void
}>()

const localName = ref('')
const localDescription = ref('')

watch(() => props.show, (isShowing) => {
  if (isShowing && props.initialData) {
    localName.value = props.initialData.name
    localDescription.value = props.initialData.description
  } else if (!isShowing) {
    localName.value = ''
    localDescription.value = ''
  }
}, { immediate: true })

const isDuplicate = computed(() => {
  const name = localName.value.trim().toLowerCase()
  if (!name || !props.existingNames) return false
  
  if (props.initialData && name === props.initialData.name.trim().toLowerCase()) {
    return false
  }
  
  return props.existingNames.some(existing => existing.trim().toLowerCase() === name)
})

const isNameValid = computed(() => {
  const nameLen = localName.value.trim().length
  return !props.showNameField || (nameLen >= 1 && nameLen <= props.nameMaxLength && !isDuplicate.value)
})

const isDescriptionTooShort = computed(() => {
  return localDescription.value.trim().length > 0 && localDescription.value.trim().length < props.descMinLength
})

const isDescriptionValid = computed(() => {
  const descLen = localDescription.value.trim().length
  return descLen >= props.descMinLength && descLen <= props.descMaxLength
})

const isValid = computed(() => isNameValid.value && isDescriptionValid.value)

const handleConfirm = () => {
  if (isValid.value) {
    emit('confirm', localName.value.trim(), localDescription.value.trim())
    localName.value = ''
    localDescription.value = ''
  }
}

const handleClose = () => {
  localName.value = ''
  localDescription.value = ''
  emit('close')
}
</script>

<template>
  <BaseModal :show="show" :title="title" @close="handleClose">
    <div class="space-y-6">
      <!-- Nombre -->
      <div v-if="showNameField" class="space-y-2">
        <div class="flex justify-between items-center">
          <label class="text-xs font-mono uppercase tracking-widest text-geist-accents-5">
            Nombre
          </label>
          <span 
            class="text-[10px] font-mono tracking-tighter"
            :class="localName.length >= nameMaxLength ? 'text-geist-error font-bold animate-pulse' : 'text-geist-accents-4'"
          >
            {{ localName.length }}/{{ nameMaxLength }}
          </span>
        </div>
        <textarea 
          v-if="nameMaxLength > 100"
          v-model="localName"
          placeholder="Nombre del elemento..."
          :maxlength="nameMaxLength"
          rows="2"
          class="geist-input w-full resize-none py-2"
          :class="{ 'border-geist-error focus:ring-geist-error/20': isDuplicate }"
          v-focus
        ></textarea>
        <input 
          v-else
          v-model="localName"
          type="text" 
          placeholder="Nombre del elemento..."
          :maxlength="nameMaxLength"
          class="geist-input w-full"
          :class="{ 'border-geist-error focus:ring-geist-error/20': isDuplicate }"
          @keyup.enter="handleConfirm"
          v-focus
        >
        <p v-if="isDuplicate" class="text-[10px] text-geist-error font-mono flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <i class="fa-solid fa-circle-exclamation"></i>
          Este nombre ya está en uso
        </p>
      </div>

      <!-- Descripción -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <label class="text-xs font-mono uppercase tracking-widest text-geist-accents-5">
            Descripción
          </label>
          <span 
            class="text-[10px] font-mono tracking-tighter"
            :class="localDescription.length >= descMaxLength ? 'text-geist-error font-bold animate-pulse' : 'text-geist-accents-4'"
          >
            {{ localDescription.length }}/{{ descMaxLength }}
          </span>
        </div>
        <textarea 
          v-model="localDescription"
          placeholder="Describe el propósito o detalles..."
          :maxlength="descMaxLength"
          rows="4"
          class="geist-input w-full min-h-[100px] resize-none py-2"
        ></textarea>
        <p v-if="isDescriptionTooShort" class="text-[10px] text-geist-error font-mono flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <i class="fa-solid fa-circle-exclamation"></i>
          Mínimo {{ props.descMinLength }} caracteres requeridos
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
          {{ confirmText }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>
