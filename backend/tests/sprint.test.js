import request from 'supertest'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// Mocks
const mockSprintFind = vi.fn()
const mockSprintFindById = vi.fn()
const mockSprintSave = vi.fn()
const mockSprintConstructor = vi.fn()

let app

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)

  // Patch auth middleware
  const auth = req('../src/middlewares/auth.js')
  auth.requireAuth = (req2, res, next) => { req2.user = { sub: 'owner-1' }; next() }

  // Patch Sprint model
  const Sprint = req('../src/models/Sprint.js')
  Sprint.find = (...args) => mockSprintFind(...args)
  Sprint.findById = (...args) => mockSprintFindById(...args)
  
  // Mock Sprint constructor
  const OriginalSprint = Sprint
  const MockedSprint = function(data) {
    this.save = async () => {
      mockSprintSave()
      return { ...data, _id: 'sprint-new', ownerId: data.ownerId }
    }
    Object.assign(this, data)
    mockSprintConstructor(data)
  }
  MockedSprint.find = Sprint.find
  MockedSprint.findById = Sprint.findById
  
  // Replace Sprint in the module cache
  req.cache[req.resolve('../src/models/Sprint.js')].exports = MockedSprint

  app = req('../src/app.js')
})

beforeEach(() => {
  mockSprintFind.mockReset()
  mockSprintFindById.mockReset()
  mockSprintSave.mockReset()
  mockSprintConstructor.mockReset()
})

describe('Sprint API', () => {
  describe('GET /api/sprints', () => {
    it('should return all sprints for the owner', async () => {
      const sprints = [
        { _id: 's1', name: 'Sprint 1', ownerId: 'owner-1' },
        { _id: 's2', name: 'Sprint 2', ownerId: 'owner-1' }
      ]
      mockSprintFind.mockReturnValue({ sort: () => Promise.resolve(sprints) })

      const res = await request(app).get('/api/sprints')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(2)
    })

    it('should filter sprints by boardId if provided', async () => {
      const sprints = [{ _id: 's1', name: 'Sprint 1', ownerId: 'owner-1', boardId: 'board-1' }]
      mockSprintFind.mockReturnValue({ sort: () => Promise.resolve(sprints) })

      const res = await request(app).get('/api/sprints?boardId=board-1')
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
    })
  })

  describe('POST /api/sprints', () => {
    it('should create a new sprint', async () => {
      const sprintData = { name: 'New Sprint', objective: 'Complete features' }

      const res = await request(app).post('/api/sprints').send(sprintData)
      expect(res.status).toBe(201)
      expect(mockSprintConstructor).toHaveBeenCalled()
      expect(mockSprintSave).toHaveBeenCalled()
    })

    it('should return 400 for invalid payload', async () => {
      const res = await request(app).post('/api/sprints').send({ name: '' })
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('PATCH /api/sprints/:id', () => {
    it('should update a sprint', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        name: 'Old Name',
        save: async function() { return this }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).patch('/api/sprints/sprint-1').send({ name: 'New Name' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('name', 'New Name')
    })

    it('should return 404 if sprint not found', async () => {
      mockSprintFindById.mockResolvedValue(null)

      const res = await request(app).patch('/api/sprints/missing').send({ name: 'Test' })
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Sprint not found')
    })

    it('should return 403 if user is not the owner', async () => {
      const sprint = { _id: 'sprint-1', ownerId: 'other-owner', name: 'Sprint' }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).patch('/api/sprints/sprint-1').send({ name: 'New' })
      expect(res.status).toBe(403)
      expect(res.body).toHaveProperty('error', 'Forbidden')
    })

    it('should return 400 for empty payload', async () => {
      const res = await request(app).patch('/api/sprints/sprint-1').send({})
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('DELETE /api/sprints/:id', () => {
    it('should delete a sprint', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        deleteOne: async function() { return }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).delete('/api/sprints/sprint-1')
      expect(res.status).toBe(204)
    })

    it('should return 404 if sprint not found', async () => {
      mockSprintFindById.mockResolvedValue(null)

      const res = await request(app).delete('/api/sprints/missing')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Sprint not found')
    })

    it('should return 403 if user is not the owner', async () => {
      const sprint = { _id: 'sprint-1', ownerId: 'other-owner' }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).delete('/api/sprints/sprint-1')
      expect(res.status).toBe(403)
      expect(res.body).toHaveProperty('error', 'Forbidden')
    })
  })

  describe('POST /api/sprints/:id/start', () => {
    it('should start a sprint by setting startDate', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        startDate: null,
        save: async function() { return this }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/start')
      expect(res.status).toBe(200)
      expect(res.body.startDate).toBeTruthy()
    })

    it('should return 400 if sprint already started', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        startDate: new Date(),
        save: async function() { return this }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/start')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'Sprint already started')
    })

    it('should return 404 if sprint not found', async () => {
      mockSprintFindById.mockResolvedValue(null)

      const res = await request(app).post('/api/sprints/missing/start')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Sprint not found')
    })
  })

  describe('POST /api/sprints/:id/close', () => {
    it('should close a sprint by setting endDate', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        endDate: null,
        save: async function() { return this }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/close')
      expect(res.status).toBe(200)
      expect(res.body.endDate).toBeTruthy()
    })

    it('should allow custom endDate in body', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        endDate: null,
        save: async function() { return this }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const customDate = '2025-12-31'
      const res = await request(app).post('/api/sprints/sprint-1/close').send({ endDate: customDate })
      expect(res.status).toBe(200)
      expect(res.body.endDate).toBeTruthy()
    })

    it('should return 400 if sprint already closed', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        endDate: new Date(),
        save: async function() { return this }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/close')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'Sprint already closed')
    })
  })
})
