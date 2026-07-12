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
    version: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    effective_at: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    tableName: 'legal_documents',
    underscored: true,
  }
);

module.exports = LegalDocument;
