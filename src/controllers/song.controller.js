const { Song, User, Hashtag, sequelize } = require('../models');

// Helper constant for common song associations to keep code DRY
const songIncludeCreator = [{ model: User, as: 'creator', attributes: ['id', 'username', 'avatar_url'] }];

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
            include: songIncludeCreator
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
            include: songIncludeCreator
        });
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }
        res.status(200).json(formatSongResponse(song));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// PUT /songs/:id - Creator updates song metadata
exports.updateSong = async (req, res) => {
    const { id } = req.params;
    // Chỉ cho phép creator cập nhật các trường này
    const { title, genre_id, hashtags } = req.body;
    const t = await sequelize.transaction();

    try {
        const song = await Song.findByPk(id, { transaction: t });

        if (!song) {
            await t.rollback();
            return res.status(404).json({ message: 'Song not found' });
        }

        // Chỉ creator của bài hát mới có quyền chỉnh sửa
        if (song.creator_id !== req.user.id) {
            await t.rollback();
            return res.status(403).json({ message: 'You are not authorized to update this song.' });
        }

        // Cập nhật các trường được phép
        // Chỉ cập nhật nếu giá trị được cung cấp (kể cả chuỗi rỗng hoặc null)
        if (title !== undefined) {
            song.title = title;
        }
        if (genre_id !== undefined) {
            song.genre_id = genre_id;
        }
        await song.save({ transaction: t });

        // Cho phép cập nhật hashtags (bao gồm cả việc xóa hết bằng mảng rỗng `[]`)
        if (hashtags) {
            const hashtagInstances = await Promise.all(
                hashtags.map(name =>
                    Hashtag.findOrCreate({
                        where: { name: (name.startsWith('#') ? name.substring(1) : name).toLowerCase() },
                        defaults: { name: (name.startsWith('#') ? name.substring(1) : name).toLowerCase() },
                        transaction: t,
                    })
                )
            );
            // hashtagInstances là một mảng [[instance, created], [instance, created]]
            await song.setHashtags(hashtagInstances.map(h => h[0]), { transaction: t });
        }

        await t.commit();
        // Tải lại instance của bài hát để bao gồm các hashtags và creator đã được cập nhật trong response
        await song.reload({ include: [...songIncludeCreator, { model: Hashtag }] });

        res.status(200).json(formatSongResponse(song));
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