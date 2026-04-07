<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue'

const props = defineProps<{
  show: boolean
  itemName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <BaseModal :show="show" title="Confirmar Eliminación" @close="emit('close')">
    <div class="space-y-6">
      <div class="flex flex-col items-center text-center space-y-4 py-2">
        <div class="w-12 h-12 rounded-full bg-geist-error/10 flex items-center justify-center">
          <i class="fa-solid fa-triangle-exclamation text-geist-error text-xl"></i>
        </div>
        <div class="space-y-2">
          <p class="text-sm text-geist-accents-6 leading-relaxed">
            ¿Estás seguro de que quieres eliminar <span class="font-bold text-geist-fg">{{ itemName || 'este elemento' }}</span>?
          </p>
          <p class="text-xs text-geist-accents-4 font-mono">
            El análisis de la máquina se eliminará del proyecto, y no se podrá recuperar
          </p>
        </div>
      </div>

      <div class="flex gap-3">
        <button 
          class="geist-button-secondary flex-1" 
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button 
          class="geist-button-error flex-1" 
          @click="emit('confirm')"
        >
          Eliminar
        </button>
      </div>
    </div>
  </BaseModal>
</template>
