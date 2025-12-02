const express = require('express')
const {
  listSprints,
  createSprint,
  patchSprint,
  deleteSprint,
  startSprint,
  closeSprint,
  reopenSprint
} = require('../controllers/sprint.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

// protect all sprint routes
router.use(requireAuth)

router.get('/', listSprints)
router.post('/', createSprint)
router.post('/:id/start', startSprint)
router.post('/:id/close', closeSprint)
router.post('/:id/reopen', reopenSprint)
router.patch('/:id', patchSprint)
router.delete('/:id', deleteSprint)

module.exports = router
