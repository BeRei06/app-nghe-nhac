const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SongHashtag = sequelize.define(
    'SongHashtag',
    {
      song_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      hashtag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
    },
    {
      tableName: 'song_hashtags',
      timestamps: false, // Junction tables usually don't need timestamps
    }
  );
  return SongHashtag;
};