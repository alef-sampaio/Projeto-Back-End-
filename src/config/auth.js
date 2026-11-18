// Configurações do JWT (lidas do .env)
module.exports = {
  secret: process.env.JWT_SECRET || 'dev-secret-troque-no-env',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};
