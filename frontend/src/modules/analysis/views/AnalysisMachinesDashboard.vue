<script setup lang="ts">
import ModuleViewHeader from '@/shared/components/layout/ModuleViewHeader.vue'
import { useExport } from '@/shared/composables/useExport'
import type { CimMachine } from '@/shared/types'
import AnalysisCimEditor from '../components/AnalysisCimEditor.vue'
import AnalysisCimVisualizer2D from '../components/AnalysisCimVisualizer2D.vue'
import AnalysisCimVisualizerJSON from '../components/AnalysisCimVisualizerJSON.vue'
import AnalysisMachinesNodeEditor from '../components/AnalysisMachinesNodeEditor.vue'
import AnalysisMachinesVisualizer2D from '../components/AnalysisMachinesVisualizer2D.vue'
import AnalysisMachinesVisualizerJSON from '../components/AnalysisMachinesVisualizerJSON.vue'
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'

import GenericConfirmDeleteModal from '@/shared/components/modals/GenericConfirmDeleteModal.vue'
import GenericAddEditModal from '@/shared/components/modals/GenericAddEditModal.vue'
import { useRoute } from 'vue-router'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'

const store = useAnalysisMachinesStore()
const { exportToJson } = useExport()
const route = useRoute()
const { runWithGuard } = useUnsavedChanges()

const showDeleteModal = ref(false)
const showAddMachineModal = ref(false)

const projectId = computed(() => Number(route.params.id))

const currentMachine = computed(() => {
  if (store.selectedNode && 'machine' in store.selectedNode) {
    return store.selectedNode as CimMachine
  }
  return null
})

const breadcrumbs = computed(() => {
  const list = []
  if (store.selectedNodeId === 'analisis') {
    list.push({ 
      label: 'Análisis del Proyecto', 
      active: true,
      canAddMachine: store.machines.length < 10 // Límite de 10 máquinas
    })
    return list
  }
  if (currentMachine.value) {
    const doc = store.parsedDocs[currentMachine.value.id]
    list.push({ 
      label: doc?.name || 'Máquina', 
      active: !store.selectedSubNode,
      canDelete: !store.selectedSubNode,
      canAddSubnodes: !store.selectedSubNode // Habilitar botones de +Generador/+Modificador en la vista de máquina
    })
  }
  if (store.selectedSubNode) {
    list.push({ 
      label: store.selectedSubNode.name || 'Nuevo Componente', 
      active: true,
      canDelete: !String(store.selectedNodeId).startsWith('new-') // Solo si no es nuevo
    })
  }
  return list
})

const handleExport = () => {
  if (store.selectedNodeId === 'analisis' && store.currentCim) {
    exportToJson(store.currentCim.machinesRelations, 'analisis-cim-relations')
  } else if (currentMachine.value) {
    const doc = store.parsedDocs[currentMachine.value.id]
    exportToJson(currentMachine.value.machine, doc?.name || 'machine')
  }
}

const handleEditBasic = () => {
  if (store.selectedNodeId === 'analisis' && store.currentCim) {
    emit('edit-cim', store.currentCim)
  } else if (currentMachine.value) {
    emit('edit-machine', currentMachine.value)
  }
}

const handleDelete = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (store.selectedSubNode) {
    const id = store.selectedNodeId as string
    const parts = id.split('-')
    if (parts.length >= 4) {
      const machineId = Number(parts[1])
      const type = parts[2] as 'el'
      const subId = parts.slice(3).join('-')
      await store.deleteSubNode(machineId, subId, type)
    }
  } else if (currentMachine.value) {
    await store.deleteMachine(currentMachine.value.id)
  }
  showDeleteModal.value = false
}

