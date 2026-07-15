'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database.js')[env]; // Correct path to config
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
      file.slice(-9) === '.model.js' // Ensure we only load model files
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

// --- Define Associations for Sprint 3 ---
if (db.Post) {
    db.User.hasMany(db.Post, { foreignKey: 'user_id' });
    db.Post.belongsTo(db.User, { foreignKey: 'user_id' });

    db.Song.hasMany(db.Post, { foreignKey: 'song_id' });
    db.Post.belongsTo(db.Song, { foreignKey: 'song_id' });

    db.Post.belongsToMany(db.User, { as: 'Reactions', through: 'PostReaction', foreignKey: 'post_id', otherKey: 'user_id' });
    db.User.belongsToMany(db.Post, { as: 'ReactedPosts', through: 'PostReaction', foreignKey: 'user_id', otherKey: 'post_id' });

    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag', foreignKey: 'post_id', otherKey: 'hashtag_id' });
    db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag', foreignKey: 'hashtag_id', otherKey: 'post_id' });

    db.User.hasOne(db.FeedRecommendation, { foreignKey: 'user_id' });
    db.FeedRecommendation.belongsTo(db.User, { foreignKey: 'user_id' });
}

// --- Define Associations for Sprint 4 ---
if (db.MusicGroup) {
    db.User.hasMany(db.MusicGroup, { foreignKey: 'created_by' });
    db.MusicGroup.belongsTo(db.User, { as: 'Creator', foreignKey: 'created_by' });

    db.MusicGroup.belongsToMany(db.User, { as: 'Members', through: db.GroupMember, foreignKey: 'group_id', otherKey: 'user_id' });
    db.User.belongsToMany(db.MusicGroup, { as: 'Groups', through: db.GroupMember, foreignKey: 'user_id', otherKey: 'group_id' });

    db.GroupMember.belongsTo(db.GroupRole, { foreignKey: 'role_id' });

    db.MusicGroup.hasMany(db.GroupPost, { foreignKey: 'group_id' });
    db.GroupPost.belongsTo(db.MusicGroup, { foreignKey: 'group_id' });

    db.Post.hasMany(db.GroupPost, { foreignKey: 'post_id' });
    db.GroupPost.belongsTo(db.Post, { foreignKey: 'post_id' });
}

// --- Define Associations for Sprint 5 ---
if (db.Playlist) {
    db.User.hasMany(db.Playlist, { foreignKey: 'user_id' });
    db.Playlist.belongsTo(db.User, { foreignKey: 'user_id' });

    db.Playlist.belongsToMany(db.Song, { through: 'PlaylistSong', foreignKey: 'playlist_id', otherKey: 'song_id' });
    db.Song.belongsToMany(db.Playlist, { through: 'PlaylistSong', foreignKey: 'song_id', otherKey: 'playlist_id' });

    db.User.hasMany(db.UserListeningDetail, { foreignKey: 'user_id' });
    db.UserListeningDetail.belongsTo(db.User, { foreignKey: 'user_id' });

    db.Song.hasMany(db.UserListeningDetail, { foreignKey: 'song_id' });
    db.UserListeningDetail.belongsTo(db.Song, { foreignKey: 'song_id' });

    db.User.hasMany(db.Notification, { foreignKey: 'user_id' });
    db.Notification.belongsTo(db.User, { foreignKey: 'user_id' });
}

// --- Define Associations for Sprint 6 ---
if (db.Report) {
    db.User.hasMany(db.Report, { as: 'FiledReports', foreignKey: 'reporter_id' });
    db.Report.belongsTo(db.User, { as: 'Reporter', foreignKey: 'reporter_id' });

    db.User.hasMany(db.Report, { as: 'HandledReports', foreignKey: 'admin_id' });
    db.Report.belongsTo(db.User, { as: 'Handler', foreignKey: 'admin_id' });
}
if (db.CopyrightDispute) {
    db.Song.hasMany(db.CopyrightDispute, { foreignKey: 'song_id' });
    db.CopyrightDispute.belongsTo(db.Song, { foreignKey: 'song_id' });

    db.User.hasMany(db.CopyrightDispute, { as: 'FiledDisputes', foreignKey: 'disputer_id' });
    db.CopyrightDispute.belongsTo(db.User, { as: 'Disputer', foreignKey: 'disputer_id' });

    db.User.hasMany(db.CopyrightDispute, { as: 'HandledDisputes', foreignKey: 'admin_id' });
    db.CopyrightDispute.belongsTo(db.User, { as: 'DisputeHandler', foreignKey: 'admin_id' });
}
if (db.AdminAuditLog) {
    db.User.hasMany(db.AdminAuditLog, { foreignKey: 'admin_id' });
    db.AdminAuditLog.belongsTo(db.User, { as: 'Admin', foreignKey: 'admin_id' });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;