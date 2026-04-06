import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/modules/projects/views/HomeView.vue'
import RegisterView from '@/modules/auth/views/RegisterView.vue'

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
      path: '/projects/:id/edit',
      name: 'edit-project',
      meta: { requiresAuth: true },
      component: () => import('@/modules/projects/views/CreateProjectView.vue')
    }
  ]
})

import keycloak from '@/app/plugins/keycloak'

router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  // Si la ruta requiere autenticación y no estamos autenticados
  if (requiresAuth && !keycloak.authenticated) {
    // Evitar disparar login() si ya hay un código o error en la URL (evita bucles)
    const hasAuthParams = window.location.hash.includes('code=') || 
                         window.location.hash.includes('error=') ||
                         window.location.search.includes('code=');
                         
    if (!hasAuthParams) {
      keycloak.login();
    } else {
      // Dejar que Keycloak procese los parámetros
      next();
    }
  } else {
    next();
  }
})

export default router
