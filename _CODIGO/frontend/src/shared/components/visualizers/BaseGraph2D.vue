<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { VueFlow, useVueFlow, Position, Handle } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import FlowDraggableEdge from '@/modules/projects/components/FlowDraggableEdge.vue'

// Importar estilos necesarios
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

interface Props {
  nodes: any[]
  edges: any[]
  legend?: { color: string, label: string }[]
  edgeLegend?: { color: string, label: string, dashed?: boolean }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'node-click', node: any): void
  (e: 'node-double-click', node: any): void
  (e: 'edge-click', edge: any): void
  (e: 'pane-click'): void
}>()

const localNodes = ref<any[]>([])
const localEdges = ref<any[]>([])
const selectedNodeId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)

const { onPaneReady, fitView, onNodeClick, onNodeDoubleClick, onPaneClick, onEdgeClick } = useVueFlow()

/**
 * Aplica el efecto de atenuación (dimming) a los elementos no relacionados.
 */
const applyDimming = () => {
  const nodeId = selectedNodeId.value
  const edgeId = selectedEdgeId.value

  if (!nodeId && !edgeId) {
    localNodes.value = localNodes.value.map(n => ({ ...n, style: { ...n.style, opacity: 1 } }))
    localEdges.value = localEdges.value.map(e => ({ ...e, style: { ...e.style, opacity: 1 } }))
    return
  }

  const relatedNodeIds = new Set<string>()
  const relatedEdgeIds = new Set<string>()

  if (nodeId) {
    relatedNodeIds.add(nodeId)
    localEdges.value.forEach(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        relatedNodeIds.add(edge.source)
        relatedNodeIds.add(edge.target)
        relatedEdgeIds.add(edge.id)
      }
    })
  } else if (edgeId) {
    const edge = localEdges.value.find(e => e.id === edgeId)
    if (edge) {
      relatedEdgeIds.add(edge.id)
      relatedNodeIds.add(edge.source)
      relatedNodeIds.add(edge.target)
    }
  }

  localNodes.value = localNodes.value.map(n => ({
    ...n,
    style: { ...n.style, opacity: relatedNodeIds.has(n.id) ? 1 : 0.1 }
  }))

  localEdges.value = localEdges.value.map(e => ({
    ...e,
    style: { ...e.style, opacity: relatedEdgeIds.has(e.id) ? 1 : 0.1 }
  }))
}

onNodeClick(({ node }) => {
  selectedEdgeId.value = null
  selectedNodeId.value = selectedNodeId.value === node.id ? null : node.id
  applyDimming()
  emit('node-click', node)
})

onNodeDoubleClick(({ node }) => {
  emit('node-double-click', node)
})

onEdgeClick(({ edge }) => {
  selectedNodeId.value = null
  selectedEdgeId.value = selectedEdgeId.value === edge.id ? null : edge.id
  applyDimming()
  emit('edge-click', edge)
})

onPaneClick(() => {
  selectedNodeId.value = null
  selectedEdgeId.value = null
  applyDimming()
  emit('pane-click')
})

onPaneReady(() => {
  fitView()
})

watch(() => [props.nodes, props.edges], () => {
  localNodes.value = JSON.parse(JSON.stringify(props.nodes))
  localEdges.value = JSON.parse(JSON.stringify(props.edges))
  setTimeout(() => fitView(), 50)
}, { deep: true })

onMounted(() => {
  localNodes.value = JSON.parse(JSON.stringify(props.nodes))
  localEdges.value = JSON.parse(JSON.stringify(props.edges))
})
</script>

<template>
  <div class="base-graph-2d w-full h-full relative bg-geist-bg">
    <VueFlow
      :nodes="localNodes"
      :edges="localEdges"
      :default-viewport="{ x: 0, y: 0, zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="4"
      class="w-full h-full"
    >
      <Background pattern-color="#333" :gap="20" />
      <Controls position="top-left" />
      
      <!-- Slot para Nodos Personalizados -->
      <template #node-custom="nodeProps">
        <slot name="node" v-bind="nodeProps">
          <div 
            class="flex items-center justify-center pointer-events-auto"
            :style="(nodeProps as any).style"
          >
            <span class="px-4 py-0">{{ (nodeProps as any).data.name }}</span>
            <Handle type="target" :position="Position.Top" class="!opacity-0 !pointer-events-none" style="top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1px; height: 1px" />
            <Handle type="source" :position="Position.Bottom" class="!opacity-0 !pointer-events-none" style="top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1px; height: 1px" />
          </div>
        </slot>
      </template>

      <!-- Slot para Aristas Personalizadas -->
      <template #edge-draggable="edgeProps">
        <FlowDraggableEdge v-bind="edgeProps" />
      </template>
    </VueFlow>

    <!-- Overlay de Leyenda -->
    <div v-if="legend || edgeLegend" class="absolute bottom-4 left-4 flex items-center gap-6 pointer-events-none opacity-60 hover:opacity-100 transition-opacity z-10">
      <div v-for="item in legend" :key="item.label" class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full" :style="{ background: item.color, boxShadow: `0 0 8px ${item.color}` }"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">{{ item.label }}</span>
      </div>
      
      <div v-if="legend && edgeLegend" class="h-3 w-px bg-geist-accents-2 mx-1"></div>
      
      <div v-for="item in edgeLegend" :key="item.label" class="flex items-center gap-2">
        <div class="w-4 h-0 border-t-2" :style="{ borderColor: item.color, borderStyle: item.dashed ? 'dashed' : 'solid' }"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<style>
.vue-flow__edges { z-index: 5 !important; }
.vue-flow__nodes { z-index: 10 !important; }
.vue-flow__node { padding: 0; border: none; background: transparent; }
.vue-flow__handle { width: 6px; height: 6px; background: #666; }
.vue-flow__edge-path { stroke-linecap: round; }

.vue-flow__controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.vue-flow__controls-button {
  fill: #fff;
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.vue-flow__controls-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
