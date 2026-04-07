<script setup lang="ts">
import { PanelGroup, Panel, PanelResizeHandle } from 'vue-resizable-panels'
import ProjectTreeView from '@/modules/projects/components/ProjectTreeView.vue'
import { useProjectStore } from '@/modules/projects/stores/projectStore'

const store = useProjectStore()
</script>

<template>
  <div class="project-dashboard flex flex-col h-screen bg-geist-bg">
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
            <!-- Breadcrumbs / Header area sutil -->
            <div v-if="store.selectedNode" class="p-4 border-b border-geist-border flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs font-mono text-geist-accents-5">
                <span>Análisis</span>
                <i class="fa-solid fa-chevron-right text-[8px]"></i>
                <span class="text-geist-fg font-bold">{{ store.selectedNode.text }}</span>
              </div>
            </div>

            <!-- Editor Placeholder -->
            <div class="flex-1 flex items-center justify-center p-8">
              <div v-if="store.selectedNode" class="text-center animate-in fade-in duration-500">
                <h2 class="text-4xl font-bold tracking-tighter mb-4">{{ store.selectedNode.text }}</h2>
                <p class="text-geist-accents-5 font-mono text-sm max-w-md mx-auto">
                  Este es el espacio de trabajo para el nodo de análisis. Próximamente podrás definir generadores y osciladores aquí.
                </p>
              </div>
              <div v-else class="text-center">
                <div class="w-12 h-12 rounded-2xl bg-geist-accents-1 flex items-center justify-center mx-auto mb-4 border border-geist-border">
                  <i class="fa-solid fa-mouse-pointer text-geist-accents-4"></i>
                </div>
                <h3 class="text-lg font-medium text-geist-fg mb-1">Área de Trabajo</h3>
                <p class="text-sm text-geist-accents-4">Seleccione un nodo del explorador para comenzar.</p>
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </main>
  </div>
</template>

<style scoped>
.project-dashboard-container {
  height: calc(100vh - 3rem);
  width: 100%;
  overflow: hidden;
}

.resize-handle {
  width: 4px;
  cursor: col-resize;
  display: flex;
  justify-content: center;
  z-index: 10;
}

/* Transiciones para suavizar el redimensionado */
:deep(.resizable-panel-group) {
  transition: all 0.1s ease;
}
</style>
