const Joi = require("joi");
const Column = require("../models/Column");
const Card = require("../models/Card");
const Board = require("../models/Board");

const createColumnSchema = Joi.object({
  key: Joi.string().trim().required(),
  title: Joi.string().trim().required(),
  wipLimit: Joi.number().integer().min(0).default(0),
  order: Joi.number().integer().min(0).default(0),
});

async function createColumn(req, res, next) {
  try {
    const { boardId } = req.params;
    const board = await Board.findOne({ _id: boardId, ownerId: req.user.sub });
    if (!board) return res.status(404).json({ error: "Board not found" });

    const payload = await createColumnSchema.validateAsync(req.body);
    const col = await Column.create({ boardId, ...payload });
    res.status(201).json(col);
  } catch (err) {
    if (err.code === 11000) {
      err.status = 409;
      err.message = "Column key already exists on this board";
    }
    if (err.isJoi) err.status = 400;
    next(err);
  }
}

const patchColumnSchema = Joi.object({
  title: Joi.string().trim(),
  wipLimit: Joi.number().integer().min(0),
  order: Joi.number().integer().min(0),
}).min(1);

async function patchColumn(req, res, next) {
  try {
    const { id } = req.params;
    const col = await Column.findById(id);
    if (!col) return res.status(404).json({ error: "Column not found" });
    const board = await Board.findOne({
      _id: col.boardId,
      ownerId: req.user.sub,
    });
    if (!board) return res.status(403).json({ error: "Forbidden" });

    const patch = await patchColumnSchema.validateAsync(req.body);
    Object.assign(col, patch);
    await col.save();
    res.json(col);
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
}

async function deleteColumn(req, res, next) {
  try {
    const { id } = req.params;
    const col = await Column.findById(id);
    if (!col) return res.status(404).json({ error: "Column not found" });
    const board = await Board.findOne({
      _id: col.boardId,
      ownerId: req.user.sub,
    });
    if (!board) return res.status(403).json({ error: "Forbidden" });

    // remove cards that belong to this column (cascade delete)
    await Card.deleteMany({ columnId: col._id, boardId: col.boardId });
    await col.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { createColumn, patchColumn, deleteColumn };

async function listColumns(req, res, next) {
  try {
    const { boardId } = req.params;
    const board = await Board.findOne({ _id: boardId, ownerId: req.user.sub });
    if (!board) return res.status(404).json({ error: "Board not found" });

    const cols = await Column.find({ boardId }).sort({
      order: 1,
      createdAt: 1,
    });
    res.json(cols);
  } catch (err) {
    next(err);
  }
}

// expose listColumns as well
module.exports = { createColumn, patchColumn, deleteColumn, listColumns };
