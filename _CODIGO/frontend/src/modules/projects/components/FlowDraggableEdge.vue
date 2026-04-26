<script setup lang="ts">
import { computed, ref } from 'vue'
import { BaseEdge, type EdgeProps, useVueFlow } from '@vue-flow/core'

const props = defineProps<EdgeProps>()

const { updateEdgeData, project, findNode } = useVueFlow()

const isDragging = ref(false)

// Calcular el punto de control (punto medio si no existe)
const controlPoint = computed(() => {
  if (props.data?.controlPoint) {
    return props.data.controlPoint
  }
  
  // Calcular punto medio
  const midX = (props.sourceX + props.targetX) / 2
  const midY = (props.sourceY + props.targetY) / 2
  
  // Calcular vector perpendicular para dar una curvatura por defecto
  const dx = props.targetX - props.sourceX
  const dy = props.targetY - props.sourceY
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  
  // Offset de 40px perpendicular (puedes ajustar este valor)
  const offset = 40
  const nx = -dy / len
  const ny = dx / len
  
  return {
    x: midX + nx * offset,
    y: midY + ny * offset,
  }
})

// Función para calcular intersección del borde del nodo con un rayo dirigido al punto de control
const getIntersection = (cx: number, cy: number, w: number, h: number, targetX: number, targetY: number) => {
  const dx = targetX - cx
  const dy = targetY - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  
  // Acercamiento elíptico, considerando que los nodos son píldoras (redondeados). 
  // Reducimos un poco w y h (-2px) para que la línea toque exactamente el perímetro dibujado.
  const a = Math.max(1, w - 2)
  const b = Math.max(1, h - 2)
  
  const t = 1 / Math.sqrt((dx * dx) / (a * a) + (dy * dy) / (b * b))
  
  // Intersectamos cerca pero sin rebasar el margen interior visual 
  return {
    x: cx + dx * t,
    y: cy + dy * t
  }
}

// Puntos de inicio y fin ajustados al borde del nodo (ahora los nodos son solo el óvalo)
const edgeEndpoints = computed(() => {
  const sNode = findNode(props.source)
  const tNode = findNode(props.target)
  const cp = controlPoint.value
  
  // Source
  let sx = props.sourceX, sy = props.sourceY
  if (sNode && sNode.dimensions) {
    const inter = getIntersection(props.sourceX, props.sourceY, sNode.dimensions.width / 2, sNode.dimensions.height / 2, cp.x, cp.y)
    sx = inter.x; sy = inter.y;
  }
  
  // Target
  let tx = props.targetX, ty = props.targetY
  if (tNode && tNode.dimensions) {
    const inter = getIntersection(props.targetX, props.targetY, tNode.dimensions.width / 2, tNode.dimensions.height / 2, cp.x, cp.y)
    tx = inter.x; ty = inter.y;
  }
  
  return { sx, sy, tx, ty }
})

// Path personalizado de Bezier Cuadrático interactivo
const customPath = computed(() => {
  const cp = controlPoint.value
  const { sx, sy, tx, ty } = edgeEndpoints.value
  return `M ${sx} ${sy} Q ${cp.x} ${cp.y} ${tx} ${ty}`
})

const onMouseDown = (event: MouseEvent) => {
  event.stopPropagation()
  event.preventDefault()
  isDragging.value = true
  
  // Obtener el contenedor de Vue Flow para calcular el offset
  const flowContainer = (event.target as HTMLElement).closest('.vue-flow')
  if (!flowContainer) return
  
  const rect = flowContainer.getBoundingClientRect()
  
  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isDragging.value) return
    
    // Proyectar coordenadas: (Raton - Container) -> Project
    const projected = project({
      x: moveEvent.clientX - rect.left,
      y: moveEvent.clientY - rect.top,
    })
    
    updateEdgeData(props.id, {
      controlPoint: {
        x: projected.x,
        y: projected.y
      }
    })
  }
  
  const onMouseUp = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <!-- La arista base con animación de flujo si está activa -->
  <BaseEdge 
    :id="id" 
    :path="customPath" 
    :style="style"
    class="vue-flow__edge-path"
  />
  
  <!-- Manejador interactivo (visible en hover o drag) -->
  <g class="pointer-events-auto cursor-move group">
    <circle
      :cx="controlPoint.x"
      :cy="controlPoint.y"
      r="12"
      fill="transparent"
      @mousedown="onMouseDown"
    />
    <circle
      :cx="controlPoint.x"
      :cy="controlPoint.y"
      r="4"
      :fill="style?.stroke || '#fff'"
      class="opacity-0 group-hover:opacity-100 transition-opacity"
      :class="{ '!opacity-100': isDragging }"
      style="pointer-events: none"
    />
  </g>

  <!-- Punta de flecha animada (Dirección del flujo) -->
  <path 
    d="M -8 -5 L 2 0 L -8 5 Z" 
    :fill="style?.stroke || '#fff'" 
    class="pointer-events-none" 
    :style="{ opacity: style?.opacity }"
  >
    <animateMotion
      :path="customPath"
      dur="3s"
      repeatCount="indefinite"
      rotate="auto"
    />
  </path>
</template>

<style scoped>
.cursor-move {
  cursor: move;
}
</style>
