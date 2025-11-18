const express = require('express')
const auth = require('./auth.routes')
const board = require('./board.routes')
const column = require('./column.routes')
const card = require('./card.routes')
const { requireAuth } = require('../middlewares/auth')
const sprint = require('./sprint.routes') 


const router = express.Router()

router.use('/auth', auth)
router.use('/boards', board)
router.use('/columns', column)
router.use('/cards', card)
router.use('/sprints', sprint)


router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))

module.exports = router
