import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HomeView from './HomeView.vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } }
  ]
})

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders properly', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    
    // Esperar a que onMounted termine (isLoading -> false)
    await flushPromises()
    
    expect(wrapper.text()).toContain('MDA')
    expect(wrapper.text()).toContain('Audio')
    expect(wrapper.text()).toContain('Generador de audio guiado por modelos')
  })

  it('contains the main layout features', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    
    await flushPromises()
    
    expect(wrapper.find('.max-w-6xl').exists()).toBe(true)
  })
})
