const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserConsent = sequelize.define(
  'UserConsent',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    document_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    accepted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    tableName: 'user_consents',
    underscored: true,
    timestamps: false,
  }
);

module.exports = UserConsent;
