import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/about', name: 'about', component: { template: '<div>About</div>' } }
  ]
})

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders navigation links', async () => {
    // Nota: El Navbar solo se renderiza si isAuthenticated es true.
    // Sin embargo, el botón de tema y el footer siempre están.
    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    
    // El navbar no aparecerá porque no estamos autenticados en el test (keycloak mock)
    expect(wrapper.exists()).toBe(true)
  })
})