const deleteWarningDetails = computed(() => {
  const warnings: string[] = []
  if (store.selectedSubNode) {
    const id = store.selectedNodeId as string
    const parts = id.split('-')
    if (parts.length >= 4) {
      warnings.push(...store.getSubNodeReferences(Number(parts[1]), parts.slice(3).join('-')))
    }
  } else if (currentMachine.value) {
    const relCount = store.getMachineRelationsCount(currentMachine.value.id)
    if (relCount > 0) {
      warnings.push(`Se eliminarán ${relCount} relaciones de esta máquina en el Análisis (CIM)`)
    }
  }
  return warnings
})

const setMode = (mode: '2D' | 'JSON' | 'FORM') => {
  store.visualizerMode = mode
}

// Reset mode to 2D when switching between machines or to/from analisis
watch(() => store.selectedNodeId, (newId, oldId) => {
  if (newId !== oldId) {
    store.visualizerMode = '2D'
  }
})

const emit = defineEmits<{
  (e: 'edit-machine', machine: any): void
  (e: 'edit-cim', cim: any): void
}>()

const handleAddMachine = () => {
  runWithGuard(() => {
    showAddMachineModal.value = true
  })
}

const confirmAddMachine = async (name: string, description: string) => {
  if (projectId.value) {
    await store.addMachine(projectId.value, name, description)
    showAddMachineModal.value = false
  }
}

const handleAddSubNode = (type: 'el') => {
  runWithGuard(() => {
    if (currentMachine.value) {
      store.selectNewSubNode(currentMachine.value.id, type)
    }
  })
}
</script>

<template>
  <div class="analysis-dashboard flex flex-col h-full bg-geist-bg">
    <template v-if="store.selectedNode">
      <ModuleViewHeader 
        module-name="Análisis"
        :breadcrumbs="breadcrumbs"
        :visualizer-mode="(!store.selectedSubNode) ? store.visualizerMode : undefined"
        :show-export="!store.selectedSubNode"
        :show-form-mode="store.selectedNodeId === 'analisis'"
        :description="(!store.selectedSubNode) ? (store.selectedNodeId === 'analisis' ? store.parsedCimRelations.description : store.parsedDocs[currentMachine?.id || 0]?.description) : undefined"
        @set-mode="setMode"
        @export="handleExport"
        @edit-basic="handleEditBasic"
        @delete="handleDelete"
        @add-subnode="handleAddSubNode"
        @add-machine="handleAddMachine"
      />
  
        <div class="flex-1 relative overflow-hidden">
          <div v-if="store.selectedNodeId === 'analisis'" class="w-full h-full">
            <template v-if="store.visualizerMode === '2D'">
              <AnalysisCimVisualizer2D />
            </template>
            <template v-else-if="store.visualizerMode === 'FORM'">
              <AnalysisCimEditor />
            </template>
            <template v-else-if="store.visualizerMode === 'JSON'">
              <AnalysisCimVisualizerJSON />
            </template>
          </div>
          <div v-else-if="store.selectedSubNode" class="w-full h-full">
            <AnalysisMachinesNodeEditor />
          </div>
          <div v-else class="w-full h-full animate-in fade-in duration-500">
            <template v-if="currentMachine">
              <AnalysisMachinesVisualizerJSON v-if="store.visualizerMode === 'JSON'" :machine="currentMachine" />
              <AnalysisMachinesVisualizer2D v-else-if="store.visualizerMode === '2D'" :machine-json="currentMachine.machine" />
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

    <GenericConfirmDeleteModal
      :show="showDeleteModal"
      :item-name="store.selectedSubNode?.name || store.parsedDocs[currentMachine?.id || 0]?.name || 'Elemento'"
      :extra-warnings="deleteWarningDetails"
      @close="showDeleteModal = false"
      @confirm="confirmDelete"
    />

    <GenericAddEditModal
      :show="showAddMachineModal"
      title="Nueva Máquina (Análisis)"
      entity-label="Máquina"
      confirm-text="Crear"
      :show-name-field="true"
      :existing-names="store.machines.map(m => store.parsedDocs[m.id]?.name || '')"
      :desc-min-length="10"
      @close="showAddMachineModal = false"
      @confirm="confirmAddMachine"
    />
  </div>
</template>
