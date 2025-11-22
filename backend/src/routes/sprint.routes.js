const express = require('express')
const { listSprints, createSprint, patchSprint, deleteSprint, startSprint } = require('../controllers/sprint.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

// protect all sprint routes
router.use(requireAuth)

router.get('/', listSprints)
router.post('/', createSprint)
router.post('/:id/start', startSprint)
router.patch('/:id', patchSprint)
router.delete('/:id', deleteSprint)

module.exports = router

module.exports = router
