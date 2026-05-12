<script setup lang="ts">
// No logic needed for this simple visual component
</script>

<template>
  <div class="base-loader flex items-center justify-center py-12">
    <div class="flex gap-1.5">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  </div>
</template>

<style scoped>
.base-loader {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-geist-fg);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.3;
  } 
  40% { 
    transform: scale(1.0);
    opacity: 1;
  }
}
</style>
