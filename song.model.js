const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Song = sequelize.define('Song', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    hls_streaming_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    creator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    genre_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lyrics_timestamp: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending', // 'pending','approved','rejected','flagged'
    },
    copyright_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'unverified', // 'clean','matched','flagged','disputed'
    },
    external_song_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    external_artist_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    external_buy_link: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    match_score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    is_eligible_for_monetization: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'songs',
    paranoid: true, // soft delete
    timestamps: true,
  });

  return Song;
};