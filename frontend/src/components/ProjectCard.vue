<script setup lang="ts">
import type { Project } from '../types';

interface Props {
  project: Project;
}

defineProps<Props>();

const emit = defineEmits(['edit', 'delete']);

const handleEdit = () => {
  emit('edit');
};

const handleDelete = () => {
  emit('delete');
};
</script>

<template>
  <div 
    class="aspect-square p-6 rounded-xl border border-geist-border bg-geist-bg hover:border-geist-fg shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group relative cursor-pointer"
  >
    <!-- Acciones Rápidas (Lápiz y Aspa) -->
    <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
      <button 
        @click.stop="handleEdit"
        class="w-7 h-7 flex items-center justify-center rounded-full bg-geist-bg border border-geist-border text-geist-accents-4 hover:text-geist-fg hover:border-geist-fg transition-all"
        title="Editar proyecto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>
      </button>

      <button 
        @click.stop="handleDelete"
        class="w-7 h-7 flex items-center justify-center rounded-full bg-geist-bg border border-geist-border text-geist-accents-4 hover:text-geist-error hover:border-geist-error transition-all"
        title="Eliminar proyecto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="space-y-2">
      <h3 class="text-lg font-bold tracking-tight text-geist-fg line-clamp-2 leading-tight">
        {{ project.name }}
      </h3>
      <p class="text-xs text-geist-accents-5 line-clamp-3 leading-relaxed">
        {{ project.description || 'Sin descripción' }}
      </p>
    </div>

    <div class="flex items-center justify-between mt-auto pt-4">
      <div 
        class="w-8 h-8 rounded-lg bg-geist-accents-1 flex items-center justify-center text-[10px] font-bold text-geist-accents-4 group-hover:bg-geist-fg group-hover:text-geist-bg transition-colors uppercase"
      >
        {{ project.name.substring(0, 2) }}
      </div>
      <span class="text-[10px] uppercase tracking-widest font-bold text-geist-accents-3">Ver Detalle</span>
    </div>
  </div>
</template>
