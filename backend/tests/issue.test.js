import request from 'supertest'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// Mocks
const mockIssueCreate = vi.fn()
const mockIssueFind = vi.fn()
const mockIssueFindById = vi.fn()
const mockIssueCountDocuments = vi.fn()
const mockBoardFindOne = vi.fn()
const mockReorderIssues = vi.fn()

let app

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)

  // Patch auth middleware
  const auth = req('../src/middlewares/auth.js')
  auth.requireAuth = (req2, res, next) => { req2.user = { sub: 'owner-1' }; next() }

  // Patch Board model
  const Board = req('../src/models/Board.js')
  Board.findOne = (...args) => mockBoardFindOne(...args)

  // Patch Issue model
  const Issue = req('../src/models/Issue.js')
  Issue.create = (...args) => mockIssueCreate(...args)
  Issue.find = (...args) => mockIssueFind(...args)
  Issue.findById = (...args) => mockIssueFindById(...args)
  Issue.countDocuments = (...args) => mockIssueCountDocuments(...args)

  // Patch reorder utility
  const issueUtils = req('../src/utils/issue.js')
  issueUtils.reorderIssues = (...args) => mockReorderIssues(...args)

  app = req('../src/app.js')
})

beforeEach(() => {
  mockIssueCreate.mockReset()
  mockIssueFind.mockReset()
  mockIssueFindById.mockReset()
  mockIssueCountDocuments.mockReset()
  mockBoardFindOne.mockReset()
  mockReorderIssues.mockReset()
})

