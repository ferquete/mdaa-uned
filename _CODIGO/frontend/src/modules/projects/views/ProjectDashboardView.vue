<script setup lang="ts">
import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore'
import AnalysisMachinesDashboard from '@/modules/analysis/views/AnalysisMachinesDashboard.vue'
import { usePimStore } from '@/modules/pim/stores/pimStore'
import PimDashboard from '@/modules/pim/views/PimDashboard.vue'
import { useProjectStore } from '@/modules/projects/stores/projectStore'
import UnsavedChangesModal from '@/shared/components/UnsavedChangesModal.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import type { Project } from '@/shared/types'
import { computed, onMounted, ref } from 'vue'
import { Panel, PanelGroup, PanelResizeHandle } from 'vue-resizable-panels'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import ProjectTreeView from '../components/ProjectTreeView.vue'

const analysisStore = useAnalysisMachinesStore()
const pimStore = usePimStore()
const projectStore = useProjectStore()
const route = useRoute()
const { runWithGuard, hasUnsavedChanges } = useUnsavedChanges()

const currentProject = ref<Project | null>(null)

onBeforeRouteLeave((_to, _from, next) => {
  if (hasUnsavedChanges.value) {
    runWithGuard(() => next())
  } else {
    next()
  }
})

const treeRef = ref<InstanceType<typeof ProjectTreeView> | null>(null)
const sidebarPanelRef = ref<any>(null)
const isCollapsed = ref(false)

const toggleSidebar = () => {
  const panel = sidebarPanelRef.value
  if (!panel) return
  
  if (isCollapsed.value) {
    panel.expand()
    isCollapsed.value = false
  } else {
    panel.collapse()
    isCollapsed.value = true
  }
}

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
  
  // Nodos específicos de PIM o máquinas PIM
  if (typeof id === 'string' && (id.startsWith('pim-') || id.startsWith('new-pim-'))) {
    return 'design'
  }

  return null
})

const handleEditMachine = (machine: any) => {
  if (treeRef.value) {
    // Ya no usamos m.name porque está en el JSON, editNode lo recuperará del store
    treeRef.value.editNode({ id: machine.id, text: '' })
  }
}

const handleEditCim = () => {
  if (treeRef.value) {
    treeRef.value.editNode({ id: 'analisis', text: 'Análisis' })
  }
}

onMounted(async () => {
  const projectId = Number(route.params.id)
  if (projectId) {
    currentProject.value = await projectStore.fetchProjectById(projectId)
    // Carga paralela de CIM y PIM
    await Promise.all([
      analysisStore.fetchMachines(projectId),
      pimStore.fetchPimData(projectId)
    ])
  }
})
</script>

<template>
  <div class="project-dashboard flex flex-col h-[calc(100vh-3rem)] bg-geist-bg">
    <main class="flex-1 overflow-hidden relative">
      <PanelGroup direction="horizontal">
        <!-- Sidebar: Explorador -->
        <Panel 
          ref="sidebarPanelRef"
          :default-size="25" 
          :min-size="12" 
          :max-size="35" 
          collapsible
          @collapse="isCollapsed = true"
          @expand="isCollapsed = false"
        >
          <ProjectTreeView ref="treeRef" />
        </Panel>

        <PanelResizeHandle class="w-1.5 bg-geist-border hover:bg-geist-accents-2 transition-colors cursor-col-resize relative group/handle">
          <!-- Toggle Button in the center of the handle - Always Visible -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <button 
              @click.stop="toggleSidebar"
              class="w-6 h-10 rounded-full bg-geist-bg border border-geist-border text-geist-fg transition-all shadow-md flex items-center justify-center cursor-pointer hover:border-geist-accents-4 hover:bg-geist-accents-1 active:scale-95"
              title="Alternar explorador"
            >
              <i class="fa-solid" :class="isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
            </button>
          </div>
          <div class="absolute inset-y-0 -left-1 -right-1 z-10"></div>
        </PanelResizeHandle>

        <!-- Main Area: Dynamic Module Loader -->
        <Panel :min-size="40">
          <div class="h-full bg-geist-bg">
            <template v-if="activeModule === 'analysis'">
              <AnalysisMachinesDashboard 
                @edit-machine="handleEditMachine" 
                @edit-cim="handleEditCim"
              />
            </template>
            
            <template v-else-if="activeModule === 'design'">
              <PimDashboard />
            </template>
            
            <div v-else-if="activeModule === 'implementation'" class="w-full h-full flex items-center justify-center">
              <div class="text-center opacity-30">
                <i class="fa-solid fa-tools text-4xl mb-4"></i>
                <h3 class="text-xl font-bold uppercase tracking-widest">En Desarrollo</h3>
                <p class="text-sm font-mono mt-2">Módulo de {{ activeModule }} próximamente...</p>
              </div>
            </div>

            <div v-else class="w-full h-full flex items-center justify-center p-8 overflow-y-auto">
              <div v-if="analysisStore.selectedNodeId === 'root' && currentProject" class="max-w-3xl w-full">
                <!-- Project Detail Hero -->
                <div class="flex items-center gap-6 mb-12 animate-in slide-in-from-top duration-500">
                  <div class="w-20 h-20 rounded-[2rem] bg-geist-fg flex items-center justify-center text-geist-bg shadow-2xl">
                    <i class="fa-solid fa-folder-open text-3xl"></i>
                  </div>
                  <div>
                    <h1 class="text-4xl font-bold text-geist-fg tracking-tighter mb-2">{{ currentProject.name }}</h1>
                  </div>
                </div>

                <!-- Info Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-in fade-in duration-700 delay-200">
                  <div class="p-6 rounded-2xl bg-geist-accents-1 border border-geist-border shadow-sm">
                    <h3 class="text-[10px] uppercase tracking-widest font-bold text-geist-accents-4 mb-4">Descripción</h3>
                    <p class="text-sm text-geist-fg leading-relaxed whitespace-pre-wrap">
                      {{ (currentProject.description?.length > 400) ? currentProject.description.substring(0, 400) + '...' : (currentProject.description || 'Sin descripción disponible.') }}
                    </p>
                  </div>
                  
                  <div class="p-6 rounded-2xl bg-geist-accents-1 border border-geist-border shadow-sm">
                    <h3 class="text-[10px] uppercase tracking-widest font-bold text-geist-accents-4 mb-4">Información de Sistema</h3>
                    <div class="space-y-3">
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-geist-accents-5">Fecha de Creación</span>
                        <span class="font-mono text-geist-fg">{{ new Date(currentProject.createdAt).toLocaleDateString() }}</span>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-geist-accents-5">Máquinas de Análisis</span>
                        <span class="font-mono text-geist-fg">{{ analysisStore.machines.length }}</span>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-geist-accents-5">Máquinas de Diseño Conceptual</span>
                        <span class="font-mono text-geist-fg">{{ pimStore.machines.length }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Guidance Footer -->
                <div class="p-6 rounded-2xl border-2 border-dashed border-geist-border text-center animate-in zoom-in-95 duration-700 delay-300">
                  <p class="text-xs text-geist-accents-4 font-medium uppercase tracking-[0.2em]">Explora el menú lateral para gestionar componentes</p>
                </div>
              </div>

              <div v-else class="text-center">
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
