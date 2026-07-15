const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CopyrightDispute = sequelize.define('CopyrightDispute', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    song_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'songs', key: 'id' },
    },
    disputer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending', // 'pending', 'approved', 'rejected'
    },
    admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
    },
    resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
  }, {
    tableName: 'copyright_disputes',
    timestamps: true,
  });

  return CopyrightDispute;
};