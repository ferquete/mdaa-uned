<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue';

interface Props {
  show: boolean
  itemName?: string
  title?: string
  message?: string
  extraWarnings?: string[]
}

withDefaults(defineProps<Props>(), {
  title: '¿Confirmar eliminación?',
  message: 'Esta acción no se puede deshacer.',
  extraWarnings: () => []
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <BaseModal :show="show" :title="title" @close="emit('close')">
    <div class="space-y-6">
      <div class="p-4 bg-geist-error/5 border border-geist-error/20 rounded-xl flex items-start gap-4">
        <div class="w-10 h-10 rounded-full bg-geist-error/10 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-triangle-exclamation text-geist-error text-xl"></i>
        </div>
        <div class="space-y-3 flex-1">
          <div>
            <p class="text-sm text-geist-fg font-medium mb-1">
              Estás a punto de eliminar <span class="font-bold underline text-geist-error">{{ itemName || 'este elemento' }}</span>.
            </p>
            <p class="text-xs text-geist-accents-5 leading-relaxed">
              {{ message }} Todos los datos asociados se perderán permanentemente.
            </p>
          </div>

          <!-- Extra Warnings for References -->
          <div v-if="extraWarnings && extraWarnings.length > 0" class="p-3 bg-white/5 rounded-lg border border-white/5 space-y-2 animate-in fade-in slide-in-from-top-2">
            <p class="text-[10px] font-bold uppercase tracking-widest text-geist-error flex items-center gap-2">
              <i class="fa-solid fa-link"></i>
              Elemento en uso
            </p>
            <p class="text-xs text-geist-accents-4">
              Este elemento es referenciado por: <span class="text-geist-fg font-medium">{{ extraWarnings.join(', ') }}</span>.
            </p>
            <p class="text-[10px] italic text-geist-accents-3 bg-geist-accents-1 p-1.5 rounded">
              Las referencias en estos elementos se eliminarán automáticamente para mantener la integridad.
            </p>
          </div>
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
          Eliminar Permanentemente
        </button>
      </div>
    </div>
  </BaseModal>
</template>
