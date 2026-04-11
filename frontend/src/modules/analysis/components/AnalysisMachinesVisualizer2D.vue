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
  { color: 'var(--color-node-rel)', label: 'rel', dashed: true },
  { color: 'var(--color-node-ref)', label: 'ref', dashed: true }
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

      const isGenerator = (node as any).$type === 'CimGenerator' || generators.includes(node as any)

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

    // Mapeo de aristas
    generators.forEach(gen => {
      if (gen.refs) gen.refs.forEach((ref: any) => {
        const targetId = typeof ref === 'string' ? ref : ref?.id
        if (targetId && allNodes.some(n => n.id === targetId)) {
          edges.push({
            id: `e-${gen.id}-${targetId}-ref`,
            source: gen.id,
            target: targetId,
            type: 'draggable',
            style: { stroke: 'var(--color-node-ref)', strokeWidth: 2, strokeDasharray: '5,5' },
            animated: true,
          })
        }
      })
      if (gen.rels) gen.rels.forEach((rel: any) => {
        const targetId = typeof rel === 'string' ? rel : rel?.id
        if (targetId && allNodes.some(n => n.id === targetId)) {
          edges.push({
            id: `e-${gen.id}-${targetId}-rel`,
            source: gen.id,
            target: targetId,
            type: 'draggable',
            style: { stroke: 'var(--color-node-rel)', strokeWidth: 2, strokeDasharray: '5,5' },
            animated: true,
          })
        }
      })
    })

    modificators.forEach(mod => {
      if (mod.refs) mod.refs.forEach((ref: any) => {
        const targetId = typeof ref === 'string' ? ref : ref?.id
        if (targetId && allNodes.some(n => n.id === targetId)) {
          edges.push({
            id: `e-${mod.id}-${targetId}-ref`,
            source: mod.id,
            target: targetId,
            type: 'draggable',
            style: { stroke: 'var(--color-node-ref)', strokeWidth: 2, strokeDasharray: '5,5' },
            animated: true,
          })
        }
      })
    })

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
