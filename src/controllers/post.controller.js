const { Post, Song, User, Hashtag, sequelize } = require('../models');

// Helper constant for common post associations to keep code DRY
const postIncludeOptions = [
    { model: User, attributes: ['id', 'username', 'avatar_url'] },
    { model: Song, include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'avatar_url'] }] },
    { model: Hashtag, through: { attributes: [] } }
];

// Helper to extract hashtags from caption
const extractHashtags = (caption) => {
    if (!caption) return [];
    const regex = /#([a-zA-Z0-9_]+)/g;
    const matches = caption.match(regex);
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
};

// POST /posts - Create a new post (share a song)
exports.createPost = async (req, res, next) => {
    const { song_id, caption, snippet_start_time, snippet_end_time } = req.body;
    const user_id = req.user.id;
    const t = await sequelize.transaction();

    try {
        const song = await Song.findByPk(song_id);
        if (!song || song.status !== 'approved') {
            await t.rollback();
            return res.status(404).json({ message: 'Song not found or not available.' });
        }

        const post = await Post.create({
            user_id,
            song_id,
            caption,
            snippet_start_time,
            snippet_end_time
        }, { transaction: t });

        const hashtagNames = extractHashtags(caption);
        if (hashtagNames.length > 0) {
            const hashtagInstances = await Promise.all(
                hashtagNames.map(name =>
                    Hashtag.findOrCreate({
                        where: { name },
                        transaction: t,
                    })
                )
            );
            await post.setHashtags(hashtagInstances.map(h => h[0]), { transaction: t });
        }

        await t.commit();

        // Reload to include associations for the response
        const fullPost = await Post.findByPk(post.id, {
            include: postIncludeOptions
        });

        res.status(201).json(fullPost);
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// GET /posts/:id - Get a single post
exports.getPostById = async (req, res, next) => {
    try {
        const post = await Post.findByPk(req.params.id, {
            include: [
                ...postIncludeOptions,
                { model: User, as: 'Reactions', attributes: ['id', 'username'], through: { attributes: [] } }
            ]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const postJSON = post.toJSON();
        // Dữ liệu reaction đã có sẵn từ `include`
        postJSON.reactions = postJSON.Reactions;
        postJSON.reaction_count = postJSON.Reactions.length;
        postJSON.has_reacted = postJSON.Reactions.some(r => r.id === req.user.id);
        // Dọn dẹp payload trả về
        delete postJSON.Reactions;

        res.status(200).json(postJSON);
    } catch (error) {
        next(error);
    }
};

// PUT /posts/:id - Update a post's caption
exports.updatePost = async (req, res, next) => {
    const { id } = req.params;
    const { caption } = req.body;
    const user_id = req.user.id;
    const t = await sequelize.transaction();

    try {
        const post = await Post.findByPk(id, { transaction: t });

        if (!post) {
            await t.rollback();
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.user_id !== user_id) {
            await t.rollback();
            return res.status(403).json({ message: 'You are not authorized to update this post.' });
        }

        post.caption = caption;
        await post.save({ transaction: t });

        const hashtagNames = extractHashtags(caption);
        const hashtagInstances = await Promise.all(
            hashtagNames.map(name => Hashtag.findOrCreate({ where: { name }, transaction: t }))
        );
        await post.setHashtags(hashtagInstances.map(h => h[0]), { transaction: t });

        await t.commit();
        
        await post.reload({
            include: postIncludeOptions
        });

        res.status(200).json(post);
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// DELETE /posts/:id - Delete a post
exports.deletePost = async (req, res, next) => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const isAdmin = req.user.Roles.some(role => role.name === 'super_admin' || role.name === 'content_mod');
        if (post.user_id !== req.user.id && !isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to delete this post.' });
        }

        await post.destroy(); // Soft delete if paranoid is true in model
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// POST /posts/:id/react - React to a post
exports.reactToPost = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;
    const { type = 'like' } = req.body;
    const t = await sequelize.transaction();

    try {
        const post = await Post.findByPk(id, { transaction: t });
        if (!post) {
            await t.rollback();
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Tối ưu: Sử dụng các hàm helper của Sequelize association để code gọn hơn
        const hasReacted = await post.hasReaction(user_id, { transaction: t });

        if (hasReacted) {
            await post.removeReaction(user_id, { transaction: t });
            await t.commit();
            return res.status(200).json({ message: 'Reaction removed.' });
        } else {
            await post.addReaction(user_id, { through: { reaction_type: type }, transaction: t });
            await t.commit();
            return res.status(201).json({ message: 'Post reacted to successfully.' });
        }
    } catch (error) {
        await t.rollback();
        next(error);
    }
};