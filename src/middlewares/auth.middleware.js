const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authenticate middleware
 * Extracts Bearer token from Authorization header, verifies JWT access_token,
 * and attaches decoded user payload to req.user.
 * Returns 401 if token is missing or invalid.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id || decoded.user_id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    }
    if (user.status === 'deleted') {
      return res.status(401).json({ success: false, message: 'Account deleted.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

/**
 * Optional authentication middleware
 * Same as authenticate but does NOT return an error if no token is present.
 * Sets req.user = null when no valid token is found.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Token is invalid or expired, but we don't block the request
    req.user = null;
    next();
  }
};

/**
 * Require creator role middleware
 * Checks if the authenticated user has is_creator === true.
 * Must be used after authenticate middleware.
 * Returns 403 if the user is not a creator.
 */
const requireCreator = (req, res, next) => {
  if (!req.user || req.user.is_creator !== true) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Creator role required.',
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireCreator, requireAdmin };
