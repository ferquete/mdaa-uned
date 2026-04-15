<script setup lang="ts">
import { ref } from 'vue'

const isCollapsed = ref(false)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

interface NodeItem {
  id: string
  label: string
  icon: string
  colorClass: string
}

interface Category {
  id: string
  title: string
  isOpen: boolean
  items: NodeItem[]
}

const categories = ref<Category[]>([
  {
    id: 'generators',
    title: 'Generadores de Audio',
    isOpen: true,
    items: [
      { id: 'oscillator', label: 'Oscilador', icon: 'fa-wave-square', colorClass: 'text-node-generator' },
      { id: 'noise', label: 'Ruido', icon: 'fa-braille', colorClass: 'text-node-generator' },
      { id: 'sample', label: 'Sample', icon: 'fa-file-audio', colorClass: 'text-node-generator' }
    ]
  },
  {
    id: 'param-modifiers',
    title: 'Modificadores de Parámetros',
    isOpen: false,
    items: [
      { id: 'lfo', label: 'LFO', icon: 'fa-signature', colorClass: 'text-node-modificator' },
      { id: 'envelope', label: 'Envolvente', icon: 'fa-chart-line', colorClass: 'text-node-modificator' }
    ]
  },
  {
    id: 'sound-modifiers',
    title: 'Modificadores de Sonido',
    isOpen: false,
    items: [
      { id: 'frequency_filter', label: 'Filtro Frecuencia', icon: 'fa-filter', colorClass: 'text-geist-success' },
      { id: 'reverb', label: 'Reverb', icon: 'fa-water', colorClass: 'text-geist-success' },
      { id: 'delay', label: 'Delay / Eco', icon: 'fa-clock-rotate-left', colorClass: 'text-geist-success' },
      { id: 'distortion', label: 'Distorsión', icon: 'fa-bolt', colorClass: 'text-geist-success' },
      { id: 'chorus_flanger', label: 'Chorus / Flanger', icon: 'fa-users', colorClass: 'text-geist-success' },
      { id: 'compressor', label: 'Compresor', icon: 'fa-arrows-to-dot', colorClass: 'text-geist-success' },
      { id: 'equalizer', label: 'Ecualizador', icon: 'fa-sliders', colorClass: 'text-geist-success' }
    ]
  },
  {
    id: 'mixing-level',
    title: 'De Mezcla y Nivel',
    isOpen: false,
    items: [
      { id: 'mixer', label: 'Mezclador', icon: 'fa-blender', colorClass: 'text-node-rel' },
      { id: 'gain_pan', label: 'Ganancia / Pan', icon: 'fa-left-right', colorClass: 'text-node-rel' }
    ]
  }
])

const toggleCategory = (id: string) => {
  categories.value = categories.value.map(cat => ({
    ...cat,
    isOpen: cat.id === id ? !cat.isOpen : cat.isOpen
  }))
}

// Para arrastrar (futura implementación)
const onDragStart = (event: DragEvent, nodeType: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('nodeType', nodeType)
    event.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<template>
  <div class="palette-container relative h-full flex transition-all duration-300" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Botón de expansión flotante cuando está colapsado -->
    <button 
      v-if="isCollapsed"
      @click="toggleCollapse"
      class="expand-trigger absolute left-2 top-4 w-10 h-10 rounded-full bg-geist-bg border border-geist-border shadow-lg flex items-center justify-center text-geist-accents-4 hover:text-geist-fg hover:bg-geist-accents-1 transition-all z-40 active:scale-95"
      title="Expandir Paleta"
    >
      <i class="fa-solid fa-palette text-sm"></i>
    </button>

    <aside class="pim-editor-palette w-64 border-r border-geist-border bg-geist-accents-1/20 flex flex-col overflow-hidden relative transition-all duration-300">
      <div class="px-4 py-3 border-b border-geist-border bg-geist-bg/50 flex items-center justify-between">
        <h3 class="text-[10px] font-bold uppercase tracking-[0.15em] text-geist-accents-5 flex items-center gap-2">
          <i class="fa-solid fa-palette text-geist-accents-3"></i>
          Paleta de Nodos
        </h3>
        <!-- Botón de colapso -->
        <button 
          @click="toggleCollapse"
          class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-geist-accents-2 text-geist-accents-4 hover:text-geist-fg transition-colors"
          title="Colapsar"
        >
          <i class="fa-solid fa-chevron-left text-[10px]"></i>
        </button>
      </div>

    <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div v-for="cat in categories" :key="cat.id" class="border-b border-geist-border/50 last:border-0">
        <!-- Header Acordeón -->
        <button 
          @click="toggleCategory(cat.id)"
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-geist-accents-1 transition-colors group"
        >
          <span class="text-[11px] font-semibold text-geist-fg/80 group-hover:text-geist-fg transition-colors">
            {{ cat.title }}
          </span>
          <i 
            class="fa-solid fa-chevron-down text-[8px] text-geist-accents-4 transition-transform duration-300"
            :class="{ 'rotate-180': cat.isOpen }"
          ></i>
        </button>

        <!-- Contenido Acordeón -->
        <transition name="accordion">
          <div v-show="cat.isOpen" class="overflow-hidden">
            <div class="px-2 pb-3 grid grid-cols-1 gap-1">
              <div 
                v-for="item in cat.items" 
                :key="item.id"
                draggable="true"
                @dragstart="onDragStart($event, item.id)"
                class="node-item group px-3 py-2.5 rounded-lg border border-transparent hover:border-geist-border hover:bg-geist-bg hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 cursor-grab active:cursor-grabbing flex items-center gap-3"
              >
                <div 
                  class="w-8 h-8 rounded-md bg-geist-accents-1 flex items-center justify-center transition-colors group-hover:bg-geist-bg border border-geist-border/50 shadow-sm"
                  :class="item.colorClass.replace('text-', 'bg-').replace('text-', 'bg-') + '/5'"
                >
                  <i :class="['fa-solid', item.icon, item.colorClass, 'text-sm']"></i>
                </div>
                <div class="flex flex-col">
                  <span class="text-[11px] font-medium text-geist-accents-7 group-hover:text-geist-fg transition-colors">
                    {{ item.label }}
                  </span>
                  <span class="text-[8px] text-geist-accents-4 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    #{{ item.id }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px;
  opacity: 1;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
}

.node-item:hover {
  transform: translateX(2px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-geist-accents-2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-geist-accents-3);
}

.palette-container.is-collapsed .pim-editor-palette {
  width: 0;
  border-right-width: 0;
  opacity: 0;
  pointer-events: none;
}

.expand-trigger {
  animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes bounceIn {
  from { transform: scale(0) rotate(-45deg); opacity: 0; }
  to { transform: scale(1) rotate(0); opacity: 1; }
}
</style>
