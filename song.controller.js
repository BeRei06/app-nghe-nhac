const { Song, User, Hashtag, sequelize } = require('../models');

// Helper function to format song response based on copyright status
const formatSongResponse = (song) => {
    const songJson = song.toJSON();
    if (song.copyright_status !== 'matched') {
        delete songJson.external_song_title;
        delete songJson.external_artist_name;
        delete songJson.external_buy_link;
    }
    return songJson;
};

// GET /songs - List approved songs
exports.listSongs = async (req, res) => {
    try {
        const songs = await Song.findAll({
            where: { status: 'approved' },
            include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'avatar_url'] }]
        });
        res.status(200).json(songs.map(formatSongResponse));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /songs/:id - Get song details
exports.getSongById = async (req, res) => {
    try {
        const song = await Song.findByPk(req.params.id, {
            include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'avatar_url'] }]
        });
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }
        res.status(200).json(formatSongResponse(song));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// POST /songs - Creator uploads metadata (after file upload)
exports.createSong = async (req, res) => {
    // hashtags là một mảng các string, ví dụ: ['#pop', '#chill']
    const { title, hls_streaming_url, duration, genre_id, hashtags } = req.body;
    const t = await sequelize.transaction();
    try {
        const newSong = await Song.create({
            title,
            hls_streaming_url,
            duration,
            genre_id,
            creator_id: req.user.id,
        }, { transaction: t });

        if (hashtags && hashtags.length > 0) {
            const hashtagInstances = await Promise.all(
                hashtags.map(name =>
                    Hashtag.findOrCreate({
                        where: { name: name.startsWith('#') ? name.substring(1) : name },
                        transaction: t,
                    })
                )
            );
            // hashtagInstances là một mảng [[instance, created], [instance, created]]
            await newSong.setHashtags(hashtagInstances.map(h => h[0]), { transaction: t });
        }

        await t.commit();
        res.status(201).json(newSong);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE /songs/:id - Soft delete a song
exports.deleteSong = async (req, res) => {
    try {
        const song = await Song.findByPk(req.params.id);
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Check if the user is the creator or an admin
        const isAdmin = req.user.Roles.some(role => role.name === 'super_admin' || role.name === 'content_mod');
        if (song.creator_id !== req.user.id && !isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to delete this song.' });
        }

        await song.destroy(); // Soft delete
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Stubs for other endpoints
exports.getTrending = async (req, res) => res.status(501).json({ message: 'Not implemented' });
exports.getTopChart = async (req, res) => res.status(501).json({ message: 'Not implemented' });
exports.getRecommended = async (req, res) => res.status(501).json({ message: 'Not implemented' });
exports.recordListen = async (req, res) => res.status(501).json({ message: 'Not implemented' });
        });
        res.status(201).json(newSong);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE /songs/:id - Soft delete a song
exports.deleteSong = async (req, res) => {
    try {
        const song = await Song.findByPk(req.params.id);
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Check if the user is the creator or an admin
        const isAdmin = req.user.Roles.some(role => role.name === 'super_admin' || role.name === 'content_mod');
        if (song.creator_id !== req.user.id && !isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to delete this song.' });
        }

        await song.destroy(); // Soft delete
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Stubs for other endpoints
exports.getTrending = async (req, res) => res.status(501).json({ message: 'Not implemented' });
exports.getTopChart = async (req, res) => res.status(501).json({ message: 'Not implemented' });
exports.getRecommended = async (req, res) => res.status(501).json({ message: 'Not implemented' });
exports.recordListen = async (req, res) => res.status(501).json({ message: 'Not implemented' });