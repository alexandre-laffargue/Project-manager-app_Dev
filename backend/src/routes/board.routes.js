const express = require('express')
const { createBoard, getMyBoards } = require('../controllers/board.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

router.get('/me', requireAuth, getMyBoards)
router.post('/', requireAuth, createBoard)

module.exports = router
