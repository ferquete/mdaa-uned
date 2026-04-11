<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { PanelGroup, Panel, PanelResizeHandle } from 'vue-resizable-panels'
import ProjectTreeView from '../components/ProjectTreeView.vue'
import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore'
import AnalysisMachinesDashboard from '@/modules/analysis/views/AnalysisMachinesDashboard.vue'
import UnsavedChangesModal from '@/shared/components/UnsavedChangesModal.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'

const analysisStore = useAnalysisMachinesStore()
const route = useRoute()
const { runWithGuard, hasUnsavedChanges } = useUnsavedChanges()

onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    runWithGuard(() => next())
  } else {
    next()
  }
})

const treeRef = ref<InstanceType<typeof ProjectTreeView> | null>(null)

/**
 * Determina qué módulo mostrar basado en el nodo seleccionado.
 * Por ahora solo tenemos Análisis, pero aquí se añadirán Diseño e Implementación.
 */
const activeModule = computed(() => {
  const id = analysisStore.selectedNodeId
  if (!id) return null
  
  // Por ahora todos los nodos que no son 'root' cuelgan de Análisis o son Análisis
  if (id === 'analisis' || 
      (typeof id === 'number') || 
      (typeof id === 'string' && (id.startsWith('m-') || id.startsWith('new-m-')))) {
    return 'analysis'
  }
  
  if (id === 'diseno') return 'design'
  if (id === 'implementacion') return 'implementation'
  
  return null
})

const handleEditMachine = (machine: any) => {
  if (treeRef.value) {
    treeRef.value.editNode({ id: machine.id, text: machine.name })
  }
}

onMounted(async () => {
  const projectId = Number(route.params.id)
  if (projectId) {
    await analysisStore.fetchMachines(projectId)
  }
})
</script>

<template>
  <div class="project-dashboard flex flex-col h-[calc(100vh-3rem)] bg-geist-bg">
    <main class="flex-1 overflow-hidden">
      <PanelGroup direction="horizontal">
        <!-- Sidebar: Explorador -->
        <Panel :default-size="25" :min-size="12" :max-size="35">
          <ProjectTreeView ref="treeRef" />
        </Panel>

        <PanelResizeHandle class="w-px bg-geist-border hover:bg-geist-accents-2 transition-colors cursor-col-resize relative">
          <div class="absolute inset-y-0 -left-1 -right-1 z-10"></div>
        </PanelResizeHandle>

        <!-- Main Area: Dynamic Module Loader -->
        <Panel :min-size="40">
          <div class="h-full bg-geist-bg">
            <template v-if="activeModule === 'analysis'">
              <AnalysisMachinesDashboard @edit-machine="handleEditMachine" />
            </template>
            
            <div v-else-if="activeModule === 'design' || activeModule === 'implementation'" class="w-full h-full flex items-center justify-center">
              <div class="text-center opacity-30">
                <i class="fa-solid fa-tools text-4xl mb-4"></i>
                <h3 class="text-xl font-bold uppercase tracking-widest">En Desarrollo</h3>
                <p class="text-sm font-mono mt-2">Módulo de {{ activeModule }} próximamente...</p>
              </div>
            </div>

            <div v-else class="w-full h-full flex items-center justify-center">
              <div class="text-center">
                <div class="w-12 h-12 rounded-2xl bg-geist-accents-1 flex items-center justify-center mx-auto mb-4 border border-geist-border">
                  <i class="fa-solid fa-mouse-pointer text-geist-accents-4 animate-bounce"></i>
                </div>
                <h3 class="text-lg font-medium text-geist-fg mb-1">Área de Trabajo</h3>
                <p class="text-xs text-geist-accents-5">Explora el proyecto para comenzar a editar</p>
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
      
      <UnsavedChangesModal />
    </main>
  </div>
</template>
