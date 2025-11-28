import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockRouter, resetTestMocks } from '../utils/testUtils'

// create mock functions
const mockLogin = vi.fn()
const mockPush = vi.fn()

describe('LoginView', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('renders and validates inputs', async () => {
    // setup mocks: auth store with mocked login and router
    mockAuthStore({ login: mockLogin })
    mockRouter({ push: mockPush })

    const { default: LoginView } = await import('../../views/LoginView.vue')
    const wrapper = mount(LoginView)

    // submit with empty fields -> should show validation messages and not call login
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain("L'adresse e-mail est requise.")
    expect(wrapper.text()).toContain('Le mot de passe est requis.')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('calls auth.login and navigates on success', async () => {
    // make login succeed
    mockLogin.mockResolvedValue({ token: 'fake', user: { email: 'x' } })

    // setup mocks for this test
    mockAuthStore({ login: mockLogin })
    mockRouter({ push: mockPush })

    const { default: LoginView } = await import('../../views/LoginView.vue')
    const wrapper = mount(LoginView)
    const email = wrapper.find('#email')
    const pwd = wrapper.find('#password')

    await email.setValue('test@example.com')
    await pwd.setValue('password123')

    await wrapper.find('form').trigger('submit.prevent')

    // wait for microtasks (promise resolution) instead of fake timers
    await Promise.resolve()
    await Promise.resolve()

    expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123', remember: false })
    expect(mockPush).toHaveBeenCalledWith('/kanban')
  })

  it('shows error when email is invalid and does not call login', async () => {
    // setup mocks
    mockAuthStore({ login: mockLogin })
    mockRouter({ push: mockPush })

    const { default: LoginView } = await import('../../views/LoginView.vue')
    const wrapper = mount(LoginView)

    const email = wrapper.find('#email')
    const pwd = wrapper.find('#password')

    await email.setValue('bad-email')
    await pwd.setValue('password123')

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain("L'adresse e-mail n'est pas valide.")
    expect(mockLogin).not.toHaveBeenCalled()
  })
})
