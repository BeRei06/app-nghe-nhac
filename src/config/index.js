'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-9) === '.model.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes); db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// --- Define Associations for Sprint 1 ---

// User <-> Role (Many-to-Many)
db.User.belongsToMany(db.Role, {
  through: 'UserRole', // Use the model name as a string
  foreignKey: 'user_id',
  otherKey: 'role_id',
});
db.Role.belongsToMany(db.User, {
  through: 'UserRole',
  foreignKey: 'role_id',
  otherKey: 'user_id',
});

// User -> UserSession (One-to-Many)
db.User.hasMany(db.UserSession, {
  foreignKey: 'user_id',
  as: 'sessions'
});
db.UserSession.belongsTo(db.User, {
  foreignKey: 'user_id'
});

// Assuming user_consent.model.js exists from previous work
if (db.UserConsent) {
    db.User.hasMany(db.UserConsent, { foreignKey: 'user_id' });
    db.LegalDocument.hasMany(db.UserConsent, { foreignKey: 'document_id' });
}

// --- Define Associations for Sprint 2 ---

// User -> Song (One-to-Many as creator)
if (db.Song) {
  db.User.hasMany(db.Song, {
    foreignKey: 'creator_id',
    as: 'createdSongs'
  });
  db.Song.belongsTo(db.User, {
    foreignKey: 'creator_id',
    as: 'creator'
  });

  // Song -> AudioFingerprint (One-to-One)
  db.Song.hasOne(db.AudioFingerprint, {
    foreignKey: 'song_id'
  });
  db.AudioFingerprint.belongsTo(db.Song, {
    foreignKey: 'song_id'
  });

  // Song <-> Hashtag (Many-to-Many)
  db.Song.belongsToMany(db.Hashtag, {
    through: 'SongHashtag',
    foreignKey: 'song_id',
    otherKey: 'hashtag_id',
  });
  db.Hashtag.belongsToMany(db.Song, {
    through: 'SongHashtag',
    foreignKey: 'hashtag_id',
    otherKey: 'song_id',
  });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;