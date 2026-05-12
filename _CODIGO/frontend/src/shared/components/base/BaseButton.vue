<script setup lang="ts">
import { computed } from 'vue';

/**
 * Propiedades del botón base.
 */
interface Props {
  /** Variante estilística del botón */
  variant?: 'primary' | 'secondary' | 'error';
  /** Tipo nativo del botón HTML */
  type?: 'button' | 'submit' | 'reset';
  /** Deshabilita la interacción con el botón */
  disabled?: boolean;
  /** Muestra un indicador de carga y deshabilita el botón */
  loading?: boolean;
  /** Texto a mostrar cuando el botón está en estado de carga */
  loadingText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
  loading: false,
  loadingText: 'Cargando...'
});

/**
 * Eventos emitidos por el botón base.
 */
const emit = defineEmits(['click']);

/**
 * Calcula las clases CSS aplicables basadas en la variante seleccionada.
 * @returns {string} Clase CSS correspondiente.
 */
const buttonClass = computed(() => {
  switch (props.variant) {
    case 'secondary': return 'geist-button-secondary';
    case 'error': return 'geist-button-error';
    case 'primary':
    default:
      return 'geist-button-primary';
  }
});

/**
 * Manejador del evento click nativo.
 * Emite el evento personalizado 'click' solo si el botón no está deshabilitado ni cargando.
 * @param {MouseEvent} event Evento del ratón.
 */
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    :type="type"
    :class="[buttonClass, 'w-full sm:w-auto min-w-[120px]']"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <template v-if="loading">
      <div class="flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ loadingText }}</span>
      </div>
    </template>
    <slot v-else></slot>
  </button>
</template>
