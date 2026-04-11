<script setup lang="ts">
import { computed } from 'vue'
import { Position, Handle } from '@vue-flow/core'
import BaseGraph2D from '@/shared/components/visualizers/BaseGraph2D.vue'
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'

const store = useAnalysisMachinesStore()

const nodesAndEdges = computed(() => {
  const rawRelations = store.parsedCimRelations?.relations
  const relations = Array.isArray(rawRelations) ? rawRelations : []
  const machines = store.machines
  
  // 1. Recoger todos los IDs de máquinas mencionados en las relaciones
  const machineIds = new Set<string>()
  relations.forEach(rel => {
    if (rel && typeof rel === 'object') {
      if (rel.source) machineIds.add(String(rel.source))
      if (rel.destination) machineIds.add(String(rel.destination))
    }
  })

  // 2. Mapear máquinas a Nodos (solo las que existen y están en relaciones)
  const nodes: any[] = []
  const currentMachinesInProject = machines.map(m => {
    const doc = store.parsedDocs[m.id]
    return { 
      id: doc?.id, 
      name: doc?.name || 'Máquina desconocida',
      dbId: m.id
    }
  }).filter(m => m.id)

  const radius = Math.max(200, currentMachinesInProject.length * 50)
  const centerX = 400
  const centerY = 300

  currentMachinesInProject.forEach((m, index) => {
    const angle = (index / currentMachinesInProject.length) * Math.PI * 2
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    nodes.push({
      id: m.id,
      label: m.name,
      position: { x, y },
      type: 'custom',
      data: { 
        name: m.name,
        type: 'machine' 
      },
      style: {
        background: '#F0CDAF',
        color: '#3d2b1f', // Texto oscuro para mejor contraste con el marrón claro
        borderRadius: '40px',
        minWidth: '120px',
        minHeight: '50px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'none', // Como en la imagen, no todo mayúsculas
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(0,0,0,0.05)',
      },
    })
  })

  // 3. Crear Aristas
  const edges: any[] = []
  relations.forEach((rel, index) => {
    if (!rel?.source || !rel?.destination) return
    
    // Solo si ambas máquinas existen en el proyecto
    const sourceExists = currentMachinesInProject.some(m => m.id === rel.source)
    const destExists = currentMachinesInProject.some(m => m.id === rel.destination)

    if (sourceExists && destExists) {
      edges.push({
        id: `rel-${index}`,
        source: rel.source,
        target: rel.destination,
        label: rel.description,
        type: 'draggable',
        style: { stroke: '#F59827', strokeWidth: 2, strokeDasharray: '6,4' },
        animated: true,
        markerEnd: {
          type: 'arrowclosed',
          color: '#F59827',
        },
      })
    }
  })

  return { nodes, edges }
})

const legend = [
  { color: '#F0CDAF', label: 'Máquinas' }
]

const edgeLegend = [
  { color: '#F59827', label: 'Relación', dashed: true }
]
</script>

<template>
  <div class="analysis-cim-visualizer-2d h-full bg-geist-bg">
    <BaseGraph2D 
      :nodes="nodesAndEdges.nodes" 
      :edges="nodesAndEdges.edges"
      :legend="legend"
      :edge-legend="edgeLegend"
    >
      <!-- Nodo Personalizado con Icono -->
      <template #node="nodeProps">
        <div 
          class="flex items-center justify-center gap-3 pointer-events-auto relative"
          :style="(nodeProps as any).style"
        >
          <!-- Icono alineado con el texto -->
          <div class="opacity-60 text-[12px]">
            <i class="fa-solid fa-microchip"></i>
          </div>
          
          <span class="font-bold">{{ (nodeProps as any).data.name }}</span>
          
          <!-- Los handles son necesarios para Vue Flow -->
          <Handle type="target" :position="Position.Top" class="!opacity-0 !pointer-events-none" style="top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1px; height: 1px" />
          <Handle type="source" :position="Position.Bottom" class="!opacity-0 !pointer-events-none" style="top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1px; height: 1px" />
        </div>
      </template>
    </BaseGraph2D>
  </div>
</template>
