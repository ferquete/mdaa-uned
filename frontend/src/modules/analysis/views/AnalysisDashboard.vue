<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAnalysisStore } from '../stores/analysisStore'
import ModuleViewHeader from '@/shared/components/layout/ModuleViewHeader.vue'
import AnalysisVisualizer2D from '../components/AnalysisVisualizer2D.vue'
import AnalysisVisualizer3D from '../components/AnalysisVisualizer3D.vue'
import AnalysisVisualizerJSON from '../components/AnalysisVisualizerJSON.vue'
import AnalysisNodeEditor from '../components/AnalysisNodeEditor.vue'
import { useExport } from '@/shared/composables/useExport'

const store = useAnalysisStore()
const { exportToJson } = useExport()
const visualizerMode = ref<'2D' | '3D' | 'JSON'>('2D')

const breadcrumbs = computed(() => {
  const list = []
  if (store.selectedNode) {
    list.push({ label: store.selectedNode.name, active: !store.selectedSubNode })
  }
  if (store.selectedSubNode) {
    list.push({ label: store.selectedSubNode.name || 'Nuevo Componente', active: true })
  }
  return list
})

const handleExport = () => {
  if (store.selectedNode) {
    exportToJson(store.selectedNode.machine, store.selectedNode.name)
  }
}

const setMode = (mode: '2D' | '3D' | 'JSON') => {
  visualizerMode.value = mode
}

// Reset mode to 2D when selecting a base machine node
watch(() => store.selectedNodeId, (newId, oldId) => {
  if (typeof newId === 'number' && typeof oldId !== 'number') {
    visualizerMode.value = '2D'
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
        :visualizer-mode="!store.selectedSubNode ? visualizerMode : undefined"
        :show-export="!store.selectedSubNode"
        :description="!store.selectedSubNode ? store.selectedNode.description : undefined"
        @set-mode="setMode"
        @export="handleExport"
        @edit-basic="emit('edit-machine', store.selectedNode)"
      />

      <div class="flex-1 relative overflow-hidden">
        <div v-if="store.selectedSubNode" class="w-full h-full">
          <AnalysisNodeEditor />
        </div>
        <div v-else class="w-full h-full animate-in fade-in duration-500">
          <AnalysisVisualizerJSON v-if="visualizerMode === 'JSON'" :machine="store.selectedNode" />
          <AnalysisVisualizer2D v-else-if="visualizerMode === '2D'" :machine-json="store.selectedNode.machine" />
          <AnalysisVisualizer3D v-else :machine-json="store.selectedNode.machine" />
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
