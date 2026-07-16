const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const feedController = require('../controllers/feed.controller');

// All routes in this file are protected
router.use(protect);

router.get('/', feedController.getFeed);

module.exports = router;