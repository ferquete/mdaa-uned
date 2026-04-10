<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { PanelGroup, Panel, PanelResizeHandle } from 'vue-resizable-panels'
import ProjectTreeView from '@/modules/projects/components/ProjectTreeView.vue'
import { useProjectStore } from '@/modules/projects/stores/projectStore'

import MachineVisualizer3D from '@/modules/projects/components/MachineVisualizer3D.vue'
import MachineVisualizer2D from '@/modules/projects/components/MachineVisualizer2D.vue'
import MachineVisualizerJSON from '@/modules/projects/components/MachineVisualizerJSON.vue'
import NodeEditor from '@/modules/projects/components/NodeEditor.vue'
import UnsavedChangesModal from '@/shared/components/UnsavedChangesModal.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'

const store = useProjectStore()
const route = useRoute()
const showDescription = ref(false)
const visualizerMode = ref<'2D' | '3D' | 'JSON'>('2D')
const { runWithGuard, hasUnsavedChanges } = useUnsavedChanges()

// Protección contra cambio de rutas (Vue Router)
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    runWithGuard(() => {
      next()
    })
  } else {
    next()
  }
})

const treeRef = ref<InstanceType<typeof ProjectTreeView> | null>(null)

const editSelectedMachine = () => {
  if (store.selectedNode && treeRef.value) {
    runWithGuard(() => {
      treeRef.value!.editNode({ id: store.selectedNode!.id, text: store.selectedNode!.name })
    })
  }
}

const setVisualizerMode = (mode: '2D' | '3D' | 'JSON') => {
  runWithGuard(() => {
    visualizerMode.value = mode
  })
}

onMounted(async () => {
  const projectId = Number(route.params.id)
  if (projectId) {
    await store.fetchMachines(projectId)
  }
})

// Fuerza el modo 2D al entrar en la visualización de una máquina principal
watch(
  () => [store.selectedNode?.id, store.selectedSubNode?.id],
  ([newMachineId, newSubId], [oldMachineId, oldSubId]) => {
    // Solo reseteamos a 2D al entrar a una máquina nueva o volver del subnodo a la raíz
    if (!newSubId && (newMachineId !== oldMachineId || oldSubId)) {
      visualizerMode.value = '2D'
    }
  }
)

const toggleDescription = () => {
  showDescription.value = !showDescription.value
}

