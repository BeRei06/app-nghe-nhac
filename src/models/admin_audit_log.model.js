const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminAuditLog = sequelize.define('AdminAuditLog', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    action: {
      type: DataTypes.STRING(255), // e.g., 'suspend_user', 'approve_song', 'delete_post'
      allowNull: false,
    },
    target_entity_type: {
      type: DataTypes.STRING(50), // 'user', 'song', 'post'
      allowNull: true,
    },
    target_entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON, // Store before/after state or reasons
      allowNull: true,
    },
  }, {
    tableName: 'admin_audit_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
        { fields: ['admin_id'] }
    ]
  });

  return AdminAuditLog;
};