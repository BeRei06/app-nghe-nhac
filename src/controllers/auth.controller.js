const jwt = require('jsonwebtoken');
const { User, UserSession, LegalDocument, UserConsent } = require('../models');
const { Op } = require('sequelize');

/**
 * Generate an access token (short-lived, 15 minutes)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      is_creator: user.is_creator,
      role: user.role
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );
};

/**
 * Generate a refresh token (long-lived, 7 days)
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: '7d' }
  );
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, phone_number, document_id } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username is already taken.' });
    }

    const user = await User.create({
      username,
      email,
      password_hash: password, // The hook handles hashing
      phone_number: phone_number || null,
      last_tos_accepted_at: document_id ? new Date() : null
    });

    if (document_id) {
      await UserConsent.create({
        user_id: user.id,
        legal_document_id: document_id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    }

    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await UserSession.create({
      user_id: user.id,
      refresh_token,
      expires_at: expiresAt,
      is_revoked: false,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt
    });

    const userResponse = user.toJSON();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: userResponse,
        access_token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login an existing user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    const user = await User.findOne({
      where: email ? { email } : { username }
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status === 'suspended' || user.status === 'deleted') {
      return res.status(403).json({ success: false, message: 'Account is not active.' });
    }

    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await UserSession.create({
      user_id: user.id,
      refresh_token,
      expires_at: expiresAt,
      is_revoked: false,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt
    });

    // Check if new ToS consent is required
    let requires_new_consent = false;
    const latestDocument = await LegalDocument.findOne({
      where: { effective_at: { [Op.lte]: new Date() } },
      order: [['effective_at', 'DESC']]
    });

    if (latestDocument && (!user.last_tos_accepted_at || new Date(user.last_tos_accepted_at) < new Date(latestDocument.effective_at))) {
      requires_new_consent = true;
    }

    const userResponse = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: userResponse,
        access_token,
        requires_new_consent,
        strike_count: user.strike_count
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout the current user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (refresh_token) {
      const session = await UserSession.findOne({
        where: { refresh_token },
      });

      if (session) {
        session.is_revoked = true;
        await session.save();
      }
    }

    res.clearCookie('refresh_token');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res.status(401).json({ success: false, message: 'Refresh token not found.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const session = await UserSession.findOne({
      where: { user_id: decoded.id, refresh_token },
    });

    if (!session || session.is_revoked || new Date() > new Date(session.expires_at)) {
      return res.status(401).json({ success: false, message: 'Session is invalid or expired. Please login again.' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'User is not active.' });
    }

    const access_token = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: { access_token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept new Terms of Service
 * POST /api/auth/accept-tos
 */
const acceptTos = async (req, res, next) => {
  try {
    const { document_id } = req.body;
    const user = req.user;

    const document = await LegalDocument.findByPk(document_id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Legal document not found.' });
    }

    await UserConsent.create({
      user_id: user.id,
      legal_document_id: document.id,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    user.last_tos_accepted_at = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Terms of service accepted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  acceptTos
};
