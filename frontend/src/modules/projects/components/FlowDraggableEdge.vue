<script setup lang="ts">
import { computed, ref } from 'vue'
import { BaseEdge, type EdgeProps, useVueFlow } from '@vue-flow/core'

const props = defineProps<EdgeProps>()

const { updateEdgeData, project } = useVueFlow()

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

// Path personalizado de Bezier Cuadrático para que el punto de control sea real
const customPath = computed(() => {
  const cp = controlPoint.value
  return `M ${props.sourceX} ${props.sourceY} Q ${cp.x} ${cp.y} ${props.targetX} ${props.targetY}`
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
</template>

<style scoped>
.cursor-move {
  cursor: move;
}
</style>
