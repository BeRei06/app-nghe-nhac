const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupPost = sequelize.define('GroupPost', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'music_groups',
        key: 'id',
      },
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
    },
    shared_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
  }, {
    tableName: 'group_posts',
    timestamps: true,
    updatedAt: false,
  });

  return GroupPost;
};