const { DataTypes } = require('sequelize');

// Tabela users
module.exports = (sequelize) =>
  sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      firstname: { type: DataTypes.STRING, allowNull: false },
      surname: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false }, // hash gerado pelo bcrypt
    },
    { tableName: 'users', timestamps: true, underscored: true }
  );
