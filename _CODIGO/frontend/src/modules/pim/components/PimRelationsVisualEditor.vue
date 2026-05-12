<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { VueFlow, useVueFlow, type EdgeTypesObject, type NodeTypesObject, type Connection } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { computed, markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { usePimStore } from '../stores/pimStore'
import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import GenericConfirmDeleteModal from '@/shared/components/modals/GenericConfirmDeleteModal.vue'
import GenericConfirmSaveModal from '@/shared/components/modals/GenericConfirmSaveModal.vue'
import PimRelationsMachineNode from './PimRelationsMachineNode.vue'
import PimRelationModal from './PimRelationModal.vue'
import PimCustomEdge from './PimCustomEdge.vue' // Reusamos el estilo de aristas del editor PIM

const store = usePimStore()
const analysisStore = useAnalysisMachinesStore()
const { setUnsavedState, runWithGuard } = useUnsavedChanges()

const nodeTypes: NodeTypesObject = {
  machine: markRaw(PimRelationsMachineNode)
}

const edgeTypes: EdgeTypesObject = {
  custom: markRaw(PimCustomEdge)
}

const { 
  edges, 
  onConnect, 
  addEdges, 
  removeEdges, 
  fromObject,
  onNodeDoubleClick
} = useVueFlow({
  id: 'pim-relations-flow'
})

// --- ESTADO DEL MODAL ---
const showRelationModal = ref(false)
const modalEditMode = ref(false)
const pendingConnection = ref<Connection | null>(null)
const editingEdgeId = ref<string | null>(null)
const sourcePortLabel = ref('')
const destPortLabel = ref('')
const initialRelationData = ref<{ id: string, description: string } | null>(null)
const showDeleteConfirmModal = ref(false)
const showSaveConfirmModal = ref(false)
const edgeIdToDelete = ref<string | null>(null)

// --- PERSISTENCIA Y SNAPSHOTS ---
const snapshotRelations = ref('')
const isDirty = computed(() => {
  if (!snapshotRelations.value) return false
  return getCurrentRelationsJson() !== snapshotRelations.value
})

const getCurrentRelationsJson = () => {
  const currentRelations = edges.value.map(e => ({
    id: e.id,
    source: e.sourceHandle,
    destination: e.targetHandle,
    description: e.data?.description || ''
  }))
  return JSON.stringify({
    description: store.parsedPimRelations.description,
    relations: currentRelations
  })
}

watch(isDirty, (val) => {
  setUnsavedState(val, true, executeSave)
})

// --- CARGA DE DATOS ---
const initializeGraph = () => {
  const flowNodes = store.machines.map((m, index) => ({
    id: `machine-${m.id}`,
    type: 'machine',
    position: { x: 50 + (index % 3) * 300, y: 50 + Math.floor(index / 3) * 250 },
    data: { machineId: m.id }
  }))

  const flowEdges = store.parsedPimRelations.relations.map(rel => {
    // Buscar dueños de los puertos para conectar nodos adecuadamente
    const sourceNodeId = findMachineByPortId(rel.source)
    const targetNodeId = findMachineByPortId(rel.destination)

    return {
      id: rel.id,
      source: sourceNodeId ? `machine-${sourceNodeId}` : '',
      sourceHandle: rel.source,
      target: targetNodeId ? `machine-${targetNodeId}` : '',
      targetHandle: rel.destination,
      type: 'custom',
      data: { description: rel.description, type: getSignalTypeForPort(rel.source) }
    }
  }).filter(e => e.source && e.target)

  fromObject({ nodes: flowNodes, edges: flowEdges })
  snapshotRelations.value = getCurrentRelationsJson()
}

const findMachineByPortId = (portId: string): number | null => {
  for (const [mId, doc] of Object.entries(store.parsedDocs)) {
    if (!doc?.nodes) continue
    const found = doc.nodes.some((node: any) => {
      if (!node) return false
      // Buscar en propiedades de nivel superior (parámetros estándar)
      const inMain = Object.entries(node).some(([key, val]: [string, any]) => {
        if (['id', 'name', 'type', 'description', 'ids_references', 'others'].includes(key)) return false
        return val?.id === portId
      })
      if (inMain) return true
      
      // Buscar en others
      if (Array.isArray(node.others)) {
        return node.others.some((o: any) => o.id === portId)
      }
      return false
    })
    if (found) return Number(mId)
  }
  return null
}

const getPortLabel = (portId: string): string => {
  for (const doc of Object.values(store.parsedDocs)) {
    if (!doc?.nodes) continue
    for (const node of (doc.nodes as any[])) {
      if (!node) continue
      
      // Buscar en propiedades de nivel superior
      for (const [key, val] of Object.entries(node)) {
        if (['id', 'name', 'type', 'description', 'ids_references', 'others'].includes(key)) continue
        if ((val as any)?.id === portId) return `${node.name} - ${key}`
      }
      
      // Others
      if (Array.isArray(node.others)) {
        const other = node.others.find((o: any) => o.id === portId)
        if (other) return `${node.name} - ${other.name}`
      }
    }
  }
  return portId
}

const getSignalTypeForPort = (portId: string): 'audio' | 'modification' => {
  for (const doc of Object.values(store.parsedDocs)) {
    if (!doc?.nodes) continue
    for (const node of (doc.nodes as any[])) {
      if (!node) continue
      const isModNode = node.type === 'lfo' || node.type === 'envelope'
      
      // Buscar en propiedades
      for (const [key, val] of Object.entries(node)) {
        if (['id', 'name', 'type', 'description', 'ids_references', 'others'].includes(key)) continue
        if ((val as any)?.id === portId) {
          const isAudio = (key.startsWith('output') || key.startsWith('input_')) && !isModNode
          return isAudio ? 'audio' : 'modification'
        }
      }
      
      // Others
      if (Array.isArray(node.others)) {
        if (node.others.some((o: any) => o.id === portId)) return 'modification'
      }
    }
  }
  return 'modification'
}

const isValidConnection = (connection: Connection) => {
  if (!connection.sourceHandle || !connection.targetHandle) return false
  const sourceType = getSignalTypeForPort(connection.sourceHandle)
  const targetType = getSignalTypeForPort(connection.targetHandle)
  return sourceType === targetType
}

// --- INTERACCIONES ---
onConnect((params) => {
  pendingConnection.value = params
  modalEditMode.value = false
  sourcePortLabel.value = getPortLabel(params.sourceHandle!)
  destPortLabel.value = getPortLabel(params.targetHandle!)
  initialRelationData.value = null
  showRelationModal.value = true
})

const handleConfirmRelation = (data: { id: string, description: string }) => {
  if (modalEditMode.value && editingEdgeId.value) {
    // Actualizar existente
    const edge = edges.value.find(e => e.id === editingEdgeId.value)
    if (edge) {
      edge.data = { ...edge.data, description: data.description }
    }
  } else if (pendingConnection.value) {
    // Crear nueva
    const sigType = getSignalTypeForPort(pendingConnection.value.sourceHandle!)
    addEdges([{
      id: data.id,
      source: pendingConnection.value.source,
      sourceHandle: pendingConnection.value.sourceHandle,
      target: pendingConnection.value.target,
      targetHandle: pendingConnection.value.targetHandle,
      type: 'custom',
      data: { description: data.description, type: sigType }
    }])
  }
  showRelationModal.value = false
  pendingConnection.value = null
  editingEdgeId.value = null
}

onNodeDoubleClick(({ node }) => {
  const machineId = node.data.machineId
  if (!machineId) return

  runWithGuard(() => {
    const selectionId = `pim-m-${machineId}`
    analysisStore.selectedNodeId = selectionId
    store.selectedNodeId = selectionId
    store.visualizerMode = '2D'
  })
})

const handleEditEdge = (edgeId: string) => {
  const edge = edges.value.find(e => e.id === edgeId)
  if (!edge) return

  editingEdgeId.value = edge.id
  modalEditMode.value = true
  sourcePortLabel.value = getPortLabel(edge.sourceHandle!)
  destPortLabel.value = getPortLabel(edge.targetHandle!)
  initialRelationData.value = { id: edge.id, description: edge.data?.description || '' }
  showRelationModal.value = true
}

const handleRequestDeleteEdge = (edgeId: string) => {
  edgeIdToDelete.value = edgeId
  showDeleteConfirmModal.value = true
}

const confirmDeleteEdge = () => {
  if (edgeIdToDelete.value) {
    removeEdges(edgeIdToDelete.value)
    edgeIdToDelete.value = null
  }
  showDeleteConfirmModal.value = false
}

const handleSave = () => {
  showSaveConfirmModal.value = true
}

const executeSave = async () => {
  showSaveConfirmModal.value = false
  const result = await store.updatePimRelations(getCurrentRelationsJson())
  if (result.success) {
    snapshotRelations.value = getCurrentRelationsJson()
    setUnsavedState(false)
    return true
  }
  return false
}

// Observar cambios en el documento de relaciones (para capturar podas automáticas)
watch(() => store.parsedPimRelations, () => {
  // Solo reinicializamos si no hay cambios locales pendientes, 
  // o si el cambio viene del servidor (poda)
  if (!isDirty.value) {
    initializeGraph()
  }
}, { deep: true })

onMounted(initializeGraph)
onBeforeUnmount(() => {
  setUnsavedState(false)
})
</script>

<template>
  <div class="pim-relations-visual-editor w-full h-full relative bg-geist-accents-1/30">
    <VueFlow
      id="pim-relations-flow"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :is-valid-connection="isValidConnection"
      fit-view-on-init
      class="relations-flow"
    >
      <Background :pattern-color="'rgba(0,0,0,0.05)'" :gap="20" />
      <Controls />
      
      <!-- Slot personalizado para aristas para capturar eventos de sus botones -->
      <template #edge-custom="edgeProps">
        <PimCustomEdge 
          v-bind="edgeProps" 
          @edit-edge="handleEditEdge"
          @delete-edge="handleRequestDeleteEdge"
        />
      </template>
      
      <div class="absolute top-4 right-4 z-10 flex gap-2">
         <button 
           @click="handleSave"
           :disabled="!isDirty"
           class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
           :class="isDirty 
             ? 'bg-geist-fg text-geist-bg hover:scale-105 active:scale-95' 
             : 'bg-geist-accents-2 text-geist-accents-4 cursor-not-allowed opacity-50'"
         >
           <i class="fa-solid fa-cloud-arrow-up"></i>
           Guardar Cambios
         </button>
      </div>
    </VueFlow>

    <PimRelationModal
      :show="showRelationModal"
      :title="modalEditMode ? 'Editar Relación' : 'Nueva Relación PIM'"
      :confirm-text="modalEditMode ? 'Actualizar' : 'Crear Relación'"
      :source-label="sourcePortLabel"
      :destination-label="destPortLabel"
      :initial-data="initialRelationData"
      @close="showRelationModal = false"
      @confirm="handleConfirmRelation"
    />

    <!-- Confirmación de Borrado de Relación -->
    <GenericConfirmDeleteModal
      :show="showDeleteConfirmModal"
      item-name="esta relación entre máquinas"
      @close="showDeleteConfirmModal = false"
      @confirm="confirmDeleteEdge"
    />

    <!-- Confirmación de Guardado -->
    <GenericConfirmSaveModal
      :show="showSaveConfirmModal"
      @close="showSaveConfirmModal = false"
      @confirm="executeSave"
    />
  </div>
</template>

<style scoped>
.pim-relations-visual-editor {
  flex: 1;
  min-height: 0;
}
.relations-flow {
  background-color: transparent;
}
:deep(.vue-flow__edge-path) {
  stroke-width: 2.5;
  transition: stroke 0.3s ease;
}
:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: var(--color-geist-fg) !important;
}
</style>
