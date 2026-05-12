import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/modules/projects/views/HomeView.vue'
import RegisterView from '@/modules/auth/views/RegisterView.vue'
import keycloak from '@/app/plugins/keycloak'

/**
 * Configuración del Router principal de Vue.
 * Define las rutas de la aplicación y la jerarquía de vistas.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/profile',
      name: 'profile',
      meta: { requiresAuth: true },
      component: () => import('@/modules/profile/views/ProfileView.vue')
    },
    {
      path: '/projects/new',
      name: 'create-project',
      meta: { requiresAuth: true },
      component: () => import('@/modules/projects/views/CreateProjectView.vue')
    },
    {
      path: '/projects/:id',
      name: 'project-dashboard',
      meta: { requiresAuth: true },
      component: () => import('@/modules/projects/views/ProjectDashboardView.vue')
    },
    {
      path: '/projects/:id/edit',
      name: 'edit-project',
      meta: { requiresAuth: true },
      component: () => import('@/modules/projects/views/CreateProjectView.vue')
    }
  ]
})

/**
 * Guard de navegación global.
 * Verifica si la ruta requiere autenticación y, de ser así, comprueba el estado en Keycloak.
 * Si el usuario no está autenticado, lo redirige al portal de login.
 */
router.beforeEach((to) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth && !keycloak.authenticated) {
    const hasAuthParams = window.location.hash.includes('code=') || 
                         window.location.hash.includes('error=') ||
                         window.location.search.includes('code=');
                         
    if (!hasAuthParams) {
      keycloak.login();
      return false;
    }
  }
  return true;
})

export default router
