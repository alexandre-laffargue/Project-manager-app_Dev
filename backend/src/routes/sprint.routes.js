const express = require('express');
const { createSprint, listSprints } = require('../controllers/sprint.controller');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/', requireAuth, listSprints);
router.post('/', requireAuth, createSprint);

module.exports = router;

