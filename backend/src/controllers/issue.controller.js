const Joi = require('joi')
const Issue = require('../models/Issue')
const Board = require('../models/Board')
const { reorderIssues } = require('../utils/issue')

const createSchema = Joi.object({
  boardId: Joi.string().required(),
  title: Joi.string().min(1).required(),
  description: Joi.string().allow(''),
  type: Joi.string().valid('Bug', 'Feature', 'Task').default('Task'),
  priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
  position: Joi.number().integer().min(0).default(0),
  sprintId: Joi.string().allow(null)
})

async function createIssue (req, res, next) {
  try {
    const payload = await createSchema.validateAsync(req.body)
    const board = await Board.findOne({ _id: payload.boardId, ownerId: req.user.sub })
    if (!board) return res.status(404).json({ error: 'Board not found' })

    // determine position: append to scope
    const q = { boardId: payload.boardId }
    if (payload.sprintId) q.sprintId = payload.sprintId
    else q.sprintId = null
    const count = await Issue.countDocuments(q)
    const issue = await Issue.create({ ...payload, position: payload.position || count })
    res.status(201).json(issue)
  } catch (err) { if (err.isJoi) err.status = 400; next(err) }
}

async function getIssues (req, res, next) {
  try {
    const { scope, boardId, sprintId } = req.query
    const q = {}
    if (boardId) q.boardId = boardId
    if (scope === 'backlog') q.sprintId = null
    else if (scope === 'sprint') q.sprintId = sprintId || { $ne: null }
    const issues = await Issue.find(q).sort({ position: 1, createdAt: 1 })
    res.json(issues)
  } catch (err) { next(err) }
}

const reorderSchema = Joi.object({ issueId: Joi.string().required(), toPosition: Joi.number().integer().min(0).required(), sprintId: Joi.string().allow(null), boardId: Joi.string().required() })

async function patchReorder (req, res, next) {
  try {
    const payload = await reorderSchema.validateAsync(req.body)
    const issue = await reorderIssues({ boardId: payload.boardId, sprintId: payload.sprintId || null, issueId: payload.issueId, toPosition: payload.toPosition })
    res.json(issue)
  } catch (err) { if (err.isJoi) err.status = 400; next(err) }
}

const moveToSprintSchema = Joi.object({ issueId: Joi.string().required(), sprintId: Joi.string().allow(null), toPosition: Joi.number().integer().min(0).default(0), boardId: Joi.string().required() })

async function patchMoveToSprint (req, res, next) {
  try {
    const payload = await moveToSprintSchema.validateAsync(req.body)
    // remove from previous scope and insert into target scope
    // ensure issue exists and belongs to board
    const issue = await Issue.findById(payload.issueId)
    if (!issue) return res.status(404).json({ error: 'Issue not found' })
    if (issue.boardId.toString() !== payload.boardId) return res.status(403).json({ error: 'Forbidden' })

    // adjust source list positions
    const sourceQ = { boardId: payload.boardId }
    sourceQ.sprintId = issue.sprintId ? issue.sprintId : null
    const sourceIssues = await Issue.find(sourceQ).sort({ position: 1, createdAt: 1 })
    const sourceOthers = sourceIssues.filter(i => i._id.toString() !== issue._id.toString())
    await Promise.all(sourceOthers.map((it, idx) => { if (it.position !== idx) { it.position = idx; return it.save() } return null }))

    // set new sprintId and insert into target
    issue.sprintId = payload.sprintId || null
    await issue.save()

    // now reorder target scope to place issue at desired position
    const updated = await reorderIssues({ boardId: payload.boardId, sprintId: issue.sprintId, issueId: issue._id, toPosition: payload.toPosition })
    res.json(updated)
  } catch (err) { if (err.isJoi) err.status = 400; next(err) }
}

module.exports = { createIssue, getIssues, patchReorder, patchMoveToSprint }
