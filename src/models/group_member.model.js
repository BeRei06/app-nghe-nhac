const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupMember = sequelize.define('GroupMember', {
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'music_groups',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'group_roles',
        key: 'id',
      },
    },
  }, {
    tableName: 'group_members',
    timestamps: true,
    updatedAt: false,
  });

  return GroupMember;
};