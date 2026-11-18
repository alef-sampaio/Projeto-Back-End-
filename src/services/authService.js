const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { secret, expiresIn } = require('../config/auth');
const AppError = require('../utils/AppError');
const { isNonEmptyString } = require('../utils/validators');

// Valida e-mail/senha e devolve um token JWT
async function generateToken({ email, password } = {}) {
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw new AppError(400, 'email e password são obrigatórios');
  }
  const user = await User.findOne({ where: { email: email.trim() } });
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw new AppError(400, 'E-mail ou senha inválidos');

  return jwt.sign({ email: user.email }, secret, { subject: String(user.id), expiresIn });
}

module.exports = { generateToken };
