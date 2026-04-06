<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import keycloak from '../plugins/keycloak'
import { useProjectStore } from '../stores/projectStore'
import { useUserStore } from '../stores/userStore'
import type { Project } from '../types'

// Componentes
import ProjectCard from '../components/ProjectCard.vue'
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue'
import BaseButton from '../components/base/BaseButton.vue'

const router = useRouter()
const userStore = useUserStore()
const projectStore = useProjectStore()

const isLoading = ref(true)
const isAuthenticated = ref(false)
const firstName = ref('')

const showDeleteConfirm = ref(false)
const projectToDelete = ref<Project | null>(null)
const isDeleting = ref(false)

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

const login = () => keycloak.login()
const register = () => router.push('/register')
const createProject = () => router.push('/projects/new')

const openDeleteConfirm = (project: Project) => {
  projectToDelete.value = project
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  projectToDelete.value = null
}

const confirmDelete = async () => {
  if (!projectToDelete.value) return
  
  isDeleting.value = true
  const result = await projectStore.deleteProject(projectToDelete.value.id)
  isDeleting.value = false
  
  if (result.success) {
    showDeleteConfirm.value = false
    projectToDelete.value = null
  } else {
    alert(result.message || 'Error al eliminar el proyecto')
  }
}

const editProject = (id: number) => {
  router.push(`/projects/${id}/edit`)
}
</script>

<template>
  <div class="h-screen pt-12 pb-6 px-6 max-w-6xl mx-auto flex flex-col overflow-hidden text-geist-fg">
    
    <!-- Contenido Scrollable (Cargando, Landing o Dashboard) -->
    <div class="flex-1 overflow-y-auto scrollbar-hide pr-2">
      
      <!-- Estado de Carga -->
      <div v-if="isLoading" class="h-full flex items-center justify-center">
        <div class="flex gap-2">
          <div class="w-1.5 h-1.5 bg-geist-fg rounded-full animate-bounce"></div>
          <div class="w-1.5 h-1.5 bg-geist-fg rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div class="w-1.5 h-1.5 bg-geist-fg rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>

      <div v-else class="w-full">
        <!-- Vista Landing (Usuario no autenticado) -->
        <div v-if="!isAuthenticated" class="mt-8 md:mt-24 flex flex-col items-center text-center space-y-12">
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
          
          <p class="text-[10px] uppercase tracking-[0.2em] font-medium text-geist-accents-4">
            Versión Música Electrónica
          </p>
        </div>

        <!-- Vista Dashboard (Usuario autenticado) -->
        <div v-else class="space-y-12 pt-4">
          <header class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tighter">Tus Proyectos</h1>
            <p class="text-geist-accents-5 text-sm font-medium">Gestiona y crea tus espacios de trabajo.</p>
          </header>

          <!-- Grid de Proyectos -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-8">
            
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
              @edit="editProject(project.id)"
              @delete="openDeleteConfirm(project)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación -->
    <DeleteConfirmModal 
      :show="showDeleteConfirm"
      :project-name="projectToDelete?.name"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
/* Estilos específicos de marca MDA */
.audio-text {
  color: var(--color-geist-accents-5);
}
</style>
