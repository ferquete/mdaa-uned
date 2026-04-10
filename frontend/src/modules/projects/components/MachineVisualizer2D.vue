<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { VueFlow, useVueFlow, Position, Handle } from '@vue-flow/core'
import FlowDraggableEdge from './FlowDraggableEdge.vue'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { CimDocument } from '@/shared/types'

const props = defineProps<{
  machineJson: string
}>()

const nodes = ref<any[]>([])
const edges = ref<any[]>([])

const selectedNodeId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)
const { onPaneReady, fitView, onNodeClick, onPaneClick, onEdgeClick } = useVueFlow()

const transformJsonToElements = () => {
  try {
    const data: CimDocument = JSON.parse(props.machineJson || '{}')
    const generators = data.generators || []
    const modificators = data.modificators || []
    const allNodes = [...generators, ...modificators]

    const newNodes: any[] = []
    const newEdges: any[] = []

    const radius = Math.max(200, allNodes.length * 40)
    const centerX = 400
    const centerY = 300

    allNodes.forEach((node, index) => {
      const angle = (index / allNodes.length) * Math.PI * 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      const isGenerator = (node as any).$type === 'CimGenerator' || generators.includes(node as any)

      newNodes.push({
        id: node.id,
        label: node.name || node.id,
        position: { x, y },
        type: 'custom', // Usar tipo personalizado
        data: { 
          name: node.name || node.id,
          type: isGenerator ? 'generator' : 'modificator' 
        },
        style: {
          background: isGenerator ? 'var(--color-node-generator)' : 'var(--color-node-modificator)',
          color: '#fff',
          borderRadius: '100px',
          minWidth: '60px',
          minHeight: '60px',
          padding: '0 16px',
          width: 'auto',
          height: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          border: 'none',
          boxShadow: isGenerator 
            ? 'var(--shadow-node-generator)' 
            : 'var(--shadow-node-modificator)',
        },
      })
    })

    generators.forEach(gen => {
      if (gen.refs && Array.isArray(gen.refs)) {
        gen.refs.forEach((ref: any) => {
          const targetId = typeof ref === 'string' ? ref : ref?.id
          if (targetId && allNodes.some(n => n.id === targetId)) {
            newEdges.push({
              id: `e-${gen.id}-${targetId}-ref`,
              source: gen.id,
              target: targetId,
              type: 'draggable',
              data: { controlPoint: null },
              style: { stroke: 'var(--color-node-ref)', strokeWidth: 2, strokeDasharray: '5,5' },
              animated: true,
            })
          }
        })
      }
      if (gen.rels && Array.isArray(gen.rels)) {
        gen.rels.forEach((rel: any) => {
          const targetId = typeof rel === 'string' ? rel : rel?.id
          if (targetId && allNodes.some(n => n.id === targetId)) {
            newEdges.push({
              id: `e-${gen.id}-${targetId}-rel`,
              source: gen.id,
              target: targetId,
              type: 'draggable',
              data: { controlPoint: null },
              style: { stroke: 'var(--color-node-rel)', strokeWidth: 2, strokeDasharray: '5,5' },
              animated: true,
            })
          }
        })
      }
    })

    modificators.forEach(mod => {
      if (mod.refs && Array.isArray(mod.refs)) {
        mod.refs.forEach((ref: any) => {
          const targetId = typeof ref === 'string' ? ref : ref?.id
          if (targetId && allNodes.some(n => n.id === targetId)) {
            newEdges.push({
              id: `e-${mod.id}-${targetId}-ref`,
              source: mod.id,
              target: targetId,
              type: 'draggable',
              data: { controlPoint: null },
              style: { stroke: 'var(--color-node-ref)', strokeWidth: 2, strokeDasharray: '5,5' },
              animated: true,
            })
          }
        })
      }
    })

    nodes.value = newNodes
    edges.value = newEdges
    
    if (selectedNodeId.value) {
      applyDimming()
    }
  } catch (e) {
    console.error('Error parsing machine JSON in 2D visualizer:', e)
  }
}

