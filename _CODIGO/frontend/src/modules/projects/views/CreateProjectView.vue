<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectStore } from '@/modules/projects/stores/projectStore'
import { useToastStore } from '@/shared/stores/toastStore'

/**
 * Vista para la creación o edición de proyectos de usuario.
 * Maneja tanto la creación inicial como la actualización de los metadatos de un proyecto.
 */

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()
const toastStore = useToastStore()

const projectId = ref<number | null>(null)
const name = ref('')
const description = ref('')
const isSubmitting = ref(false)
const isEditMode = computed(() => projectId.value !== null)

onMounted(async () => {
  
  // Detectar modo edición
  if (route.params.id) {
    projectId.value = Number(route.params.id)
    const project = await projectStore.fetchProjectById(projectId.value)
    if (project) {
      name.value = project.name
      description.value = project.description || ''
    } else {
      toastStore.addToast('No se pudo cargar el proyecto para editar', 'error')
      router.push('/')
    }
  }
})

// Validaciones en tiempo real
const isNameValid = computed(() => {
  return name.value.length >= 1 && name.value.length <= 40
})

const isDescriptionValid = computed(() => {
  return description.value.length <= 1000
})

const isFormValid = computed(() => {
  return isNameValid.value && isDescriptionValid.value
})

const handleCancel = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  
  let result
  if (isEditMode.value && projectId.value) {
    result = await projectStore.updateProject(projectId.value, name.value, description.value)
  } else {
    result = await projectStore.createProject(name.value, description.value)
  }
  
  if (result.success) {
    toastStore.addToast(isEditMode.value ? 'Proyecto actualizado' : 'Proyecto creado con éxito', 'success')
    handleCancel()
  } else {
    toastStore.addToast(result.message || 'Error al procesar el proyecto', 'error')
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="pt-8 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
    <div class="max-w-md mx-auto w-full space-y-12">
      <div>
        <h2 class="text-center text-4xl font-black tracking-tighter text-geist-fg">
          {{ isEditMode ? 'Editar Proyecto.' : 'Nuevo Proyecto.' }}
        </h2>
        <p class="mt-4 text-center text-sm font-medium text-geist-accents-5">
          {{ isEditMode ? 'Ajusta los detalles de tu espacio de trabajo.' : 'Define el espacio de trabajo para tu próxima creación.' }}
        </p>
      </div>
      
      <form class="mt-8 space-y-8" @submit.prevent="handleSubmit">
        <div class="space-y-6">
          <!-- Nombre -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label for="name" class="text-xs uppercase tracking-widest font-bold text-geist-accents-4">Nombre del Proyecto</label>
              <span class="text-[9px] uppercase font-bold tracking-wider" :class="name.length >= 40 ? 'text-geist-error animate-pulse' : 'text-geist-accents-3'">
                {{ name.length }} / 40
              </span>
            </div>
            <input 
              v-model="name" 
              id="name" 
              type="text" 
              required 
              class="geist-input" 
              placeholder="Ej. Mi Primer Track"
              maxlength="40"
            >
            <p v-if="name.length > 0 && !isNameValid" class="text-[9px] text-geist-error mt-1 uppercase font-bold tracking-wider">Debe tener entre 1 y 40 caracteres.</p>
          </div>

          <!-- Descripción -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label for="description" class="text-xs uppercase tracking-widest font-bold text-geist-accents-4">Descripción (Opcional)</label>
              <span class="text-[9px] uppercase font-bold tracking-wider" :class="description.length >= 1000 ? 'text-geist-error animate-pulse' : 'text-geist-accents-3'">
                {{ description.length }} / 1000
              </span>
            </div>
            <textarea 
              v-model="description" 
              id="description" 
              rows="6"
              class="geist-input py-3 resize-none" 
              placeholder="¿De qué trata este proyecto?"
              maxlength="1000"
            ></textarea>
          </div>

        </div>

        <div class="flex flex-col gap-4">
          <button 
            type="submit" 
            :disabled="isSubmitting || !isFormValid" 
            class="geist-button-primary w-full disabled:opacity-30 disabled:hover:bg-geist-fg disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? (isEditMode ? 'Guardando...' : 'Creando...') : (isEditMode ? 'Guardar Cambios' : 'Crear Proyecto') }}
          </button>
          <button 
            type="button" 
            @click="handleCancel" 
            class="geist-button-secondary w-full"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
