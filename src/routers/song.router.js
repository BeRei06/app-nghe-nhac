const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, creatorOnly } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const songController = require('../controllers/song.controller');

// === Public Routes ===
router.get('/', songController.listSongs);
router.get('/trending', songController.getTrending);
router.get('/top-chart', songController.getTopChart);
router.get('/:id', songController.getSongById);

// === Protected Routes ===
router.use(protect);

router.get('/recommended', songController.getRecommended); // Personalized recommendations
router.post('/:id/listen', songController.recordListen); // Record a listen event

router.put(
    '/:id',
    creatorOnly, // Only the song's creator can update its metadata
    validate([
        body('title').optional().notEmpty().withMessage('Title cannot be empty.'),
        body('genre_id').optional().isInt().withMessage('Genre ID must be an integer.'),
        body('hashtags').optional().isArray().withMessage('Hashtags must be an array of strings.')
    ]),
    songController.updateSong
);

// Authorization (creator or admin) is handled within the controller
router.delete('/:id', songController.deleteSong);

module.exports = router;