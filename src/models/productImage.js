const { DataTypes } = require('sequelize');

// Tabela product_images (sem timestamps, conforme o escopo)
module.exports = (sequelize) =>
  sequelize.define(
    'ProductImage',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
      path: { type: DataTypes.STRING, allowNull: false }, // caminho relativo salvo no servidor
    },
    { tableName: 'product_images', timestamps: false }
  );
