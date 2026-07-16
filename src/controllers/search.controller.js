const { Song, User, Playlist, Hashtag } = require('../models');
const { Op } = require('sequelize');

// GET /search?q=...
exports.searchAll = async (req, res, next) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: 'Search query "q" is required.' });
    }

    try {
        const searchTerm = `%${q}%`;

        const [songs, users, playlists, hashtags] = await Promise.all([
            // Search for approved songs
            Song.findAll({
                where: { title: { [Op.like]: searchTerm }, status: 'approved' },
                include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
                limit: 10
            }),
            // Search for users (creators/artists)
            User.findAll({
                where: { username: { [Op.like]: searchTerm } },
                attributes: ['id', 'username', 'avatar_url'],
                limit: 10
            }),
            // Search for public playlists
            Playlist.findAll({
                where: { name: { [Op.like]: searchTerm }, is_private: false },
                include: [{ model: User, attributes: ['id', 'username'] }],
                limit: 10
            }),
            // Search for hashtags
            Hashtag.findAll({
                where: { name: { [Op.like]: searchTerm } },
                limit: 10
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                songs,
                users,
                playlists,
                hashtags
            }
        });
    } catch (error) {
        next(error);
    }
};