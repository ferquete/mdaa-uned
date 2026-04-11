<script setup lang="ts">
import { useAnalysisMachinesStore } from '../stores/analysisMachinesStore'

const store = useAnalysisMachinesStore()
</script>

<template>
  <div class="analysis-cim-editor h-full flex flex-col bg-geist-bg">
    <!-- Header -->
    <div class="px-8 py-6 border-b border-geist-border bg-geist-accents-1/20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-geist-fg flex items-center justify-center text-geist-bg shadow-lg">
          <i class="fa-solid fa-microscope"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-geist-fg">Configuración Central de Análisis</h2>
          <p class="text-[10px] font-mono text-geist-accents-4 uppercase tracking-widest">Entidad CIM: ID {{ store.currentCim?.id }}</p>
        </div>
      </div>
    </div>

    <!-- Content Empty for now -->
    <div class="flex-1 p-8 flex items-center justify-center">
      <div class="text-center space-y-4 opacity-50">
        <div class="text-4xl text-geist-accents-3">
          <i class="fa-solid fa-folder-open"></i>
        </div>
        <p class="text-sm font-mono text-geist-accents-4 uppercase tracking-widest">Sin contenido disponible</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
