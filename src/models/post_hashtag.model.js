const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PostHashtag = sequelize.define('PostHashtag', {
    post_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'posts',
        key: 'id',
      },
    },
    hashtag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'hashtags',
        key: 'id',
      },
    },
  }, {
    tableName: 'post_hashtags',
    timestamps: false,
  });

  return PostHashtag;
};