describe('Issue API', () => {
  describe('POST /api/issues', () => {
    it('should create a new issue', async () => {
      const boardId = 'board-1'
      mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })
      mockIssueCountDocuments.mockResolvedValue(3)
      
      const created = { 
        _id: 'issue-1', 
        boardId, 
        title: 'New Bug', 
        type: 'Bug',
        priority: 'High',
        position: 3 
      }
      mockIssueCreate.mockResolvedValue(created)

      const res = await request(app)
        .post('/api/issues')
        .send({ boardId, title: 'New Bug', type: 'Bug', priority: 'High' })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('title', 'New Bug')
      expect(res.body).toHaveProperty('type', 'Bug')
    })

    it('should return 404 when board not found', async () => {
      mockBoardFindOne.mockResolvedValue(null)

      const res = await request(app)
        .post('/api/issues')
        .send({ boardId: 'missing', title: 'Test' })

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Board not found')
    })

    it('should return 400 for invalid payload', async () => {
      const res = await request(app)
        .post('/api/issues')
        .send({ title: '' })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should create issue with default type and priority', async () => {
      const boardId = 'board-1'
      mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })
      mockIssueCountDocuments.mockResolvedValue(0)
      
      const created = { 
        _id: 'issue-1', 
        boardId, 
        title: 'Task',
        type: 'Task',
        priority: 'Medium',
        position: 0
      }
      mockIssueCreate.mockResolvedValue(created)

      const res = await request(app)
        .post('/api/issues')
        .send({ boardId, title: 'Task' })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('type', 'Task')
      expect(res.body).toHaveProperty('priority', 'Medium')
    })
  })

  describe('GET /api/issues', () => {
    it('should return all issues when no filter', async () => {
      const issues = [
        { _id: 'i1', title: 'Issue 1', position: 0 },
        { _id: 'i2', title: 'Issue 2', position: 1 }
      ]
      mockIssueFind.mockReturnValue({ sort: () => Promise.resolve(issues) })

      const res = await request(app).get('/api/issues')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(2)
    })

    it('should filter by boardId', async () => {
      const issues = [{ _id: 'i1', boardId: 'board-1', title: 'Issue 1' }]
      mockIssueFind.mockReturnValue({ sort: () => Promise.resolve(issues) })

      const res = await request(app).get('/api/issues?boardId=board-1')
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
    })

    it('should filter backlog issues (sprintId null)', async () => {
      const issues = [{ _id: 'i1', sprintId: null, title: 'Backlog Issue' }]
      mockIssueFind.mockReturnValue({ sort: () => Promise.resolve(issues) })

      const res = await request(app).get('/api/issues?scope=backlog')
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
    })

    it('should filter sprint issues', async () => {
      const issues = [{ _id: 'i1', sprintId: 'sprint-1', title: 'Sprint Issue' }]
      mockIssueFind.mockReturnValue({ sort: () => Promise.resolve(issues) })

      const res = await request(app).get('/api/issues?scope=sprint&sprintId=sprint-1')
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
    })
  })

  describe('PATCH /api/issues/reorder', () => {
    it('should reorder an issue', async () => {
      const reordered = { _id: 'issue-1', position: 2 }
      mockReorderIssues.mockResolvedValue(reordered)

      const res = await request(app)
        .patch('/api/issues/reorder')
        .send({ issueId: 'issue-1', toPosition: 2, boardId: 'board-1' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('position', 2)
      expect(mockReorderIssues).toHaveBeenCalled()
    })

    it('should return 400 for invalid payload', async () => {
      const res = await request(app)
        .patch('/api/issues/reorder')
        .send({ issueId: 'issue-1' })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('PATCH /api/issues/moveToSprint', () => {
    it('should move issue to a sprint', async () => {
      const issue = {
        _id: 'issue-1',
        boardId: 'board-1',
        sprintId: null,
        position: 0,
        save: async function() { return this }
      }
      mockIssueFindById.mockResolvedValue(issue)
      mockIssueFind.mockReturnValue({ sort: () => Promise.resolve([issue]) })
      
      const moved = { ...issue, sprintId: 'sprint-1', position: 0 }
      mockReorderIssues.mockResolvedValue(moved)

      const res = await request(app)
        .patch('/api/issues/moveToSprint')
        .send({ issueId: 'issue-1', sprintId: 'sprint-1', boardId: 'board-1', toPosition: 0 })

      expect(res.status).toBe(200)
      expect(mockReorderIssues).toHaveBeenCalled()
    })

    it('should return 404 when issue not found', async () => {
      mockIssueFindById.mockResolvedValue(null)

      const res = await request(app)
        .patch('/api/issues/moveToSprint')
        .send({ issueId: 'missing', sprintId: 'sprint-1', boardId: 'board-1' })

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Issue not found')
    })

    it('should return 403 when issue does not belong to board', async () => {
      const issue = { _id: 'issue-1', boardId: 'other-board' }
      mockIssueFindById.mockResolvedValue(issue)

      const res = await request(app)
        .patch('/api/issues/moveToSprint')
        .send({ issueId: 'issue-1', sprintId: 'sprint-1', boardId: 'board-1' })

      expect(res.status).toBe(403)
      expect(res.body).toHaveProperty('error', 'Forbidden')
    })
  })

  describe('PATCH /api/issues/:id/dates', () => {
    it('should update issue dates', async () => {
      const issue = {
        _id: 'issue-1',
        boardId: 'board-1',
        startDate: null,
        endDate: null,
        save: async function() { return this }
      }
      mockIssueFindById.mockResolvedValue(issue)
      mockBoardFindOne.mockResolvedValue({ _id: 'board-1', ownerId: 'owner-1' })

      const startDate = '2025-12-01'
      const endDate = '2025-12-15'
      const res = await request(app)
        .patch('/api/issues/issue-1/dates')
        .send({ startDate, endDate })

      expect(res.status).toBe(200)
      expect(res.body.startDate).toBeTruthy()
      expect(res.body.endDate).toBeTruthy()
    })

    it('should return 404 when issue not found', async () => {
      mockIssueFindById.mockResolvedValue(null)

      const res = await request(app)
        .patch('/api/issues/missing/dates')
        .send({ startDate: '2025-12-01' })

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Issue not found')
    })

    it('should return 403 when user is not board owner', async () => {
      const issue = { _id: 'issue-1', boardId: 'board-1' }
      mockIssueFindById.mockResolvedValue(issue)
      mockBoardFindOne.mockResolvedValue(null) // Board not found or not owner

      const res = await request(app)
        .patch('/api/issues/issue-1/dates')
        .send({ startDate: '2025-12-01' })

      expect(res.status).toBe(403)
      expect(res.body).toHaveProperty('error', 'Forbidden')
    })

    it('should allow null dates', async () => {
      const issue = {
        _id: 'issue-1',
        boardId: 'board-1',
        startDate: new Date(),
        endDate: new Date(),
        save: async function() { return this }
      }
      mockIssueFindById.mockResolvedValue(issue)
      mockBoardFindOne.mockResolvedValue({ _id: 'board-1', ownerId: 'owner-1' })

      const res = await request(app)
        .patch('/api/issues/issue-1/dates')
        .send({ startDate: null, endDate: null })

      expect(res.status).toBe(200)
    })
  })
})
