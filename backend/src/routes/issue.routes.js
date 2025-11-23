const express = require('express')
const { createIssue, getIssues, patchReorder, patchMoveToSprint, patchDates } = require('../controllers/issue.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

router.get('/issues', requireAuth, getIssues) // supports ?scope=backlog or ?scope=sprint&sprintId=...
router.post('/issues', requireAuth, createIssue)
router.patch('/issues/reorder', requireAuth, patchReorder)
router.patch('/issues/moveToSprint', requireAuth, patchMoveToSprint)
router.patch('/issues/:id/dates', requireAuth, patchDates)

module.exports = router
