<script setup lang="ts">
import { Handle, Position, useNodeId, type NodeProps } from '@vue-flow/core'
import { computed, ref } from 'vue'
import { PIM_NODE_METADATA, PIM_MODIFIABLE_PARAMS } from '../utils/pim-node-metadata'

interface PimNodeData {
  label: string
  type: string
  name: string
  description?: string
  parameters?: any
  isValid?: boolean
}

const props = defineProps<NodeProps<PimNodeData>>()

const nodeId = useNodeId()
const isHovered = ref(false)

const metadata = computed(() => PIM_NODE_METADATA[props.data.type] || {
  icon: 'fa-question',
  colorClass: 'text-geist-accents-4',
  inputs: [],
  outputs: []
})

const modifiableParams = computed(() => PIM_MODIFIABLE_PARAMS[props.data.type] || [])

const allInputs = computed(() => {
  const audioInputs = metadata.value.inputs.map(p => ({ ...p, isMod: false }))
  const modInputs = modifiableParams.value.map(pName => ({
    id: pName,
    name: pName,
    type: 'modification',
    position: 'left',
    isInput: true,
    isMod: true
  }))
  return [...audioInputs, ...modInputs]
})

const allOutputs = computed(() => {
  return metadata.value.outputs.map(p => ({ ...p, isMod: false }))
})

const getHandleStyle = (type: string) => {
  return {
    backgroundColor: type === 'audio' ? '#e11d48' : '#10b981',
    width: '8px',
    height: '8px',
    border: '2px solid white'
  }
}
</script>

<template>
  <div 
    class="pim-custom-node relative px-4 py-3 rounded-xl border-2 transition-all duration-300 min-w-[160px]"
    :class="[
      data.isValid === false ? 'border-geist-error bg-geist-error/5 shadow-lg shadow-geist-error/10' : 'border-geist-border bg-geist-bg shadow-sm',
      isHovered ? 'shadow-md scale-[1.02]' : ''
    ]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Contenido Principal -->
    <div class="flex items-center gap-3">
      <div 
        class="w-9 h-9 rounded-lg flex items-center justify-center border border-geist-border shadow-inner"
        :class="metadata.colorClass.replace('text-', 'bg-') + '/10'"
      >
        <i :class="['fa-solid', metadata.icon, metadata.colorClass, 'text-lg']"></i>
      </div>
      
      <div class="flex flex-col min-w-0">
        <span class="text-[11px] font-bold text-geist-fg truncate uppercase tracking-wider">
          {{ data.name }}
        </span>
        <span class="text-[9px] text-geist-accents-4 font-mono">
          {{ metadata.label }}
        </span>
      </div>
    </div>

    <!-- Handles de Entrada (Izquierda) -->
    <div class="absolute left-0 top-0 bottom-0 flex flex-col justify-around py-4 -translate-x-1/2 w-4">
      <div v-for="input in allInputs" :key="input.id" class="relative group h-4 flex items-center">
        <Handle
          :id="input.id"
          type="target"
          :position="Position.Left"
          :style="getHandleStyle(input.type)"
          class="!static"
        />
        <!-- Label al hacer hover -->
        <transition name="fade">
          <div 
            v-if="isHovered"
            class="absolute left-3 px-2 py-0.5 rounded bg-geist-fg text-geist-bg text-[8px] font-bold uppercase whitespace-nowrap z-50 pointer-events-none shadow-sm"
          >
            {{ input.name }}
          </div>
        </transition>
      </div>
    </div>

    <!-- Handles de Salida (Derecha) -->
    <div class="absolute right-0 top-0 bottom-0 flex flex-col justify-around py-4 translate-x-1/2 w-4 items-end">
      <div v-for="output in allOutputs" :key="output.id" class="relative group h-4 flex items-center justify-end">
        <!-- Label al hacer hover -->
        <transition name="fade">
          <div 
            v-if="isHovered"
            class="absolute right-3 px-2 py-0.5 rounded bg-geist-fg text-geist-bg text-[8px] font-bold uppercase whitespace-nowrap z-50 pointer-events-none shadow-sm"
          >
            {{ output.name }}
          </div>
        </transition>
        <Handle
          :id="output.id"
          type="source"
          :position="Position.Right"
          :style="getHandleStyle(output.type)"
          class="!static"
        />
      </div>
    </div>

    <!-- Error Indicator -->
    <div v-if="data.isValid === false" class="absolute -top-2 -right-2">
      <div class="bg-geist-error text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-bounce">
        <i class="fa-solid fa-exclamation text-[10px]"></i>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pim-custom-node {
  background-image: linear-gradient(135deg, transparent, rgba(var(--color-geist-accents-1-rgb), 0.1));
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

.right-side .fade-enter-from, .right-side .fade-leave-to {
  transform: translateX(4px);
}

:deep(.vue-flow__handle) {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

:deep(.vue-flow__handle:hover) {
  transform: scale(1.5);
}
</style>
