const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupRole = sequelize.define('GroupRole', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.ENUM('owner', 'admin', 'moderator', 'member'),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'group_roles',
    timestamps: false,
  });

  return GroupRole;
};