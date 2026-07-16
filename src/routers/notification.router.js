const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;