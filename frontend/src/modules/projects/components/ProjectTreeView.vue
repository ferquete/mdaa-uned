<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import TreeNode from '@/modules/projects/components/TreeNode.vue'
import GenericAddEditModal from '@/shared/components/modals/GenericAddEditModal.vue'
import GenericConfirmDeleteModal from '@/shared/components/modals/GenericConfirmDeleteModal.vue'
import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'

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
const route = useRoute()
const { runWithGuard } = useUnsavedChanges()

const showAddModal = ref(false)
const showDeleteModal = ref(false)
const pendingParentId = ref<string | number | null>(null)
const nodeToDelete = ref<TreeNodeType | null>(null)
const nodeToEdit = ref<any | null>(null)
const deleteWarningDetails = ref<string[]>([])

const projectId = computed(() => Number(route.params.id))

const treeData = computed<TreeNodeType[]>(() => [
  {
    id: 'root',
    text: 'Proyecto Actual',
    icon: 'fa-solid fa-folder-open',
    open: true,
    children: [
      { 
        id: 'analisis', 
        text: 'Análisis', 
        icon: 'fa-solid fa-microscope',
        open: true,
        showAdd: analysisStore.machines.length < 10,
        children: analysisStore.machines.map(m => {
          const doc = analysisStore.parsedDocs[m.id];
          const children: TreeNodeType[] = [];

          if (!doc) {
            return {
              id: m.id,
              text: m.name,
              icon: 'fa-solid fa-microchip',
              canDelete: true,
              canEdit: true,
              children: []
            };
          }

          children.push({
            id: `m-${m.id}-generators`,
            text: 'Generadores',
            icon: 'fa-solid fa-volume-high',
            showAdd: true,
            children: doc.generators.map(g => ({
              id: `m-${m.id}-g-${g.id}`,
              text: g.name,
              icon: 'fa-solid fa-wave-square',
              canDelete: true
            }))
          });

          children.push({
            id: `m-${m.id}-modificators`,
            text: 'Modificadores',
            icon: 'fa-solid fa-sliders',
            showAdd: true,
            children: doc.modificators.map(mod => ({
              id: `m-${m.id}-mod-${mod.id}`,
              text: mod.name,
              icon: 'fa-solid fa-wand-magic-sparkles',
              canDelete: true
            }))
          });

          return {
            id: m.id,
            text: m.name,
            icon: 'fa-solid fa-microchip',
            canDelete: true,
            canEdit: true,
            children
          };
        })
      },
      { id: 'diseno', text: 'Diseño', icon: 'fa-solid fa-pen-nib' },
      { id: 'implementacion', text: 'Implementación', icon: 'fa-solid fa-code' },
    ]
  }
])

const checkRawEditing = () => {
  if (analysisStore.isRawEditing) {
    alert('No se puede modificar la estructura del proyecto mientras se edita el JSON raw. Por favor, cambia a la vista 2D primero.')
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
  } else if (typeof parentId === 'string' && parentId.startsWith('m-')) {
    const parts = parentId.split('-');
    if (parts.length === 3 && (parts[2] === 'generators' || parts[2] === 'modificators')) {
      const machineId = Number(parts[1]);
      const type = parts[2] === 'generators' ? 'g' : 'mod';
      runWithGuard(() => {
        analysisStore.selectNewSubNode(machineId, type);
      })
    }
  }
}

const handleEditNode = (node: TreeNodeType) => {
  const machine = analysisStore.machines.find(m => m.id === node.id)
  if (machine) {
    nodeToEdit.value = machine
    showAddModal.value = true
  }
}

const confirmAddNode = async (name: string, description: string) => {
  if (nodeToEdit.value) {
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
      await analysisStore.deleteMachine(Number(id));
    } else if (typeof id === 'string' && id.startsWith('m-')) {
      const parts = id.split('-');
      if (parts.length >= 4) {
        const machineId = Number(parts[1]);
        const type = parts[2] as 'g' | 'mod';
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
  })
}

defineExpose({ editNode: handleEditNode })
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
      :title="nodeToEdit ? 'Editar Análisis de Módulo Sintetizador' : 'Nuevo Análisis de Módulo Sintetizador'"
      entity-label="Análisis de Módulo Sintetizador"
      :confirm-text="nodeToEdit ? 'Guardar Cambios' : 'Crear Análisis de Módulo'"
      :existing-names="analysisStore.machines.map(m => m.name)"
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
  </div>
</template>

<style scoped>
.project-tree-wrapper { border-right: 1px solid var(--color-geist-border); }
.tree-root { display: flex; flex-direction: column; gap: 2px; }
</style>
