const { DataTypes } = require('sequelize');

// const { encrypt, decrypt } = require('../utils/crypto'); // Placeholder for encryption utility

module.exports = (sequelize) => {
  const MailConfig = sequelize.define('MailConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },
    authType: {
      type: DataTypes.ENUM('smtp', 'oauth2', 'graph'),
      defaultValue: 'smtp',
      field: 'auth_type',
    },
    host: { type: DataTypes.STRING, allowNull: true },
    port: { type: DataTypes.INTEGER, allowNull: true },
    secure: { type: DataTypes.BOOLEAN, defaultValue: true },
    user: { type: DataTypes.STRING, allowNull: true },
    pass: { type: DataTypes.TEXT, allowNull: true }, // TEXT to store encrypted string
    tenantId: { type: DataTypes.STRING, field: 'tenant_id', allowNull: true },
    clientId: { type: DataTypes.STRING, field: 'client_id', allowNull: true },
    clientSecret: { type: DataTypes.TEXT, field: 'client_secret', allowNull: true }, // TEXT to store encrypted string
    fromEmail: { type: DataTypes.STRING, field: 'from_email', validate: { isEmail: true } },
    fromName: { type: DataTypes.STRING, field: 'from_name' }
  }, {
    tableName: 'mail_configs',
    timestamps: false,
    hooks: {
      // Hooks for automatic encryption/decryption will be implemented in a later stage
      // when the crypto utility is built.
      // beforeSave: (config) => {
      //   if (config.pass && config.changed('pass')) config.pass = encrypt(config.pass);
      //   if (config.clientSecret && config.changed('clientSecret')) config.clientSecret = encrypt(config.clientSecret);
      // },
      // afterFind: (config) => {
      //   if (config) {
      //     if (config.pass) config.pass = decrypt(config.pass);
      //     if (config.clientSecret) config.clientSecret = decrypt(config.clientSecret);
      //   }
      // }
    }
  });

  return MailConfig;
};