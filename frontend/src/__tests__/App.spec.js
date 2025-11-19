import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts renders properly', () => {
    const wrapper = mount(App)
    // App now renders the router view; simply assert it mounts without error
    expect(wrapper.exists()).toBe(true)
  })
})
