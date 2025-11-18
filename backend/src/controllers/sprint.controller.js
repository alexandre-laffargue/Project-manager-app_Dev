const Joi = require('joi')
const Sprint = require('../models/Sprint')

const createSprintSchema = Joi.object({
  name: Joi.string().min(1).required(),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  objective: Joi.string().allow('').default(''),
  issues: Joi.array().items(Joi.string()).optional(),
  boardId: Joi.string().optional().allow(null)
})

const patchSprintSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().optional().allow(null),
  objective: Joi.string().optional().allow(''),
  issues: Joi.array().items(Joi.string()).optional(),
  boardId: Joi.string().optional().allow(null)
}).min(1)

const listSprints = async (req, res) => {
  try {
    const ownerId = req.user.sub
    const filter = { ownerId }
    if (req.query.boardId) filter.boardId = req.query.boardId
    const sprints = await Sprint.find(filter).sort({ createdAt: -1 })
    return res.json(sprints)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

const createSprint = async (req, res) => {
  const { error } = createSprintSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  try {
    const ownerId = req.user.sub
    const payload = { ...req.body, ownerId }
    const sprint = new Sprint(payload)
    await sprint.save()
    return res.status(201).json(sprint)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

const patchSprint = async (req, res) => {
  const { error } = patchSprintSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  try {
    const sprint = await Sprint.findById(req.params.id)
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' })
    if (sprint.ownerId.toString() !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
    Object.assign(sprint, req.body)
    await sprint.save()
    return res.json(sprint)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

const deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id)
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' })
    if (sprint.ownerId.toString() !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
    await sprint.deleteOne()
    return res.status(204).send()
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports = { listSprints, createSprint, patchSprint, deleteSprint }
