<script setup lang="ts">
defineProps<{
  nodeId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <aside class="pim-editor-properties w-80 border-l border-geist-border bg-geist-bg flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.03)] transition-all">
    <div class="px-4 h-12 flex items-center justify-between border-b border-geist-border bg-geist-accents-1/30">
      <h3 class="text-[10px] font-bold uppercase tracking-[0.15em] text-geist-accents-5 flex items-center gap-2">
        <i class="fa-solid fa-sliders text-geist-accents-3"></i>
        Propiedades del Nodo
      </h3>
      <button 
        @click="emit('close')"
        class="text-geist-accents-4 hover:text-geist-fg transition-colors"
      >
        <i class="fa-solid fa-xmark text-sm"></i>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
      <div v-if="!nodeId" class="text-center opacity-40">
        <div class="w-16 h-16 rounded-2xl bg-geist-accents-1 flex items-center justify-center mx-auto mb-4 border border-geist-border">
          <i class="fa-solid fa-mouse-pointer text-2xl"></i>
        </div>
        <p class="text-[10px] font-medium text-geist-accents-5 max-w-[180px]">
          Selecciona un nodo en el lienzo para editar sus parámetros técnicos
        </p>
      </div>
      
      <div v-else class="w-full">
        <!-- Renderizar controles según el tipo de nodo (futuro) -->
        <div class="p-3 rounded-lg border border-geist-border bg-geist-accents-1/20 border-t-2 border-t-node-generator mb-4">
           <span class="text-[10px] font-mono text-geist-accents-4 bg-geist-accents-2 px-1 rounded block mb-2 w-max">UUID: {{ nodeId }}</span>
           <h4 class="text-xs font-bold text-geist-fg">Configuración del Nodo</h4>
        </div>
        
        <!-- Placeholder de Parámetros -->
        <div class="space-y-4">
          <div v-for="i in 3" :key="i" class="h-10 bg-geist-accents-1/50 rounded-md border border-geist-border border-dashed"></div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.pim-editor-properties {
  z-index: 20;
}
</style>
