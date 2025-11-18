const express = require('express')
const { 
  createSprint, 
  listSprints, 
  patchSprint, 
  deleteSprint 
} = require('../controllers/sprint.controller')
const { requireAuth } = require('../middlewares/auth')

const router = express.Router()

router.get('/', requireAuth, listSprints)
router.post('/', requireAuth, createSprint)

router.patch('/:id', requireAuth, patchSprint)
router.delete('/:id', requireAuth, deleteSprint)

module.exports = router
