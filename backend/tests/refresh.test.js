import request from 'supertest'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

const mockFindOne = vi.fn()
const mockVerifyJwt = vi.fn()

let app

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)
  
  // Patch User model
  const UserModel = req('../src/models/User.js')
  UserModel.findOne = (...args) => mockFindOne(...args)

  // Patch jwt utils
  const jwtUtils = req('../src/utils/jwt.js')
  const originalVerify = jwtUtils.verifyJwt
  jwtUtils.verifyJwt = (...args) => {
    if (mockVerifyJwt.mock.calls.length > 0) {
      return mockVerifyJwt(...args)
    }
    return originalVerify(...args)
  }

  app = req('../src/app.js')
})

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    mockFindOne.mockReset()
    mockVerifyJwt.mockReset()
  })

  it('should return a new access token with valid refresh token', async () => {
    const refreshToken = 'valid-refresh-token'
    const fakeUser = { 
      _id: '507f191e810c19729de860ea', 
      email: 'user@example.com', 
      name: 'User', 
      roles: ['user'],
      refreshToken 
    }
    
    mockVerifyJwt.mockReturnValue({ sub: fakeUser.email })
    mockFindOne.mockResolvedValue(fakeUser)

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(typeof res.body.token).toBe('string')
  })

  it('should return 401 when refresh token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({})

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Refresh token required')
  })

  it('should return 401 when refresh token is invalid (JWT verify fails)', async () => {
    mockVerifyJwt.mockImplementation(() => {
      throw new Error('Invalid token')
    })

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Invalid refresh token')
  })

  it('should return 401 when refresh token not found in database', async () => {
    const refreshToken = 'valid-but-not-in-db'
    
    mockVerifyJwt.mockReturnValue({ sub: 'user@example.com' })
    mockFindOne.mockResolvedValue(null) // User not found or token doesn't match

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Invalid refresh token')
  })

  it('should return 401 when user exists but refresh token does not match', async () => {
    const refreshToken = 'wrong-refresh-token'
    const fakeUser = { 
      _id: '507f191e810c19729de860ea', 
      email: 'user@example.com',
      refreshToken: 'different-token' 
    }
    
    mockVerifyJwt.mockReturnValue({ sub: fakeUser.email })
    mockFindOne.mockResolvedValue(null) // findOne with email AND refreshToken returns null

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Invalid refresh token')
  })
})
