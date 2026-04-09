<script setup lang="ts">
import { ref, computed } from 'vue'

interface TreeNodeType {
  id: string | number
  text: string
  icon?: string
  children?: TreeNodeType[]
  open?: boolean
  showAdd?: boolean
  canDelete?: boolean
  canEdit?: boolean
}

const props = defineProps<{
  node: TreeNodeType
  level: number
  showAddButton?: boolean
  selectedId?: string | number | null
}>()

const emit = defineEmits<{
  (e: 'add-child', nodeId: string | number): void
  (e: 'select', node: TreeNodeType): void
  (e: 'delete-node', node: TreeNodeType): void
  (e: 'edit-node', node: TreeNodeType): void
}>()

const isSelected = computed(() => props.node.id === props.selectedId)
const isOpen = ref(props.node.open ?? true)

const toggle = () => {
  if (props.node.children?.length) {
    isOpen.value = !isOpen.value
  }
}

const handleSelect = () => {
  emit('select', props.node)
}

const handleAddChild = (e: Event) => {
  e.stopPropagation()
  emit('add-child', props.node.id)
}

const handleDelete = (e: Event) => {
  e.stopPropagation()
  emit('delete-node', props.node)
}

const handleEdit = (e: Event) => {
  e.stopPropagation()
  emit('edit-node', props.node)
}

// Calculamos el desplazamiento del contenido basado en el nivel
const contentPadding = computed(() => `${props.level * 1}rem`)
// Posición de la línea de guía vertical corregida
const lineLeft = computed(() => `calc(${props.level * 1}rem - 0.5rem)`)
</script>

<template>
  <div class="tree-node w-full">
    <!-- Node Content -->
    <div 
      class="tree-node-content group flex items-center py-1.5 px-2 rounded-md transition-colors cursor-pointer w-full relative"
      :class="[isSelected ? 'bg-geist-accents-2' : 'hover:bg-geist-accents-1']"
      @click="handleSelect(); toggle()"
    >
      <!-- Vertical guide line (Trunk) -->
      <div 
        v-if="level > 0" 
        class="absolute top-0 bottom-0 w-px bg-geist-border group-hover:bg-geist-accents-3 transition-colors"
        :style="{ left: lineLeft }"
      ></div>
      
      <!-- Indented Content Wrapper -->
      <div class="flex items-center gap-2" :style="{ paddingLeft: contentPadding }">
        <!-- Toggle Arrow for parents -->
        <i 
          v-if="node.children?.length" 
          class="fa-solid fa-chevron-right text-[10px] transition-transform duration-200 opacity-40 group-hover:opacity-100"
          :class="{ 'rotate-90': isOpen }"
        ></i>
        
        <!-- Spacer for items without children to align with arrows -->
        <div v-else class="w-[10px]"></div>

        <!-- Icon -->
        <i 
          v-if="node.icon" 
          :class="[node.icon, 'text-[12px] opacity-60 group-hover:opacity-100 group-hover:text-geist-fg transition-all w-4 text-center']"
          :style="{ color: isSelected ? 'var(--color-geist-fg)' : 'inherit' }"
        ></i>
        
        <!-- Text -->
        <span 
          class="node-text text-sm font-mono font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis selection:bg-geist-accents-2"
          :class="{ '!text-geist-fg': isSelected }"
        >
          {{ node.text }}
        </span>
      </div>

      <!-- Action Buttons (Pushed to the far right) -->
      <div class="ml-auto flex items-center gap-1 pl-2">
        <!-- Edit Button -->
        <button 
          v-if="node.canEdit"
          class="flex items-center justify-center w-5 h-5 rounded-md hover:bg-geist-accents-2 text-geist-accents-5 transition-all border border-transparent hover:border-geist-accents-3 cursor-pointer"
          @click="handleEdit"
          title="Editar máquina"
        >
          <i class="fa-solid fa-pencil text-[10px]"></i>
        </button>

        <!-- Plus Button -->
        <button 
          v-if="showAddButton"
          class="flex items-center justify-center w-5 h-5 rounded-md hover:bg-geist-success/10 text-geist-success transition-all border border-transparent hover:border-geist-success/20 cursor-pointer"
          @click="handleAddChild"
          title="Añadir nueva máquina"
        >
          <i class="fa-solid fa-plus text-[10px]"></i>
        </button>

        <!-- Delete Button -->
        <button 
          v-if="node.canDelete"
          class="flex items-center justify-center w-5 h-5 rounded-md hover:bg-geist-error/10 text-geist-error transition-all border border-transparent hover:border-geist-error/20 cursor-pointer"
          @click="handleDelete"
          title="Eliminar máquina"
        >
          <i class="fa-solid fa-minus text-[10px]"></i>
        </button>

        <!-- Selection Indicator -->
        <div v-if="isSelected && !showAddButton && !node.canDelete && !node.canEdit" class="w-1.5 h-1.5 rounded-full bg-geist-fg"></div>
      </div>
    </div>

    <!-- Children (No extra padding here, indentation is handled by siblings' level) -->
    <div v-if="isOpen && node.children?.length" class="tree-children w-full">
      <TreeNode 
        v-for="child in node.children" 
        :key="child.id" 
        :node="child" 
        :level="level + 1" 
        :show-add-button="child.showAdd"
        :selected-id="selectedId"
        @add-child="$emit('add-child', $event)"
        @select="$emit('select', $event)"
        @delete-node="$emit('delete-node', $event)"
        @edit-node="$emit('edit-node', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-node-content {
  user-select: none;
}

.node-text {
  color: var(--color-geist-accents-5);
  transition: color 0.2s ease;
}

.tree-node-content:hover .node-text {
  color: var(--color-geist-fg);
}

.dark .node-text {
  color: var(--color-geist-accents-4);
}

.dark .tree-node-content:hover .node-text {
  color: var(--color-geist-fg);
}

.tree-children {
  position: relative;
}
</style>
