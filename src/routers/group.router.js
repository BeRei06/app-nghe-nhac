const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { canViewGroup, isGroupMember, isGroupAdmin } = require('../middlewares/group.middleware');
const groupController = require('../controllers/group.controller');

// All routes are protected
router.use(protect);

// --- Group Management ---
router.post(
    '/',
    validate([
        body('name').notEmpty().withMessage('Group name is required.'),
        body('description').optional().isString(),
        body('is_private').isBoolean().withMessage('is_private must be a boolean.')
    ]),
    groupController.createGroup
);

router.get('/:groupId', canViewGroup, groupController.getGroupById);

router.put(
    '/:groupId',
    isGroupAdmin, // Middleware to check for admin rights
    validate([
        body('name').optional().notEmpty().withMessage('Group name cannot be empty.'),
        body('description').optional().isString(),
        body('is_private').optional().isBoolean().withMessage('is_private must be a boolean.')
    ]),
    groupController.updateGroup
);

// --- Member Management ---
router.post('/:groupId/join', groupController.joinGroup);
router.post('/:groupId/leave', groupController.leaveGroup);

// Admin actions
router.post('/:groupId/members/:userId/approve', isGroupAdmin, groupController.approveJoinRequest);
router.delete('/:groupId/members/:userId', isGroupAdmin, groupController.removeMember);

// --- Group Content ---
router.post(
    '/:groupId/posts',
    isGroupMember, // Must be a member to post
    validate([ body('post_id').notEmpty().withMessage('post_id is required.') ]),
    groupController.createGroupPost
);

router.get('/:groupId/posts', canViewGroup, groupController.getGroupPosts);

module.exports = router;