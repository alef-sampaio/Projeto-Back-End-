const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const { isNonEmptyString, isEmail, parseId } = require('../utils/validators');

// Nunca devolve a senha
const serialize = (u) => ({ id: u.id, firstname: u.firstname, surname: u.surname, email: u.email });

function validateProfile(body, { requirePassword }) {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Corpo da requisição inválido');
  const { firstname, surname, email, password, confirmPassword } = body;

  if (!isNonEmptyString(firstname)) throw new AppError(400, 'firstname é obrigatório');
  if (!isNonEmptyString(surname)) throw new AppError(400, 'surname é obrigatório');
  if (!isEmail(email)) throw new AppError(400, 'email inválido');
  if (requirePassword) {
    if (!isNonEmptyString(password)) throw new AppError(400, 'password é obrigatório');
    if (password !== confirmPassword) throw new AppError(400, 'password e confirmPassword devem ser iguais');
  }
  return { firstname: firstname.trim(), surname: surname.trim(), email: email.trim().toLowerCase(), password };
}

async function getById(rawId) {
  const user = await User.findByPk(parseId(rawId));
  if (!user) throw new AppError(404, 'Usuário não encontrado');
  return serialize(user);
}

async function create(body) {
  const data = validateProfile(body, { requirePassword: true });
  if (await User.findOne({ where: { email: data.email } })) throw new AppError(400, 'E-mail já cadastrado');

  const hash = await bcrypt.hash(data.password, 10);
  const user = await User.create({ ...data, password: hash });
  return serialize(user);
}

async function update(rawId, body) {
  const user = await User.findByPk(parseId(rawId));
  if (!user) throw new AppError(404, 'Usuário não encontrado');

  const data = validateProfile(body, { requirePassword: false });
  const taken = await User.findOne({ where: { email: data.email, id: { [Op.ne]: user.id } } });
  if (taken) throw new AppError(400, 'E-mail já cadastrado');

  await user.update({ firstname: data.firstname, surname: data.surname, email: data.email });
}

async function remove(rawId) {
  const user = await User.findByPk(parseId(rawId));
  if (!user) throw new AppError(404, 'Usuário não encontrado');
  await user.destroy();
}

module.exports = { getById, create, update, remove };
