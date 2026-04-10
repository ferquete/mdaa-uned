<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import TreeNode from '@/modules/projects/components/TreeNode.vue'
import AddNodeModal from '@/modules/projects/components/AddNodeModal.vue'
import ConfirmDeleteModal from '@/modules/projects/components/ConfirmDeleteModal.vue'
import { useProjectStore } from '@/modules/projects/stores/projectStore'

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

const store = useProjectStore()
const route = useRoute()
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const pendingParentId = ref<string | number | null>(null)
const nodeToDelete = ref<TreeNodeType | null>(null)
const nodeToEdit = ref<any | null>(null)

// Extraemos el ID del proyecto de la ruta actual
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
        showAdd: store.machines.length < 10,
        children: store.machines.map(m => {
          const doc = store.parsedDocs[m.id];
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

          // Agrupación de Generadores
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

          // Agrupación de Modificadores
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

const handleAddChild = (parentId: string | number) => {
  if (parentId === 'analisis') {
    pendingParentId.value = parentId
    nodeToEdit.value = null
    showAddModal.value = true
  } else if (typeof parentId === 'string' && parentId.startsWith('m-')) {
    const parts = parentId.split('-');
    if (parts.length === 3 && (parts[2] === 'generators' || parts[2] === 'modificators')) {
      const machineId = Number(parts[1]);
      const type = parts[2] === 'generators' ? 'g' : 'mod';
      store.selectNewSubNode(machineId, type);
    }
  }
}

const handleEditNode = (node: TreeNodeType) => {
  const machine = store.machines.find(m => m.id === node.id)
  if (machine) {
    nodeToEdit.value = machine
    showAddModal.value = true
  }
}

const confirmAddNode = async (name: string, description: string) => {
  if (nodeToEdit.value) {
    await store.updateAnalysisNode(nodeToEdit.value.id, name, description)
  } else if (pendingParentId.value === 'analisis' && projectId.value) {
    await store.addAnalysisNode(projectId.value, name, description)
  }
  
  pendingParentId.value = null
  nodeToEdit.value = null
  showAddModal.value = false
}

const handleCloseAddModal = () => {
  showAddModal.value = false
  nodeToEdit.value = null
  pendingParentId.value = null
}

const handleDeleteNode = (node: TreeNodeType) => {
  nodeToDelete.value = node
  showDeleteModal.value = true
}

const confirmDeleteNode = async () => {
  if (nodeToDelete.value) {
    const id = nodeToDelete.value.id;
    if (typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id)))) {
      await store.deleteAnalysisNode(Number(id));
    } else if (typeof id === 'string' && id.startsWith('m-')) {
      const parts = id.split('-');
      if (parts.length >= 4) {
        const machineId = Number(parts[1]);
        const type = parts[2] as 'g' | 'mod';
        const subId = parts.slice(3).join('-');
        await store.deleteSubNode(machineId, subId, type);
      }
    }
    showDeleteModal.value = false
    nodeToDelete.value = null
  }
}

import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'

const { runWithGuard } = useUnsavedChanges()

const handleSelect = (node: TreeNodeType) => {
  // Integramos el Guard de "Unsaved Changes" en todas las navegaciones del árbol
  runWithGuard(() => {
    store.selectNode(node.id)
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

    <!-- Custom Tree View -->
    <div class="tree-root">
      <TreeNode 
        v-for="node in treeData" 
        :key="node.id" 
        :node="node" 
        :level="0" 
        :show-add-button="node.showAdd"
        :selected-id="store.selectedNodeId"
        @add-child="handleAddChild"
        @select="handleSelect"
        @delete-node="handleDeleteNode"
        @edit-node="handleEditNode"
      />
    </div>

    <!-- Modals -->
    <AddNodeModal 
      :show="showAddModal" 
      :existing-names="store.machines.map(m => m.name)"
      :initial-data="nodeToEdit ? { name: nodeToEdit.name, description: nodeToEdit.description } : null"
      @close="handleCloseAddModal" 
      @confirm="confirmAddNode"
    />

    <ConfirmDeleteModal 
      :show="showDeleteModal" 
      :item-name="nodeToDelete?.text" 
      @close="showDeleteModal = false" 
      @confirm="confirmDeleteNode"
    />
  </div>
</template>

<style scoped>
.project-tree-wrapper {
  border-right: 1px solid var(--color-geist-border);
}

.tree-root {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
