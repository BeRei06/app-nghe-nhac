const { MusicGroup, GroupMember, GroupRole, User, Post, GroupPost, sequelize } = require('../models');

// POST /groups - Create a new group
exports.createGroup = async (req, res, next) => {
    const { name, description, is_private } = req.body;
    const created_by = req.user.id;
    const t = await sequelize.transaction();

    try {
        const group = await MusicGroup.create({
            name,
            description,
            is_private,
            created_by
        }, { transaction: t });

        // The creator automatically becomes the owner
        const ownerRole = await GroupRole.findOne({ where: { name: 'owner' }, transaction: t });
        if (!ownerRole) {
            await t.rollback();
            return next(new Error('Owner role not found. Please seed database roles.'));
        }

        await GroupMember.create({
            group_id: group.id,
            user_id: created_by,
            role_id: ownerRole.id,
            status: 'approved' // Owner is auto-approved
        }, { transaction: t });

        await t.commit();
        res.status(201).json(group);
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// GET /groups/:groupId - Get group details
exports.getGroupById = async (req, res, next) => {
    try {
        // canViewGroup middleware already handled privacy check
        const group = await MusicGroup.findByPk(req.params.groupId, {
            include: [
                { model: User, as: 'Creator', attributes: ['id', 'username'] },
                {
                    model: User,
                    as: 'Members',
                    attributes: ['id', 'username', 'avatar_url'],
                    through: {
                        as: 'membership',
                        attributes: ['status'],
                        include: [{ model: GroupRole, attributes: ['name'] }]
                    }
                }
            ]
        });

        // The findByPk would have returned null if not found, but middleware catches it first.
        // This is a defensive check.
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        res.status(200).json(group);
    } catch (error) {
        next(error);
    }
};

// PUT /groups/:groupId - Update group details
exports.updateGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const { name, description, is_private } = req.body;
    try {
        const group = await MusicGroup.findByPk(groupId);
        // isGroupAdmin middleware already checked for permissions and existence

        // Build an update object to avoid accidentally setting fields to undefined
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (is_private !== undefined) updateData.is_private = is_private;

        await group.update(updateData);
        res.status(200).json(group);
    } catch (error) {
        next(error);
    }
};

// POST /groups/:groupId/join - Request to join a private group or join a public one
exports.joinGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.user.id;
    const t = await sequelize.transaction();

    try {
        const group = await MusicGroup.findByPk(groupId, { transaction: t });
        if (!group) {
            await t.rollback();
            return res.status(404).json({ message: 'Group not found.' });
        }

        const existingMember = await GroupMember.findOne({ where: { group_id: groupId, user_id: userId }, transaction: t });
        if (existingMember) {
            await t.rollback();
            return res.status(409).json({ message: 'You are already a member or have a pending request.' });
        }

        const memberRole = await GroupRole.findOne({ where: { name: 'member' }, transaction: t });
        if (!memberRole) {
            await t.rollback();
            return next(new Error('Member role not found.'));
        }

        const status = group.is_private ? 'pending' : 'approved';
        await GroupMember.create({
            group_id: groupId,
            user_id: userId,
            role_id: memberRole.id,
            status: status
        }, { transaction: t });

        await t.commit();
        const message = group.is_private ? 'Request to join sent.' : 'Successfully joined group.';
        res.status(200).json({ message });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// POST /groups/:groupId/leave - Leave a group
exports.leaveGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.user.id;
    try {
        const member = await GroupMember.findOne({ where: { group_id: groupId, user_id: userId } });
        if (!member) {
            return res.status(404).json({ message: 'You are not a member of this group.' });
        }
        const ownerRole = await GroupRole.findOne({ where: { name: 'owner' } });
        if (member.role_id === ownerRole.id) {
            return res.status(400).json({ message: 'Owner cannot leave the group. Please transfer ownership or delete the group.' });
        }
        await member.destroy();
        res.status(200).json({ message: 'You have left the group.' });
    } catch (error) {
        next(error);
    }
};

// POST /groups/:groupId/members/:userId/approve - Admin approves a join request
exports.approveJoinRequest = async (req, res, next) => {
    const { groupId, userId } = req.params;
    try {
        const request = await GroupMember.findOne({ where: { group_id: groupId, user_id: userId, status: 'pending' } });
        if (!request) {
            return res.status(404).json({ message: 'No pending join request found for this user.' });
        }
        request.status = 'approved';
        await request.save();
        res.status(200).json({ message: 'User has been added to the group.' });
    } catch (error) {
        next(error);
    }
};

// DELETE /groups/:groupId/members/:userId - Admin kicks a member or denies a request
exports.removeMember = async (req, res, next) => {
    const { groupId, userId } = req.params;
    try {
        const memberToRemove = await GroupMember.findOne({ where: { group_id: groupId, user_id: userId }, include: GroupRole });
        if (!memberToRemove) {
            return res.status(404).json({ message: 'User is not a member or has no pending request.' });
        }

        if (memberToRemove.GroupRole.name === 'owner') {
            return res.status(403).json({ message: 'Cannot remove the group owner.' });
        }

        await memberToRemove.destroy();
        res.status(200).json({ message: 'User has been removed from the group.' });
    } catch (error) {
        next(error);
    }
};

// POST /groups/:groupId/posts - Share a post to the group
exports.createGroupPost = async (req, res, next) => {
    const { groupId } = req.params;
    const { post_id } = req.body;
    const t = await sequelize.transaction();

    try {
        // isGroupMember middleware already ran
        const post = await Post.findByPk(post_id, { transaction: t });
        if (!post) {
            await t.rollback();
            return res.status(404).json({ message: 'Original post not found.' });
        }

        const groupPost = await GroupPost.create({
            group_id: groupId,
            post_id: post_id,
            shared_by_user_id: req.user.id
        }, { transaction: t });

        await t.commit();
        res.status(201).json(groupPost);
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// GET /groups/:groupId/posts - Get posts from a group
exports.getGroupPosts = async (req, res, next) => {
    const { groupId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        // canViewGroup middleware already handled privacy
        const { count, rows } = await GroupPost.findAndCountAll({
            where: { group_id: groupId },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            include: [
                { model: Post, include: [
                    { model: User, attributes: ['id', 'username', 'avatar_url'] },
                    { model: Song, include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'avatar_url'] }] },
                    { model: Hashtag, through: { attributes: [] } },
                    { model: User, as: 'Reactions', attributes: ['id'], through: { attributes: [] } }
                ]},
                { model: User, as: 'SharedBy', attributes: ['id', 'username'] }
            ]
        });

        const posts = rows.map(gp => {
            const postJSON = gp.Post.toJSON();
            postJSON.has_reacted = postJSON.Reactions.some(r => r.id === req.user.id);
            postJSON.reaction_count = postJSON.Reactions.length;
            delete postJSON.Reactions;
            return { ...postJSON, shared_by: gp.SharedBy, shared_at: gp.created_at };
        });

        res.status(200).json({
            success: true, data: posts,
            meta: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
        });
    } catch (error) {
        next(error);
    }
};