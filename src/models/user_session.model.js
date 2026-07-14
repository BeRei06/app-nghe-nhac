const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserSession = sequelize.define('UserSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    refresh_token: {
      type: DataTypes.STRING(500),
      unique: true,
      allowNull: false,
    },
    device_id: DataTypes.STRING(255),
    is_revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, { tableName: 'user_sessions', createdAt: 'created_at', updatedAt: false });

  return UserSession;
};