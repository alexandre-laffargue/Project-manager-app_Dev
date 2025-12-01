// Helpers to centralize test mocks for frontend tests
import { vi } from 'vitest'

export function mockAuthStore({
  login = null,
  register = null,
  token = null,
  loadFromStorage = () => {},
  logout = null,
  isAuthenticated = false,
  user = null,
} = {}) {
  // call vi.mock synchronously so it happens before module imports in tests
  const factory = () => ({
    useAuthStore: () => ({
      login,
      register,
      token,
      loadFromStorage,
      logout,
      isAuthenticated,
      user,
    }),
  })
  vi.doMock('../../stores/auth', factory)
  vi.doMock('@/stores/auth', factory)
}

export function mockRouter({ push = () => {}, route = { path: '/' } } = {}) {
  vi.doMock('vue-router', async () => {
    const actual = await vi.importActual('vue-router')
    return {
      ...actual,
      useRouter: () => ({ push }),
      useRoute: () => route,
    }
  })
}

export function mockApi({
  get = () => Promise.resolve([]),
  post = () => Promise.resolve(),
  patch = () => Promise.resolve(),
  del = () => Promise.resolve(),
} = {}) {
  const factory = () => ({
    get: (...args) => get(...args),
    post: (...args) => post(...args),
    patch: (...args) => patch(...args),
    del: (...args) => del(...args),
  })
  // Mock both the relative path and the alias path to ensure module resolution
  vi.doMock('../../services/api', factory)
  vi.doMock('@/services/api', factory)
  // Also mock any nested imports from composables
  vi.doMock('../../composables/kanban/useKanbanBoard', async () => {
    const actual = await vi.importActual('../../composables/kanban/useKanbanBoard')
    return actual
  })
  vi.doMock('@/composables/kanban/useKanbanBoard', async () => {
    const actual = await vi.importActual('@/composables/kanban/useKanbanBoard')
    return actual
  })
}

export function resetTestMocks() {
  vi.clearAllMocks()
  vi.resetModules()
}
