const { Notification } = require('../models');

// GET /notifications - Get user's notifications
exports.getNotifications = async (req, res, next) => {
    const { page = 1, limit = 15 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await Notification.findAndCountAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
        res.status(200).json({
            success: true, data: rows,
            meta: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
        });
    } catch (error) {
        next(error);
    }
};

// GET /notifications/unread-count - Get count of unread notifications
exports.getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.count({
            where: { user_id: req.user.id, is_read: false }
        });
        res.status(200).json({ success: true, unread_count: count });
    } catch (error) {
        next(error);
    }
};

// PATCH /notifications/:id/read - Mark a single notification as read
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }
        if (notification.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }
        notification.is_read = true;
        await notification.save();
        res.status(200).json(notification);
    } catch (error) {
        next(error);
    }
};

// POST /notifications/read-all - Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
    try {
        await Notification.update(
            { is_read: true },
            { where: { user_id: req.user.id, is_read: false } }
        );
        res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
        next(error);
    }
};