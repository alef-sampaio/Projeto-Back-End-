const jwt = require('jsonwebtoken');
const { secret } = require('../config/auth');
const AppError = require('../utils/AppError');

// Exige o cabeçalho "Authorization: Bearer <jwt>"
function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Token de autorização não informado'));
  }
  try {
    const payload = jwt.verify(token, secret);
    req.userId = Number(payload.sub);
    return next();
  } catch (err) {
    return next(new AppError(401, 'Token inválido ou expirado'));
  }
}

module.exports = { authenticate };
