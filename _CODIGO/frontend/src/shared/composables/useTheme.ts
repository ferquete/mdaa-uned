import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable para detectar y reaccionar al cambio de tema (dark/light).
 */
export function useTheme() {
  const isDark = ref(document.documentElement.classList.contains('dark'))

  let observer: MutationObserver | null = null

  onMounted(() => {
    // Escuchar cambios en la clase del elemento html
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          isDark.value = document.documentElement.classList.contains('dark')
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  })

  onUnmounted(() => {
    if (observer) observer.disconnect()
  })

  return {
    isDark
  }
}
