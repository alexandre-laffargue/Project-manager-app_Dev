const Joi = require("joi");
const Board = require("../models/Board");

const createBoardSchema = Joi.object({
  name: Joi.string().min(2).required(),
});

async function createBoard(req, res, next) {
  try {
    const { name } = await createBoardSchema.validateAsync(req.body);
    const board = await Board.create({ name, ownerId: req.user.sub });
    res.status(201).json(board);
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
}

async function getMyBoards(req, res, next) {
  try {
    const boards = await Board.find({ ownerId: req.user.sub }).sort({
      createdAt: -1,
    });
    res.json(boards);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBoard, getMyBoards };
