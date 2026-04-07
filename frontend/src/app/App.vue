<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import keycloak from '@/app/plugins/keycloak'
import { useUserStore } from '@/modules/auth/stores/userStore'
import { useProjectStore } from '@/modules/projects/stores/projectStore'
import { useRoute, useRouter } from 'vue-router'
 
const userStore = useUserStore()
const projectStore = useProjectStore()
const route = useRoute()
const router = useRouter()

const isDarkMode = ref(true) // Skills.sh (Geist) es oscuro por defecto
const isAuthenticated = ref(false)

const firstName = computed(() => userStore.user?.firstName || 'Usuario')

const currentProject = computed(() => {
  if (route.name === 'project-dashboard' && route.params.id) {
    const id = Number(route.params.id)
    return projectStore.projects.find(p => p.id === id)
  }
  return null
})

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  updateTheme()
}

const updateTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const logout = () => keycloak.logout({ redirectUri: window.location.origin })

onMounted(async () => {
  // Configuración de Tema
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark'
  } else {
    isDarkMode.value = true
  }
  updateTheme()

  // Configuración de Autenticación
  isAuthenticated.value = keycloak.authenticated || false
})
</script>

<template>
  <div class="min-h-screen transition-colors duration-200">
    
    <!-- Navbar Global (Solo Autenticados) -->
    <nav v-if="isAuthenticated" class="fixed top-0 w-full py-4 px-8 flex justify-between items-center max-w-screen-2xl left-1/2 -translate-x-1/2 z-40 h-12 border-b border-geist-border bg-geist-bg/80 backdrop-blur-md shadow-sm">
      <!-- Logo e Inicio -->
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-geist-fg rounded-full"></div>
        <router-link to="/" class="text-sm font-bold tracking-tighter uppercase">MDA Audio</router-link>
      </div>

      <!-- Título del Proyecto (Monocromo Retro) -->
      <transition name="fade-retro">
        <div 
          v-if="currentProject" 
          @click="router.push(`/projects/${currentProject.id}/edit`)"
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group z-50 h-full px-4"
        >
          <div class="retro-monitor-text text-sm md:text-base font-mono font-bold tracking-[0.2em] uppercase group-hover:text-geist-fg transition-colors">
            {{ currentProject.name }}
          </div>
        </div>
      </transition>

      <!-- Perímetro y Usuario -->
      <div class="flex items-center gap-6">
        <router-link to="/profile" class="flex items-center gap-2 text-sm font-medium hover:text-geist-accents-3 transition-colors underline-offset-4 hover:underline decoration-geist-accents-2 cursor-pointer">
          <i class="fa-regular fa-circle-user text-base"></i>
          {{ firstName }}
        </router-link>
        <button @click="logout" class="flex items-center gap-2 text-sm font-medium hover:text-geist-accents-3 transition-colors" title="Salir">
          <i class="fa-solid fa-arrow-right-from-bracket text-base"></i>
        </button>
      </div>
    </nav>
    
    <!-- Theme Toggle Minimalista -->
    <button 
      @click="toggleTheme" 
      class="fixed bottom-6 right-6 z-50 p-3 rounded-full border border-geist-border bg-geist-bg shadow-xl hover:border-geist-fg transition-all duration-200 active:scale-95"
      aria-label="Toggle Theme"
    >
      <svg v-if="!isDarkMode" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </button>

    <main class="relative pt-12" :class="!isAuthenticated ? 'pt-0' : ''">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <ToastContainer />
  </div>
</template>

<style>
/* Estilos Globales Relacionados con la Marca */
.mda-text {
  background: linear-gradient(to right, var(--color-geist-fg), var(--color-geist-accents-5));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Efecto Monitor Monocromo (Subtíl en Gris) */
.retro-monitor-text {
  color: var(--color-geist-accents-5); /* Gris oscuro estándar */
  letter-spacing: 0.2em;
  opacity: 0.8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  text-transform: uppercase;
}

.dark .retro-monitor-text {
  color: var(--color-geist-accents-4); /* Un gris ligeramente más claro para modo oscuro */
  opacity: 0.7;
}

/* Transiciones Retro */
.fade-retro-enter-active,
.fade-retro-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-retro-enter-from,
.fade-retro-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.9);
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
