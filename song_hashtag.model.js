const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SongHashtag = sequelize.define('SongHashtag', {
    song_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'songs',
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
    tableName: 'song_hashtags',
    timestamps: false,
  });

  return SongHashtag;
};