<script setup lang="ts">
import { computed } from 'vue'
import { type EdgeProps, getBezierPath } from '@vue-flow/core'

// Props estándar que VueFlow inyecta en componentes de arista personalizados
const props = defineProps<EdgeProps>()

const emit = defineEmits<{
  (e: 'delete-edge', edgeId: string): void
  (e: 'edit-edge', edgeId: string): void
}>()

// Ruta Bézier calculada por VueFlow
const pathData = computed(() =>
  getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })
)

const edgePath = computed(() => pathData.value[0])
const labelX = computed(() => pathData.value[1])
const labelY = computed(() => pathData.value[2])

// Texto truncado a 10 caracteres
const truncatedLabel = computed(() => {
  const raw = (props.data?.description as string) || ''
  if (!raw) return ''
  return raw.length > 10 ? raw.substring(0, 10) + '...' : raw
})

const hasLabel = computed(() => !!truncatedLabel.value)

const strokeColor = computed(() =>
  props.data?.type === 'audio' ? '#e11d48' : '#10b981'
)
</script>

<template>
  <g>
    <!-- Ruta invisible más gruesa para facilitar la captura del doble clic -->
    <path
      :d="edgePath"
      stroke="transparent"
      stroke-width="12"
      fill="none"
      @dblclick="emit('edit-edge', id)"
      style="cursor: pointer"
    />

    <!-- Ruta visible de la arista -->
    <path
      :id="id"
      :d="edgePath"
      :stroke="strokeColor"
      stroke-width="2"
      fill="none"
      stroke-dasharray="5"
      class="pim-edge-path"
    />

    <!-- Etiqueta flotante con controles -->
    <foreignObject
      :x="labelX - 52"
      :y="labelY - 14"
      width="104"
      height="28"
      style="overflow: visible; pointer-events: all"
    >
      <div class="pim-edge-label" @dblclick.stop="emit('edit-edge', id)">
        <!-- Botón eliminar -->
        <button
          class="pim-edge-btn pim-edge-btn--delete"
          title="Eliminar arista"
          @click.stop="emit('delete-edge', id)"
        >
          <i class="fa-solid fa-trash-can" style="font-size: 6px"></i>
        </button>

        <!-- Botón editar -->
        <button
          class="pim-edge-btn pim-edge-btn--edit"
          title="Editar descripción"
          @click.stop="emit('edit-edge', id)"
        >
          <i class="fa-solid fa-pencil" style="font-size: 6px"></i>
        </button>

        <!-- Texto de descripción truncado -->
        <span v-if="hasLabel" class="pim-edge-text" :title="data?.description">
          {{ truncatedLabel }}
        </span>
      </div>
    </foreignObject>
  </g>
</template>

<style scoped>
.pim-edge-path {
  animation: dash 20s linear infinite;
}

@keyframes dash {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

.pim-edge-label {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--color-geist-bg);
  border: 1px solid var(--color-geist-border);
  border-radius: 4px;
  padding: 2px 5px;
  white-space: nowrap;
  width: fit-content;
  max-width: 180px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  cursor: default;
}

.pim-edge-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.pim-edge-btn--delete {
  color: var(--color-geist-error, #ef4444);
}
.pim-edge-btn--delete:hover {
  background: rgba(239, 68, 68, 0.12);
}

.pim-edge-btn--edit {
  color: var(--color-geist-accents-5, #888);
}
.pim-edge-btn--edit:hover {
  background: var(--color-geist-accents-2, #eee);
  color: var(--color-geist-fg);
}

.pim-edge-text {
  font-size: 5px;
  font-family: ui-monospace, monospace;
  color: var(--color-geist-accents-5);
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
