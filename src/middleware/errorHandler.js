const AppError = require('../utils/AppError');

// Rotas inexistentes
function notFound(req, res, next) {
  next(new AppError(404, 'Rota não encontrada'));
}

// Tratamento central de erros: sempre responde { message }
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) return res.status(err.status).json({ message: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON inválido' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Requisição muito grande' });
  // Erros de validação / unicidade do Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ message: err.errors?.[0]?.message || 'Dados inválidos' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
}

module.exports = { notFound, errorHandler };
