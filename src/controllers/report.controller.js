const { Report, Song, Post, User, MusicGroup, sequelize } = require('../models');

// POST /reports - Create a new report
exports.createReport = async (req, res, next) => {
    const { reported_entity_type, reported_entity_id, reason } = req.body;
    const reporter_id = req.user.id;

    try {
        // Validate entity type and existence
        let entity;
        const modelMap = { song: Song, post: Post, user: User, group: MusicGroup };
        const Model = modelMap[reported_entity_type];

        if (!Model) {
            return res.status(400).json({ message: 'Invalid entity type for reporting.' });
        }
        entity = await Model.findByPk(reported_entity_id);
        if (!entity) {
            return res.status(404).json({ message: `The ${reported_entity_type} you are trying to report does not exist.` });
        }

        const report = await Report.create({
            reporter_id,
            reported_entity_type,
            reported_entity_id,
            reason
        });

        res.status(201).json({ message: 'Report submitted successfully.', report });
    } catch (error) {
        next(error);
    }
};