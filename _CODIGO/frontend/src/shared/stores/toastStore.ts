import { defineStore } from 'pinia';
import { ref } from 'vue';

/** Estructura de datos para una notificación (Toast) */
export interface Toast {
  /** Identificador único */
  id: number;
  /** Mensaje a mostrar */
  text: string;
  /** Tipo de notificación */
  type: 'success' | 'error' | 'info';
  /** Duración opcional en milisegundos */
  duration?: number;
}

/**
 * Store de Pinia para la gestión global de notificaciones tipo Toast.
 */
export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 0;

  /**
   * Añade una nueva notificación a la cola.
   * @param {string} text Mensaje de la notificación.
   * @param {'success' | 'error' | 'info'} type Tipo de notificación (por defecto 'info').
   * @param {number} duration Tiempo en milisegundos antes de desaparecer (por defecto 3000).
   */
  function addToast(text: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    const id = nextId++;
    toasts.value.push({ id, text, type, duration });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  /**
   * Elimina una notificación específica de la cola.
   * @param {number} id Identificador de la notificación a eliminar.
   */
  function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return {
    toasts,
    addToast,
    removeToast
  };
});
