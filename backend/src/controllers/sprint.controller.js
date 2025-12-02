const Joi = require("joi");
const Sprint = require("../models/Sprint");
const Issue = require("../models/Issue");

const createSprintSchema = Joi.object({
  name: Joi.string().min(1).required(),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  objective: Joi.string().allow("").default(""),
  status: Joi.string().valid("planned", "active", "completed").optional(),
  issues: Joi.array().items(Joi.string()).optional(),
  boardId: Joi.string().optional().allow(null),
});

const patchSprintSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().optional().allow(null),
  objective: Joi.string().optional().allow(""),
  status: Joi.string().valid("planned", "active", "completed").optional(),
  issues: Joi.array().items(Joi.string()).optional(),
  boardId: Joi.string().optional().allow(null),
}).min(1);

const listSprints = async (req, res) => {
  try {
    const ownerId = req.user.sub;
    const filter = { ownerId };
    if (req.query.boardId) filter.boardId = req.query.boardId;
    const sprints = await Sprint.find(filter).sort({ createdAt: -1 });
    return res.json(sprints);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const createSprint = async (req, res) => {
  const { error } = createSprintSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  try {
    const ownerId = req.user.sub;
    const payload = { ...req.body, ownerId };
    const sprint = new Sprint(payload);
    await sprint.save();

    // Mettre à jour le sprintId des issues liées
    if (req.body.issues && req.body.issues.length > 0) {
      // D'abord, retirer ces issues de tout autre sprint
      await Sprint.updateMany(
        { issues: { $in: req.body.issues }, _id: { $ne: sprint._id } },
        { $pull: { issues: { $in: req.body.issues } } },
      );

      // Puis assigner les issues au nouveau sprint
      await Issue.updateMany(
        { _id: { $in: req.body.issues } },
        { $set: { sprintId: sprint._id } },
      );
    }

    return res.status(201).json(sprint);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const patchSprint = async (req, res) => {
  const { error } = patchSprintSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: "Sprint not found" });
    if (sprint.ownerId.toString() !== req.user.sub)
      return res.status(403).json({ error: "Forbidden" });

    // Si on modifie les issues liées
    if (req.body.issues !== undefined) {
      const oldIssueIds = sprint.issues.map((id) => id.toString());
      const newIssueIds = req.body.issues || [];

      // Retirer le sprintId des issues qui ne sont plus dans le sprint
      const removedIssues = oldIssueIds.filter(
        (id) => !newIssueIds.includes(id),
      );
      if (removedIssues.length > 0) {
        await Issue.updateMany(
          { _id: { $in: removedIssues } },
          { $set: { sprintId: null } },
        );
      }

      // Ajouter le sprintId aux nouvelles issues
      const addedIssues = newIssueIds.filter((id) => !oldIssueIds.includes(id));
      if (addedIssues.length > 0) {
        // Retirer ces issues de tout autre sprint d'abord
        await Sprint.updateMany(
          { issues: { $in: addedIssues }, _id: { $ne: sprint._id } },
          { $pull: { issues: { $in: addedIssues } } },
        );

        // Puis assigner au sprint actuel
        await Issue.updateMany(
          { _id: { $in: addedIssues } },
          { $set: { sprintId: sprint._id } },
        );
      }
    }

    Object.assign(sprint, req.body);
    await sprint.save();
    return res.json(sprint);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: "Sprint not found" });
    if (sprint.ownerId.toString() !== req.user.sub)
      return res.status(403).json({ error: "Forbidden" });

    // Retirer le sprintId de toutes les issues liées avant de supprimer le sprint
    if (sprint.issues && sprint.issues.length > 0) {
      await Issue.updateMany(
        { _id: { $in: sprint.issues } },
        { $set: { sprintId: null } },
      );
    }

    await sprint.deleteOne();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const startSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: "Sprint not found" });
    if (sprint.ownerId.toString() !== req.user.sub)
      return res.status(403).json({ error: "Forbidden" });
    if (sprint.status === "active")
      return res.status(400).json({ error: "Sprint already started" });
    if (sprint.status === "completed")
      return res.status(400).json({ error: "Cannot start a completed sprint" });
    sprint.status = "active";
    if (!sprint.startDate) sprint.startDate = new Date();
    await sprint.save();
    return res.json(sprint);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const closeSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: "Sprint not found" });
    if (sprint.ownerId.toString() !== req.user.sub)
      return res.status(403).json({ error: "Forbidden" });
    if (sprint.status === "completed")
      return res.status(400).json({ error: "Sprint already closed" });
    sprint.status = "completed";
    // allow optional endDate in body
    if (req.body && req.body.endDate)
      sprint.endDate = new Date(req.body.endDate);
    else if (!sprint.endDate) sprint.endDate = new Date();
    await sprint.save();
    return res.json(sprint);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const reopenSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: "Sprint not found" });
    if (sprint.ownerId.toString() !== req.user.sub)
      return res.status(403).json({ error: "Forbidden" });
    if (sprint.status !== "completed")
      return res
        .status(400)
        .json({ error: "Only completed sprints can be reopened" });
    sprint.status = "planned";
    await sprint.save();
    return res.json(sprint);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  listSprints,
  createSprint,
  patchSprint,
  deleteSprint,
  startSprint,
  closeSprint,
  reopenSprint,
};
