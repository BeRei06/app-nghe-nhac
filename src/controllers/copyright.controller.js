const { CopyrightDispute, Song, sequelize } = require('../models');

// POST /copyright/disputes - File a copyright dispute
exports.fileDispute = async (req, res, next) => {
    const { song_id, reason } = req.body;
    const disputer_id = req.user.id;
    const t = await sequelize.transaction();

    try {
        const song = await Song.findByPk(song_id, { transaction: t });
        if (!song) {
            await t.rollback();
            return res.status(404).json({ message: 'Song not found.' });
        }

        // A user can only dispute a song that has been matched to their content
        // Or if they are the creator of the original song that was flagged
        if (song.creator_id !== disputer_id) {
             await t.rollback();
             return res.status(403).json({ message: 'You can only file a dispute for your own song.' });
        }
        
        if (song.copyright_status !== 'flagged' && song.copyright_status !== 'matched') {
            await t.rollback();
            return res.status(400).json({ message: 'This song is not eligible for a dispute at its current status.' });
        }

        const dispute = await CopyrightDispute.create({
            song_id,
            disputer_id,
            reason
        }, { transaction: t });

        // Update song status to 'disputed'
        song.copyright_status = 'disputed';
        await song.save({ transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Dispute filed successfully.', dispute });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};