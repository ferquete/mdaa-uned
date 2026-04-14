<script setup lang="ts">
import { ref } from 'vue'
import PimEditorPalette from './PimEditorPalette.vue'
import PimEditorToolbar from './PimEditorToolbar.vue'
import PimEditorProperties from './PimEditorProperties.vue'

const isSaving = ref(false)
const showProperties = ref(false)
const selectedNodeId = ref<string | undefined>(undefined)

const handleSave = () => {
  isSaving.value = true
  setTimeout(() => {
    isSaving.value = false
  }, 1000)
}

const handleCapture = () => {
  console.log('Capturando imagen...')
}

const toggleProperties = () => {
  showProperties.value = !showProperties.value
}

// Simular selección al soltar un nodo para mostrar cómo funcionaría
const onDrop = (event: DragEvent) => {
  const nodeType = event.dataTransfer?.getData('nodeType')
  if (nodeType) {
    selectedNodeId.value = crypto.randomUUID()
    // No abrimos propiedades automáticamente de inicio para respetar el "oculto por defecto"
    // Pero si el usuario quiere, podríamos abrirlas aquí.
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}
</script>

<template>
  <div class="pim-visual-editor flex flex-col h-full bg-geist-bg select-none relative overflow-hidden">
    <!-- Barra de Herramientas Superior -->
    <PimEditorToolbar @save="handleSave" @capture="handleCapture" />

    <div class="flex-1 flex overflow-hidden relative">
      <!-- Paleta Izquierda -->
      <PimEditorPalette />

      <!-- Área de Edición Central -->
      <main 
        class="flex-1 relative bg-geist-accents-1/30 overflow-hidden"
        @dragover="onDragOver"
        @drop="onDrop"
      >
        <!-- Grid de fondo para el editor -->
        <div class="absolute inset-0 pattern-grid opacity-20 pointer-events-none"></div>

        <!-- Botón para abrir el panel si está oculto y hay algo seleccionado -->
        <button 
          v-if="!showProperties && selectedNodeId"
          @click="showProperties = true"
          class="absolute right-4 top-4 z-30 w-8 h-8 rounded-full bg-geist-bg border border-geist-border shadow-md flex items-center justify-center text-geist-accents-4 hover:text-geist-fg transition-all active:scale-90"
          title="Ver Propiedades"
        >
          <i class="fa-solid fa-sliders"></i>
        </button>

        <!-- Placeholder del lienzo -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="w-32 h-32 rounded-3xl border-2 border-dashed border-geist-accents-2 flex items-center justify-center mx-auto mb-6 bg-geist-bg/50 backdrop-blur-sm shadow-inner group transition-all hover:scale-105 hover:border-geist-accents-3">
               <i class="fa-solid fa-plus text-4xl text-geist-accents-2 group-hover:text-geist-accents-3 transition-colors"></i>
            </div>
            <h4 class="text-xs font-bold text-geist-accents-5 uppercase tracking-widest">Lienzo de Diseño</h4>
            <div v-if="selectedNodeId" class="mt-4 px-3 py-1 bg-geist-accents-2/40 text-[9px] font-mono rounded-md border border-geist-border">
              Nodo seleccionado: {{ selectedNodeId.slice(0, 8) }}...
            </div>
          </div>
        </div>
      </main>

      <!-- Panel de Propiedades Derecho (Colapsable) -->
      <transition name="slide-right">
        <PimEditorProperties 
          v-if="showProperties"
          :node-id="selectedNodeId"
          @close="showProperties = false"
        />
      </transition>
    </div>

    <!-- Overlay de guardado -->
    <transition name="fade">
      <div v-if="isSaving" class="absolute inset-0 bg-geist-bg/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-2 border-geist-accents-2 border-t-geist-fg rounded-full animate-spin"></div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-geist-fg">Guardando Cambios...</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.pattern-grid {
  background-image: 
    radial-gradient(circle, var(--color-geist-accents-4) 1px, transparent 1px);
  background-size: 24px 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transición para el panel de propiedades */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
