const mongoose = require("mongoose");

const sprintSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    objective: { type: String, default: "" },
    status: {
      type: String,
      enum: ["planned", "active", "completed"],
      default: "planned",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      default: null,
      index: true,
    },
    issues: [{ type: mongoose.Schema.Types.ObjectId, ref: "Issue" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Sprint", sprintSchema);
