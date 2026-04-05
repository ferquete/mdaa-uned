import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeView from './HomeView.vue'

describe('HomeView', () => {
  it('renders properly', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.text()).toContain('Base de Proyecto SaaS')
    expect(wrapper.text()).toContain('Spring Boot, Vue 3, Tailwind CSS y Keycloak')
  })

  it('contains the main features', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.text()).toContain('Backend Reactivo')
    expect(wrapper.text()).toContain('Frontend Moderno')
    expect(wrapper.text()).toContain('Seguridad Integrada')
  })
})
