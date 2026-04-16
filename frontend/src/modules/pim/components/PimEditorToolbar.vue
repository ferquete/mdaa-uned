<script setup lang="ts">
const emit = defineEmits<{
  (e: 'save'): void
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


      </div>
    </div>

    <div class="flex items-center gap-3">
      <slot name="feedback"></slot>
    </div>
  </div>
</template>

<style scoped>
.pim-editor-toolbar {
  z-index: 10;
}
</style>
