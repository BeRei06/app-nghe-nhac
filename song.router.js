const express = require('express');
const router = express.Router();
const songController = require('../controllers/song.controller');
const { protect, creatorOnly } = require('../middlewares/auth.middleware');
// Giả sử bạn có middleware validate và file validator
// const validate = require('../middlewares/validate.middleware');
// const { createSongValidator } = require('../validators/song.validator');

router.get('/', songController.listSongs);
router.get('/trending', songController.getTrending);
router.get('/top-chart', songController.getTopChart);
router.get('/recommended', protect, songController.getRecommended);

router.get('/:id', songController.getSongById);
router.post('/:id/listen', protect, songController.recordListen);

// For creating a song metadata entry, after file is uploaded and processed
router.post(
    '/',
    protect,
    creatorOnly,
    // validate(createSongValidator), // <-- ÁP DỤNG VALIDATION
    songController.createSong
);

router.delete('/:id', protect, songController.deleteSong);

module.exports = router;