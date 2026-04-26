<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue';

interface Props {
  show: boolean
  title?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  title: '¿Confirmar cambios?',
  message: 'Los cambios realizados se guardarán permanentemente en el proyecto.'
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <BaseModal :show="show" :title="title" @close="emit('close')">
    <div class="space-y-6">
      <div class="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-4">
        <div class="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-cloud-arrow-up text-emerald-500 text-xl"></i>
        </div>
        <div class="space-y-1 flex-1">
          <p class="text-sm text-geist-fg font-medium">
            Guardar Diseño Conceptual
          </p>
          <p class="text-xs text-geist-accents-5 leading-relaxed">
            {{ message }}
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
          class="px-6 py-2 rounded-xl text-xs font-bold transition-all bg-geist-fg text-geist-bg hover:scale-[1.02] flex-1" 
          @click="emit('confirm')"
        >
          Confirmar y Guardar
        </button>
      </div>
    </div>
  </BaseModal>
</template>
