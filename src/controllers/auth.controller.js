const jwt = require('jsonwebtoken');
const { User, UserConsent, LegalDocument, sequelize } = require('../models');
const { Op } = require('sequelize');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const register = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, email, password, document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({ success: false, message: 'Thiếu document_id (ToS)' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng.' });
    }

    const legalDoc = await LegalDocument.findByPk(document_id);
    if (!legalDoc) {
      return res.status(404).json({ success: false, message: 'Tài liệu pháp lý không tồn tại.' });
    }

    const user = await User.create({ name, email, password, last_tos_accepted_at: new Date() }, { transaction: t });
    
    await UserConsent.create({
      user_id: user.id,
      document_id: document_id,
      accepted_at: new Date()
    }, { transaction: t });

    await t.commit();
    const token = signToken(user.id);

    res.status(201).json({ success: true, data: { user, token } });
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
      attributes: { include: ['password'] },
    });

    if (!rawUser || !(await rawUser.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    if (rawUser.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị đình chỉ.' });
    }

    const token = signToken(rawUser.id);
    const userJSON = rawUser.toJSON();

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
        token, 
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
      attributes: { include: ['password'] },
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

module.exports = { register, login, getMe, changePassword };
