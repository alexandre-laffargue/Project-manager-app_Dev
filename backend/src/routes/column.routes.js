const express = require("express");
const {
  createColumn,
  patchColumn,
  deleteColumn,
  listColumns,
} = require("../controllers/column.controller");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.get("/boards/:boardId/columns", requireAuth, listColumns);
router.post("/boards/:boardId/columns", requireAuth, createColumn);
router.patch("/columns/:id", requireAuth, patchColumn);
router.delete("/columns/:id", requireAuth, deleteColumn);

module.exports = router;
