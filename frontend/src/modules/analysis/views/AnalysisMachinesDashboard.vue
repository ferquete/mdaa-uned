<script setup lang="ts">
import ModuleViewHeader from '@/shared/components/layout/ModuleViewHeader.vue'
import { useExport } from '@/shared/composables/useExport'
import type { CimMachine } from '@/shared/types'
import AnalysisCimEditor from '../components/AnalysisCimEditor.vue'
import AnalysisMachinesNodeEditor from '../components/AnalysisMachinesNodeEditor.vue'
import AnalysisMachinesVisualizer2D from '../components/AnalysisMachinesVisualizer2D.vue'
import AnalysisMachinesVisualizer3D from '../components/AnalysisMachinesVisualizer3D.vue'
import AnalysisMachinesVisualizerJSON from '../components/AnalysisMachinesVisualizerJSON.vue'
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'

const store = useAnalysisMachinesStore()
const { exportToJson } = useExport()

const currentMachine = computed(() => {
  if (store.selectedNode && 'machine' in store.selectedNode) {
    return store.selectedNode as CimMachine
  }
  return null
})

const breadcrumbs = computed(() => {
  const list = []
  if (store.selectedNodeId === 'analisis') {
    list.push({ label: 'Configuración Central', active: true })
    return list
  }
  if (store.selectedNode && store.selectedNodeId !== 'analisis') {
    list.push({ label: (store.selectedNode as any).name, active: !store.selectedSubNode })
  }
  if (store.selectedSubNode) {
    list.push({ label: store.selectedSubNode.name || 'Nuevo Componente', active: true })
  }
  return list
})

const handleExport = () => {
  if (currentMachine.value) {
    exportToJson(currentMachine.value.machine, currentMachine.value.name)
  }
}

const handleEditBasic = () => {
  if (currentMachine.value) {
    emit('edit-machine', currentMachine.value)
  }
}

const setMode = (mode: '2D' | '3D' | 'JSON') => {
  store.visualizerMode = mode
}

// Reset mode to 2D when selecting a base machine node
watch(() => store.selectedNodeId, (newId, oldId) => {
  if (typeof newId === 'number' && typeof oldId !== 'number') {
    store.visualizerMode = '2D'
  }
})

const emit = defineEmits<{
  (e: 'edit-machine', machine: any): void
}>()
</script>

<template>
  <div class="analysis-dashboard flex flex-col h-full bg-geist-bg">
    <template v-if="store.selectedNode">
      <ModuleViewHeader 
        module-name="Análisis"
        :breadcrumbs="breadcrumbs"
        :visualizer-mode="(!store.selectedSubNode && store.selectedNodeId !== 'analisis') ? store.visualizerMode : undefined"
        :show-export="!store.selectedSubNode && store.selectedNodeId !== 'analisis'"
        :description="(!store.selectedSubNode && store.selectedNodeId !== 'analisis') ? (store.selectedNode as any).description : undefined"
        @set-mode="setMode"
        @export="handleExport"
        @edit-basic="handleEditBasic"
      />
  
        <div class="flex-1 relative overflow-hidden">
          <div v-if="store.selectedNodeId === 'analisis'" class="w-full h-full">
            <AnalysisCimEditor />
          </div>
          <div v-else-if="store.selectedSubNode" class="w-full h-full">
            <AnalysisMachinesNodeEditor />
          </div>
          <div v-else class="w-full h-full animate-in fade-in duration-500">
            <template v-if="currentMachine">
              <AnalysisMachinesVisualizerJSON v-if="store.visualizerMode === 'JSON'" :machine="currentMachine" />
              <AnalysisMachinesVisualizer2D v-else-if="store.visualizerMode === '2D'" :machine-json="currentMachine.machine" />
              <AnalysisMachinesVisualizer3D v-else :machine-json="currentMachine.machine" />
            </template>
          </div>
        </div>
    </template>
    
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-center opacity-50">
        <div class="w-16 h-16 rounded-2xl bg-geist-accents-1 flex items-center justify-center mx-auto mb-4 border border-geist-border">
          <i class="fa-solid fa-microscope text-2xl text-geist-accents-4"></i>
        </div>
        <h3 class="text-lg font-medium text-geist-fg">Módulo de Análisis</h3>
        <p class="text-xs text-geist-accents-5">Selecciona una máquina para comenzar</p>
      </div>
    </div>
  </div>
</template>
