const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CopyrightBlacklist = sequelize.define('CopyrightBlacklist', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    file_hash_sha256: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
    },
    original_song_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'copyright_blacklist',
    timestamps: true,
    updatedAt: false,
    createdAt: 'added_at',
  });

  return CopyrightBlacklist;
};