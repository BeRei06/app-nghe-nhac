const { Playlist, Song, User, sequelize } = require('../models');

// POST /playlists - Create a new playlist
exports.createPlaylist = async (req, res, next) => {
    const { name, is_private } = req.body;
    try {
        const playlist = await Playlist.create({
            name,
            is_private,
            user_id: req.user.id
        });
        res.status(201).json(playlist);
    } catch (error) {
        next(error);
    }
};

// GET /playlists/me - Get all playlists for the logged-in user
exports.getMyPlaylists = async (req, res, next) => {
    try {
        const playlists = await Playlist.findAll({
            where: { user_id: req.user.id },
            include: {
                model: Song,
                attributes: ['id', 'title'],
                through: { attributes: [] } // Don't include junction table data
            }
        });
        res.status(200).json(playlists);
    } catch (error) {
        next(error);
    }
};

// GET /playlists/:id - Get a single playlist by ID
exports.getPlaylistById = async (req, res, next) => {
    try {
        const playlist = await Playlist.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['id', 'username'] },
                { model: Song, include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }] }
            ]
        });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found.' });
        }

        // Privacy check
        if (playlist.is_private && playlist.user_id !== req.user.id) {
            return res.status(403).json({ message: 'This playlist is private.' });
        }

        res.status(200).json(playlist);
    } catch (error) {
        next(error);
    }
};

// PUT /playlists/:id - Update a playlist
exports.updatePlaylist = async (req, res, next) => {
    const { id } = req.params;
    const { name, is_private } = req.body;
    try {
        const playlist = await Playlist.findByPk(id);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found.' });
        }
        if (playlist.user_id !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to update this playlist.' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (is_private !== undefined) updateData.is_private = is_private;

        await playlist.update(updateData);
        res.status(200).json(playlist);
    } catch (error) {
        next(error);
    }
};

// DELETE /playlists/:id - Delete a playlist
exports.deletePlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findByPk(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found.' });
        }
        if (playlist.user_id !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to delete this playlist.' });
        }
        await playlist.destroy();
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// POST /playlists/:id/songs - Add a song to a playlist
exports.addSongToPlaylist = async (req, res, next) => {
    const { song_id } = req.body;
    const t = await sequelize.transaction();
    try {
        const playlist = await Playlist.findByPk(req.params.id, { transaction: t });
        if (!playlist) {
            await t.rollback();
            return res.status(404).json({ message: 'Playlist not found.' });
        }
        if (playlist.user_id !== req.user.id) {
            await t.rollback();
            return res.status(403).json({ message: 'You are not authorized to modify this playlist.' });
        }

        const song = await Song.findByPk(song_id, { transaction: t });
        if (!song || song.status !== 'approved') {
            await t.rollback();
            return res.status(404).json({ message: 'Song not found or is not available.' });
        }

        await playlist.addSong(song, { transaction: t });
        await t.commit();
        res.status(200).json({ message: 'Song added to playlist.' });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// DELETE /playlists/:id/songs/:songId - Remove a song from a playlist
exports.removeSongFromPlaylist = async (req, res, next) => {
    const { id, songId } = req.params;
    const t = await sequelize.transaction();
    try {
        const playlist = await Playlist.findByPk(id, { transaction: t });
        if (!playlist) {
            await t.rollback();
            return res.status(404).json({ message: 'Playlist not found.' });
        }
        if (playlist.user_id !== req.user.id) {
            await t.rollback();
            return res.status(403).json({ message: 'You are not authorized to modify this playlist.' });
        }

        const song = await Song.findByPk(songId, { transaction: t });
        if (!song) {
            await t.rollback();
            return res.status(404).json({ message: 'Song not found.' });
        }

        await playlist.removeSong(song, { transaction: t });
        await t.commit();
        res.status(200).json({ message: 'Song removed from playlist.' });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};