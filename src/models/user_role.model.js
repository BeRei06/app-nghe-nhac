const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserRole = sequelize.define('UserRole', {
    user_id: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'id' },
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      references: { model: 'roles', key: 'id' },
      primaryKey: true,
    },
  }, { tableName: 'user_roles', timestamps: false });

  return UserRole;
};