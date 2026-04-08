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
}

const store = useProjectStore()
const route = useRoute()
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const pendingParentId = ref<string | number | null>(null)
const nodeToDelete = ref<TreeNodeType | null>(null)

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
        children: store.machines.map(m => ({
          id: m.id,
          text: m.name,
          icon: 'fa-solid fa-cube',
          canDelete: true
        }))
      },
      { id: 'diseno', text: 'Diseño', icon: 'fa-solid fa-pen-nib' },
      { id: 'implementacion', text: 'Implementación', icon: 'fa-solid fa-code' },
    ]
  }
])

const handleAddChild = (parentId: string | number) => {
  if (parentId === 'analisis') {
    pendingParentId.value = parentId
    showAddModal.value = true
  }
}

const confirmAddNode = async (name: string) => {
  if (pendingParentId.value === 'analisis' && projectId.value) {
    await store.addAnalysisNode(projectId.value, name)
  }
  pendingParentId.value = null
  showAddModal.value = false
}

const handleDeleteNode = (node: TreeNodeType) => {
  nodeToDelete.value = node
  showDeleteModal.value = true
}

const confirmDeleteNode = async () => {
  if (nodeToDelete.value) {
    await store.deleteAnalysisNode(Number(nodeToDelete.value.id))
    showDeleteModal.value = false
    nodeToDelete.value = null
  }
}

const handleSelect = (node: TreeNodeType) => {
  // Solo permitimos seleccionar nodos hijos de análisis por ahora
  store.selectNode(node.id)
}
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
      />
    </div>

    <!-- Modals -->
    <AddNodeModal 
      :show="showAddModal" 
      :existing-names="store.machines.map(m => m.name)"
      @close="showAddModal = false" 
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
