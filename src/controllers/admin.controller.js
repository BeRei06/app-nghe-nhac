const { User, Song, Post, Report, CopyrightDispute, CopyrightBlacklist, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /admin/dashboard - Get system overview stats
exports.getDashboardStats = async (req, res, next) => {
    try {
        const [userCount, songCount, postCount, pendingReports, pendingDisputes] = await Promise.all([
            User.count(),
            Song.count(),
            Post.count(),
            Report.count({ where: { status: 'pending' } }),
            CopyrightDispute.count({ where: { status: 'pending' } })
        ]);
        res.status(200).json({
            users: userCount,
            songs: songCount,
            posts: postCount,
            pending_reports: pendingReports,
            pending_disputes: pendingDisputes
        });
    } catch (error) {
        next(error);
    }
};

// --- User Management ---
// GET /admin/users - Get list of users
exports.getUsers = async (req, res, next) => {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    if (search) where.username = { [Op.like]: `%${search}%` };

    try {
        const { count, rows } = await User.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });
        res.status(200).json({
            success: true, data: rows,
            meta: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /admin/users/:id/status - Update user status
exports.updateUserStatus = async (req, res, next) => {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        user.status = status;
        await user.save();
        res.status(200).json({ message: `User status updated to ${status}.`, user });
    } catch (error) {
        next(error);
    }
};

// --- Content Management ---
// GET /admin/songs - Get songs by status
exports.getSongs = async (req, res, next) => {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await Song.findAndCountAll({
            where: { status },
            include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'ASC']]
        });
        res.status(200).json({
            success: true, data: rows,
            meta: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /admin/songs/:id/review - Approve or reject a song
exports.reviewSong = async (req, res, next) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid review status.' });
    }
    try {
        const song = await Song.findByPk(req.params.id);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        song.status = status;
        await song.save();
        // TODO: Send notification to creator
        res.status(200).json({ message: `Song has been ${status}.` });
    } catch (error) {
        next(error);
    }
};

// --- Moderation ---
// GET /admin/reports - Get reports
exports.getReports = async (req, res, next) => {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await Report.findAndCountAll({
            where: { status },
            include: [{ model: User, as: 'Reporter', attributes: ['id', 'username'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'ASC']]
        });
        res.status(200).json({
            success: true, data: rows,
            meta: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /admin/reports/:id/resolve - Resolve a report
exports.resolveReport = async (req, res, next) => {
    const { status, action_taken } = req.body; // action_taken is for audit log
    if (!['resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid resolution status.' });
    }
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found.' });
        report.status = status;
        report.admin_id = req.user.id;
        report.resolved_at = new Date();
        await report.save();
        // TODO: Perform action based on `action_taken` (e.g., delete post, suspend user)
        res.status(200).json({ message: `Report has been ${status}.` });
    } catch (error) {
        next(error);
    }
};

// --- Copyright Admin ---
// GET /admin/copyright/disputes - Get copyright disputes
exports.getDisputes = async (req, res, next) => {
    // Similar to getReports
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await CopyrightDispute.findAndCountAll({
            where: { status },
            include: [
                { model: User, as: 'Disputer', attributes: ['id', 'username'] },
                { model: Song }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'ASC']]
        });
        res.status(200).json({
            success: true, data: rows,
            meta: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /admin/copyright/disputes/:id/resolve - Resolve a dispute
exports.resolveDispute = async (req, res, next) => {
    // Similar to resolveReport
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid resolution status.' });
    }
    const t = await sequelize.transaction();
    try {
        const dispute = await CopyrightDispute.findByPk(req.params.id, { include: Song, transaction: t });
        if (!dispute) {
            await t.rollback();
            return res.status(404).json({ message: 'Dispute not found.' });
        }
        dispute.status = status;
        dispute.admin_id = req.user.id;
        dispute.resolved_at = new Date();
        await dispute.save({ transaction: t });

        if (status === 'approved') {
            // If dispute is approved, song copyright status becomes clean
            dispute.Song.copyright_status = 'clean';
            await dispute.Song.save({ transaction: t });
        }
        // If rejected, it might remain 'disputed' or go back to 'flagged', depends on policy. Let's keep it simple.

        await t.commit();
        res.status(200).json({ message: `Dispute has been ${status}.` });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// GET /admin/copyright/blacklist - Get blacklist
exports.getBlacklist = async (req, res, next) => {
    try {
        const list = await CopyrightBlacklist.findAll();
        res.status(200).json(list);
    } catch (error) {
        next(error);
    }
};

// POST /admin/copyright/blacklist - Add to blacklist
exports.addToBlacklist = async (req, res, next) => {
    const { file_hash_sha256, reason } = req.body;
    try {
        const entry = await CopyrightBlacklist.create({ file_hash_sha256, reason });
        res.status(201).json(entry);
    } catch (error) {
        next(error);
    }
};

// DELETE /admin/copyright/blacklist/:id - Remove from blacklist
exports.removeFromBlacklist = async (req, res, next) => {
    try {
        const entry = await CopyrightBlacklist.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Blacklist entry not found.' });
        await entry.destroy();
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};