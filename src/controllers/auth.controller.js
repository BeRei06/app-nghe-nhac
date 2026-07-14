const jwt = require('jsonwebtoken');
const { User, UserConsent, LegalDocument, UserSession, sequelize } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const appleSignIn = require('apple-signin-auth');
const { v4: uuidv4 } = require('uuid');

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

const register = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    // Theo schema mới, chúng ta cần username
    const { name, email, password, document_id, username } = req.body;

    if (!document_id) {
      return res.status(400).json({ success: false, message: 'Thiếu document_id (ToS)' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng.' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username đã được sử dụng.' });
    }

    const legalDoc = await LegalDocument.findByPk(document_id);
    if (!legalDoc) {
      return res.status(404).json({ success: false, message: 'Tài liệu pháp lý không tồn tại.' });
    }

    const user = await User.create({ 
      name, 
      email, 
      password, // Model sẽ hash mật khẩu
      username,
      last_tos_accepted_at: new Date() 
    }, { transaction: t });
    
    await UserConsent.create({
      user_id: user.id,
      document_id: document_id,
      accepted_at: new Date()
    }, { transaction: t });

    await t.commit();
    
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Match refresh token expiry

    await UserSession.create({
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      device_id: req.headers['user-agent'] // Example device_id
    });

    res.status(201).json({ 
      success: true, 
      data: { user, access_token: accessToken, refresh_token: refreshToken } 
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const rawUser = await User.findOne({
      where: { email },
      attributes: { include: ['password_hash'] }, // Cập nhật theo schema mới
    });

    if (!rawUser || !(await rawUser.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    if (rawUser.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị đình chỉ.' });
    }

    const accessToken = signAccessToken(rawUser.id);
    const refreshToken = signRefreshToken(rawUser.id);
    const userJSON = rawUser.toJSON();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Match refresh token expiry

    // Tạo hoặc cập nhật session
    await UserSession.create({
      user_id: rawUser.id,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      device_id: req.headers['user-agent']
    });


    // Check if new ToS is available
    const latestToS = await LegalDocument.findOne({ order: [['effective_at', 'DESC']] });
    let requiresNewTos = false;
    if (latestToS && (!rawUser.last_tos_accepted_at || new Date(latestToS.effective_at) > new Date(rawUser.last_tos_accepted_at))) {
      requiresNewTos = true;
    }

    res.json({ 
      success: true, 
      data: { 
        user: userJSON, 
        access_token: accessToken,
        refresh_token: refreshToken,
        strike_count: rawUser.strike_count,
        requires_new_tos: requiresNewTos,
        latest_tos_id: requiresNewTos ? latestToS.id : null
      } 
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const rawUser = await User.findOne({
      where: { id: req.user.id },
      attributes: { include: ['password_hash'] },
    });

    if (!(await rawUser.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
    }

    await rawUser.update({ password: newPassword });

    res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp refresh token.' });
  }

  try {
    const session = await UserSession.findOne({ where: { refresh_token } });
    if (!session) {
      return res.status(401).json({ success: false, message: 'Session không hợp lệ.' });
    }

    if (session.is_revoked || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token đã hết hạn hoặc đã bị thu hồi.' });
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = signAccessToken(decoded.id);

    res.json({ success: true, data: { access_token: newAccessToken } });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp refresh token để đăng xuất.' });
  }

  try {
    const session = await UserSession.findOne({ where: { refresh_token, user_id: req.user.id } });
    if (session) {
      session.is_revoked = true;
      await session.save();
    }
    res.json({ success: true, message: 'Đăng xuất thành công.' });
  } catch (error) {
    next(error);
  }
};

const loginWithGoogle = async (req, res, next) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp access token từ Google.' });
  }

  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { email, name, picture } = response.data;

    let user = await User.findOne({ where: { email } });

    if (user && user.auth_provider !== 'google') {
      return res.status(409).json({ success: false, message: `Email này đã được đăng ký bằng ${user.auth_provider}. Vui lòng đăng nhập bằng phương thức đó.` });
    }

    if (!user) {
      user = await User.create({
        email,
        name,
        username: `${email.split('@')[0]}_${uuidv4().substring(0, 4)}`, // Generate unique username
        auth_provider: 'google',
        avatar_url: picture,
        password_hash: null, // No password for OAuth users
        status: 'active',
      });
    }

    const newAccessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await UserSession.create({
      user_id: user.id,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
      device_id: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        user,
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      },
    });
  } catch (error) {
    // Handle token validation error from Google
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ success: false, message: 'Google access token không hợp lệ.' });
    }
    next(error);
  }
};

// Stub for Apple login as per plan
const loginWithApple = async (req, res, next) => {
  const { identity_token, user: appleUser } = req.body;
  if (!identity_token) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp identity_token từ Apple.' });
  }

  try {
    const { sub, email } = await appleSignIn.verifyIdToken(identity_token, {
      audience: process.env.APPLE_BUNDLE_ID,
    });

    let user = await User.findOne({ where: { apple_user_id: sub } });

    if (!user && email) {
      user = await User.findOne({ where: { email } });
    }

    if (user && user.auth_provider !== 'apple') {
      return res.status(409).json({ success: false, message: `Tài khoản này đã được đăng ký bằng ${user.auth_provider}. Vui lòng đăng nhập bằng phương thức đó.` });
    }

    if (!user) {
      if (!email) {
        return res.status(400).json({ success: false, message: 'Không thể tạo tài khoản do Apple không cung cấp email. Vui lòng thử lại và cho phép chia sẻ email của bạn.' });
      }

      let name = 'User';
      if (appleUser && appleUser.name) {
        name = `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim();
      }

      user = await User.create({
        email,
        name,
        username: `${email.split('@')[0]}_${uuidv4().substring(0, 6)}`,
        auth_provider: 'apple',
        apple_user_id: sub,
        password_hash: null,
        status: 'active',
      });
    }

    const newAccessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await UserSession.create({
      user_id: user.id,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
      device_id: req.headers['user-agent'],
    });

    res.json({ success: true, data: { user, access_token: newAccessToken, refresh_token: newRefreshToken } });
  } catch (error) {
    console.error('Apple Sign-In Error:', error);
    return res.status(401).json({ success: false, message: 'Apple identity_token không hợp lệ hoặc đã hết hạn.' });
  }
};

module.exports = { register, login, getMe, changePassword, refreshToken, logout, loginWithGoogle, loginWithApple };
