<script setup lang="ts">
import PimVisualizerJSON from './PimVisualizerJSON.vue'

/**
 * Componente principal del editor PIM.
 * Se encarga de visualizar y gestionar el modelo independiente de plataforma.
 */
</script>

<template>
  <div class="pim-editor h-full">
    <!-- Por ahora solo tenemos la vista JSON, en el futuro aquí se conmutará con formularios u otras vistas -->
    <PimVisualizerJSON />
  </div>
</template>

<style scoped>
.pim-editor {
  background-color: var(--color-geist-bg);
}
</style>
