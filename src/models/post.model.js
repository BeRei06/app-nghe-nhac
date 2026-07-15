const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    song_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'songs',
        key: 'id',
      },
    },
    snippet_start_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    snippet_end_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'posts',
    paranoid: true,
    timestamps: true,
    validate: {
        snippetDuration() {
            if ((this.snippet_end_time - this.snippet_start_time) > 60) {
                throw new Error('Snippet duration cannot exceed 60 seconds.');
            }
        }
    }
  });

  return Post;
};