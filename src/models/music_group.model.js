const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MusicGroup = sequelize.define('MusicGroup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    cover_image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
  }, {
    tableName: 'music_groups',
    paranoid: true,
    timestamps: true,
  });

  return MusicGroup;
};