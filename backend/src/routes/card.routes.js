const express = require("express");
const {
  createCard,
  listCards,
  patchCard,
  deleteCard,
} = require("../controllers/card.controller");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.get("/boards/:boardId/cards", requireAuth, listCards);
router.post("/boards/:boardId/cards", requireAuth, createCard);
router.patch("/cards/:id", requireAuth, patchCard); // inclut move (via toColumnId/toPosition)
router.delete("/cards/:id", requireAuth, deleteCard);

module.exports = router;
