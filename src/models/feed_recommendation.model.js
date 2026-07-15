const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FeedRecommendation = sequelize.define('FeedRecommendation', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    recommended_post_ids: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  }, {
    tableName: 'feed_recommendations',
    timestamps: true,
    createdAt: false,
  });

  return FeedRecommendation;
};