<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/shared/api/apiClient'

/**
 * Vista de Registro de Usuario.
 * Permite a nuevos usuarios crear una cuenta en el sistema, conectando con el backend
 * y gestionando la respuesta (éxito o errores de validación/conexión).
 */

const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')

const isSubmitting = ref(false)

const showModal = ref(false)
const modalType = ref<'success' | 'error'>('success')
const modalMessage = ref('')

// Validaciones en tiempo real
/** Valida el nombre: solo letras y longitud mínima de 2 */
const isFirstNameValid = computed(() => {
  const re = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  return firstName.value.length >= 2 && re.test(firstName.value)
})

/** Valida los apellidos: longitud entre 2 y 30 caracteres */
const isLastNameValid = computed(() => {
  return lastName.value.length >= 2 && lastName.value.length <= 30
})

/** Valida el formato del correo electrónico mediante expresión regular */
const isEmailValid = computed(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email.value)
})

/** Valida la contraseña: longitud entre 8 y 20 caracteres */
const isPasswordValid = computed(() => {
  return password.value.length >= 8 && password.value.length <= 20
})

/** Comprueba que todos los campos del formulario sean válidos */
const isFormValid = computed(() => {
  return isFirstNameValid.value && isLastNameValid.value && isEmailValid.value && isPasswordValid.value
})

/**
 * Cierra el modal de notificación.
 * Si el tipo era de éxito, redirige a la pantalla principal (login).
 */
const closeModal = () => {
  showModal.value = false
  if (modalType.value === 'success') {
    router.push('/')
  }
}

const register = async () => {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  
  try {
    const response = await apiClient.post('/api/v1/auth/register', {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value
    })

    modalType.value = 'success'
    modalMessage.value = 'Revise su correo para terminar el proceso de registro.'
    showModal.value = true
  } catch (err: any) {
    modalType.value = 'error'
    modalMessage.value = err.message || 'Error de conexión. ¿Está el backend encendido?'
    showModal.value = true
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-12">
    <div>
      <h2 class="text-center text-4xl font-black tracking-tighter text-geist-fg">
        Únete
      </h2>
      <p class="mt-4 text-center text-sm font-medium text-geist-accents-5">
        Completa tus datos para crear una cuenta segura
      </p>
    </div>
    
    <form class="mt-8 space-y-10" @submit.prevent="register">
      <div class="space-y-8">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="firstName" class="text-xs uppercase tracking-widest font-bold text-geist-accents-4">Nombre</label>
            <input v-model="firstName" id="firstName" name="firstName" type="text" required class="geist-input" placeholder="Ej. Juan">
            <p v-if="firstName.length > 0 && !isFirstNameValid" class="text-[9px] text-geist-error mt-1 uppercase font-bold tracking-wider">Mínimo 2 letras.</p>
          </div>
          <div class="space-y-2">
            <label for="lastName" class="text-xs uppercase tracking-widest font-bold text-geist-accents-4">Apellidos</label>
            <input v-model="lastName" id="lastName" name="lastName" type="text" required class="geist-input" placeholder="Ej. Pérez">
            <p v-if="lastName.length > 0 && !isLastNameValid" class="text-[9px] text-geist-error mt-1 uppercase font-bold tracking-wider">2 a 30 caracteres.</p>
          </div>
        </div>
        <div class="space-y-2">
          <label for="email" class="text-xs uppercase tracking-widest font-bold text-geist-accents-4">Email</label>
          <input v-model="email" id="email" name="email" type="email" autocomplete="email" required class="geist-input" placeholder="juan@ejemplo.com">
          <p v-if="email.length > 0 && !isEmailValid" class="text-[9px] text-geist-error mt-1 uppercase font-bold tracking-wider">Formato no válido.</p>
        </div>
        <div class="space-y-2">
          <label for="password" class="text-xs uppercase tracking-widest font-bold text-geist-accents-4">Contraseña</label>
          <input v-model="password" id="password" name="password" type="password" required class="geist-input" placeholder="••••••••">
          <p v-if="password.length > 0 && !isPasswordValid" class="text-[9px] text-geist-error mt-1 uppercase font-bold tracking-wider">8 a 20 caracteres.</p>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <button 
          type="submit" 
          :disabled="isSubmitting || !isFormValid" 
          class="geist-button-primary w-full disabled:opacity-30 disabled:hover:bg-geist-fg disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Procesando...' : 'Crear Cuenta' }}
        </button>
        <button 
          type="button" 
          @click="router.push('/')" 
          class="geist-button-secondary w-full"
        >
          Cancelar
        </button>
      </div>
    </form>
  </div>

  <!-- Modal Geist-style -->
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-geist-bg/80 backdrop-blur-md">
      <div class="bg-geist-bg border border-geist-border max-w-sm w-full p-8 text-center rounded-lg shadow-2xl">
        <div 
          class="mx-auto flex items-center justify-center h-10 w-10 rounded-full mb-6 border"
          :class="modalType === 'success' ? 'border-geist-success text-geist-success' : 'border-geist-error text-geist-error'"
        >
          <svg v-if="modalType === 'success'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h3 class="text-xl font-bold tracking-tight text-geist-fg mb-2">
          {{ modalType === 'success' ? 'Éxito' : 'Error' }}
        </h3>
        <p class="text-sm font-medium text-geist-accents-5 mb-8">
          {{ modalMessage }}
        </p>
        
        <button @click="closeModal" class="geist-button-primary w-full">
          Entendido
        </button>
      </div>
    </div>
  </Transition>
</div>
</template>
