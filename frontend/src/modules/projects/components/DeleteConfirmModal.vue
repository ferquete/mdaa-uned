<script setup lang="ts">


interface Props {
  show: boolean;
  projectName?: string;
  isDeleting: boolean;
}

defineProps<Props>();

const emit = defineEmits(['confirm', 'cancel']);

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <!-- Overlay -->
      <div 
        class="absolute inset-0 bg-geist-bg/80 backdrop-blur-sm" 
        @click="handleCancel"
      ></div>
      
      <!-- Contenido del Modal -->
      <div 
        class="relative bg-geist-bg border border-geist-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div class="p-8 space-y-6">
          <div class="space-y-2">
            <h2 class="text-2xl font-bold tracking-tight text-geist-fg">Eliminar Proyecto</h2>
            <p class="text-geist-accents-5 text-sm leading-relaxed">
              ¿Estás seguro de que quieres eliminar 
              <span class="font-bold text-geist-fg">"{{ projectName || 'este proyecto' }}"</span>? 
              Esta acción no se puede deshacer.
            </p>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <BaseButton 
              variant="error" 
              class="flex-1"
              :loading="isDeleting"
              loading-text="Eliminando..."
              @click="handleConfirm"
            >
              Sí, eliminar
            </BaseButton>
            
            <BaseButton 
              variant="secondary" 
              class="flex-1"
              :disabled="isDeleting"
              @click="handleCancel"
            >
              Cancelar
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-in {
  animation-fill-mode: forwards;
}
@keyframes zoom-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.zoom-in {
  animation-name: zoom-in;
}
</style>
