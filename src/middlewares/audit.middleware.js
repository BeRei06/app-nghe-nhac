const { AdminAuditLog } = require('../models');

const logAction = (action) => async (req, res, next) => {
    // This middleware should be placed after `protect` and admin role check
    const admin_id = req.user.id;
    
    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            await AdminAuditLog.create({
                admin_id,
                action: `${action}_${req.method}`,
                details: { params: req.params, body: req.body, query: req.query }
            });
        }
    });
    next();
};

module.exports = { logAction };