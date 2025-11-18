import request from 'supertest'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// prepare mocks BEFORE importing the app (we'll patch the real model object)
const mockFindOne = vi.fn()
const mockCreate = vi.fn()

let app

beforeAll(async () => {
	// Ensure JWT secret exists for signJwt
	process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

	// Import the real User model and overwrite the methods with our mocks
	const userMod = await import('../src/models/User.js')
	const UserModel = userMod.default || userMod
	// replace methods in-place so controllers that required the model see the mocks
	UserModel.findOne = (...args) => mockFindOne(...args)
	UserModel.create = (...args) => mockCreate(...args)

	const mod = await import('../src/app.js')
	app = mod.default || mod
})

describe('POST /api/auth/register', () => {
	beforeEach(() => {
		mockFindOne.mockReset()
		mockCreate.mockReset()
	})

	it('should register a new user and return token + user', async () => {
		mockFindOne.mockResolvedValue(null)
		mockCreate.mockImplementation(async (user) => ({ _id: '507f191e810c19729de860ea', email: user.email, name: user.name, roles: user.roles || ['user'] }))

		const payload = { email: 'test+1@example.com', password: 'password123', name: 'Test User' }
		const res = await request(app).post('/api/auth/register').send(payload)

		expect(res.status).toBe(201)
		expect(res.body).toHaveProperty('token')
		expect(res.body).toHaveProperty('user')
		expect(res.body.user.email).toBe(payload.email)
		expect(res.body.user.name).toBe(payload.name)
	})

	it('should return 409 when email already used', async () => {
		mockFindOne.mockResolvedValue({ _id: 'existing', email: 'taken@example.com' })

		const payload = { email: 'taken@example.com', password: 'password123', name: 'Taken' }
		const res = await request(app).post('/api/auth/register').send(payload)

		expect(res.status).toBe(409)
		expect(res.body).toHaveProperty('error')
	})

	it('should return 400 for invalid payload', async () => {
		// invalid email and short password
		const payload = { email: 'not-an-email', password: 'short', name: '' }
		const res = await request(app).post('/api/auth/register').send(payload)

		expect(res.status).toBe(400)
		expect(res.body).toHaveProperty('error')
	})
})

