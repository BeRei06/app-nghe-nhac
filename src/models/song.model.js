const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Song = sequelize.define(
    'Song',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      hls_streaming_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      cover_url: {
        type: DataTypes.TEXT,
      },
      duration: {
        type: DataTypes.INTEGER,
      },
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      genre_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lyrics_timestamp: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
        defaultValue: 'pending',
      },
      copyright_status: {
        type: DataTypes.ENUM('unverified', 'clean', 'matched', 'flagged', 'disputed'),
        defaultValue: 'unverified',
      },
      external_song_title: {
        type: DataTypes.STRING(255),
      },
      external_artist_name: {
        type: DataTypes.STRING(255),
      },
      external_buy_link: {
        type: DataTypes.TEXT,
      },
      match_score: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      is_eligible_for_monetization: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'songs',
      timestamps: true,
      paranoid: true, // This will automatically handle the deleted_at column for soft deletes
      deletedAt: 'deleted_at',
    }
  );
  return Song;
};