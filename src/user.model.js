const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone_number: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    auth_provider: {
      type: DataTypes.STRING(50),
      defaultValue: 'email', // 'email','phone','google','apple'
    },
    apple_user_id: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    strike_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    theme_preference: {
      type: DataTypes.STRING(20),
      defaultValue: 'dark',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active', // 'active','suspended','deleted'
    },
    last_tos_accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'users',
    paranoid: true, // Enables soft deletes by adding `deleted_at`
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash') && user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ['password_hash'] },
    },
    scopes: {
      withPassword: {
        attributes: {},
      }
    }
  });

  User.prototype.comparePassword = async function (plainPassword) {
    if (!this.password_hash) return false;
    return await bcrypt.compare(plainPassword, this.password_hash);
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  return User;
};