const express = require('express')
const { listSprints, createSprint, patchSprint, deleteSprint } = require('../controllers/sprint.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

// protect all sprint routes
router.use(requireAuth)

router.get('/', listSprints)
router.post('/', createSprint)
router.patch('/:id', patchSprint)
router.delete('/:id', deleteSprint)

module.exports = router

