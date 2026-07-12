const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LegalDocument = sequelize.define(
  'LegalDocument',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    effective_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'legal_documents',
    underscored: true,
    timestamps: true,
  }
);

module.exports = LegalDocument;
