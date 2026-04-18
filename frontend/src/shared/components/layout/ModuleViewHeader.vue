<script setup lang="ts">
import { ref } from 'vue'

interface Breadcrumb {
  label: string
  active?: boolean
  opacity?: number
  canDelete?: boolean;
  canAddSubnodes?: boolean;
  canAddMachine?: boolean;
  showPencil?: boolean;
}

interface Props {
  moduleName: string
  breadcrumbs: Breadcrumb[]
  visualizerMode?: '2D' | 'JSON' | 'FORM'
  showExport?: boolean
  showFormMode?: boolean
  showInfo?: boolean
  description?: string
  label2D?: string
}

import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'set-mode', mode: '2D' | 'JSON' | 'FORM'): void
  (e: 'export'): void
  (e: 'edit-basic'): void
  (e: 'delete'): void
  (e: 'add-subnode', type: 'el'): void
  (e: 'add-machine'): void
}>()

const { runWithGuard } = useUnsavedChanges()
const showDescription = ref(false)

const toggleDescription = () => {
  showDescription.value = !showDescription.value
}

const handleSetMode = (mode: '2D' | 'JSON' | 'FORM') => {
  runWithGuard(() => {
    emit('set-mode', mode)
  })
}

const handleEditBasic = () => {
  runWithGuard(() => {
    emit('edit-basic')
  })
}
</script>

<template>
  <div class="module-view-header flex flex-col border-b border-geist-border bg-geist-accents-1/30">
    <div class="px-4 flex items-center justify-between h-12">
      <!-- Breadcrumbs -->
      <div class="flex items-center gap-2 text-xs font-mono text-geist-accents-5">
        <span class="opacity-50">{{ moduleName }}</span>
        
        <template v-for="(bc, index) in breadcrumbs" :key="index">
          <i class="fa-solid fa-chevron-right text-[8px] opacity-30"></i>
          <div class="flex items-center gap-1">
            <span 
              :class="bc.active ? 'text-geist-fg font-bold tracking-tight' : 'opacity-50'"
            >
              {{ bc.label }}
            </span>
            <!-- Botón de Editar (Pencil) - Visible permanentemente -->
            <button 
              v-if="bc.active && bc.showPencil"
              @click="handleEditBasic"
              class="flex items-center justify-center w-5 h-5 rounded-md bg-geist-accents-2/40 text-geist-fg hover:bg-geist-accents-2 transition-all border border-geist-border cursor-pointer ml-1"
              title="Editar información básica"
            >
              <i class="fa-solid fa-pencil text-[10px]"></i>
            </button>

            <!-- Botón de Eliminar (Trash) - Visible permanentemente en rojo suave -->
            <button 
              v-if="bc.active && bc.canDelete"
              @click="emit('delete')"
              class="flex items-center justify-center w-5 h-5 rounded-md bg-geist-error/5 text-geist-error/60 hover:text-geist-error hover:bg-geist-error/15 transition-all border border-geist-error/20 cursor-pointer ml-1"
              title="Eliminar elemento"
            >
              <i class="fa-solid fa-trash-can text-[10px]"></i>
            </button>

            <!-- Botones de Añadir Sub-nodos -->
            <div v-if="bc.canAddSubnodes" class="flex items-center gap-1.5 ml-2">
              <button 
                @click="emit('add-subnode', 'el')"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-node-generator/10 text-node-generator hover:bg-node-generator/20 transition-all border border-node-generator/20 cursor-pointer shadow-sm text-[9px] font-bold uppercase tracking-wider"
                title="Añadir Elemento"
              >
                <i class="fa-solid fa-plus overflow-hidden"></i>
                Elemento
              </button>
            </div>

            <!-- Botón de Añadir Máquina -->
            <button 
              v-if="bc.canAddMachine"
              @click="emit('add-machine')"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-geist-success/10 text-geist-success hover:bg-geist-success/20 transition-all border border-geist-success/20 cursor-pointer shadow-sm text-[9px] font-bold uppercase tracking-wider ml-2"
              title="Añadir Nueva Máquina"
            >
              <i class="fa-solid fa-plus overflow-hidden"></i>
              Máquina
            </button>
          </div>
        </template>
      </div>
      
      <!-- Actions Section -->
      <div class="flex items-center gap-2">
        <!-- Visualizer Switches -->
        <div v-if="visualizerMode" class="flex items-center gap-1 bg-geist-bg border border-geist-border rounded-lg p-0.5">
          <button 
            @click="handleSetMode('2D')"
            class="px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-1.5"
            :class="visualizerMode === '2D' ? 'bg-geist-accents-2 text-geist-fg shadow-sm' : 'text-geist-accents-4 hover:text-geist-accents-6'"
          >
            <i class="fa-solid fa-diagram-project"></i>
            {{ label2D || '2D' }}
          </button>

          <button 
            v-if="showFormMode"
            @click="handleSetMode('FORM')"
            class="px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-2"
            :class="visualizerMode === 'FORM' ? 'bg-geist-accents-2 text-geist-fg shadow-sm' : 'text-geist-accents-4 hover:text-geist-accents-6'"
          >
            <i class="fa-solid fa-rectangle-list"></i> Formulario
          </button>
          
          <button 
            @click="handleSetMode('JSON')"
            class="px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-2"
            :class="visualizerMode === 'JSON' ? 'bg-geist-accents-2 text-geist-fg shadow-sm' : 'text-geist-accents-4 hover:text-geist-accents-6'"
          >
            <i class="fa-solid fa-code"></i> JSON
          </button>
        </div>

        <div v-if="visualizerMode && showExport" class="w-px h-4 bg-geist-border mx-1"></div>

        <!-- Export Button -->
        <button 
          v-if="showExport"
          @click="emit('export')"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-geist-border bg-geist-bg text-[10px] uppercase font-bold hover:bg-geist-accents-2 text-geist-accents-5 hover:text-geist-fg transition-all shadow-sm group"
          title="Exportar archivo JSON"
        >
          <i class="fa-solid fa-download group-hover:scale-110 transition-transform"></i>
          Exportar
        </button>

        <div v-if="description" class="w-px h-4 bg-geist-border mx-2"></div>

        <!-- Info Toggle -->
        <button 
          v-if="description && showInfo !== false"
          @click="toggleDescription"
          class="flex items-center gap-2 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all hover:bg-geist-accents-2"
          :class="showDescription ? 'text-geist-fg' : 'text-geist-accents-5'"
        >
          <i class="fa-solid fa-circle-info text-[12px]"></i>
          {{ showDescription ? 'Ocultar Info' : 'Ver Info' }}
          <i class="fa-solid fa-chevron-down text-[8px] transition-transform duration-300" :class="{ 'rotate-180': showDescription }"></i>
        </button>
      </div>
    </div>

    <!-- Collapsible Description -->
    <transition name="expand">
      <div v-if="showDescription && description" class="px-4 pb-4 overflow-hidden">
        <div class="p-4 bg-geist-bg border border-geist-border rounded-lg shadow-sm">
          <p class="text-xs text-geist-accents-5 leading-relaxed font-mono whitespace-pre-wrap">
            {{ description }}
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 800px;
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-bottom: 0 !important;
  transform: translateY(-4px);
}
</style>
