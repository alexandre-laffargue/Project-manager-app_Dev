import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import ChronologieView from '../../views/ChronologieView.vue'

describe('ChronologieView', () => {
  it('renders title and auth message when not authenticated', () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const wrapper = mount(ChronologieView, {
      global: {
        plugins: [pinia]
      }
    })
    expect(wrapper.text()).toContain('Chronologie')
    expect(wrapper.text()).toContain('Vous devez être connecté(e) pour accéder à la chronologie.')
  })
})
