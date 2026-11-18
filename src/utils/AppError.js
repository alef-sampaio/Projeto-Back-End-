// Erro com status HTTP, tratado pelo middleware de erros
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = AppError;
