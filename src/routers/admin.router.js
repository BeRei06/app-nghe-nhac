const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { logAction } = require('../middlewares/audit.middleware');
const adminController = require('../controllers/admin.controller');

// All admin routes are protected and require admin privileges
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', logAction('update_user_status'), adminController.updateUserStatus);

// Content Management
router.get('/songs', adminController.getSongs);
router.patch('/songs/:id/review', logAction('review_song'), adminController.reviewSong);

// Moderation
router.get('/reports', adminController.getReports);
router.patch('/reports/:id/resolve', logAction('resolve_report'), adminController.resolveReport);

// Copyright Admin
router.get('/copyright/disputes', adminController.getDisputes);
router.patch('/copyright/disputes/:id/resolve', logAction('resolve_dispute'), adminController.resolveDispute);
router.get('/copyright/blacklist', adminController.getBlacklist);
router.post('/copyright/blacklist', logAction('add_to_blacklist'), adminController.addToBlacklist);
router.delete('/copyright/blacklist/:id', logAction('remove_from_blacklist'), adminController.removeFromBlacklist);

module.exports = router;