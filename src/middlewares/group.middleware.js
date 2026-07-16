const { MusicGroup, GroupMember, GroupRole } = require('../models');

// Middleware to check if user can view group content (is member or group is public)
const canViewGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.user.id;

    try {
        const group = await MusicGroup.findByPk(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        if (group.is_private) {
            const member = await GroupMember.findOne({
                where: { group_id: groupId, user_id: userId, status: 'approved' }
            });
            if (!member) {
                return res.status(403).json({ message: 'Access denied. This group is private.' });
            }
        }
        
        // If public, or if private and user is a member, proceed.
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to check if the user is a member of the group
const isGroupMember = async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.user.id;

    try {
        const member = await GroupMember.findOne({
            where: { group_id: groupId, user_id: userId, status: 'approved' }
        });

        if (!member) {
            return res.status(403).json({ message: 'Access denied. You are not a member of this group.' });
        }

        req.groupMember = member; // Attach member info to request
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to check if the user has an admin role in the group
const isGroupAdmin = async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.user.id;

    try {
        const member = await GroupMember.findOne({
            where: { group_id: groupId, user_id: userId, status: 'approved' },
            include: GroupRole
        });

        if (!member || !['admin', 'owner'].includes(member.GroupRole.name)) {
            return res.status(403).json({ message: 'Access denied. Requires admin privileges in this group.' });
        }

        req.groupMember = member;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { canViewGroup, isGroupMember, isGroupAdmin };