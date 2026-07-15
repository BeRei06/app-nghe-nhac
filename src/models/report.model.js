const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    reporter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    reported_entity_type: {
      type: DataTypes.STRING(50), // 'song', 'post', 'user', 'group'
      allowNull: false,
    },
    reported_entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending', // 'pending', 'resolved', 'dismissed'
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
    tableName: 'reports',
    timestamps: true,
    indexes: [
        { fields: ['reported_entity_type', 'reported_entity_id'] }
    ]
  });

  return Report;
};