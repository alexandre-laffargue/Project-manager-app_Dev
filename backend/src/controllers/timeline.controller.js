const Sprint = require("../models/Sprint");
const Issue = require("../models/Issue");
const Board = require("../models/Board");
const Timeline = require("../models/Timeline");

async function computeTimelineForBoard(
  boardId,
  ownerId,
  selectedSprints = null,
  selectedIssues = null,
) {
  console.log("[Timeline] Computing timeline:", {
    boardId,
    ownerId,
    selectedSprints,
    selectedIssues,
  });

  // --- Sprints ---
  let sprints = [];
  // Check if selection is provided (not null/undefined)
  const hasSprintSelection =
    selectedSprints !== null && selectedSprints !== undefined;

  if (hasSprintSelection) {
    if (selectedSprints.length > 0) {
      sprints = await Sprint.find({ _id: { $in: selectedSprints } })
        .sort({ startDate: 1, createdAt: 1 })
        .lean();
    }
    // If length is 0, sprints remains []
    console.log("[Timeline] Found selected sprints:", sprints.length);
  } else {
    // No selection provided -> Fetch All
    const filter = { ownerId };
    if (boardId) filter.boardId = boardId;
    sprints = await Sprint.find(filter)
      .sort({ startDate: 1, createdAt: 1 })
      .lean();
    console.log("[Timeline] Found all sprints for board:", sprints.length);
  }

  const sprintIds = sprints.map((s) => s._id.toString());
  const bySprint = {};
  sprints.forEach((s) => {
    bySprint[s._id.toString()] = [];
  });

  // --- Issues ---
  let issues = [];
  const hasIssueSelection =
    selectedIssues !== null && selectedIssues !== undefined;

  if (hasIssueSelection) {
    if (selectedIssues.length > 0) {
      issues = await Issue.find({ _id: { $in: selectedIssues } })
        .sort({ startDate: 1, position: 1 })
        .lean();
    }
    console.log("[Timeline] Found selected issues:", issues.length);
  } else {
    // No selection provided -> Fetch All in Sprints
    const issueFilter = Object.assign({}, boardId ? { boardId } : {}, {
      sprintId: { $in: sprintIds },
    });
    issues = await Issue.find(issueFilter)
      .sort({ startDate: 1, position: 1 })
      .lean();
    console.log("[Timeline] Found all issues in sprints:", issues.length);
  }

  // Distribute issues to sprints
  issues.forEach((i) => {
    const sid = i.sprintId ? i.sprintId.toString() : null;
    if (sid && bySprint[sid]) {
      bySprint[sid].push(i);
    }
  });

  const sprintsWithIssues = sprints.map((s) => ({
    ...s,
    issues: bySprint[s._id.toString()] || [],
  }));

  // --- Backlog ---
  let backlog = [];

  if (hasIssueSelection) {
    // If we have explicit issue selection, we already fetched them in 'issues' variable above.
    // We include issues that have no sprint, OR issues whose sprint is not in the selected sprints list.
    backlog = issues.filter((i) => {
      const sid = i.sprintId ? i.sprintId.toString() : null;
      return !sid || !bySprint[sid];
    });
  } else {
    // No selection -> Fetch all backlog
    const backlogQ = {};
    if (boardId) backlogQ.boardId = boardId;
    backlogQ.sprintId = null;
    backlog = await Issue.find(backlogQ).sort({ position: 1 }).lean();
  }

  console.log("[Timeline] Found backlog issues:", backlog.length);
  console.log("[Timeline] Result:", {
    sprintsCount: sprintsWithIssues.length,
    backlogCount: backlog.length,
  });

  return { sprints: sprintsWithIssues, backlog };
}

// GET /timeline?boardId=...  — returns all timelines for the board/owner
async function getTimeline(req, res, next) {
  try {
    const boardId = req.query.boardId;
    if (boardId) {
      const board = await Board.findOne({
        _id: boardId,
        ownerId: req.user.sub,
      });
      if (!board) return res.status(404).json({ error: "Board not found" });
    }

    // Find all timelines for this board/owner, sorted by most recent first
    const timelines = await Timeline.find({
      boardId: boardId || null,
      ownerId: req.user.sub,
    })
      .sort({ snapshotDate: -1 })
      .lean();

    return res.json(timelines);
  } catch (err) {
    next(err);
  }
}

// POST /timeline  — create (or overwrite) a snapshot for the board
async function createTimeline(req, res, next) {
  try {
    const payload = req.body || {};
    const boardId = payload.boardId;
    if (boardId) {
      const board = await Board.findOne({
        _id: boardId,
        ownerId: req.user.sub,
      });
      if (!board) return res.status(404).json({ error: "Board not found" });
    }

    // if no data provided, compute
    let data = payload.data;
    if (!data) data = await computeTimelineForBoard(boardId, req.user.sub);

    const t = new Timeline({
      boardId: boardId || null,
      ownerId: req.user.sub,
      name: payload.name || "Timeline snapshot",
      data,
      selectedSprints: payload.selectedSprints || [],
      selectedIssues: payload.selectedIssues || [],
      snapshotDate: new Date(),
      version: 1,
    });
    await t.save();
    res.status(201).json({ snapshot: t });
  } catch (err) {
    next(err);
  }
}

// POST /timeline/:id/refresh  — recompute and update snapshot
async function refreshTimeline(req, res, next) {
  try {
    const t = await Timeline.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "Timeline not found" });
    if (t.ownerId.toString() !== req.user.sub) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const data = await computeTimelineForBoard(
      t.boardId,
      req.user.sub,
      t.selectedSprints,
      t.selectedIssues,
    );
    t.data = data;
    t.snapshotDate = new Date();
    t.version = (t.version || 0) + 1;
    await t.save();
    res.json({ snapshot: t });
  } catch (err) {
    next(err);
  }
}

// PATCH /timeline/:id — update metadata (name/isPublished)
async function updateTimeline(req, res, next) {
  try {
    const t = await Timeline.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "Timeline not found" });
    if (t.ownerId.toString() !== req.user.sub) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const up = {};
    if (req.body.name !== undefined) up.name = req.body.name;
    if (req.body.isPublished !== undefined) {
      up.isPublished = req.body.isPublished;
    }
    if (req.body.selectedSprints !== undefined) {
      up.selectedSprints = req.body.selectedSprints;
    }
    if (req.body.selectedIssues !== undefined) {
      up.selectedIssues = req.body.selectedIssues;
    }
    Object.assign(t, up);
    await t.save();
    res.json({ snapshot: t });
  } catch (err) {
    next(err);
  }
}

// DELETE /timeline/:id
async function deleteTimeline(req, res, next) {
  try {
    const t = await Timeline.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "Timeline not found" });
    if (t.ownerId.toString() !== req.user.sub) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await t.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTimeline,
  createTimeline,
  refreshTimeline,
  updateTimeline,
  deleteTimeline,
};
