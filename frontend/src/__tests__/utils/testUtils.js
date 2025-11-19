// Helpers to centralize test mocks for frontend tests
import { vi } from 'vitest'

export function mockAuthStore({ login = null, register = null, token = null, loadFromStorage = () => {} } = {}) {
  // call vi.mock synchronously so it happens before module imports in tests
  vi.doMock('../../stores/auth', () => ({
    useAuthStore: () => ({ login, register, token, loadFromStorage })
  }))
}

export function mockRouter({ push = () => {}, route = { path: '/' } } = {}) {
  vi.doMock('vue-router', async () => {
    const actual = await vi.importActual('vue-router')
    return {
      ...actual,
      useRouter: () => ({ push }),
      useRoute: () => (route),
    }
  })
}

export function mockApi({ get = () => Promise.resolve([]), post = () => Promise.resolve(), patch = () => Promise.resolve(), del = () => Promise.resolve() } = {}) {
  vi.doMock('../../services/api', () => ({
    get: (...args) => get(...args),
    post: (...args) => post(...args),
    patch: (...args) => patch(...args),
    del: (...args) => del(...args),
  }))
}

export function resetTestMocks() {
  vi.clearAllMocks()
  vi.resetModules()
}
