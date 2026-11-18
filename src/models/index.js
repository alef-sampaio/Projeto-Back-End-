const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const User = require('./user')(sequelize);
const Category = require('./category')(sequelize);
const Product = require('./product')(sequelize);
const ProductImage = require('./productImage')(sequelize);
const ProductOption = require('./productOption')(sequelize);
const ProductCategory = require('./productCategory')(sequelize);

// Associações (onDelete CASCADE: ao apagar o produto, apaga imagens, opções e vínculos)
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options', onDelete: 'CASCADE' });
ProductOption.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(ProductCategory, { foreignKey: 'product_id', as: 'productCategories', onDelete: 'CASCADE' });
Category.hasMany(ProductCategory, { foreignKey: 'category_id', onDelete: 'CASCADE' });
ProductCategory.belongsTo(Product, { foreignKey: 'product_id' });
ProductCategory.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = { sequelize, User, Category, Product, ProductImage, ProductOption, ProductCategory };
