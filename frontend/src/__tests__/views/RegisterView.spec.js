import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockRouter, resetTestMocks } from '../utils/testUtils'

const mockRegister = vi.fn()
const mockPush = vi.fn()

describe('RegisterView', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('renders and validates inputs', async () => {
    mockAuthStore({ register: mockRegister })
    mockRouter({ push: mockPush })

    const { default: RegisterView } = await import('../../views/RegisterView.vue')
    const wrapper = mount(RegisterView)

    // submit with empty fields -> should show validation messages and not call register
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain("L'adresse e-mail est requise.")
    expect(wrapper.text()).toContain('Le nom est requis.')
    expect(wrapper.text()).toContain('Le mot de passe est requis.')
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('calls auth.register and navigates on success', async () => {
    // make register succeed
    mockRegister.mockResolvedValue({ ok: true })

    mockAuthStore({ register: mockRegister })
    mockRouter({ push: mockPush })

    const { default: RegisterView } = await import('../../views/RegisterView.vue')
    const wrapper = mount(RegisterView)
    const email = wrapper.find('#email')
    const name = wrapper.find('#name')
    const pwd = wrapper.find('#password')
    const confirm = wrapper.find('#confirm')

    await email.setValue('newuser@example.com')
    await name.setValue('New User')
    await pwd.setValue('password123')
    await confirm.setValue('password123')

    await wrapper.find('form').trigger('submit.prevent')

    // wait for microtasks (promise resolution)
    await Promise.resolve()
    await Promise.resolve()

    expect(mockRegister).toHaveBeenCalledWith({ email: 'newuser@example.com', password: 'password123', name: 'New User' })
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('shows error when name is too short and does not call register', async () => {
    mockAuthStore({ register: mockRegister })
    mockRouter({ push: mockPush })

    const { default: RegisterView } = await import('../../views/RegisterView.vue')
    const wrapper = mount(RegisterView)

    const email = wrapper.find('#email')
    const name = wrapper.find('#name')
    const pwd = wrapper.find('#password')
    const confirm = wrapper.find('#confirm')

    await email.setValue('user@example.com')
    await name.setValue('A')
    await pwd.setValue('password123')
    await confirm.setValue('password123')

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Le nom doit contenir au moins 2 caractères.')
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows error when password is too short and does not call register', async () => {
    mockAuthStore({ register: mockRegister })
    mockRouter({ push: mockPush })

    const { default: RegisterView } = await import('../../views/RegisterView.vue')
    const wrapper = mount(RegisterView)

    const email = wrapper.find('#email')
    const name = wrapper.find('#name')
    const pwd = wrapper.find('#password')
    const confirm = wrapper.find('#confirm')

    await email.setValue('user@example.com')
    await name.setValue('Valid Name')
    await pwd.setValue('123')
    await confirm.setValue('123')

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Le mot de passe doit contenir au moins 6 caractères.')
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows error when passwords do not match and does not call register', async () => {
    mockAuthStore({ register: mockRegister })
    mockRouter({ push: mockPush })

    const { default: RegisterView } = await import('../../views/RegisterView.vue')
    const wrapper = mount(RegisterView)

    const email = wrapper.find('#email')
    const name = wrapper.find('#name')
    const pwd = wrapper.find('#password')
    const confirm = wrapper.find('#confirm')

    await email.setValue('user@example.com')
    await name.setValue('Valid Name')
    await pwd.setValue('password123')
    await confirm.setValue('different')

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain("Les mots de passe ne correspondent pas.")
    expect(mockRegister).not.toHaveBeenCalled()
  })
})
