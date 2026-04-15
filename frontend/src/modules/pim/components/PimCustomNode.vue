<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { computed } from 'vue'
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

const metadata = computed(() => PIM_NODE_METADATA[props.data.type] || {
  icon: 'fa-question',
  colorClass: 'text-geist-accents-4',
  label: 'Desconocido',
  inputs: [],
  outputs: []
})

const modifiableParams = computed(() => PIM_MODIFIABLE_PARAMS[props.data.type] || [])

/**
 * Entradas del nodo: entradas de audio fijas + parámetros modulables.
 * Los parámetros modulables solo generan handle si isModifiable !== false.
 */
const allInputs = computed(() => {
  const audioInputs = metadata.value.inputs.map(p => ({ ...p, isMod: false }))
  
  // Filtrar handles de modulación por isModifiable
  const modInputs = modifiableParams.value
    .filter(pName => {
      const param = props.data.parameters?.[pName]
      // Si el parámetro es un objeto con isModifiable, respetar su valor
      if (param && typeof param === 'object' && 'isModifiable' in param) {
        return param.isModifiable === true
      }
      // Si es un valor primitivo (editor simplificado), usar el flag global
      const isModFlag = props.data.parameters?._isModifiable
      if (isModFlag && typeof isModFlag === 'object') {
        return isModFlag[pName] !== false
      }
      return true // Por defecto, es modulable
    })
    .map(pName => ({
      id: pName,
      name: pName,
      type: 'modification' as const,
      position: 'left' as const,
      isInput: true,
      isMod: true
    }))
  return [...audioInputs, ...modInputs]
})

/**
 * Salidas del nodo (siempre visibles si el nodo tiene outputs definidos).
 */
const allOutputs = computed(() => {
  return metadata.value.outputs.map(p => ({ ...p, isMod: false }))
})

/**
 * Calcula el alto mínimo del nodo en función del número de handles.
 */
const nodeMinHeight = computed(() => {
  const maxHandles = Math.max(allInputs.value.length, allOutputs.value.length, 1)
  // Cabecera ~48px + 28px por cada handle
  return 48 + maxHandles * 28
})

const getHandleColor = (type: string) => {
  return type === 'audio' ? '#e11d48' : '#10b981'
}
</script>

<template>
  <div 
    class="pim-custom-node relative rounded-xl border-2 transition-all duration-300 min-w-[180px]"
    :class="[
      data.isValid === false 
        ? 'border-geist-error bg-geist-error/5 shadow-lg shadow-geist-error/10' 
        : 'border-geist-border bg-geist-bg shadow-sm hover:shadow-md'
    ]"
    :style="{ minHeight: `${nodeMinHeight}px` }"
  >
    <!-- Cabecera del nodo -->
    <div class="flex items-center gap-3 px-4 py-3 border-b border-geist-border/50">
      <div 
        class="w-8 h-8 rounded-lg flex items-center justify-center border border-geist-border shadow-inner flex-shrink-0"
        :class="metadata.colorClass.replace('text-', 'bg-') + '/10'"
      >
        <i :class="['fa-solid', metadata.icon, metadata.colorClass, 'text-base']"></i>
      </div>
      
      <div class="flex flex-col min-w-0">
        <span class="text-[11px] font-bold text-geist-fg truncate uppercase tracking-wider">
          {{ data.name }}
        </span>
        <span class="text-[8px] text-geist-accents-4 font-mono">
          {{ metadata.label }}
        </span>
      </div>
    </div>

    <!-- Zona de Handles -->
    <div class="flex justify-between px-1 py-1">
      <!-- Columna Izquierda: Entradas -->
      <div class="flex flex-col gap-0.5">
        <div 
          v-for="input in allInputs" 
          :key="input.id" 
          class="relative flex items-center h-[26px]"
        >
          <Handle
            :id="input.id"
            type="target"
            :position="Position.Left"
            class="!absolute !left-0 !translate-x-[-50%]"
            :style="{
              backgroundColor: getHandleColor(input.type),
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }"
          />
          <span 
            class="ml-3 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-tight whitespace-nowrap"
            :class="input.isMod ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'"
          >
            {{ input.name }}
          </span>
        </div>
      </div>

      <!-- Columna Derecha: Salidas -->
      <div class="flex flex-col gap-0.5 items-end">
        <div 
          v-for="output in allOutputs" 
          :key="output.id" 
          class="relative flex items-center justify-end h-[26px]"
        >
          <span 
            class="mr-3 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-tight whitespace-nowrap"
            :class="output.type === 'modification' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'"
          >
            {{ output.name }}
          </span>
          <!-- Handle de salida con forma de flecha (triángulo) -->
          <Handle
            :id="output.id"
            type="source"
            :position="Position.Right"
            class="!absolute !right-0 !translate-x-[50%] output-arrow-handle"
            :style="{
              backgroundColor: 'transparent',
              width: '0',
              height: '0',
              borderRadius: '0',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: `10px solid ${getHandleColor(output.type)}`,
              boxShadow: 'none',
              border: 'none'
            }"
          />
          <!-- Flecha SVG superpuesta para la representación visual -->
          <div 
            class="absolute right-0 translate-x-[50%] pointer-events-none"
            :style="{ color: getHandleColor(output.type) }"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M2 1 L12 7 L2 13 Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de Error -->
    <div v-if="data.isValid === false" class="absolute -top-2 -right-2">
      <div class="bg-geist-error text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-bounce">
        <i class="fa-solid fa-exclamation text-[10px]"></i>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pim-custom-node {
  background-image: linear-gradient(135deg, transparent, rgba(var(--color-geist-accents-1-rgb), 0.05));
}

/* El handle de salida es invisible (lo reemplaza la flecha SVG),
   pero sigue siendo interactivo para las conexiones */
.output-arrow-handle {
  opacity: 0;
  width: 14px !important;
  height: 14px !important;
}

:deep(.vue-flow__handle) {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

:deep(.vue-flow__handle:hover) {
  transform: scale(1.4);
}
</style>
