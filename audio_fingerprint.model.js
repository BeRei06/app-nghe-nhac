const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AudioFingerprint = sequelize.define('AudioFingerprint', {
    song_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'songs',
        key: 'id',
      },
    },
    file_hash_sha256: {
      type: DataTypes.STRING(64),
      unique: true,
    },
    file_hash_md5: {
      type: DataTypes.STRING(32),
      unique: true,
    },
    fingerprint_code: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    acoustid_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
  }, {
    tableName: 'audio_fingerprints',
    timestamps: true,
    updatedAt: false,
  });

  return AudioFingerprint;
};