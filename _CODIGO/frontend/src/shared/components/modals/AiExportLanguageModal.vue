<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/shared/components/BaseModal.vue'

interface Props {
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', language: string): void
}>()

const languages = [
  { id: 'SuperCollider', name: 'SuperCollider', icon: 'fa-solid fa-code' },
  { id: 'Max/MSP', name: 'Max/MSP', icon: 'fa-solid fa-cubes' },
  { id: 'Pure Data', name: 'Pure Data', icon: 'fa-solid fa-circle-nodes' },
  { id: 'Web Audio API (JavaScript)', name: 'Web Audio API (JavaScript)', icon: 'fa-brands fa-js' }
]

const selectedLanguage = ref(languages[3].id) // Default to Web Audio

const handleConfirm = () => {
  emit('confirm', selectedLanguage.value)
}
</script>

<template>
  <BaseModal :show="show" title="Exportar para IA" @close="emit('close')">
    <div class="space-y-6">
      <div class="p-4 bg-geist-success/5 border border-geist-success/20 rounded-xl flex items-start gap-4">
        <div class="w-10 h-10 rounded-full bg-geist-success/10 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-robot text-geist-success text-xl"></i>
        </div>
        <div class="space-y-1 flex-1">
          <p class="text-sm text-geist-fg font-medium">
            Selecciona el Lenguaje Objetivo
          </p>
          <p class="text-xs text-geist-accents-5 leading-relaxed">
            Se generará documentación y ejemplos de código adaptados al lenguaje que selecciones.
          </p>
        </div>
      </div>

      <div class="space-y-2">
        <div 
          v-for="lang in languages" 
          :key="lang.id"
          @click="selectedLanguage = lang.id"
          class="group relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer"
          :class="selectedLanguage === lang.id 
            ? 'bg-geist-accents-2/50 border-geist-fg shadow-sm' 
            : 'bg-geist-bg border-geist-border hover:bg-geist-accents-1 hover:border-geist-accents-3'"
        >
          <div 
            class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            :class="selectedLanguage === lang.id ? 'bg-geist-fg text-geist-bg' : 'bg-geist-accents-1 text-geist-accents-5 group-hover:bg-geist-accents-2'"
          >
            <i :class="lang.icon" class="text-sm"></i>
          </div>
          
          <span class="text-sm font-medium" :class="selectedLanguage === lang.id ? 'text-geist-fg' : 'text-geist-accents-5'">
            {{ lang.name }}
          </span>

          <div v-if="selectedLanguage === lang.id" class="ml-auto">
            <i class="fa-solid fa-circle-check text-geist-fg"></i>
          </div>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button 
          class="geist-button-secondary flex-1" 
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button 
          class="geist-button-primary flex-1" 
          @click="handleConfirm"
        >
          Generar Exportación
        </button>
      </div>
    </div>
  </BaseModal>
</template>
