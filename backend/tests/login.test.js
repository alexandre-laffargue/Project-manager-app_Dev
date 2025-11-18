import request from 'supertest'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

const mockFindOne = vi.fn()
const mockCompare = vi.fn()

vi.mock('bcryptjs', () => ({
  compare: (...args) => mockCompare(...args)
}))

let app

beforeAll(async () => {
  // ensure JWT secret for signJwt
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

  // import the real User model and patch methods in-place
  // require the model via CommonJS require to patch the exact module instance
  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)
  const UserModel = req('../src/models/User.js')
  UserModel.findOne = (...args) => mockFindOne(...args)

  const mod = await import('../src/app.js')
  app = mod.default || mod
})

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    mockFindOne.mockReset()
    mockCompare.mockReset()
  })

  it('should login successfully with correct credentials', async () => {
      // Call the controller directly with mocked model & bcrypt to avoid express/middleware module-hoisting issues
      const fakeUser = { _id: '507f191e810c19729de860ea', email: 'user@example.com', name: 'User', passwordHash: 'hash', roles: ['user'] }
      mockFindOne.mockResolvedValue(fakeUser)
      mockCompare.mockResolvedValue(true)

      // require the controller & model via CommonJS to ensure we patch the same instances
      const { createRequire } = await import('module')
      const reqC = createRequire(import.meta.url)
      const UserModel = reqC('../src/models/User.js')
      UserModel.findOne = (...args) => mockFindOne(...args)

      const bcryptC = reqC('bcryptjs')
      bcryptC.compare = (...args) => mockCompare(...args)

      const authController = reqC('../src/controllers/auth.controller.js')

      const req = { body: { email: fakeUser.email, password: 'password123' } }
      let sent = {}
      const res = {
        json (obj) { sent = { status: 200, body: obj }; return this },
        status (s) { sent.status = s; return this }
      }

      await authController.login(req, res, (err) => { if (err) throw err })

      expect(sent.body).toHaveProperty('token')
      expect(sent.body).toHaveProperty('user')
      expect(sent.body.user.email).toBe(fakeUser.email)
  })

  it('should return 401 for wrong password', async () => {
    const fakeUser = { _id: '507f191e810c19729de860eb', email: 'user2@example.com', name: 'User2', passwordHash: 'hash' }
    mockFindOne.mockResolvedValue(fakeUser)
    mockCompare.mockResolvedValue(false)

    // use an invalid but valid length password so Joi passes and controller can check credentials
    const res = await request(app).post('/api/auth/login').send({ email: fakeUser.email, password: 'wrongpass' })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('should return 401 when user not found', async () => {
    mockFindOne.mockResolvedValue(null)
    mockCompare.mockResolvedValue(false)

    const res = await request(app).post('/api/auth/login').send({ email: 'notfound@example.com', password: 'whatever' })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('should return 400 for invalid payload', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'short' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})
