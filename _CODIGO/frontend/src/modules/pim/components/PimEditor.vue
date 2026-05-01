<script setup lang="ts">
import PimVisualizerJSON from './PimVisualizerJSON.vue'

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
