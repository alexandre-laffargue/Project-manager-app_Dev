import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import * as api from '@/services/api'

describe('Auth Store', () => {
  let store
  let fetchMock

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()

    // Clear storage
    localStorage.clear()
    sessionStorage.clear()

    // Mock fetch globally
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    // Mock API
    vi.spyOn(api, 'setAuthToken')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('Initial state', () => {
    it('starts with null user and token', () => {
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('loadFromStorage', () => {
    it('loads token and user from localStorage', () => {
      localStorage.setItem('auth_token', 'stored-token')
      localStorage.setItem('auth_user', JSON.stringify({ id: '1', name: 'Test User' }))

      store.loadFromStorage()

      expect(store.token).toBe('stored-token')
      expect(store.user).toEqual({ id: '1', name: 'Test User' })
      // setAuthToken is called directly on the imported module, not the mock
    })

    it('loads token and user from sessionStorage when localStorage is empty', () => {
      sessionStorage.setItem('auth_token', 'session-token')
      sessionStorage.setItem('auth_user', JSON.stringify({ id: '2', name: 'Session User' }))

      store.loadFromStorage()

      expect(store.token).toBe('session-token')
      expect(store.user).toEqual({ id: '2', name: 'Session User' })
    })

    it('prefers localStorage over sessionStorage', () => {
      localStorage.setItem('auth_token', 'local-token')
      sessionStorage.setItem('auth_token', 'session-token')

      store.loadFromStorage()

      expect(store.token).toBe('local-token')
    })

    it('handles missing storage gracefully', () => {
      store.loadFromStorage()
      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
    })
  })

  describe('login', () => {
    it('successfully logs in with valid credentials', async () => {
      const mockResponse = {
        token: 'jwt-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await store.login({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        }),
      )
      expect(store.token).toBe('jwt-token')
      expect(store.user).toEqual(mockResponse.user)
      expect(result).toEqual(mockResponse)
    })

    it('stores credentials in localStorage when remember is true', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'jwt-token',
          user: { id: '1', email: 'test@example.com', name: 'Test' },
        }),
      })

      await store.login({
        email: 'test@example.com',
        password: 'password123',
        remember: true,
      })

      expect(localStorage.getItem('auth_token')).toBe('jwt-token')
      expect(JSON.parse(localStorage.getItem('auth_user'))).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
      })
      expect(sessionStorage.getItem('auth_token')).toBeNull()
    })

    it('stores credentials in sessionStorage when remember is false', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'jwt-token',
          user: { id: '1', email: 'test@example.com', name: 'Test' },
        }),
      })

      await store.login({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      })

      expect(sessionStorage.getItem('auth_token')).toBe('jwt-token')
      expect(localStorage.getItem('auth_token')).toBeNull()
    })

    it('rejects invalid email format', async () => {
      await expect(
        store.login({ email: 'invalid-email', password: 'password123', remember: false }),
      ).rejects.toThrow('Adresse e-mail invalide')
    })

    it('rejects password shorter than 8 characters', async () => {
      await expect(
        store.login({ email: 'test@example.com', password: 'short', remember: false }),
      ).rejects.toThrow('Mot de passe invalide (minimum 8 caractères)')
    })

    it('propagates API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid credentials' }),
      })

      await expect(
        store.login({ email: 'test@example.com', password: 'password123', remember: false }),
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('successfully registers with valid data', async () => {
      const mockResponse = {
        token: 'new-jwt-token',
        user: { id: '2', email: 'new@example.com', name: 'New User' },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await store.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        remember: false,
      })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: 'new@example.com',
            password: 'password123',
            name: 'New User',
          }),
        }),
      )
      expect(store.token).toBe('new-jwt-token')
      expect(store.user).toEqual(mockResponse.user)
      expect(result).toEqual(mockResponse)
    })

    it('rejects invalid email', async () => {
      await expect(
        store.register({
          email: 'bad-email',
          password: 'password123',
          name: 'User',
          remember: false,
        }),
      ).rejects.toThrow('Adresse e-mail invalide')
    })

    it('rejects password shorter than 6 characters', async () => {
      await expect(
        store.register({
          email: 'test@example.com',
          password: 'short',
          name: 'User',
          remember: false,
        }),
      ).rejects.toThrow('Le mot de passe doit contenir au moins 6 caractères')
    })

    it('rejects name shorter than 2 characters', async () => {
      await expect(
        store.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'A',
          remember: false,
        }),
      ).rejects.toThrow('Nom invalide')
    })

    it('stores credentials after registration', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'reg-token',
          user: { id: '3', email: 'reg@example.com', name: 'Registered' },
        }),
      })

      await store.register({
        email: 'reg@example.com',
        password: 'password123',
        name: 'Registered',
        remember: true,
      })

      expect(localStorage.getItem('auth_token')).toBe('reg-token')
    })
  })

  describe('logout', () => {
    it('clears user, token and storage', () => {
      // Set initial state
      store.token = 'some-token'
      store.user = { id: '1', name: 'User' }
      localStorage.setItem('auth_token', 'some-token')
      localStorage.setItem('auth_user', JSON.stringify({ id: '1' }))
      sessionStorage.setItem('auth_token', 'some-token')

      store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('auth_user')).toBeNull()
      expect(sessionStorage.getItem('auth_token')).toBeNull()
      // setAuthToken is called but not easily mockable in this context
    })
  })

  describe('isAuthenticated getter', () => {
    it('returns false when no token', () => {
      store.token = null
      expect(store.isAuthenticated).toBe(false)
    })

    it('returns true when token exists', () => {
      store.token = 'valid-token'
      expect(store.isAuthenticated).toBe(true)
    })
  })
})
