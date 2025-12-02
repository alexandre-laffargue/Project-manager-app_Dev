import request from 'supertest'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// Mocks
const mockSprintFind = vi.fn()
const mockSprintFindById = vi.fn()
const mockSprintSave = vi.fn()
const mockSprintConstructor = vi.fn()
const mockSprintUpdateMany = vi.fn()
const mockIssueFindByIdAndUpdate = vi.fn()
const mockIssueUpdateMany = vi.fn()

let app

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)

  // Patch auth middleware
  const auth = req('../src/middlewares/auth.js')
  auth.requireAuth = (req2, res, next) => {
    req2.user = { sub: 'owner-1' }
    next()
  }

  // Patch Sprint model
  const Sprint = req('../src/models/Sprint.js')
  Sprint.find = (...args) => mockSprintFind(...args)
  Sprint.findById = (...args) => mockSprintFindById(...args)
  Sprint.updateMany = (...args) => mockSprintUpdateMany(...args)

  // Mock Sprint constructor
  // const OriginalSprint = Sprint
  const MockedSprint = function (data) {
    this.save = async () => {
      mockSprintSave()
      this._id = 'sprint-new'
      this.ownerId = data.ownerId
      return this
    }
    Object.assign(this, data)
    mockSprintConstructor(data)
  }
  MockedSprint.find = Sprint.find
  MockedSprint.findById = Sprint.findById
  MockedSprint.updateMany = Sprint.updateMany

  // Replace Sprint in the module cache
  req.cache[req.resolve('../src/models/Sprint.js')].exports = MockedSprint

  // Patch Issue model
  const Issue = req('../src/models/Issue.js')
  Issue.findByIdAndUpdate = (...args) => mockIssueFindByIdAndUpdate(...args)
  Issue.updateMany = (...args) => mockIssueUpdateMany(...args)

  app = req('../src/app.js')
})