const applyDimming = () => {
  const nodeId = selectedNodeId.value
  const edgeId = selectedEdgeId.value

  if (!nodeId && !edgeId) {
    // Reset opacity
    nodes.value = nodes.value.map(n => ({ ...n, style: { ...n.style, opacity: 1 } }))
    edges.value = edges.value.map(e => ({ ...e, style: { ...e.style, opacity: 1 } }))
    return
  }

  const relatedNodeIds = new Set<string>()
  const relatedEdgeIds = new Set<string>()

  if (nodeId) {
    relatedNodeIds.add(nodeId)
    edges.value.forEach(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        relatedNodeIds.add(edge.source)
        relatedNodeIds.add(edge.target)
        relatedEdgeIds.add(edge.id)
      }
    })
  } else if (edgeId) {
    const edge = edges.value.find(e => e.id === edgeId)
    if (edge) {
      relatedEdgeIds.add(edge.id)
      relatedNodeIds.add(edge.source)
      relatedNodeIds.add(edge.target)
    }
  }

  // Apply opacity
  nodes.value = nodes.value.map(n => ({
    ...n,
    style: { ...n.style, opacity: relatedNodeIds.has(n.id) ? 1 : 0.1 }
  }))

  edges.value = edges.value.map(e => ({
    ...e,
    style: { ...e.style, opacity: relatedEdgeIds.has(e.id) ? 1 : 0.1 }
  }))
}

// Eventos de interacción
onNodeClick(({ node }) => {
  selectedEdgeId.value = null
  selectedNodeId.value = selectedNodeId.value === node.id ? null : node.id
  applyDimming()
})

onEdgeClick(({ edge }) => {
  selectedNodeId.value = null
  selectedEdgeId.value = selectedEdgeId.value === edge.id ? null : edge.id
  applyDimming()
})

onPaneClick(() => {
  selectedNodeId.value = null
  selectedEdgeId.value = null
  applyDimming()
})

// Ejecutar fitView cuando el panel esté listo o cambien los elementos
onPaneReady(() => {
  fitView()
})

watch(() => props.machineJson, () => {
  transformJsonToElements()
  setTimeout(() => fitView(), 100)
})

onMounted(() => {
  transformJsonToElements()
})
</script>

<template>
  <div class="machine-2d-visualizer w-full h-full relative bg-geist-bg">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ x: 0, y: 0, zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="4"
      class="w-full h-full"
    >
      <Background pattern-color="#333" :gap="20" />
      <Controls position="top-left" />
      
      <!-- Nodo personalizado con anclajes periféricos -->
      <template #node-custom="props">
        <div 
          class="flex items-center justify-center pointer-events-auto"
          :style="(props as any).style"
        >
          <span class="px-4 py-0">{{ (props as any).data.name }}</span>
          
          <!-- Anclajes invisibles en los 4 costados -->
          <Handle type="target" :position="Position.Top" class="!opacity-0 !pointer-events-none" />
          <Handle type="source" :position="Position.Top" class="!opacity-0 !pointer-events-none" />
          
          <Handle type="target" :position="Position.Bottom" class="!opacity-0 !pointer-events-none" />
          <Handle type="source" :position="Position.Bottom" class="!opacity-0 !pointer-events-none" />
          
          <Handle type="target" :position="Position.Left" class="!opacity-0 !pointer-events-none" />
          <Handle type="source" :position="Position.Left" class="!opacity-0 !pointer-events-none" />
          
          <Handle type="target" :position="Position.Right" class="!opacity-0 !pointer-events-none" />
          <Handle type="source" :position="Position.Right" class="!opacity-0 !pointer-events-none" />
        </div>
      </template>

      <!-- Arista personalizada arrastrable -->
      <template #edge-draggable="edgeProps">
        <FlowDraggableEdge v-bind="edgeProps" />
      </template>

    </VueFlow>

    <!-- Overlay Indicators (Coherencia con 3D) -->
    <div class="absolute bottom-4 left-4 flex items-center gap-6 pointer-events-none opacity-60 hover:opacity-100 transition-opacity z-10">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-[#0070f3] rounded-full shadow-[0_0_8px_#0070f3]"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">Generadores</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-[#059669] rounded-full shadow-[0_0_8px_#059669]"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">Modificadores</span>
      </div>
      
      <div class="h-3 w-px bg-geist-accents-2 mx-1"></div>
      
      <div class="flex items-center gap-2">
        <div class="w-4 h-0 border-t-2 border-[#0070f3] border-dashed"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">rel</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-0 border-t-2 border-[#ff0000] border-dashed"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">ref</span>
      </div>
    </div>
  </div>
</template>

<style>
/* Required Vue Flow styles */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';

.vue-flow__edges {
  z-index: 5 !important;
}

.vue-flow__nodes {
  z-index: 10 !important;
}

.vue-flow__node {
  padding: 0;
  border: none;
  background: transparent;
}

.vue-flow__handle {
  width: 6px;
  height: 6px;
  background: #666;
}

.vue-flow__edge-path {
  stroke-linecap: round;
}

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
