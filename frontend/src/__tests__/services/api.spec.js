import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setAuthToken, setRefreshToken, post, get, patch, del } from '@/services/api'

describe('API Service', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock
    setAuthToken(null)
    setRefreshToken(null)
    localStorage.clear()
    sessionStorage.clear()
    
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('setAuthToken', () => {
    it('sets auth token for subsequent requests', async () => {
      setAuthToken('my-token')
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      await get('/api/test')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        }),
      )
    })

    it('clears auth token when set to null', async () => {
      setAuthToken('token')
      setAuthToken(null)
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      await get('/api/test')

      const headers = fetchMock.mock.calls[0][1].headers
      expect(headers.Authorization).toBeUndefined()
    })
  })

  describe('GET requests', () => {
    it('makes a GET request with correct parameters', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      })

      const result = await get('/api/users')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      )
      expect(result).toEqual({ users: [] })
    })

    it('throws error on failed GET request', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'User not found' }),
      })

      await expect(get('/api/users/999')).rejects.toThrow('User not found')
    })

    it('handles non-JSON responses gracefully', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Not JSON')),
      })

      const result = await get('/api/health')
      expect(result).toBeNull()
    })
  })

  describe('POST requests', () => {
    it('makes a POST request with JSON body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '123', name: 'Test' }),
      })

      const result = await post('/api/boards', { name: 'Test' })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/boards',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      )
      expect(result).toEqual({ id: '123', name: 'Test' })
    })

    it('throws error with custom message on POST failure', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid name', message: 'Name is required' }),
      })

      await expect(post('/api/boards', {})).rejects.toThrow('Invalid name')
    })
  })

  describe('PATCH requests', () => {
    it('makes a PATCH request with partial body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '123', title: 'Updated' }),
      })

      const result = await patch('/api/cards/123', { title: 'Updated' })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/cards/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ title: 'Updated' }),
        }),
      )
      expect(result).toEqual({ id: '123', title: 'Updated' })
    })
  })

  describe('DELETE requests', () => {
    it('makes a DELETE request', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      })

      const result = await del('/api/cards/123')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/cards/123',
        expect.objectContaining({
          method: 'DELETE',
        }),
      )
      expect(result).toBeNull()
    })

    it('handles 204 No Content responses', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('No content')),
      })

      const result = await del('/api/cards/123')
      expect(result).toBeNull()
    })
  })

  describe('Error handling', () => {
    it('includes status code in thrown error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Access denied' }),
      })

      try {
        await get('/api/admin')
      } catch (err) {
        expect(err.status).toBe(403)
        expect(err.message).toBe('Access denied')
      }
    })

    it('falls back to statusText when no error message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      })

      await expect(get('/api/error')).rejects.toThrow('Internal Server Error')
    })

    it('uses generic message when all else fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: '',
        json: () => Promise.resolve(null),
      })

      await expect(get('/api/error')).rejects.toThrow('Request failed')
    })
  })

  describe('Token Refresh', () => {
    it('refreshes token on 401 and retries request', async () => {
      setAuthToken('expired-token')
      setRefreshToken('valid-refresh-token')

      // First call fails with 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Token expired' })
      })

      // Refresh call succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'new-access-token' })
      })

      // Retry call succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'success' })
      })

      const result = await get('/api/protected')

      expect(fetchMock).toHaveBeenCalledTimes(3)
      // 1. Initial request
      expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/protected', expect.anything())
      // 2. Refresh request
      expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/auth/refresh'), expect.anything())
      // 3. Retry request with new token
      expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/protected', expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer new-access-token'
        })
      }))
      expect(result).toEqual({ data: 'success' })
    })

    it('logs out user if refresh fails', async () => {
      setAuthToken('expired-token')
      setRefreshToken('invalid-refresh-token')

      // First call fails with 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Token expired' })
      })

      // Refresh call fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Invalid refresh token' })
      })

      await expect(get('/api/protected')).rejects.toThrow('Refresh failed')

      expect(window.location.href).toBe('/login')
    })

    it('queues concurrent requests during refresh', async () => {
      setAuthToken('expired-token')
      setRefreshToken('valid-refresh-token')

      // Mock responses
      fetchMock.mockImplementation(async (url) => {
        if (url === '/api/req1' || url === '/api/req2') {
          // If no token or expired token, return 401
          // We need to simulate state change. 
          // But simpler: use a counter or check headers.
          // Actually, let's just use mockResolvedValueOnce for the 401s and refresh
          // and mockImplementation for the retries.
          return {
             ok: true,
             json: () => Promise.resolve({ id: url === '/api/req1' ? 1 : 2 })
          }
        }
        return { ok: true, json: () => Promise.resolve({}) }
      })

      // Override the first few calls to force the refresh flow
      fetchMock
        .mockResolvedValueOnce({ // Req 1 -> 401
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Token expired' })
        })
        .mockResolvedValueOnce({ // Req 2 -> 401
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Token expired' })
        })
        .mockResolvedValueOnce({ // Refresh
          ok: true,
          json: () => Promise.resolve({ token: 'new-token' })
        })
        // Subsequent calls will use the mockImplementation above (returning id 1 or 2)

      const [res1, res2] = await Promise.all([
        get('/api/req1'),
        get('/api/req2')
      ])

      expect(res1).toEqual({ id: 1 })
      expect(res2).toEqual({ id: 2 })
      
      // Should only call refresh once
      const refreshCalls = fetchMock.mock.calls.filter(call => call[0].includes('/refresh'))
      expect(refreshCalls.length).toBe(1)
    })
  })
})
