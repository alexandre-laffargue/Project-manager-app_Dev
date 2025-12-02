const Card = require('../models/Card')
const Column = require('../models/Column')

async function moveCard ({ boardId, cardId, toColumnId, toPosition = 0 }) {
  const card = await Card.findOne({ _id: cardId, boardId })
  if (!card) throw Object.assign(new Error('Card not found'), { status: 404 })

  const targetCol = await Column.findOne({ _id: toColumnId, boardId })
  if (!targetCol) { throw Object.assign(new Error('Target column not found'), { status: 400 }) }

  const fromColumnId = card.columnId.toString()
  const sameColumn = fromColumnId === toColumnId.toString()

  if (sameColumn) {
    const cards = await Card.find({ boardId, columnId: toColumnId }).sort({
      position: 1,
      createdAt: 1
    })
    const others = cards.filter((c) => c._id.toString() !== cardId.toString())
    const clamped = Math.max(0, Math.min(toPosition, others.length))
    others.splice(clamped, 0, card)
    await Promise.all(
      others.map((c, i) => {
        if (c.position !== i) {
          c.position = i
          return c.save()
        }
        return null
      })
    )
    return await Card.findById(cardId)
  }

  const fromCards = await Card.find({ boardId, columnId: fromColumnId }).sort({
    position: 1,
    createdAt: 1
  })
  const toCards = await Card.find({ boardId, columnId: toColumnId }).sort({
    position: 1,
    createdAt: 1
  })

  const fromOthers = fromCards.filter(
    (c) => c._id.toString() !== cardId.toString()
  )
  await Promise.all(
    fromOthers.map((c, i) => {
      if (c.position !== i) {
        c.position = i
        return c.save()
      }
      return null
    })
  )

  const clamped = Math.max(0, Math.min(toPosition, toCards.length))
  toCards.splice(clamped, 0, card)
  await Promise.all(
    toCards.map((c, i) => {
      const origCol =
        c.columnId && c.columnId.toString ? c.columnId.toString() : c.columnId
      const needPos = c.position !== i
      const needCol = origCol !== toColumnId.toString()
      c.columnId = toColumnId
      if (needPos) c.position = i
      if (needPos || needCol) return c.save()
      return null
    })
  )

  return await Card.findById(cardId)
}

module.exports = { moveCard }
