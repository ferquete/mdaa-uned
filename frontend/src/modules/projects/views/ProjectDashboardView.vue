<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PanelGroup, Panel, PanelResizeHandle } from 'vue-resizable-panels'
import ProjectTreeView from '@/modules/projects/components/ProjectTreeView.vue'
import { useProjectStore } from '@/modules/projects/stores/projectStore'

const store = useProjectStore()
const route = useRoute()
const showDescription = ref(false)

onMounted(async () => {
  const projectId = Number(route.params.id)
  if (projectId) {
    await store.fetchMachines(projectId)
  }
})

const toggleDescription = () => {
  showDescription.value = !showDescription.value
}
</script>

<template>
  <div class="project-dashboard flex flex-col h-[calc(100vh-3rem)] bg-geist-bg">
    <!-- Splitter Container -->
    <main class="flex-1 overflow-hidden">
      <PanelGroup direction="horizontal">
        <!-- Sidebar: Explorador -->
        <Panel :default-size="16" :min-size="12" :max-size="30">
          <ProjectTreeView />
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
                  <span class="text-geist-fg font-bold tracking-tight">{{ store.selectedNode.name }}</span>
                </div>
                
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
              <div v-if="store.selectedNode" class="w-full h-full animate-in fade-in duration-700">
                <!-- El visualizador 3D ahora es el contenido principal -->
                <MachineVisualizer3D :machine-json="store.selectedNode.machine" />
              </div>
              
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                  <div class="w-12 h-12 rounded-2xl bg-geist-accents-1 flex items-center justify-center mx-auto mb-4 border border-geist-border">
                    <i class="fa-solid fa-mouse-pointer text-geist-accents-4"></i>
                  </div>
                  <h3 class="text-lg font-medium text-geist-fg mb-1">Área de Trabajo</h3>
                  <p class="text-sm text-geist-accents-4 font-mono">Seleccione una máquina para comenzar la exploración 3D.</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
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
