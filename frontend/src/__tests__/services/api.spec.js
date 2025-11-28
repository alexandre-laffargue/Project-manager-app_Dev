import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setAuthToken, post, get, patch, del } from '@/services/api'

describe('API Service', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock
    setAuthToken(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('setAuthToken', () => {
    it('sets auth token for subsequent requests', async () => {
      setAuthToken('my-token')
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      })

      await get('/api/test')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token'
          })
        })
      )
    })

    it('clears auth token when set to null', async () => {
      setAuthToken('token')
      setAuthToken(null)
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
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
        json: () => Promise.resolve({ users: [] })
      })

      const result = await get('/api/users')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual({ users: [] })
    })

    it('throws error on failed GET request', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'User not found' })
      })

      await expect(get('/api/users/999')).rejects.toThrow('User not found')
    })

    it('handles non-JSON responses gracefully', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Not JSON'))
      })

      const result = await get('/api/health')
      expect(result).toBeNull()
    })
  })

  describe('POST requests', () => {
    it('makes a POST request with JSON body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '123', name: 'Test' })
      })

      const result = await post('/api/boards', { name: 'Test' })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/boards',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual({ id: '123', name: 'Test' })
    })

    it('throws error with custom message on POST failure', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid name', message: 'Name is required' })
      })

      await expect(post('/api/boards', {})).rejects.toThrow('Invalid name')
    })
  })

  describe('PATCH requests', () => {
    it('makes a PATCH request with partial body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '123', title: 'Updated' })
      })

      const result = await patch('/api/cards/123', { title: 'Updated' })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/cards/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ title: 'Updated' })
        })
      )
      expect(result).toEqual({ id: '123', title: 'Updated' })
    })
  })

  describe('DELETE requests', () => {
    it('makes a DELETE request', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null)
      })

      const result = await del('/api/cards/123')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/cards/123',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
      expect(result).toBeNull()
    })

    it('handles 204 No Content responses', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('No content'))
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
        json: () => Promise.resolve({ error: 'Access denied' })
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
        json: () => Promise.resolve({})
      })

      await expect(get('/api/error')).rejects.toThrow('Internal Server Error')
    })

    it('uses generic message when all else fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: '',
        json: () => Promise.resolve(null)
      })

      await expect(get('/api/error')).rejects.toThrow('Request failed')
    })
  })
})
