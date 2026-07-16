const { Post, User, Song, Hashtag } = require('../models');

// GET /feed - Get personalized feed for the logged-in user
exports.getFeed = async (req, res, next) => {
    const user_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        // TODO: Implement "following" logic and filter by followed users.
        // const followingIds = await req.user.getFollowing().map(u => u.id);
        // where: { user_id: { [Op.in]: [...followingIds, user_id] } }

        const { count, rows: posts } = await Post.findAndCountAll({
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                { model: User, attributes: ['id', 'username', 'avatar_url'] },
                { 
                    model: Song, 
                    include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'avatar_url'] }] 
                },
                { model: Hashtag, through: { attributes: [] } },
                { model: User, as: 'Reactions', attributes: ['id'], through: { attributes: [] } }
            ],
            distinct: true,
        });

        // Augment posts with reaction status for the current user
        const postsWithReactionStatus = posts.map(post => {
            const postJSON = post.toJSON();
            postJSON.has_reacted = post.Reactions.some(reactionUser => reactionUser.id === user_id);
            postJSON.reaction_count = post.Reactions.length;
            delete postJSON.Reactions; // Keep payload clean
            return postJSON;
        });

        res.status(200).json({
            success: true,
            data: postsWithReactionStatus,
            meta: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            }
        });

    } catch (error) {
        next(error);
    }
};