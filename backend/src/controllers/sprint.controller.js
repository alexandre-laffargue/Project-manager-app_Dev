const Joi = require('joi')
const Sprint = require('../models/Sprint')
const Board = require('../models/Board')

const createSprintSchema = Joi.object({
  name: Joi.string().min(1).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  objective: Joi.string().allow('').default('')
})

const patchSprintSchema = Joi.object({
  name: Joi.string().min(1),
  startDate: Joi.date(),
  endDate: Joi.date(),
  objective: Joi.string().allow('')
}).min(1)

async function createSprint(req, res, next) {
  try {
    const { boardId } = req.params
    const payload = await createSprintSchema.validateAsync(req.body)

    if (boardId) {
      const board = await Board.findOne({ _id: boardId, ownerId: req.user.sub })
      if (!board) return res.status(404).json({ error: 'Board not found' })
      payload.boardId = boardId
    }

    const sprint = await Sprint.create({ ...payload, ownerId: req.user.sub })
    res.status(201).json(sprint)
  } catch (err) {
    if (err.isJoi) err.status = 400
    next(err)
  }
}

async function listSprints(req, res, next) {
  try {
    const { boardId } = req.query
    const query = { ownerId: req.user.sub }
    if (boardId) query.boardId = boardId

    const sprints = await Sprint.find(query).sort({ startDate: 1 })
    res.json(sprints)
  } catch (err) {
    next(err)
  }
}

async function patchSprint(req, res, next) {
  try {
    const { id } = req.params
    const sprint = await Sprint.findById(id)
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' })
    if (sprint.ownerId.toString() !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })

    const patch = await patchSprintSchema.validateAsync(req.body)
    Object.assign(sprint, patch)
    await sprint.save()
    res.json(sprint)
  } catch (err) {
    if (err.isJoi) err.status = 400
    next(err)
  }
}

async function deleteSprint(req, res, next) {
  try {
    const { id } = req.params
    const sprint = await Sprint.findById(id)
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' })
    if (sprint.ownerId.toString() !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })

    await sprint.deleteOne()
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

module.exports = { createSprint, listSprints, patchSprint, deleteSprint }