const exportMachine = () => {
  if (!store.selectedNode) return
  
  // Format el JSON limpiamente
  let content = store.selectedNode.machine
  try {
    const parsed = JSON.parse(content)
    content = JSON.stringify(parsed, null, 2)
  } catch(e) {
    // Si no es parseable, usamos raw
  }

  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  // Limpiar el nombre para sistema de archivos
  const safeName = store.selectedNode.name.replace(/[^a-zA-Z0-9_-]/g, '_')
  a.download = `${safeName}.json`
  
  document.body.appendChild(a)
  a.click()
  
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="project-dashboard flex flex-col h-[calc(100vh-3rem)] bg-geist-bg">
    <!-- Splitter Container -->
    <main class="flex-1 overflow-hidden">
      <PanelGroup direction="horizontal">
        <!-- Sidebar: Explorador -->
        <Panel :default-size="25" :min-size="12" :max-size="35">
          <ProjectTreeView ref="treeRef" />
        </Panel>

        <!-- Resize Handle -->
        <PanelResizeHandle class="w-px bg-geist-border hover:bg-geist-accents-2 transition-colors cursor-col-resize relative">
          <div class="absolute inset-y-0 -left-1 -right-1 z-10"></div>
        </PanelResizeHandle>

        <!-- Main Area: Editor -->
        <Panel :min-size="40">
          <div class="h-full bg-geist-bg flex flex-col">
            <!-- Header area sutil: Breadcrumbs + Description -->
            <div v-if="store.selectedNode" class="flex flex-col border-b border-geist-border bg-geist-accents-1/30">
              <div class="p-4 flex items-center justify-between h-12">
                <div class="flex items-center gap-2 text-xs font-mono text-geist-accents-5">
                  <span class="opacity-50">Análisis</span>
                  <i class="fa-solid fa-chevron-right text-[8px] opacity-30"></i>
                  
                  <div class="flex items-center gap-1">
                    <span class="transition-colors" :class="store.selectedSubNode ? 'opacity-50' : 'text-geist-fg font-bold tracking-tight'">
                      {{ store.selectedNode.name }}
                    </span>
                    <button 
                      @click="editSelectedMachine"
                      class="flex items-center justify-center w-5 h-5 rounded-md hover:bg-geist-accents-2 text-geist-accents-5 transition-all border border-transparent hover:border-geist-accents-3 cursor-pointer"
                      title="Editar información básica"
                    >
                      <i class="fa-solid fa-pencil text-[10px]"></i>
                    </button>
                  </div>

                  <template v-if="store.selectedSubNode">
                    <i class="fa-solid fa-chevron-right text-[8px] opacity-30"></i>
                    <span class="text-geist-fg font-bold tracking-tight">{{ store.selectedSubNode.name }}</span>
                  </template>
                </div>
                
                <div v-if="!store.selectedSubNode" class="flex items-center gap-2">
                  <div class="flex items-center gap-1 bg-geist-bg border border-geist-border rounded-lg p-0.5">
                    <button 
                      @click="setVisualizerMode('2D')"
                      class="px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-2"
                      :class="visualizerMode === '2D' ? 'bg-geist-accents-2 text-geist-fg shadow-sm' : 'text-geist-accents-4 hover:text-geist-accents-6'"
                    >
                      <i class="fa-solid fa-diagram-project"></i>
                      2D
                    </button>
                    <button 
                      @click="setVisualizerMode('3D')"
                      class="px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-2"
                      :class="visualizerMode === '3D' ? 'bg-geist-accents-2 text-geist-fg shadow-sm' : 'text-geist-accents-4 hover:text-geist-accents-6'"
                    >
                      <i class="fa-solid fa-cube"></i>
                      3D
                    </button>
                    <button 
                      @click="setVisualizerMode('JSON')"
                      class="px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-2"
                      :class="visualizerMode === 'JSON' ? 'bg-geist-accents-2 text-geist-fg shadow-sm' : 'text-geist-accents-4 hover:text-geist-accents-6'"
                    >
                      <i class="fa-solid fa-code"></i>
                      JSON
                    </button>
                  </div>

                  <div class="w-px h-4 bg-geist-border mx-1"></div>

                  <button 
                    @click="exportMachine"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-geist-border bg-geist-bg text-[10px] uppercase font-bold hover:bg-geist-accents-2 text-geist-accents-5 hover:text-geist-fg transition-all shadow-sm group"
                    title="Exportar archivo JSON"
                  >
                    <i class="fa-solid fa-download group-hover:scale-110 transition-transform"></i>
                    Exportar
                  </button>
                </div>

                <div class="w-px h-4 bg-geist-border mx-2"></div>

                <button 
                  v-if="store.selectedNode.description"
                  @click="toggleDescription"
                  class="flex items-center gap-2 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all hover:bg-geist-accents-2"
                  :class="showDescription ? 'text-geist-fg' : 'text-geist-accents-5'"
                >
                  <i class="fa-solid fa-circle-info text-[12px]"></i>
                  {{ showDescription ? 'Ocultar Info' : 'Ver Info' }}
                  <i class="fa-solid fa-chevron-down text-[8px] transition-transform duration-300" :class="{ 'rotate-180': showDescription }"></i>
                </button>
              </div>

              <!-- Collapsible Description (Solo texto) -->
              <transition name="expand">
                <div v-if="showDescription && store.selectedNode?.description" class="px-4 pb-4 overflow-hidden">
                  <div class="p-4 bg-geist-bg border border-geist-border rounded-lg shadow-sm">
                    <p class="text-xs text-geist-accents-5 leading-relaxed font-mono whitespace-pre-wrap">
                      {{ store.selectedNode.description }}
                    </p>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Editor Workspace Area Principal -->
            <div class="flex-1 relative overflow-hidden bg-geist-bg">
              <div v-if="store.selectedSubNode" class="w-full h-full">
                <NodeEditor />
              </div>
              <div v-else-if="store.selectedNode" class="w-full h-full animate-in fade-in duration-700">
                <!-- El visualizador condicionado por el modo -->
                <MachineVisualizerJSON v-if="visualizerMode === 'JSON'" :machine="store.selectedNode" />
                <MachineVisualizer2D v-else-if="visualizerMode === '2D'" :machine-json="store.selectedNode.machine" />
                <MachineVisualizer3D v-else :machine-json="store.selectedNode.machine" />
              </div>
              
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                  <div class="w-12 h-12 rounded-2xl bg-geist-accents-1 flex items-center justify-center mx-auto mb-4 border border-geist-border">
                    <i class="fa-solid fa-mouse-pointer text-geist-accents-4"></i>
                  </div>
                  <h3 class="text-lg font-medium text-geist-fg mb-1">Área de Trabajo</h3>

                </div>
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
      
      <!-- Guardian Global de Cambios -->
      <UnsavedChangesModal />
    </main>
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
