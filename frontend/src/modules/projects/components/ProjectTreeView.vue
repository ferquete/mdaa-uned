<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import TreeNode from '@/modules/projects/components/TreeNode.vue'
import GenericAddEditModal from '@/shared/components/modals/GenericAddEditModal.vue'
import GenericConfirmDeleteModal from '@/shared/components/modals/GenericConfirmDeleteModal.vue'
import GenericAlertModal from '@/shared/components/modals/GenericAlertModal.vue'
import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore'
import { usePimStore } from '@/modules/pim/stores/pimStore'
import { useProjectStore } from '@/modules/projects/stores/projectStore'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { onMounted } from 'vue'

interface TreeNodeType {
  id: string | number
  text: string
  children?: TreeNodeType[]
  icon?: string
  open?: boolean
  showAdd?: boolean
  canDelete?: boolean
  canEdit?: boolean
}

const analysisStore = useAnalysisMachinesStore()
const pimStore = usePimStore()
const projectStore = useProjectStore()
const route = useRoute()
const { runWithGuard } = useUnsavedChanges()

const projectName = ref('Cargando...')

const showAddModal = ref(false)
const showDeleteModal = ref(false)
const pendingParentId = ref<string | number | null>(null)
const nodeToDelete = ref<TreeNodeType | null>(null)
const nodeToEdit = ref<any | null>(null)
const deleteWarningDetails = ref<string[]>([])

// Estado para alertas genéricas
const showAlert = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')
const alertType = ref<'warning' | 'error' | 'info'>('warning')

const projectId = computed(() => Number(route.params.id))

const modalDescMinLength = computed(() => {
  return nodeToEdit.value?.id === 'analisis' ? 1 : 10
})

const treeData = computed<TreeNodeType[]>(() => [
  {
    id: 'root',
    text: projectName.value,
    icon: 'fa-solid fa-folder-open',
    open: true,
    children: [
      { 
        id: 'analisis', 
        text: 'Análisis', 
        icon: 'fa-solid fa-microscope',
        open: true,
        children: analysisStore.machines.map(m => {
          const doc = analysisStore.parsedDocs[m.id];
          const children: TreeNodeType[] = [];

          if (!doc) {
            return {
              id: m.id,
              text: 'Cargando...',
              icon: 'fa-solid fa-microchip',
              canEdit: true,
              children: []
            };
          }

          const elNodes: TreeNodeType[] = doc.elements.map(e => ({
            id: `m-${m.id}-el-${e.id}`,
            text: e.name,
            icon: 'fa-solid fa-cube'
          }));

          children.push(...elNodes);

          return {
            id: m.id,
            text: doc.name,
            icon: 'fa-solid fa-microchip',
            canEdit: true,
            children
          };
        })
      },
      {
        id: 'diseno', 
        text: 'Diseño Conceptual', 
        icon: 'fa-solid fa-pen-nib',
        open: true,
        children: pimStore.machines.map(m => {
          const doc = pimStore.parsedDocs[m.id];
          return {
            id: `pim-m-${m.id}`,
            text: doc?.name || `Máquina PIM ${m.id}`,
            icon: 'fa-solid fa-microchip',
            canEdit: false
          };
        })
      },
      { 
        id: 'implementacion', 
        text: 'Implementación', 
        icon: 'fa-solid fa-code',
        disabled: pimStore.machines.length === 0
      },
    ]
  }
])

const checkRawEditing = () => {
  if (analysisStore.isRawEditing) {
    alertTitle.value = 'Edición en Curso'
    alertMessage.value = 'No se puede modificar la estructura del proyecto mientras se edita el JSON raw. Por favor, cambia a la vista 2D primero.'
    alertType.value = 'warning'
    showAlert.value = true
    return true
  }
  return false
}

const handleAddChild = (parentId: string | number) => {
  if (checkRawEditing()) return

  if (parentId === 'analisis') {
    pendingParentId.value = parentId
    nodeToEdit.value = null
    showAddModal.value = true
  }
}

const handleEditNode = (node: TreeNodeType) => {
  const machine = analysisStore.machines.find(m => m.id === node.id)
  const doc = analysisStore.parsedDocs[Number(node.id)]
  if (machine && doc) {
    nodeToEdit.value = { ...machine, name: doc.name, description: doc.description }
    showAddModal.value = true
  }
}

/**
 * Método expuesto para disparar el modal de edición desde el exterior.
 */
const editNode = (node: any) => {
  if (node.id === 'analisis') {
    const cim = analysisStore.currentCim
    const relations = analysisStore.parsedCimRelations
    if (cim && relations) {
      // Para el CIM, el "name" es fijo, solo editamos descripción
      nodeToEdit.value = { id: 'analisis', name: 'Análisis del Proyecto', description: relations.description || '' }
      showAddModal.value = true
    }
  } else {
    handleEditNode(node as TreeNodeType)
  }
}

defineExpose({ editNode })

