const express = require('express')
const { createColumn, patchColumn, deleteColumn, listColumns } = require('../controllers/column.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

router.get('/boards/:boardId/columns', requireAuth, listColumns)   // list columns for board
router.post('/boards/:boardId/columns', requireAuth, createColumn) // create
router.patch('/columns/:id', requireAuth, patchColumn)             // update
router.delete('/columns/:id', requireAuth, deleteColumn)           // delete

module.exports = router
