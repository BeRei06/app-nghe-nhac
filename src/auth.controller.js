const jwt = require('jsonwebtoken');
const { User, Role, UserSession, LegalDocument, UserConsent } = require('../../models');
const { Op } = require('sequelize');

const generateTokens = async (user, deviceId) => {
  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await UserSession.create({
    user_id: user.id,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    device_id: deviceId,
  });

  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    const newUser = await User.create({
      username,
      email,
      password_hash: password,
      auth_provider: 'email',
    });

    const userRole = await Role.findOne({ where: { name: 'user' } });
    if (userRole) {
      await newUser.addRole(userRole);
    }

    const activeTos = await LegalDocument.findOne({
      where: { type: 'terms_of_use', is_active: true },
      order: [['effective_at', 'DESC']],
    });
    if (activeTos) {
      await UserConsent.create({
        user_id: newUser.id,
        document_id: activeTos.id,
      });
      await newUser.update({ last_tos_accepted_at: new Date() });
    }

    const { accessToken, refreshToken } = await generateTokens(newUser, req.headers['user-agent']);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.status === 'suspended') {
        return res.status(403).json({ message: 'This account has been suspended.' });
    }
    if (user.status === 'deleted') {
        return res.status(401).json({ message: 'This account has been deleted.' });
    }

    const { accessToken, refreshToken } = await generateTokens(user, req.headers['user-agent']);

    res.status(200).json({
      accessToken,
      refreshToken,
      user: user.toJSON(),
      strike_count: user.strike_count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

exports.logout = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required.' });
    }
    try {
        await UserSession.update({ is_revoked: true }, { where: { refresh_token: refreshToken } });
        res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during logout.' });
    }
};

exports.refresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token not provided.' });
    }

    try {
        const session = await UserSession.findOne({ where: { refresh_token: refreshToken } });
        if (!session || session.is_revoked || session.expires_at < new Date()) {
            return res.status(403).json({ message: 'Invalid, revoked, or expired refresh token.' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        res.status(200).json({ accessToken });
    } catch (error) {
        res.status(403).json({ message: 'Invalid refresh token.' });
    }
};

exports.getMe = async (req, res) => {
  res.status(200).json(req.user);
};

exports.googleAuth = async (req, res) => {
    res.status(501).json({ message: 'Google OAuth not implemented yet.' });
};

exports.appleAuth = async (req, res) => {
    res.status(501).json({ message: 'Apple OAuth not implemented yet.' });
};

exports.acceptTos = async (req, res) => {
    try {
        const { documentId } = req.body;
        const document = await LegalDocument.findByPk(documentId);
        if (!document || !document.is_active) {
            return res.status(400).json({ message: 'Invalid or inactive legal document.' });
        }
        await UserConsent.create({ user_id: req.user.id, document_id: documentId });
        await User.update({ last_tos_accepted_at: new Date() }, { where: { id: req.user.id } });
        res.status(200).json({ message: 'Terms of Service accepted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while accepting ToS.' });
    }
};