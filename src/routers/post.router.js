const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const postController = require('../controllers/post.controller');

// All routes in this file are protected
router.use(protect);

router.post(
    '/',
    validate([
        body('song_id').isInt().withMessage('Song ID must be an integer.'),
        body('snippet_start_time').isInt({ min: 0 }).withMessage('Snippet start time must be a non-negative integer.'),
        body('snippet_end_time').isInt({ min: 0 }).withMessage('Snippet end time must be a non-negative integer.'),
        body('caption').optional().isString().isLength({ max: 500 }).withMessage('Caption cannot exceed 500 characters.')
    ]),
    postController.createPost
);

router.get('/:id', postController.getPostById);

router.put(
    '/:id',
    validate([
        body('caption').exists().withMessage('Caption is required for update.').isString().isLength({ max: 500 }).withMessage('Caption cannot exceed 500 characters.')
    ]),
    postController.updatePost
);

router.delete('/:id', postController.deletePost);

router.post('/:id/react', postController.reactToPost);

module.exports = router;