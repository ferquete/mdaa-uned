<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import keycloak from '../plugins/keycloak'
import { useProjectStore } from '../stores/projectStore'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const projectStore = useProjectStore()
const isLoading = ref(true)
const isAuthenticated = ref(false)
const firstName = ref('')
const showDeleteConfirm = ref(false)
const projectToDelete = ref<any>(null)
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
const createProject = () => {
  router.push('/projects/new')
}

const openDeleteConfirm = (project: any) => {
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
</script>

<template>
  <div class="h-screen pt-12 pb-6 px-6 max-w-6xl mx-auto flex flex-col overflow-hidden">
    
    <!-- Contenido Scrollable (Cargando, Landing o Dashboard) -->
    <div class="flex-1 overflow-y-auto scrollbar-hide pr-2">
      <!-- Cargando Global -->
      <div v-if="isLoading" class="h-full flex items-center justify-center">
        <div class="flex gap-2">
          <div class="w-1.5 h-1.5 bg-geist-fg rounded-full animate-bounce"></div>
          <div class="w-1.5 h-1.5 bg-geist-fg rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div class="w-1.5 h-1.5 bg-geist-fg rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>

      <div v-else class="w-full">
        <!-- Landing View (No Autenticados) -->
        <div v-if="!isAuthenticated" class="mt-8 md:mt-24 flex flex-col items-center text-center space-y-12">
          <div class="space-y-4">
            <h1 class="flex justify-center items-baseline text-5xl md:text-7xl font-black tracking-tighter leading-tight text-geist-fg">
              <span class="mda-text">MDA</span><span class="audio-text">Audio</span>
            </h1>
            <p class="text-lg md:text-xl text-geist-accents-5 font-medium max-w-lg mx-auto">
              Generador de audio guiado por modelos
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button @click="login" class="geist-button-primary w-full sm:w-auto min-w-[200px]">
              Iniciar Sesión
            </button>
            <button @click="register" class="geist-button-secondary w-full sm:w-auto min-w-[200px]">
              Crear una Cuenta
            </button>
          </div>
          
          <p class="text-[10px] uppercase tracking-[0.2em] font-medium text-geist-accents-4">
            Versión Música Electrónica
          </p>
        </div>

        <!-- Dashboard View (Autenticados) -->
        <div v-else class="space-y-12 pt-4">
          <header class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tighter text-geist-fg">Tus Proyectos</h1>
            <p class="text-geist-accents-5 text-sm font-medium">Gestiona y crea tus espacios de trabajo.</p>
          </header>

          <!-- Proyectos Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-8">
            
            <!-- Botón Crear (+) -->
            <button 
              @click="createProject"
              class="aspect-square flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-geist-border hover:border-geist-fg hover:bg-geist-accents-1 transition-all group overflow-hidden"
            >
              <div class="w-12 h-12 rounded-full border border-geist-border flex items-center justify-center group-hover:scale-110 transition-transform bg-geist-bg shadow-sm">
                <span class="text-2xl font-light text-geist-accents-5 group-hover:text-geist-fg">+</span>
              </div>
              <span class="text-xs font-bold uppercase tracking-widest text-geist-accents-4 group-hover:text-geist-fg transition-colors">Crear Proyecto</span>
            </button>

            <!-- Skeleton Loading de Proyectos -->
            <template v-if="projectStore.loading && projectStore.projects.length === 0">
              <div v-for="i in 3" :key="i" class="aspect-square rounded-xl border border-geist-border bg-geist-accents-1 animate-pulse"></div>
            </template>

            <div 
              v-for="project in projectStore.projects" 
              :key="project.id"
              class="aspect-square p-6 rounded-xl border border-geist-border bg-geist-bg hover:border-geist-fg shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group relative cursor-pointer"
            >
              <!-- Botones de Acción (Lápiz y Aspa) -->
              <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                <!-- Botón Editar (Lápiz) -->
                <button 
                  @click.stop="router.push(`/projects/${project.id}/edit`)"
                  class="w-7 h-7 flex items-center justify-center rounded-full bg-geist-bg border border-geist-border text-geist-accents-4 hover:text-geist-fg hover:border-geist-fg transition-all"
                  title="Editar proyecto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>

                <!-- Botón Eliminar (Aspa) -->
                <button 
                  @click.stop="openDeleteConfirm(project)"
                  class="w-7 h-7 flex items-center justify-center rounded-full bg-geist-bg border border-geist-border text-geist-accents-4 hover:text-geist-error hover:border-geist-error transition-all"
                  title="Eliminar proyecto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div class="space-y-2">
                <h3 class="text-lg font-bold tracking-tight text-geist-fg line-clamp-2 leading-tight">{{ project.name }}</h3>
                <p class="text-xs text-geist-accents-5 line-clamp-3 leading-relaxed">{{ project.description || 'Sin descripción' }}</p>
              </div>
              <div class="flex items-center justify-between mt-auto pt-4">
                <div class="w-8 h-8 rounded-lg bg-geist-accents-1 flex items-center justify-center text-[10px] font-bold text-geist-accents-4 group-hover:bg-geist-fg group-hover:text-geist-bg transition-colors uppercase">
                  {{ project.name.substring(0, 2) }}
                </div>
                <span class="text-[10px] uppercase tracking-widest font-bold text-geist-accents-3">Ver Detalle</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Borrado -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-geist-bg/80 backdrop-blur-sm" @click="cancelDelete"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-geist-bg border border-geist-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
          <div class="p-8 space-y-6">
            <div class="space-y-2">
              <h2 class="text-2xl font-bold tracking-tight text-geist-fg">Eliminar Proyecto</h2>
              <p class="text-geist-accents-5 text-sm leading-relaxed">
                ¿Estás seguro de que quieres eliminar <span class="font-bold text-geist-fg">"{{ projectToDelete?.name }}"</span>? 
                Esta acción no se puede deshacer.
              </p>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                @click="confirmDelete" 
                :disabled="isDeleting"
                class="geist-button-error flex-1"
              >
                {{ isDeleting ? 'Eliminando...' : 'Sí, eliminar' }}
              </button>
              <button 
                @click="cancelDelete" 
                :disabled="isDeleting"
                class="geist-button-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Animaciones simples */
.animate-in {
  animation-fill-mode: forwards;
}
@keyframes zoom-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.zoom-in {
  animation-name: zoom-in;
}
</style>
