const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Hashtag = sequelize.define(
    'Hashtag',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
      },
    },
    { tableName: 'hashtags', timestamps: true }
  );
  return Hashtag;
};