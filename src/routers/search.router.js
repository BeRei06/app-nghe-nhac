const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const searchController = require('../controllers/search.controller');

router.get('/', protect, searchController.searchAll);

module.exports = router;