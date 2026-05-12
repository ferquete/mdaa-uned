<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue';

/**
 * Propiedades del modal genérico de confirmación de eliminación.
 */
interface Props {
  /** Determina si el modal está visible */
  show: boolean
  /** Nombre del elemento que se va a eliminar */
  itemName?: string
  /** Título del modal */
  title?: string
  /** Mensaje de advertencia principal */
  message?: string
  /** Lista de advertencias adicionales (por ejemplo, dependencias conflictivas) */
  extraWarnings?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '¿Confirmar eliminación?',
  message: 'Esta acción no se puede deshacer.',
  extraWarnings: () => []
})

/** Eventos emitidos por el modal de eliminación */
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
          <div v-if="extraWarnings && extraWarnings.length > 0" class="mt-4 overflow-hidden rounded-xl border border-geist-error/30 bg-geist-error/5 shadow-sm">
            <div class="px-4 py-2 bg-geist-error/10 border-b border-geist-error/20 flex items-center gap-2">
              <i class="fa-solid fa-link text-[10px] text-geist-error"></i>
              <p class="text-[9px] font-black uppercase tracking-[0.15em] text-geist-error">
                Conflicto de Integridad
              </p>
            </div>
            <div class="p-4 space-y-3">
              <p class="text-[11px] text-geist-error/80 leading-relaxed font-medium">
                Este componente no se puede eliminar de forma aislada porque es referenciado por los siguientes elementos:
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span 
                  v-for="ref in extraWarnings" 
                  :key="ref"
                  class="px-2 py-0.5 rounded-md bg-geist-error/10 border border-geist-error/20 text-[10px] font-mono text-geist-error"
                >
                  {{ ref }}
                </span>
              </div>
              <div class="pt-2 border-t border-geist-error/10 flex items-start gap-2">
                <i class="fa-solid fa-circle-info text-[10px] text-geist-error/60 mt-0.5"></i>
                <p class="text-[10px] italic text-geist-error/70">
                  Al confirmar, estas referencias se limpiarán automáticamente para mantener la consistencia del documento.
                </p>
              </div>
            </div>
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
