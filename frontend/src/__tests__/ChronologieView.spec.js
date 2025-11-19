import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChronologieView from '../views/ChronologieView.vue'

describe('ChronologieView', () => {
  it('renders title and placeholder content', () => {
    const wrapper = mount(ChronologieView)
    expect(wrapper.text()).toContain('Chronologie')
    expect(wrapper.text()).toContain('Affichage des tâches dans le temps')
  })
})
