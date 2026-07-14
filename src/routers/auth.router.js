const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, changePassword, refreshToken, logout, loginWithGoogle, loginWithApple } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.post(
  '/register',
  validate([
    body('name').notEmpty().withMessage('Tên không được để trống.'),
    body('username').notEmpty().withMessage('Username không được để trống.'),
    body('email').isEmail().withMessage('Email không hợp lệ.'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự.'),
    body('document_id').notEmpty().withMessage('Vui lòng cung cấp mã văn bản Điều khoản dịch vụ (document_id).')
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Email không hợp lệ.'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống.'),
  ]),
  login
);

router.get('/me', protect, getMe);

router.patch(
  '/change-password',
  protect,
  validate([
    body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại không được để trống.'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự.'),
  ]),
  changePassword
);

// New routes from the project plan
router.post('/google', loginWithGoogle);
router.post('/apple', loginWithApple);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);

module.exports = router;
