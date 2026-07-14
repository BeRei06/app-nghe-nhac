const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LegalDocument = sequelize.define('LegalDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING(50), // 'terms_of_use', 'privacy_policy', 'copyright_policy'
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING(20), // 'v1.0', 'v1.1'...
      allowNull: false,
    },
    content_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    effective_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'legal_documents',
    timestamps: true, 
    updatedAt: false,
  });

  return LegalDocument;
};