const confirmAddNode = async (name: string, description: string) => {
  if (nodeToEdit.value?.id === 'analisis') {
    const newRelations = { ...analysisStore.parsedCimRelations, description }
    await analysisStore.updateCimRelations(JSON.stringify(newRelations))
  } else if (nodeToEdit.value) {
    await analysisStore.updateMachine(nodeToEdit.value.id, name, description)
  } else if (pendingParentId.value === 'analisis' && projectId.value) {
    await analysisStore.addMachine(projectId.value, name, description)
  }
  
  showAddModal.value = false
}

const handleDeleteNode = (node: TreeNodeType) => {
  if (checkRawEditing()) return

  nodeToDelete.value = node
  deleteWarningDetails.value = []

  // Si es una máquina, avisamos sobre sus relaciones CIM
  if (typeof node.id === 'number' || (typeof node.id === 'string' && !isNaN(Number(node.id)))) {
    const relCount = analysisStore.getMachineRelationsCount(Number(node.id))
    if (relCount > 0) {
      deleteWarningDetails.value.push(`Se eliminarán ${relCount} relaciones de esta máquina en el Análisis (CIM)`)
    }
  }

  // Si es un sub-nodo, buscamos si tiene referencias
  if (typeof node.id === 'string' && node.id.startsWith('m-')) {
    const parts = node.id.split('-')
    if (parts.length >= 4) {
      const machineId = Number(parts[1])
      const subId = parts.slice(3).join('-')
      deleteWarningDetails.value = analysisStore.getSubNodeReferences(machineId, subId)
    }
  }

  showDeleteModal.value = true
}

const confirmDeleteNode = async () => {
  if (nodeToDelete.value) {
    const id = nodeToDelete.value.id;
    if (typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id)))) {
      const result = await analysisStore.deleteMachine(Number(id));
      if (!result.success) {
        alertTitle.value = 'Error al Eliminar'
        alertMessage.value = result.message || 'No se pudo eliminar la máquina'
        alertType.value = 'error'
        showAlert.value = true
      }
    } else if (typeof id === 'string' && id.startsWith('m-')) {
      const parts = id.split('-');
      if (parts.length >= 4) {
        const machineId = Number(parts[1]);
        const type = parts[2] as 'el';
        const subId = parts.slice(3).join('-');
        await analysisStore.deleteSubNode(machineId, subId, type);
      }
    }
    showDeleteModal.value = false
    nodeToDelete.value = null
  }
}

const handleSelect = (node: TreeNodeType) => {
  runWithGuard(() => {
    analysisStore.selectNode(node.id)
    if (String(node.id).startsWith('pim-m-') || node.id === 'diseno') {
      pimStore.selectNode(node.id)
    } else {
      pimStore.selectNode(null)
    }
  })
}

onMounted(async () => {
  if (projectId.value) {
    const project = await projectStore.fetchProjectById(projectId.value)
    if (project) {
      projectName.value = project.name
    } else {
      projectName.value = 'Proyecto no encontrado'
    }
  }
})
</script>

<template>
  <div class="project-tree-wrapper p-4 bg-geist-bg h-full select-none overflow-y-auto">
    <div class="mb-6 px-2">
      <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-geist-accents-4 mb-1">Explorador</h3>
      <div class="h-px w-full bg-geist-border"></div>
    </div>

    <div class="tree-root">
      <TreeNode 
        v-for="node in treeData" 
        :key="node.id" 
        :node="node" 
        :level="0" 
        :show-add-button="node.showAdd"
        :selected-id="analysisStore.selectedNodeId"
        @add-child="handleAddChild"
        @select="handleSelect"
        @delete-node="handleDeleteNode"
        @edit-node="handleEditNode"
      />
    </div>

    <!-- Modales Generales -->
    <GenericAddEditModal
      :show="showAddModal"
      :title="nodeToEdit?.id === 'analisis' ? 'Editar Análisis del Proyecto' : (nodeToEdit ? 'Editar Máquina' : 'Nueva Máquina')"
      entity-label="Análisis"
      :confirm-text="nodeToEdit ? 'Guardar Cambios' : 'Crear'"
      :show-name-field="nodeToEdit?.id !== 'analisis'"
      :existing-names="analysisStore.machines.map(m => analysisStore.parsedDocs[m.id]?.name || '')"
      :desc-min-length="modalDescMinLength"
      :initial-data="nodeToEdit ? { name: nodeToEdit.name, description: nodeToEdit.description } : null"
      @close="showAddModal = false"
      @confirm="confirmAddNode"
    />

    <GenericConfirmDeleteModal
      :show="showDeleteModal"
      :item-name="nodeToDelete?.text"
      :extra-warnings="deleteWarningDetails"
      @close="showDeleteModal = false"
      @confirm="confirmDeleteNode"
    />

    <GenericAlertModal
      :show="showAlert"
      :title="alertTitle"
      :message="alertMessage"
      :type="alertType"
      @close="showAlert = false"
    />
  </div>
</template>

<style scoped>
.project-tree-wrapper { border-right: 1px solid var(--color-geist-border); }
.tree-root { display: flex; flex-direction: column; gap: 2px; }
</style>
