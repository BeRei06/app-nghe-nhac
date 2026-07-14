const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tài khoản không hoạt động hoặc đã bị đình chỉ.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token hết hạn hoặc không hợp lệ.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền thực hiện.' });
  }
  next();
};

const isCreator = (req, res, next) => {
  // Dựa theo schema mới, user sẽ có trường is_creator
  if (!req.user.is_creator) {
    return res.status(403).json({ success: false, message: 'Chỉ Creator mới có quyền này.' });
  }
  next();
};

const checkActive = (req, res, next) => {
  if (req.user.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Tài khoản không hoạt động.' });
  }
  next();
};


module.exports = { protect, adminOnly, isCreator, checkActive };
