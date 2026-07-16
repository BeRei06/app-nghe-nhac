const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/upload.controller');
const { protect, creatorOnly } = require('../middlewares/auth.middleware');

// Configure multer for in-memory storage to calculate hash before saving
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } }); // Limit file size to 50MB

router.post(
    '/audio',
    protect,
    creatorOnly,
    upload.single('audio'), // 'audio' is the field name in the form-data
    uploadController.uploadAudio
);

router.get('/status/:song_id', protect, uploadController.getUploadStatus);

module.exports = router;