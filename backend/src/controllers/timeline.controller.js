const Sprint = require('../models/Sprint')
const Issue = require('../models/Issue')
const Board = require('../models/Board')
const Timeline = require('../models/Timeline')

async function computeTimelineForBoard (boardId, ownerId) {
  const filter = { ownerId }
  if (boardId) filter.boardId = boardId

  const sprints = await Sprint.find(filter).sort({ startDate: 1, createdAt: 1 }).lean()

  const sprintIds = sprints.map(s => s._id)
  const issues = await Issue.find(Object.assign({}, boardId ? { boardId } : {}, { sprintId: { $in: sprintIds } })).sort({ startDate: 1, position: 1 }).lean()

  const bySprint = {}
  sprints.forEach(s => { bySprint[s._id.toString()] = [] })
  issues.forEach(i => {
    const sid = i.sprintId ? i.sprintId.toString() : null
    if (sid && bySprint[sid]) bySprint[sid].push(i)
  })

  const sprintsWithIssues = sprints.map(s => ({ ...s, issues: bySprint[s._id.toString()] || [] }))

  const backlogQ = {}
  if (boardId) backlogQ.boardId = boardId
  backlogQ.sprintId = null
  const backlog = await Issue.find(backlogQ).sort({ position: 1 }).lean()

  return { sprints: sprintsWithIssues, backlog }
}

// GET /timeline?boardId=...  — returns latest snapshot if available, else computes and persists one
async function getTimeline (req, res, next) {
  try {
    const boardId = req.query.boardId
    if (boardId) {
      const board = await Board.findOne({ _id: boardId, ownerId: req.user.sub })
      if (!board) return res.status(404).json({ error: 'Board not found' })
    }

    // try to find latest snapshot
    const snapshot = await Timeline.findOne({ boardId: boardId || null, ownerId: req.user.sub }).sort({ snapshotDate: -1 }).lean()
    if (snapshot) return res.json({ snapshot })

    // compute and persist new snapshot
    const data = await computeTimelineForBoard(boardId, req.user.sub)
    const t = new Timeline({ boardId: boardId || null, ownerId: req.user.sub, data, snapshotDate: new Date() })
    await t.save()
    return res.json({ snapshot: t })
  } catch (err) { next(err) }
}

// POST /timeline  — create (or overwrite) a snapshot for the board
async function createTimeline (req, res, next) {
  try {
    const payload = req.body || {}
    const boardId = payload.boardId
    if (boardId) {
      const board = await Board.findOne({ _id: boardId, ownerId: req.user.sub })
      if (!board) return res.status(404).json({ error: 'Board not found' })
    }

    // if no data provided, compute
    let data = payload.data
    if (!data) data = await computeTimelineForBoard(boardId, req.user.sub)

    const t = new Timeline({ boardId: boardId || null, ownerId: req.user.sub, name: payload.name || 'Timeline snapshot', data, snapshotDate: new Date(), version: 1 })
    await t.save()
    res.status(201).json({ snapshot: t })
  } catch (err) { next(err) }
}

// POST /timeline/:id/refresh  — recompute and update snapshot
async function refreshTimeline (req, res, next) {
  try {
    const t = await Timeline.findById(req.params.id)
    if (!t) return res.status(404).json({ error: 'Timeline not found' })
    if (t.ownerId.toString() !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })

    const data = await computeTimelineForBoard(t.boardId, req.user.sub)
    t.data = data
    t.snapshotDate = new Date()
    t.version = (t.version || 0) + 1
    await t.save()
    res.json({ snapshot: t })
  } catch (err) { next(err) }
}

// PATCH /timeline/:id — update metadata (name/isPublished)
async function updateTimeline (req, res, next) {
  try {
    const t = await Timeline.findById(req.params.id)
    if (!t) return res.status(404).json({ error: 'Timeline not found' })
    if (t.ownerId.toString() !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
    const up = {}
    if (req.body.name !== undefined) up.name = req.body.name
    if (req.body.isPublished !== undefined) up.isPublished = req.body.isPublished
    Object.assign(t, up)
    await t.save()
    res.json({ snapshot: t })
  } catch (err) { next(err) }
}

// DELETE /timeline/:id
async function deleteTimeline (req, res, next) {
  try {
    const t = await Timeline.findById(req.params.id)
    if (!t) return res.status(404).json({ error: 'Timeline not found' })
    if (t.ownerId.toString() !== req.user.sub) return res.status(403).json({ error: 'Forbidden' })
    await t.deleteOne()
    res.status(204).send()
  } catch (err) { next(err) }
}

module.exports = { getTimeline, createTimeline, refreshTimeline, updateTimeline, deleteTimeline }
