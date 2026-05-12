<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { computed } from 'vue'
import { usePimStore } from '../stores/pimStore'

interface RelationsMachineNodeData {
  machineId: number
}

const props = defineProps<NodeProps<RelationsMachineNodeData>>()
const store = usePimStore()

const machineDoc = computed(() => store.parsedDocs[props.data.machineId])

/**
 * Escanea la máquina PIM para encontrar todos los puertos externalizados.
 */
const externalPorts = computed(() => {
  const inputs: any[] = []
  const outputs: any[] = []
  
  const doc = machineDoc.value
  if (!doc) return { inputs, outputs }

  doc.nodes?.forEach((node: any) => {
    if (!node) return
    const nodeName = node.name || 'Nodo'
    const isModNode = node.type === 'lfo' || node.type === 'envelope'

    // 1. Revisar propiedades para encontrar parámetros externalizados
    Object.entries(node).forEach(([key, val]: [string, any]) => {
      if (['id', 'name', 'type', 'description', 'ids_references', 'others'].includes(key)) return

      if (val && typeof val === 'object') {
        const isAudioPort = (key.startsWith('output') || key.startsWith('input_')) && !isModNode
        const signalType = isAudioPort ? 'audio' : 'modification'

        if (val.isExternalInput) {
          inputs.push({ id: val.id, label: `${nodeName} - ${key}`, signalType })
        }
        if (val.isExternalOutput) {
          outputs.push({ id: val.id, label: `${nodeName} - ${key}`, signalType })
        }
      }
    })

    // 2. Revisar la lista 'others'
    if (Array.isArray(node.others)) {
      node.others.forEach((o: any) => {
        // En 'others' solemos tener parámetros de control (modificación)
        const signalType = 'modification'
        if (o.isExternalInput) {
          inputs.push({ id: o.id, label: `${nodeName} - ${o.name}`, signalType })
        }
        if (o.isExternalOutput) {
          outputs.push({ id: o.id, label: `${nodeName} - ${o.name}`, signalType })
        }
      })
    }
  })

  return { inputs, outputs }
})

const nodeMinHeight = computed(() => {
  const maxHandles = Math.max(externalPorts.value.inputs.length, externalPorts.value.outputs.length, 1)
  return 40 + maxHandles * 20 + 10
})
</script>

<template>
  <div 
    class="pim-relations-machine-node rounded-xl border border-geist-border bg-geist-bg shadow-sm transition-all duration-300 min-w-[180px]"
    :style="{ 
      minHeight: `${nodeMinHeight}px`,
      boxShadow: selected ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : undefined,
      borderColor: selected ? 'var(--color-geist-border-hover)' : undefined
    }"
  >
    <!-- Cabecera -->
    <div class="px-3 py-2 border-b border-geist-border/50 bg-geist-accents-1 rounded-t-xl">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-microchip text-geist-accents-4 text-xs"></i>
        <span class="text-[10px] font-bold text-geist-fg truncate uppercase tracking-widest">
          {{ machineDoc?.name || 'Cargando...' }}
        </span>
      </div>
    </div>

    <!-- Contenido -->
    <div class="p-2 flex justify-between gap-4">
      <!-- Entradas -->
      <div class="flex flex-col gap-2 flex-1">
        <div 
          v-for="input in externalPorts.inputs" 
          :key="input.id" 
          class="relative flex items-center h-[16px] group"
        >
          <Handle
            :id="input.id"
            type="target"
            :position="Position.Left"
            :class="input.signalType === 'audio' ? '!bg-rose-500' : '!bg-emerald-500'"
            class="!absolute !left-0 !translate-x-[-100%] !w-2 !h-2 !border-2 !border-white !rounded-full group-hover:!scale-125 transition-transform"
          />
          <span class="text-[7px] text-geist-accents-5 font-medium truncate pl-1">
            {{ input.label }}
          </span>
        </div>
      </div>

      <!-- Salidas -->
      <div class="flex flex-col gap-2 flex-1 items-end text-right">
        <div 
          v-for="output in externalPorts.outputs" 
          :key="output.id" 
          class="relative flex items-center h-[16px] group justify-end"
        >
          <span class="text-[7px] text-geist-accents-5 font-medium truncate pr-1">
            {{ output.label }}
          </span>
          <Handle
            :id="output.id"
            type="source"
            :position="Position.Right"
            :class="output.signalType === 'audio' ? '!bg-rose-500' : '!bg-emerald-500'"
            class="!absolute !right-0 !translate-x-[100%] !w-2 !h-2 !border-2 !border-white !rounded-full group-hover:!scale-125 transition-transform"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pim-relations-machine-node {
  background-image: radial-gradient(circle at top left, rgba(var(--color-geist-accents-1-rgb), 0.3), transparent);
}
:deep(.vue-flow__handle) {
  cursor: crosshair;
}
</style>
