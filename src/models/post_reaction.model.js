const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PostReaction = sequelize.define('PostReaction', {
    post_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'posts',
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
    reaction_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'like',
    },
  }, {
    tableName: 'post_reactions',
    timestamps: true,
    updatedAt: false,
  });

  return PostReaction;
};