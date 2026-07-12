const sequelize = require('../config/database');
const User = require('./user.model');
const UserFollow = require('./user_follow.model');
const UserBlock = require('./user_block.model');
const UserSession = require('./user_session.model');
const UserDevice = require('./user_device.model');
const LegalDocument = require('./legal_document.model');
const UserConsent = require('./user_consent.model');

// Associations

// User Sessions
User.hasMany(UserSession, { foreignKey: 'user_id', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User Devices
User.hasMany(UserDevice, { foreignKey: 'user_id', as: 'devices' });
UserDevice.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User Follows (Many-to-Many self reference via UserFollow)
User.belongsToMany(User, {
  through: UserFollow,
  as: 'Followers',
  foreignKey: 'following_id',
  otherKey: 'follower_id'
});
User.belongsToMany(User, {
  through: UserFollow,
  as: 'Followings',
  foreignKey: 'follower_id',
  otherKey: 'following_id'
});

// Direct associations on UserFollow for include queries
UserFollow.belongsTo(User, { foreignKey: 'follower_id', as: 'Follower' });
UserFollow.belongsTo(User, { foreignKey: 'following_id', as: 'Following' });

// User Blocks (Many-to-Many self reference via UserBlock)
User.belongsToMany(User, {
  through: UserBlock,
  as: 'BlockedUsers',
  foreignKey: 'user_id',
  otherKey: 'blocked_user_id'
});

// User Consents
User.hasMany(UserConsent, { foreignKey: 'user_id', as: 'consents' });
UserConsent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

LegalDocument.hasMany(UserConsent, { foreignKey: 'legal_document_id', as: 'consents' });
UserConsent.belongsTo(LegalDocument, { foreignKey: 'legal_document_id', as: 'legal_document' });

module.exports = {
  sequelize,
  User,
  UserFollow,
  UserBlock,
  UserSession,
  UserDevice,
  LegalDocument,
  UserConsent
};
