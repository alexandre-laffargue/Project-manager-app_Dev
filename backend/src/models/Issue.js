const mongoose = require('mongoose')

const issueSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['Bug', 'Feature', 'Task'], default: 'Task' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    position: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    checklist: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        checked: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
)

issueSchema.index({ boardId: 1, sprintId: 1, position: 1 })

module.exports = mongoose.models.Issue || mongoose.model('Issue', issueSchema)
