const mongoose = require("mongoose");

const timelineSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: false,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, default: "Timeline snapshot" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    selectedSprints: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    selectedIssues: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    snapshotDate: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Timeline || mongoose.model("Timeline", timelineSchema);
