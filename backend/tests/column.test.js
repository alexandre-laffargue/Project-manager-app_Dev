import request from 'supertest'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

let app

// Mocks
const mockBoardFindOne = vi.fn()
const mockColumnCreate = vi.fn()
const mockColumnFind = vi.fn()
const mockColumnFindById = vi.fn()
const mockCardDeleteMany = vi.fn()

beforeAll(async () => {
  // ensure JWT secret exists if used anywhere
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)

  // Patch the auth middleware to bypass JWT and set a test user
  const auth = req('../src/middlewares/auth.js')
  auth.requireAuth = (req2, res, next) => { req2.user = { sub: 'owner-1' }; next() }

  // Patch Board model
  const Board = req('../src/models/Board.js')
  Board.findOne = (...args) => mockBoardFindOne(...args)

  // Patch Column model
  const Column = req('../src/models/Column.js')
  Column.create = (...args) => mockColumnCreate(...args)
  Column.find = (...args) => mockColumnFind(...args)
  Column.findById = (...args) => mockColumnFindById(...args)

  // Patch Card model
  const Card = req('../src/models/Card.js')
  Card.deleteMany = (...args) => mockCardDeleteMany(...args)

  app = req('../src/app.js')
})

beforeEach(() => {
  mockBoardFindOne.mockReset()
  mockColumnCreate.mockReset()
  mockColumnFind.mockReset()
  mockColumnFindById.mockReset()
  mockCardDeleteMany.mockReset()
})

describe('Columns API', () => {
  it('POST /api/boards/:boardId/columns -> creates a column when board exists', async () => {
    const boardId = 'board-1'
    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })
    const created = { _id: 'col-1', boardId, key: 'todo', title: 'To Do', wipLimit: 0, order: 0 }
    mockColumnCreate.mockResolvedValue(created)

    const res = await request(app).post(`/api/boards/${boardId}/columns`).send({ key: 'todo', title: 'To Do' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('key', 'todo')
    expect(res.body).toHaveProperty('title', 'To Do')
  })

  it('GET /api/boards/:boardId/columns -> returns 404 when board missing', async () => {
    const boardId = 'missing-board'
    mockBoardFindOne.mockResolvedValue(null)

    const res = await request(app).get(`/api/boards/${boardId}/columns`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('GET /api/boards/:boardId/columns -> returns columns when board exists', async () => {
    const boardId = 'board-2'
    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })
    const cols = [ { _id: 'c1', boardId, key: 'a', order: 0 }, { _id: 'c2', boardId, key: 'b', order: 1 } ]

    mockColumnFind.mockReturnValue({ sort: () => Promise.resolve(cols) })

    const res = await request(app).get(`/api/boards/${boardId}/columns`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(2)
  })

  it('PATCH /api/columns/:id -> updates a column when allowed', async () => {
    const colId = 'col-patch'
    const boardId = 'board-p'

    const col = { _id: colId, boardId, title: 'Old', save: async function () { return this } }
    mockColumnFindById.mockResolvedValue(col)

    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })

    const res = await request(app).patch(`/api/columns/${colId}`).send({ title: 'New Title' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('title', 'New Title')
  })

  it('DELETE /api/columns/:id -> deletes column and cascade-deletes cards', async () => {
    const colId = 'col-del'
    const boardId = 'board-d'
    const col = { _id: colId, boardId, deleteOne: async function () { return } }
    mockColumnFindById.mockResolvedValue(col)
    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })
    mockCardDeleteMany.mockResolvedValue({ deletedCount: 2 })

    const res = await request(app).delete(`/api/columns/${colId}`)
    expect(res.status).toBe(204)
  })
})
