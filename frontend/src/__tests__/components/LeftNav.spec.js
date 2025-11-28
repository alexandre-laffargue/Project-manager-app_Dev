import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockRouter, resetTestMocks } from '../utils/testUtils'

describe('LeftNav logout', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('shows user name and calls logout + navigates to /login when clicking Déconnexion', async () => {
    const mockLogout = vi.fn()
    const mockPush = vi.fn()

    mockAuthStore({ isAuthenticated: true, user: { name: 'Alice' }, logout: mockLogout })
    mockRouter({ push: mockPush, route: { path: '/kanban' } })

    const { default: LeftNav } = await import('../../components/LeftNav.vue')
    const wrapper = mount(LeftNav)

    // user name displayed
    expect(wrapper.text()).toContain('Bonjour')
    expect(wrapper.text()).toContain('Alice')

    // click logout
    const btn = wrapper.find('.nav-bottom .login-btn')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')

    expect(mockLogout).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('navigates to route when clicking a nav item and sets it active', async () => {
    resetTestMocks()
    const mockPush = vi.fn()
    // start on Kanban
    mockRouter({ push: mockPush, route: { path: '/kanban' } })

    const { default: LeftNav } = await import('../../components/LeftNav.vue')
    const wrapper = mount(LeftNav)

    // find the Backlog item by text
    const items = wrapper.findAll('.nav-list .nav-item')
    const backlog = items.find(i => i.text().includes('Backlog'))
    expect(backlog).toBeTruthy()

    await backlog.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/backlog')
    // after click it should have active class
    expect(backlog.classes()).toContain('active')
  })

  it('selects nav item with keyboard (Enter and Space)', async () => {
    resetTestMocks()
    const mockPush = vi.fn()
    mockRouter({ push: mockPush, route: { path: '/kanban' } })

    const { default: LeftNav } = await import('../../components/LeftNav.vue')
    const wrapper = mount(LeftNav)

    const items = wrapper.findAll('.nav-list .nav-item')
    const chronologie = items.find(i => i.text().includes('Chronologie'))
    expect(chronologie).toBeTruthy()

    await chronologie.trigger('keydown.enter')
    expect(mockPush).toHaveBeenCalledWith('/chronologie')

    // reset and test space
    mockPush.mockClear()
    await chronologie.trigger('keydown.space')
    expect(mockPush).toHaveBeenCalledWith('/chronologie')
  })

  it('initially marks the correct item active based on route.path', async () => {
    resetTestMocks()
    const mockPush = vi.fn()
    mockRouter({ push: mockPush, route: { path: '/chronologie' } })

    const { default: LeftNav } = await import('../../components/LeftNav.vue')
    const wrapper = mount(LeftNav)

    const items = wrapper.findAll('.nav-list .nav-item')
    const chronologie = items.find(i => i.text().includes('Chronologie'))
    expect(chronologie.classes()).toContain('active')
  })
})