beforeEach(() => {
  mockSprintFind.mockReset()
  mockSprintFindById.mockReset()
  mockSprintSave.mockReset()
  mockSprintConstructor.mockReset()
  mockSprintUpdateMany.mockReset()
  mockIssueFindByIdAndUpdate.mockReset()
  mockIssueUpdateMany.mockReset()
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
      const sprints = [
        { _id: 's1', name: 'Sprint 1', ownerId: 'owner-1', boardId: 'board-1' }
      ]
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

    it('should create sprint with issues and sync Issue.sprintId', async () => {
      const sprintData = {
        name: 'Sprint with Issues',
        objective: 'Test sync',
        issues: ['issue-1', 'issue-2']
      }

      mockSprintUpdateMany.mockResolvedValue({ modifiedCount: 0 })
      mockIssueUpdateMany.mockResolvedValue({ modifiedCount: 2 })

      const res = await request(app).post('/api/sprints').send(sprintData)

      expect(res.status).toBe(201)
      expect(mockSprintConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ issues: ['issue-1', 'issue-2'] })
      )

      // Should remove issues from other sprints first
      expect(mockSprintUpdateMany).toHaveBeenCalledWith(
        { issues: { $in: ['issue-1', 'issue-2'] }, _id: { $ne: 'sprint-new' } },
        { $pull: { issues: { $in: ['issue-1', 'issue-2'] } } }
      )

      // Then assign to new sprint
      expect(mockIssueUpdateMany).toHaveBeenCalledWith(
        { _id: { $in: ['issue-1', 'issue-2'] } },
        { $set: { sprintId: 'sprint-new' } }
      )
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
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app)
        .patch('/api/sprints/sprint-1')
        .send({ name: 'New Name' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('name', 'New Name')
    })

    it('should update sprint issues and sync with Issue.sprintId', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        name: 'Sprint',
        issues: ['issue-1', 'issue-2'],
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)
      mockSprintUpdateMany.mockResolvedValue({ modifiedCount: 0 })
      mockIssueUpdateMany.mockResolvedValue({ modifiedCount: 2 })

      const res = await request(app)
        .patch('/api/sprints/sprint-1')
        .send({ issues: ['issue-2', 'issue-3', 'issue-4'] })

      expect(res.status).toBe(200)
      expect(res.body.issues).toEqual(['issue-2', 'issue-3', 'issue-4'])

      // Should remove sprint from deleted issues
      expect(mockIssueUpdateMany).toHaveBeenCalledWith(
        { _id: { $in: ['issue-1'] } },
        { $set: { sprintId: null } }
      )

      // Should remove new issues from other sprints first
      expect(mockSprintUpdateMany).toHaveBeenCalledWith(
        { issues: { $in: ['issue-3', 'issue-4'] }, _id: { $ne: 'sprint-1' } },
        { $pull: { issues: { $in: ['issue-3', 'issue-4'] } } }
      )

      // Should add sprint to new issues
      expect(mockIssueUpdateMany).toHaveBeenCalledWith(
        { _id: { $in: ['issue-3', 'issue-4'] } },
        { $set: { sprintId: 'sprint-1' } }
      )
    })

    it('should handle removing all issues from sprint', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        name: 'Sprint',
        issues: ['issue-1', 'issue-2'],
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)
      mockIssueUpdateMany.mockResolvedValue({ modifiedCount: 2 })

      const res = await request(app)
        .patch('/api/sprints/sprint-1')
        .send({ issues: [] })

      expect(res.status).toBe(200)
      expect(res.body.issues).toEqual([])

      // Should remove sprint from all old issues
      expect(mockIssueUpdateMany).toHaveBeenCalledWith(
        { _id: { $in: ['issue-1', 'issue-2'] } },
        { $set: { sprintId: null } }
      )
    })

    it('should return 404 if sprint not found', async () => {
      mockSprintFindById.mockResolvedValue(null)

      const res = await request(app)
        .patch('/api/sprints/missing')
        .send({ name: 'Test' })
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Sprint not found')
    })

    it('should return 403 if user is not the owner', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'other-owner',
        name: 'Sprint'
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app)
        .patch('/api/sprints/sprint-1')
        .send({ name: 'New' })
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
    it('should delete a sprint and remove sprintId from linked issues', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        issues: ['issue-1', 'issue-2'],
        deleteOne: async function () {

        }
      }
      mockSprintFindById.mockResolvedValue(sprint)
      mockIssueUpdateMany.mockResolvedValue({ modifiedCount: 2 })

      const res = await request(app).delete('/api/sprints/sprint-1')
      expect(res.status).toBe(204)

      // Should remove sprintId from all linked issues
      expect(mockIssueUpdateMany).toHaveBeenCalledWith(
        { _id: { $in: ['issue-1', 'issue-2'] } },
        { $set: { sprintId: null } }
      )
    })

    it('should delete a sprint without issues', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        issues: [],
        deleteOne: async function () {

        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).delete('/api/sprints/sprint-1')
      expect(res.status).toBe(204)

      // Should not call updateMany when no issues
      expect(mockIssueUpdateMany).not.toHaveBeenCalled()
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
    it('should start a sprint by setting status to active', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        status: 'planned',
        startDate: null,
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/start')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('active')
      expect(res.body.startDate).toBeTruthy()
    })

    it('should return 400 if sprint already started', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        status: 'active',
        startDate: new Date(),
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/start')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'Sprint already started')
    })

    it('should return 400 if trying to start a completed sprint', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        status: 'completed',
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/start')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty(
        'error',
        'Cannot start a completed sprint'
      )
    })

    it('should return 404 if sprint not found', async () => {
      mockSprintFindById.mockResolvedValue(null)

      const res = await request(app).post('/api/sprints/missing/start')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Sprint not found')
    })
  })

  describe('POST /api/sprints/:id/close', () => {
    it('should close a sprint by setting status to completed', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        status: 'active',
        endDate: null,
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/close')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('completed')
      expect(res.body.endDate).toBeTruthy()
    })

    it('should allow custom endDate in body', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        status: 'active',
        endDate: null,
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const customDate = '2025-12-31'
      const res = await request(app)
        .post('/api/sprints/sprint-1/close')
        .send({ endDate: customDate })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('completed')
      expect(res.body.endDate).toBeTruthy()
    })

    it('should return 400 if sprint already closed', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        status: 'completed',
        endDate: new Date(),
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/close')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'Sprint already closed')
    })
  })

  describe('POST /api/sprints/:id/reopen', () => {
    it('should reopen a completed sprint by setting status to planned', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        status: 'completed',
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/reopen')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('planned')
    })

    it('should return 400 if sprint is not completed', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'owner-1',
        status: 'active',
        save: async function () {
          return this
        }
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/reopen')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty(
        'error',
        'Only completed sprints can be reopened'
      )
    })

    it('should return 404 if sprint not found', async () => {
      mockSprintFindById.mockResolvedValue(null)

      const res = await request(app).post('/api/sprints/missing/reopen')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Sprint not found')
    })

    it('should return 403 if user is not the owner', async () => {
      const sprint = {
        _id: 'sprint-1',
        ownerId: 'other-owner',
        status: 'completed'
      }
      mockSprintFindById.mockResolvedValue(sprint)

      const res = await request(app).post('/api/sprints/sprint-1/reopen')
      expect(res.status).toBe(403)
      expect(res.body).toHaveProperty('error', 'Forbidden')
    })
  })
})
