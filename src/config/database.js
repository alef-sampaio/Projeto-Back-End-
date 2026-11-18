require('dotenv').config();

// Configuração do banco usada pela aplicação e pelo sequelize-cli (migrations)
const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS || null,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
};

module.exports = {
  development: base,
  test: { ...base, database: process.env.DB_NAME_TEST || `${process.env.DB_NAME}_test` },
  production: base,
};
