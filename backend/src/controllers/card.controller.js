const Joi = require('joi')
const Card = require('../models/Card')
const Column = require('../models/Column')
const Board = require('../models/Board')
const { moveCard } = require('../utils/move')

const createCardSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().allow('').default(''),
  columnId: Joi.string().required(),
  position: Joi.number().integer().min(0).default(0),
  labels: Joi.array().items(Joi.string()).default([]),
  assignees: Joi.array().items(Joi.string()).default([]),
  dueDate: Joi.date().allow(null).default(null),
  priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
  type: Joi.string().valid('Bug', 'Feature', 'Task').default('Task')
})

async function createCard (req, res, next) {
  try {
    const { boardId } = req.params
    const board = await Board.findOne({ _id: boardId, ownerId: req.user.sub })
    if (!board) return res.status(404).json({ error: 'Board not found' })

    const payload = await createCardSchema.validateAsync(req.body)

    const col = await Column.findOne({ _id: payload.columnId, boardId })
    if (!col) return res.status(400).json({ error: 'Invalid columnId for this board' })

    const card = await Card.create({ ...payload, boardId })
    res.status(201).json(card)
  } catch (err) { if (err.isJoi) err.status = 400; next(err) }
}

async function listCards (req, res, next) {
  try {
    const { boardId } = req.params
    const board = await Board.findOne({ _id: boardId, ownerId: req.user.sub })
    if (!board) return res.status(404).json({ error: 'Board not found' })

    const { columnId } = req.query
    const q = { boardId }
    if (columnId) q.columnId = columnId
    const cards = await Card.find(q).sort({ columnId: 1, position: 1, createdAt: 1 })
    res.json(cards)
  } catch (err) { next(err) }
}

const patchCardSchema = Joi.object({
  title: Joi.string().min(1),
  description: Joi.string().allow(''),
  labels: Joi.array().items(Joi.string()),
  assignees: Joi.array().items(Joi.string()),
  priority: Joi.string().valid('Low', 'Medium', 'High'),
  type: Joi.string().valid('Bug', 'Feature', 'Task'),
  dueDate: Joi.date().allow(null),

  toColumnId: Joi.string(),
  toPosition: Joi.number().integer().min(0)
}).min(1)

async function patchCard (req, res, next) {
  try {
    const { id } = req.params
    const card = await Card.findById(id)
    if (!card) return res.status(404).json({ error: 'Card not found' })

    const board = await Board.findOne({ _id: card.boardId, ownerId: req.user.sub })
    if (!board) return res.status(403).json({ error: 'Forbidden' })

    const patch = await patchCardSchema.validateAsync(req.body)

    if (patch.toColumnId || typeof patch.toPosition !== 'undefined') {
      const updated = await moveCard({
        boardId: card.boardId.toString(),
        cardId: card._id.toString(),
        toColumnId: patch.toColumnId || card.columnId,
        toPosition: typeof patch.toPosition === 'number' ? patch.toPosition : card.position
      })
      const leftovers = { ...patch }
      delete leftovers.toColumnId
      delete leftovers.toPosition
      if (Object.keys(leftovers).length) {
        Object.assign(updated, leftovers)
        await updated.save()
      }
      return res.json(updated)
    }

    Object.assign(card, patch)
    await card.save()
    res.json(card)
  } catch (err) { if (err.isJoi) err.status = 400; next(err) }
}

async function deleteCard (req, res, next) {
  try {
    const { id } = req.params
    const card = await Card.findById(id)
    if (!card) return res.status(404).json({ error: 'Card not found' })
    const board = await Board.findOne({ _id: card.boardId, ownerId: req.user.sub })
    if (!board) return res.status(403).json({ error: 'Forbidden' })

    await card.deleteOne()
    res.status(204).end()
  } catch (err) { next(err) }
}

module.exports = { createCard, listCards, patchCard, deleteCard }
