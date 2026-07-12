const sequelize = require('../config/database');
const User = require('./user.model');
const Product = require('./product.model');
const LegalDocument = require('./legal_document.model');
const UserConsent = require('./user_consent.model');

// Associations
User.hasMany(Product, { foreignKey: 'user_id', as: 'products' });
Product.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

User.hasMany(UserConsent, { foreignKey: 'user_id', as: 'consents' });
UserConsent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

LegalDocument.hasMany(UserConsent, { foreignKey: 'document_id', as: 'consents' });
UserConsent.belongsTo(LegalDocument, { foreignKey: 'document_id', as: 'document' });

module.exports = { sequelize, User, Product, LegalDocument, UserConsent };
