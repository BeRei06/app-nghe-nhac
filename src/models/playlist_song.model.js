const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlaylistSong = sequelize.define('PlaylistSong', {
    playlist_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'playlists',
        key: 'id',
      },
    },
    song_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'songs',
        key: 'id',
      },
    },
  }, {
    tableName: 'playlist_songs',
    timestamps: true,
    updatedAt: false,
  });

  return PlaylistSong;
};