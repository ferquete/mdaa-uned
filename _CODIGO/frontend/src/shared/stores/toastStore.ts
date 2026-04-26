import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 0;

  function addToast(text: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    const id = nextId++;
    toasts.value.push({ id, text, type, duration });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return {
    toasts,
    addToast,
    removeToast
  };
});
