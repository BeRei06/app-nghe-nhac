const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CopyrightBlacklist = sequelize.define(
    'CopyrightBlacklist',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      file_hash_sha256: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      original_song_title: {
        type: DataTypes.STRING(255),
      },
      reason: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'copyright_blacklist',
      timestamps: true, // Manages created_at, updated_at
      updatedAt: false, // We only care about when it was added
      createdAt: 'added_at',
    }
  );
  return CopyrightBlacklist;
};