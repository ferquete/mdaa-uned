import { ref } from 'vue'

// Estado global para compartir entre componentes
const hasUnsavedChanges = ref(false)
const isContentValid = ref(true)

// Función interna para el modal
const isModalOpen = ref(false)
let pendingAction: (() => void) | null = null
let pendingSaveFn: (() => Promise<boolean>) | null = null

export function useUnsavedChanges() {
  
  /**
   * Actualiza el estado "dirty" del componente actual.
   * @param dirty Si hay cambios sin guardar.
   * @param valid Si los cambios actuales son estructuralmente válidos para poder ser guardados.
   * @param saveFn Función asincróna que intenta guardar los cambios.
   */
  const setUnsavedState = (dirty: boolean, valid: boolean = true, saveFn: (() => Promise<boolean>) | null = null) => {
    hasUnsavedChanges.value = dirty
    isContentValid.value = valid
    pendingSaveFn = saveFn
  }

  /**
   * Fuerza el reseteo del estado global sin guardar nada.
   */
  const clearUnsavedState = () => {
    hasUnsavedChanges.value = false
    isContentValid.value = true
    pendingSaveFn = null
  }

  /**
   * Intenta ejecutar una acción (como cambiar de nodo o de vista). 
   * Si hay cambios sin guardar, la interrumpe y levanta el Modal de confirmación.
   */
  const runWithGuard = (action: () => void) => {
    if (!hasUnsavedChanges.value) {
      action()
      return
    }
    
    // Si hay cambios sin guardar, guardamos la acción y mostramos el modal
    pendingAction = action
    isModalOpen.value = true
  }

  /**
   * (Interno para el Modal) - Intenta invocar el guardado pendiente.
   */
  const handleSaveAndContinue = async () => {
    if (isContentValid.value && pendingSaveFn) {
      const success = await pendingSaveFn()
      if (success) {
        clearUnsavedState()
        isModalOpen.value = false
        if (pendingAction) {
          pendingAction()
          pendingAction = null
        }
      }
    }
  }

  /**
   * (Interno para el Modal) - Descarta los cambios y prosigue.
   */
  const handleDiscardAndContinue = () => {
    clearUnsavedState()
    isModalOpen.value = false
    if (pendingAction) {
      pendingAction()
      pendingAction = null
    }
  }

  /**
   * (Interno para el Modal) - Cancela la navegación / acción.
   */
  const handleCancel = () => {
    isModalOpen.value = false
    pendingAction = null
  }

  return {
    hasUnsavedChanges,
    isContentValid,
    isModalOpen,
    setUnsavedState,
    clearUnsavedState,
    runWithGuard,
    handleSaveAndContinue,
    handleDiscardAndContinue,
    handleCancel
  }
}
