const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');

const router = Router();

/**
 * POST /register
 * Register a new user account
 */
router.post(
  '/register',
  [
    body('username')
      .notEmpty()
      .withMessage('Username is required.')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long.'),
    body('email')
      .notEmpty()
      .withMessage('Email is required.')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required.')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    body('phone_number')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number.'),
  ],
  validate,
  authController.register
);

/**
 * POST /login
 * Login with email and password
 */
router.post(
  '/login',
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required.'),
  ],
  validate,
  authController.login
);

/**
 * POST /logout
 * Logout the current user (requires authentication)
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * POST /refresh-token
 * Refresh an expired access token using a valid refresh token
 */
router.post(
  '/refresh-token',
  authController.refreshToken
);

/**
 * POST /accept-tos
 * Accept new Terms of Service
 */
router.post(
  '/accept-tos',
  authenticate,
  [
    body('document_id').notEmpty().withMessage('Document ID is required.')
  ],
  validate,
  authController.acceptTos
);

module.exports = router;
