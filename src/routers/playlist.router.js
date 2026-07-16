const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const playlistController = require('../controllers/playlist.controller');

router.use(protect);

router.post('/', validate([body('name').notEmpty().withMessage('Playlist name is required.')]), playlistController.createPlaylist);
router.get('/me', playlistController.getMyPlaylists);
router.get('/:id', playlistController.getPlaylistById);
router.put('/:id',
    validate([
        body('name').optional().notEmpty().withMessage('Playlist name cannot be empty.'),
        body('is_private').optional().isBoolean().withMessage('is_private must be a boolean value.')
    ]),
    playlistController.updatePlaylist
);
router.delete('/:id', playlistController.deletePlaylist);

router.post('/:id/songs', validate([body('song_id').notEmpty().isInt().withMessage('song_id is required and must be an integer.')]), playlistController.addSongToPlaylist);
router.delete('/:id/songs/:songId', playlistController.removeSongFromPlaylist);

module.exports = router;