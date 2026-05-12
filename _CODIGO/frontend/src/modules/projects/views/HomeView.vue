<script setup lang="ts">
import keycloak from '@/app/plugins/keycloak'
import { useUserStore } from '@/modules/auth/stores/userStore'
import { useProjectStore } from '@/modules/projects/stores/projectStore'
import GenericAlertModal from '@/shared/components/modals/GenericAlertModal.vue'
import type { Project } from '@/shared/types'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Vista principal de la aplicación.
 * Gestiona el panel de control de proyectos para usuarios autenticados
 * y muestra la pantalla de inicio (landing) para usuarios invitados.
 */

const router = useRouter()
const userStore = useUserStore()
const projectStore = useProjectStore()


const isLoading = ref(true)
const isAuthenticated = ref(false)
const firstName = ref('')

const showDeleteConfirm = ref(false)
const projectToDelete = ref<Project | null>(null)
const isDeleting = ref(false)

const showAlert = ref(false)
const alertMessage = ref('')

onMounted(async () => {
  isAuthenticated.value = keycloak.authenticated || false
  if (isAuthenticated.value) {
    firstName.value = keycloak.tokenParsed?.given_name || ''
    
    // Sincronización proactiva de sesión
    await userStore.syncSession()
    
    if (userStore.user) {
      firstName.value = userStore.user.firstName
    }
    
    // Cargar proyectos
    await projectStore.fetchProjects()
  }
  isLoading.value = false
})

/** Manejador para iniciar sesión usando Keycloak */
const login = () => keycloak.login()
/** Navega a la vista de registro */
const register = () => router.push('/register')
/** Navega a la vista de creación de proyecto */
const createProject = () => router.push('/projects/new')

/**
 * Abre el modal de confirmación de borrado.
 * @param {Project} project Proyecto seleccionado.
 */
const openDeleteConfirm = (project: Project) => {
  projectToDelete.value = project
  showDeleteConfirm.value = true
}

/**
 * Cancela el borrado de un proyecto y cierra el modal.
 */
const cancelDelete = () => {
  showDeleteConfirm.value = false
  projectToDelete.value = null
}

/**
 * Confirma el borrado definitivo del proyecto seleccionado.
 */
const confirmDelete = async () => {
  if (!projectToDelete.value) return
  
  isDeleting.value = true
  const result = await projectStore.deleteProject(projectToDelete.value.id)
  isDeleting.value = false
  
  if (result.success) {
    showDeleteConfirm.value = false
    projectToDelete.value = null
  } else {
    alertMessage.value = result.message || 'Error al eliminar el proyecto'
    showAlert.value = true
  }
}

/**
 * Navega a la vista de edición de un proyecto.
 * @param {number} id ID del proyecto a editar.
 */
const editProject = (id: number) => {
  router.push(`/projects/${id}/edit`)
}

/**
 * Abre y carga un proyecto seleccionado.
 * @param {number} id ID del proyecto a visualizar/abrir.
 */
const openProject = (id: number) => {
  router.push(`/projects/${id}`)
}
</script>

<template>
  <div class="min-h-[calc(100vh-theme(spacing.12))] px-6 max-w-6xl mx-auto flex flex-col text-geist-fg">
    
    <!-- Contenido Scrollable (Cargando, Landing o Dashboard) -->
    <div class="flex-1 flex flex-col min-h-0">
      
      <!-- Estado de Carga -->
      <div v-if="isLoading" class="flex-1 flex items-center justify-center">
        <BaseLoader />
      </div>

      <div v-else class="w-full">
        <!-- Vista Landing (Usuario no autenticado) -->
        <div v-if="!isAuthenticated" class="flex-1 flex flex-col items-center justify-center text-center space-y-12 py-12 md:py-24">
          <div class="space-y-4">
            <h1 class="flex justify-center items-baseline text-5xl md:text-7xl font-black tracking-tighter leading-tight">
              <span class="mda-text">MDA</span><span class="audio-text">Audio</span>
            </h1>
            <p class="text-lg md:text-xl text-geist-accents-5 font-medium max-w-lg mx-auto">
              Generador de audio guiado por modelos
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <BaseButton @click="login">Iniciar Sesión</BaseButton>
            <BaseButton variant="secondary" @click="register">Crear una Cuenta</BaseButton>
          </div>
          
          <div class="space-y-4 w-full">
            
            <!-- Animación de Ondas (Integrada) -->
            <div class="w-full max-w-md mx-auto h-24 opacity-60">
              <SoundWaveAnimation />
            </div>
          </div>
        </div>

        <!-- Vista Dashboard (Usuario autenticado) -->
        <div v-else class="h-[calc(100vh-theme(spacing.12))] overflow-y-auto scrollbar-hide space-y-12 pt-8 px-2">
          <header class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tighter">Tus Proyectos</h1>
            <p class="text-geist-accents-5 text-sm font-medium">Gestiona y crea tus espacios de trabajo.</p>
          </header>

          <!-- Grid de Proyectos -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-24">
            
            <!-- Botón Crear Nuevo Proyecto -->
            <button 
              @click="createProject"
              class="aspect-square flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-geist-border hover:border-geist-fg hover:bg-geist-accents-1 transition-all group overflow-hidden"
            >
              <div class="w-12 h-12 rounded-full border border-geist-border flex items-center justify-center group-hover:scale-110 transition-transform bg-geist-bg shadow-sm">
                <span class="text-2xl font-light text-geist-accents-5 group-hover:text-geist-fg">+</span>
              </div>
              <span class="text-xs font-bold uppercase tracking-widest text-geist-accents-4 group-hover:text-geist-fg transition-colors">Crear Proyecto</span>
            </button>

            <!-- Skeleton Loading al cargar proyectos -->
            <template v-if="projectStore.loading && projectStore.projects.length === 0">
              <div v-for="i in 3" :key="i" class="aspect-square rounded-xl border border-geist-border bg-geist-accents-1 animate-pulse"></div>
            </template>

            <!-- Lista de Proyectos -->
            <ProjectCard 
              v-for="project in projectStore.projects" 
              :key="project.id"
              :project="project"
              @click="openProject(project.id)"
              @edit="editProject(project.id)"
              @delete="openDeleteConfirm(project)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación -->
    <GenericConfirmDeleteModal 
      :show="showDeleteConfirm"
      :item-name="projectToDelete?.name"
      @close="cancelDelete"
      @confirm="confirmDelete"
    />

    <GenericAlertModal
      :show="showAlert"
      title="Error al Eliminar"
      :message="alertMessage"
      type="error"
      @close="showAlert = false"
    />
  </div>
</template>

<style scoped>
/* Estilos específicos de marca MDA */
.audio-text {
  color: var(--color-geist-accents-5);
}
</style>
