const Issue = require('../models/Issue')

async function reorderIssues ({
  boardId,
  sprintId = null,
  issueId,
  toPosition = 0
}) {
  // get list within scope (backlog if sprintId null)
  const q = { boardId }
  if (sprintId === null) q.sprintId = null
  else q.sprintId = sprintId

  const issues = await Issue.find(q).sort({ position: 1, createdAt: 1 })
  const moving = issues.find((i) => i._id.toString() === issueId.toString())
  if (!moving) { throw Object.assign(new Error('Issue not found in scope'), { status: 404 }) }

  const others = issues.filter((i) => i._id.toString() !== issueId.toString())
  const clamped = Math.max(0, Math.min(toPosition, others.length))
  others.splice(clamped, 0, moving)

  await Promise.all(
    others.map((it, idx) => {
      if (it.position !== idx) {
        it.position = idx
        return it.save()
      }
      return null
    })
  )

  return await Issue.findById(issueId)
}

module.exports = { reorderIssues }
