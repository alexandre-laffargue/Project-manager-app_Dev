const mongoose = require("mongoose");

const columnSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    key: { type: String, required: true },
    title: { type: String, required: true },
    wipLimit: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

columnSchema.index({ boardId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("Column", columnSchema);
