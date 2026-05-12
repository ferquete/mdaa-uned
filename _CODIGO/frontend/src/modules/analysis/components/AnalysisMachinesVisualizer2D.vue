<script setup lang="ts">
import { computed } from 'vue'
import BaseGraph2D from '@/shared/components/visualizers/BaseGraph2D.vue'
import type { CimDocument } from '@/shared/types'

const props = defineProps<{
  machineJson: string
}>()

const legend = [
  { color: '#f97316', label: 'Elementos' }
]

const edgeLegend = [
  { color: '#f97316', label: 'Conexión Interna', dashed: true }
]

const graphData = computed(() => {
  try {
    const data: CimDocument = JSON.parse(props.machineJson || '{}')
    const allNodes = data.elements || []

    const nodes: any[] = []
    const edges: any[] = []

    const radius = Math.max(200, allNodes.length * 40)
    const centerX = 400
    const centerY = 300

    allNodes.forEach((node, index) => {
      const angle = (index / allNodes.length) * Math.PI * 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      nodes.push({
        id: node.id,
        label: node.name || node.id,
        position: { x, y },
        type: 'custom',
        data: { 
          name: node.name || node.id,
          type: 'element' 
        },
        style: {
          background: '#f97316',
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
          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
        },
      })
    })

    // Mapeo de aristas sendTo (Unificado con colores dinámicos)
    allNodes.forEach(sourceNode => {
      const edgeColor = '#f97316'
      
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
