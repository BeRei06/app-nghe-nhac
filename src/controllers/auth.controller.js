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

// --- Helpers ---

/**
 * Tạo username độc nhất dựa trên email.
 * @param {string} email - Email của người dùng.
 * @param {object} transaction - Transaction của Sequelize.
 * @returns {Promise<string>} Username độc nhất.
 */
const generateUniqueUsername = async (email, transaction) => {
  let username, existingUsername;
  const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '');
  let attempts = 0;

  do {
    const suffix = attempts > 0 ? uuidv4().substring(0, 6) : uuidv4().substring(0, 4);
    username = `${baseUsername}_${suffix}`;
    existingUsername = await User.findOne({ where: { username }, transaction });
    attempts++;
  } while (existingUsername && attempts < 5);

  if (existingUsername) {
    throw new Error('Không thể tạo username độc nhất.');
  }
  return username;
};

const generateTokensAndCreateSession = async (user, req, transaction) => {
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  // Decode refresh token để lấy thời gian hết hạn (exp) một cách chính xác.
  // Điều này đảm bảo session và token luôn đồng bộ, thay vì hardcode 7 ngày.
  const decodedRefreshToken = jwt.decode(refreshToken);
  // 'exp' là UNIX timestamp (giây), cần chuyển sang mili-giây cho đối tượng Date.
  const expiresAt = new Date(decodedRefreshToken.exp * 1000);

  await UserSession.create({ user_id: user.id, refresh_token: refreshToken, expires_at: expiresAt, device_id: req.headers['user-agent'] }, { transaction });
  return { accessToken, refreshToken };
};

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

    const { accessToken, refreshToken } = await generateTokensAndCreateSession(user, req, t);

    await t.commit();

    res.status(201).json({ 
      success: true, 
      data: { user: user.toJSON(), access_token: accessToken, refresh_token: refreshToken } 
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

    const { accessToken, refreshToken } = await generateTokensAndCreateSession(rawUser, req);

    // Check if new ToS is available
    const latestToS = await LegalDocument.findOne({ order: [['effective_at', 'DESC']] });
    let requiresNewTos = false;
    if (latestToS && (!rawUser.last_tos_accepted_at || new Date(latestToS.effective_at) > new Date(rawUser.last_tos_accepted_at))) {
      requiresNewTos = true;
    }

    res.json({ 
      success: true, 
      data: { 
        user: rawUser.toJSON(), 
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

  const t = await sequelize.transaction();
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { email, name, picture } = response.data;

    let user = await User.findOne({ where: { email }, transaction: t });

    if (user && user.auth_provider !== 'google' && user.auth_provider !== null) {
      await t.rollback();
      return res.status(409).json({ success: false, message: `Email này đã được đăng ký bằng ${user.auth_provider}. Vui lòng đăng nhập bằng phương thức đó.` });
    }

    if (!user) {
      const username = await generateUniqueUsername(email, t);
      user = await User.create({
          email,
          name,
          username,
          auth_provider: 'google',
          avatar_url: picture,
          password_hash: null,
          status: 'active',
      }, { transaction: t });
    }

    const { accessToken, refreshToken } = await generateTokensAndCreateSession(user, req, t);

    await t.commit();

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    await t.rollback();
    // Handle token validation error from Google
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ success: false, message: 'Google access token không hợp lệ.' });
    }
    if (error.message === 'Không thể tạo username độc nhất.') {
        return next(error);
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

  const t = await sequelize.transaction();
  try {
    const { sub, email } = await appleSignIn.verifyIdToken(identity_token, {
      audience: process.env.APPLE_BUNDLE_ID,
    });

    let user = await User.findOne({ where: { apple_user_id: sub }, transaction: t });

    if (!user && email) {
        user = await User.findOne({ where: { email }, transaction: t });
        if (user) {
            if (user.auth_provider !== 'apple' && user.auth_provider !== null) {
                await t.rollback();
                return res.status(409).json({ success: false, message: `Tài khoản này đã được đăng ký bằng ${user.auth_provider}. Vui lòng đăng nhập bằng phương thức đó.` });
            }
            user.apple_user_id = sub;
            user.auth_provider = 'apple';
            await user.save({ transaction: t });
        }
    }

    if (!user) {
      if (!email) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Không thể tạo tài khoản do Apple không cung cấp email. Vui lòng thử lại và cho phép chia sẻ email của bạn.' });
      }

      let name = 'User';
      if (appleUser && appleUser.name) {
        name = `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim();
      }

      const username = await generateUniqueUsername(email, t);

      user = await User.create({
        email,
        name,
        username,
        auth_provider: 'apple',
        apple_user_id: sub,
        password_hash: null,
        status: 'active',
      }, { transaction: t });
    }

    const { accessToken, refreshToken } = await generateTokensAndCreateSession(user, req, t);

    await t.commit();

    res.json({ success: true, data: { user: user.toJSON(), access_token: accessToken, refresh_token: refreshToken } });
  } catch (error) {
    await t.rollback();
    console.error('Apple Sign-In Error:', error);
    if (error.message === 'Không thể tạo username độc nhất.') {
        return next(error);
    }
    return res.status(401).json({ success: false, message: 'Apple identity_token không hợp lệ hoặc đã hết hạn.' });
  }
};

module.exports = { register, login, getMe, changePassword, refreshToken, logout, loginWithGoogle, loginWithApple };
