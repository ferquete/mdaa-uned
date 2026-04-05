<script setup lang="ts">
import { useToastStore } from '../stores/toastStore';

const toastStore = useToastStore();
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
    <TransitionGroup 
      name="toast"
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in position-absolute"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id"
        class="pointer-events-auto min-w-[280px] p-4 rounded-xl border border-geist-border bg-geist-bg shadow-2xl flex items-center gap-3 backdrop-blur-md bg-opacity-90 animate-in slide-in-from-right-full"
      >
        <div 
          class="w-2 h-2 rounded-full shrink-0"
          :class="{
            'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]': toast.type === 'success',
            'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]': toast.type === 'error',
            'bg- Geist-fg shadow-[0_0_8px_rgba(255,255,255,0.6)]': toast.type === 'info'
          }"
        ></div>
        <p class="text-xs font-medium tracking-tight text-geist-fg">{{ toast.text }}</p>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-leave-active {
  position: absolute;
}
</style>
