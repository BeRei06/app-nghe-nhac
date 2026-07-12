const { LegalDocument } = require('../models');
const { Op } = require('sequelize');

const checkConsent = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Lấy bản ToS mới nhất đang hiệu lực
    const latestDocument = await LegalDocument.findOne({
      where: {
        effective_at: {
          [Op.lte]: new Date()
        }
      },
      order: [['effective_at', 'DESC']]
    });

    if (latestDocument) {
      if (!user.last_tos_accepted_at || new Date(user.last_tos_accepted_at) < new Date(latestDocument.effective_at)) {
        return res.status(403).json({ 
          success: false,
          error: 'TOS_ACCEPTANCE_REQUIRED',
          message: 'Bạn cần đồng ý với các Điều khoản mới trước khi tiếp tục.',
          document_id: latestDocument.id
        });
      }
    }

    next();
  } catch (error) {
    console.error('Check Consent Middleware Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { checkConsent };
