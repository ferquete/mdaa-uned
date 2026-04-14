<script setup lang="ts">
const emit = defineEmits<{
  (e: 'save'): void
  (e: 'capture'): void
}>()
</script>

<template>
  <div class="pim-editor-toolbar h-10 border-b border-geist-border bg-geist-bg flex items-center justify-between px-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 pr-4 border-r border-geist-border h-4">
        <span class="text-[9px] font-bold uppercase tracking-widest text-geist-accents-4">Herramientas</span>
      </div>
      
      <div class="flex items-center gap-1.5">
        <button 
          @click="emit('save')"
          class="flex items-center gap-2 px-3 py-1 rounded-md bg-geist-fg text-geist-bg text-[10px] font-bold uppercase transition-all hover:bg-geist-fg/90 active:scale-95 shadow-sm"
          title="Guardar cambios en el modelo PIM"
        >
          <i class="fa-solid fa-floppy-disk text-[11px]"></i>
          Guardar
        </button>

        <button 
          @click="emit('capture')"
          class="flex items-center gap-2 px-3 py-1 rounded-md border border-geist-border bg-geist-accents-1 text-geist-accents-7 text-[10px] font-bold uppercase transition-all hover:border-geist-accents-4 hover:text-geist-fg active:scale-95"
          title="Capturar imagen del editor"
        >
          <i class="fa-solid fa-camera text-[11px]"></i>
          Capturar
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="px-2 py-0.5 rounded-full bg-geist-success/10 text-geist-success border border-geist-success/20 text-[8px] font-bold uppercase tracking-tighter">
        Editor Visual Activo
      </div>
    </div>
  </div>
</template>

<style scoped>
.pim-editor-toolbar {
  z-index: 10;
}
</style>
