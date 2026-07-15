const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserListeningDetail = sequelize.define('UserListeningDetail', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    song_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'songs', key: 'id' },
    },
    listen_timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    duration_listened: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: false,
    },
  }, {
    tableName: 'user_listening_details',
    timestamps: false,
  });

  return UserListeningDetail;
};