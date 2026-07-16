const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Lấy thông tin user kèm theo Roles
    const user = await User.findByPk(decoded.id, {
      include: {
        model: Role,
        through: { attributes: [] } // Không lấy các thuộc tính của bảng trung gian
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tài khoản không hoạt động hoặc đã bị đình chỉ.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token đã hết hạn.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
  }
};

const adminOnly = (req, res, next) => {
  // Kiểm tra xem trong danh sách Roles của user có role admin hay không
  const isAdmin = req.user.Roles.some(role => role.name === 'super_admin' || role.name === 'admin');
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền thực hiện.' });
  }
  next();
};

const creatorOnly = (req, res, next) => {
  // Middleware này kiểm tra user có phải là creator hay không
  // Tên `creatorOnly` nhất quán với cách dùng trong router.
  if (!req.user.is_creator) {
    return res.status(403).json({ success: false, message: 'Chỉ người sáng tạo (creator) mới có quyền này.' });
  }
  next();
};

module.exports = { protect, adminOnly, creatorOnly };
