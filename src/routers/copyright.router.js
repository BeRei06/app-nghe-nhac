const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, creatorOnly } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const copyrightController = require('../controllers/copyright.controller');

router.use(protect);

// Route for creators to file a dispute
router.post('/disputes',
    creatorOnly,
    validate([
        body('song_id').isInt().withMessage('Song ID must be an integer.'),
        body('reason').notEmpty().withMessage('Reason for dispute is required.')
    ]),
    copyrightController.fileDispute
);

module.exports = router;