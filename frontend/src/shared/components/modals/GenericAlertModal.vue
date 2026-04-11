<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue';

interface Props {
  show: boolean
  title?: string
  message: string
  type?: 'warning' | 'error' | 'info'
}

withDefaults(defineProps<Props>(), {
  title: 'Atención',
  type: 'warning'
})

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <BaseModal :show="show" :title="title" @close="emit('close')">
    <div class="space-y-6">
      <div 
        class="p-5 rounded-2xl border flex items-start gap-4 transition-all"
        :class="[
          type === 'warning' ? 'bg-geist-warning/5 border-geist-warning/20' : 
          type === 'error' ? 'bg-geist-error/5 border-geist-error/20' : 
          'bg-geist-success/5 border-geist-success/20'
        ]"
      >
        <div 
          class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
          :class="[
            type === 'warning' ? 'bg-geist-warning/10 text-geist-warning' : 
            type === 'error' ? 'bg-geist-error/10 text-geist-error' : 
            'bg-geist-success/10 text-geist-success'
          ]"
        >
          <i class="fa-solid text-xl" :class="[
            type === 'warning' ? 'fa-triangle-exclamation' : 
            type === 'error' ? 'fa-circle-xmark' : 
            'fa-circle-info'
          ]"></i>
        </div>
        
        <div class="space-y-1">
          <p class="text-sm text-geist-fg font-bold leading-tight">
            {{ title }}
          </p>
          <p class="text-xs text-geist-accents-5 leading-relaxed">
            {{ message }}
          </p>
        </div>
      </div>

      <div class="flex">
        <button 
          class="geist-button-primary w-full !py-3" 
          @click="emit('close')"
        >
          Entendido
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
/* Estilos adicionales si fueran necesarios */
</style>
