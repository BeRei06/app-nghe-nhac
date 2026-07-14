const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/change-password', protect, (req, res) => res.status(501).json({message: 'Not implemented'}));
router.post('/google', authController.googleAuth);
router.post('/apple', authController.appleAuth);
router.post('/accept-tos', protect, authController.acceptTos);

module.exports = router;