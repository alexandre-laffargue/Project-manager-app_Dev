import request from 'supertest'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// Mocks
const mockBoardFindOne = vi.fn()
const mockColumnFindOne = vi.fn()
const mockCardCreate = vi.fn()
const mockCardFind = vi.fn()
const mockCardFindById = vi.fn()
const mockMoveCard = vi.fn()

let app

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)

  // Patch auth middleware to inject user
  const auth = req('../src/middlewares/auth.js')
  auth.requireAuth = (req2, res, next) => { req2.user = { sub: 'owner-1' }; next() }

  // Patch Board model
  const Board = req('../src/models/Board.js')
  Board.findOne = (...args) => mockBoardFindOne(...args)

  // Patch Column model
  const Column = req('../src/models/Column.js')
  Column.findOne = (...args) => mockColumnFindOne(...args)

  // Patch Card model
  const Card = req('../src/models/Card.js')
  Card.create = (...args) => mockCardCreate(...args)
  Card.find = (...args) => mockCardFind(...args)
  Card.findById = (...args) => mockCardFindById(...args)

  // Patch move util
  const moveUtil = req('../src/utils/move.js')
  moveUtil.moveCard = (...args) => mockMoveCard(...args)

  const mod = await import('../src/app.js')
  app = mod.default || mod
})

beforeEach(() => {
  mockBoardFindOne.mockReset()
  mockColumnFindOne.mockReset()
  mockCardCreate.mockReset()
  mockCardFind.mockReset()
  mockCardFindById.mockReset()
  mockMoveCard.mockReset()
})

describe('Cards API', () => {
  it('POST /api/boards/:boardId/cards -> creates a card when board and column exist', async () => {
    const boardId = 'board-1'
    const columnId = 'col-1'
    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })
    mockColumnFindOne.mockResolvedValue({ _id: columnId, boardId })
    const created = { _id: 'card-1', boardId, columnId, title: 'Task', position: 0 }
    mockCardCreate.mockResolvedValue(created)

    const res = await request(app).post(`/api/boards/${boardId}/cards`).send({ title: 'Task', columnId })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('title', 'Task')
    expect(res.body).toHaveProperty('columnId', columnId)
  })

  it('POST /api/boards/:boardId/cards -> 404 when board missing', async () => {
    mockBoardFindOne.mockResolvedValue(null)
    const res = await request(app).post('/api/boards/missing/cards').send({ title: 'x', columnId: 'c' })
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('POST /api/boards/:boardId/cards -> 400 when column invalid for board', async () => {
    const boardId = 'board-2'
    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })
    mockColumnFindOne.mockResolvedValue(null)
    const res = await request(app).post(`/api/boards/${boardId}/cards`).send({ title: 'Task', columnId: 'wrong' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('GET /api/boards/:boardId/cards -> returns cards (optionally filtered by column)', async () => {
    const boardId = 'board-3'
    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })
    const cards = [ { _id: 'a', boardId, columnId: 'c1' }, { _id: 'b', boardId, columnId: 'c2' } ]
    mockCardFind.mockReturnValue({ sort: () => Promise.resolve(cards) })

    const res = await request(app).get(`/api/boards/${boardId}/cards`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(2)
  })

  it('PATCH /api/cards/:id -> updates simple fields', async () => {
    const cardId = 'card-p'
    const boardId = 'board-p'
    const card = { _id: cardId, boardId, title: 'Old', save: async function () { return this } }
    mockCardFindById.mockResolvedValue(card)
    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })

    const res = await request(app).patch(`/api/cards/${cardId}`).send({ title: 'New Title' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('title', 'New Title')
  })

  it('PATCH /api/cards/:id -> move card via toColumnId/toPosition uses moveCard util', async () => {
    const cardId = 'card-m'
    const boardId = 'board-m'
    const card = { _id: cardId, boardId, columnId: 'c1', position: 0 }
    mockCardFindById.mockResolvedValue(card)
    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })

    const moved = { _id: cardId, boardId, columnId: 'c2', position: 1, save: async function () { return this } }
    mockMoveCard.mockResolvedValue(moved)

    const res = await request(app).patch(`/api/cards/${cardId}`).send({ toColumnId: 'c2', toPosition: 1 })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('columnId', 'c2')
    expect(res.body).toHaveProperty('position', 1)
  })

  it('DELETE /api/cards/:id -> deletes card when owner', async () => {
    const cardId = 'card-d'
    const boardId = 'board-d'
    const card = { _id: cardId, boardId, deleteOne: async function () { return } }
    mockCardFindById.mockResolvedValue(card)
    mockBoardFindOne.mockResolvedValue({ _id: boardId, ownerId: 'owner-1' })

    const res = await request(app).delete(`/api/cards/${cardId}`)
    expect(res.status).toBe(204)
  })
})
