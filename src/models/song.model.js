const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Song = sequelize.define(
  'Song',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    audio_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sha256_checksum: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    copyright_status: {
      type: DataTypes.ENUM('pending', 'clean', 'matched', 'flagged'),
      defaultValue: 'pending',
    },
    is_eligible_for_monetization: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    external_artist_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    external_buy_link: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    tableName: 'songs',
    underscored: true,
    paranoid: true, // Soft Delete
  }
);

module.exports = Song;
