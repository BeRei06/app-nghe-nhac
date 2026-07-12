const { LegalDocument } = require('../models');

const checkConsent = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const latestToS = await LegalDocument.findOne({ order: [['effective_at', 'DESC']] });
    if (!latestToS) {
      return next(); // No ToS in system
    }

    if (!req.user.last_tos_accepted_at || new Date(latestToS.effective_at) > new Date(req.user.last_tos_accepted_at)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần đồng ý với Điều khoản dịch vụ mới nhất để tiếp tục sử dụng hệ thống.',
        requires_new_tos: true,
        latest_tos_id: latestToS.id
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkConsent;
