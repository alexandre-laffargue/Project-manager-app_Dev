const mongoose = require('mongoose')

const SprintSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  objective: { type: String, default: '' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', default: null },
  // optional list of issue ids (free form)
  issues: [{ type: mongoose.Schema.Types.ObjectId }]
}, { timestamps: true })

module.exports = mongoose.model('Sprint', SprintSchema)
