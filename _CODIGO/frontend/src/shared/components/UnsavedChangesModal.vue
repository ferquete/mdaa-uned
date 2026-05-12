<script setup lang="ts">
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import BaseModal from '@/shared/components/BaseModal.vue'

const { isModalOpen, isContentValid, handleSaveAndContinue, handleDiscardAndContinue, handleCancel } = useUnsavedChanges()
</script>

<template>
  <BaseModal 
    :show="isModalOpen" 
    title="Cambios sin guardar" 
    max-width="max-w-xl"
    @close="handleCancel"
  >
    <div class="px-6 py-6 border-b border-geist-border text-sm text-geist-accents-5">
      <p v-if="!isContentValid" class="font-mono bg-geist-error/10 text-geist-error p-3 rounded-md mb-4 border border-geist-error/20">
        <i class="fa-solid fa-triangle-exclamation mr-2"></i>
        Hay errores estructurales en tus modificaciones. Debes <b>Descartar</b> los cambios porque un formato inválido no puede guardarse.
      </p>
      <p v-else>
        Tienes cambios sin guardar en la vista actual. Si continúas sin guardar, perderás todo tu trabajo. ¿Qué deseas hacer?
      </p>
    </div>

    <div class="px-6 py-4 bg-geist-accents-1 flex justify-end gap-3 rounded-b-lg">
      <button 
        @click="handleCancel"
        class="geist-button-secondary !py-1.5"
      >
        Cancelar Navegación
      </button>
      <button 
        @click="handleDiscardAndContinue"
        class="geist-button-secondary !py-1.5 text-geist-error border-geist-error/30 hover:border-geist-error hover:bg-geist-error/5"
      >
        <i class="fa-solid fa-trash-can mr-2 opacity-70"></i> Descartar Cambios
      </button>
      <button 
        v-if="isContentValid"
        @click="handleSaveAndContinue"
        class="geist-button-primary !py-1.5"
      >
        <i class="fa-solid fa-floppy-disk mr-2"></i> Guardar y Continuar
      </button>
    </div>
  </BaseModal>
</template>
