const mongoose = require('mongoose')

const cardSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    columnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    type: { type: String, enum: ['Bug', 'Feature', 'Task'], default: 'Task' },
    position: { type: Number, default: 0 },
    labels: [{ type: String }],
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dueDate: { type: Date, default: null }
  },
  { timestamps: true }
)

cardSchema.index({ boardId: 1, columnId: 1, position: 1 })

module.exports = mongoose.model('Card', cardSchema)
