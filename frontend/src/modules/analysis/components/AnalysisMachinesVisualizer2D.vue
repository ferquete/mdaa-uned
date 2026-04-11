<script setup lang="ts">
import { computed } from 'vue'
import BaseGraph2D from '@/shared/components/visualizers/BaseGraph2D.vue'
import type { CimDocument } from '@/shared/types'

const props = defineProps<{
  machineJson: string
}>()

const legend = [
  { color: 'var(--color-node-generator)', label: 'Generadores' },
  { color: 'var(--color-node-modificator)', label: 'Modificadores' }
]

const edgeLegend = [
  { color: 'var(--color-node-generator)', label: 'Desde Generador', dashed: true },
  { color: 'var(--color-node-modificator)', label: 'Desde Modificador', dashed: true }
]

const graphData = computed(() => {
  try {
    const data: CimDocument = JSON.parse(props.machineJson || '{}')
    const generators = data.generators || []
    const modificators = data.modificators || []
    const allNodes = [...generators, ...modificators]

    const nodes: any[] = []
    const edges: any[] = []

    const radius = Math.max(200, allNodes.length * 40)
    const centerX = 400
    const centerY = 300

    allNodes.forEach((node, index) => {
      const angle = (index / allNodes.length) * Math.PI * 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      const isGenerator = (node as any).$type === 'AudioGenerator' || (node as any).$type === 'CimGenerator'

      nodes.push({
        id: node.id,
        label: node.name || node.id,
        position: { x, y },
        type: 'custom',
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          boxShadow: isGenerator ? 'var(--shadow-node-generator)' : 'var(--shadow-node-modificator)',
        },
      })
    })

    // Mapeo de aristas sendTo (Unificado con colores dinámicos)
    allNodes.forEach(sourceNode => {
      const isGenerator = (sourceNode as any).$type === 'AudioGenerator' || (sourceNode as any).$type === 'CimGenerator'
      const edgeColor = isGenerator ? 'var(--color-node-generator)' : 'var(--color-node-modificator)'
      
      const sendToList = (sourceNode as any).sendTo || [];
      sendToList.forEach((s: any) => {
        const targetId = s.idRef;
        if (targetId && allNodes.some(n => n.id === targetId)) {
          edges.push({
            id: `e-${sourceNode.id}-${targetId}-${s.id || s.idRef}`,
            source: sourceNode.id,
            target: targetId,
            type: 'draggable',
            style: { stroke: edgeColor, strokeWidth: 2, strokeDasharray: '5,5' },
            animated: true,
          })
        }
      });
    });

    return { nodes, edges }
  } catch (e) {
    return { nodes: [], edges: [] }
  }
})
</script>

<template>
  <BaseGraph2D 
    :nodes="graphData.nodes" 
    :edges="graphData.edges" 
    :legend="legend"
    :edge-legend="edgeLegend"
  />
</template>
