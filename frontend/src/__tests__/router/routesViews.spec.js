import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import App from '../../App.vue'
import KanbanView from '../../views/KanbanView.vue'
import BacklogView from '../../views/BacklogView.vue'
import ChronologieView from '../../views/ChronologieView.vue'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'

describe('Route -> View mapping', () => {
  let router
  let wrapper

  beforeEach(async () => {
    const routes = [
      { path: '/', redirect: '/kanban' },
      { path: '/kanban', component: KanbanView },
      { path: '/backlog', component: BacklogView },
      { path: '/chronologie', component: ChronologieView },
      // minimal placeholders for auth routes
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/register', component: { template: '<div>Register</div>' } },
    ]

  router = createRouter({ history: createMemoryHistory(), routes })
  const pinia = createPinia()
  wrapper = mount(App, { global: { plugins: [router, pinia] } })
  await router.isReady()
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  test('renders KanbanView on /kanban', async () => {
    await router.push('/kanban')
    await router.isReady()
    await nextTick()
    expect(wrapper.text()).toContain('Tableau Kanban')
  })

  test('renders BacklogView on /backlog', async () => {
    await router.push('/backlog')
    await router.isReady()
    await nextTick()
    expect(wrapper.text()).toContain('Backlog')
  })

  test('renders ChronologieView on /chronologie', async () => {
    await router.push('/chronologie')
    await router.isReady()
    await nextTick()
    expect(wrapper.text()).toContain('Chronologie')
  })
})
