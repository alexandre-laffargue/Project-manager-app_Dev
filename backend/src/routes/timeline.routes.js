const express = require('express')
const {
  getTimeline,
  createTimeline,
  refreshTimeline,
  updateTimeline,
  deleteTimeline
} = require('../controllers/timeline.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/', getTimeline)
router.post('/', createTimeline)
router.post('/:id/refresh', refreshTimeline)
router.patch('/:id', updateTimeline)
router.delete('/:id', deleteTimeline)

module.exports = router
