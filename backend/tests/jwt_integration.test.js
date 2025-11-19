import request from 'supertest'
import { describe, it, expect, beforeAll } from 'vitest'
import mongoose from 'mongoose'

let app
let token
let usingExternalMongo = false
let mongod

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
  process.env.JWT_EXPIRES_IN = '1h'

  // support external MongoDB via MONGODB_URI (useful for CI)
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI)
    usingExternalMongo = true
  } else {
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    mongod = await MongoMemoryServer.create()
    await mongoose.connect(mongod.getUri())
  }

  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)
  const auth = req('../src/middlewares/auth.js')

  const { signJwt } = req('../src/utils/jwt.js')
  token = signJwt({ sub: new mongoose.Types.ObjectId().toString(), email: 'int@example.com' })

  // require app via CommonJS to avoid ESM/CJS interop issues
  app = req('../src/app.js')
})

afterAll(async () => {
  await mongoose.disconnect()
  if (!usingExternalMongo && mongod) await mongod.stop()
})

describe('JWT integration', () => {
  it('should reject requests without token', async () => {
    const res = await request(app).get('/api/boards/me')
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('should accept requests with valid token', async () => {
    const res = await request(app).get('/api/boards/me').set('Authorization', `Bearer ${token}`)
    expect([200, 204, 404]).toContain(res.status) 
  })
})
