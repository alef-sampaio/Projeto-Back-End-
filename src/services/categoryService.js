const { Category } = require('../models');
const AppError = require('../utils/AppError');
const { isNonEmptyString, isBool, parseId } = require('../utils/validators');
const { parsePagination, parseFields } = require('../utils/pagination');

const FIELDS = ['id', 'name', 'slug', 'use_in_menu'];

const serialize = (c) => ({ id: c.id, name: c.name, slug: c.slug, use_in_menu: Boolean(c.use_in_menu) });

function validate(body) {
  if (!body || typeof body !== 'object') throw new AppError(400, 'Corpo da requisição inválido');
  if (!isNonEmptyString(body.name)) throw new AppError(400, 'name é obrigatório');
  if (!isNonEmptyString(body.slug)) throw new AppError(400, 'slug é obrigatório');
  if (body.use_in_menu !== undefined && !isBool(body.use_in_menu)) {
    throw new AppError(400, 'use_in_menu deve ser booleano');
  }
  return { name: body.name.trim(), slug: body.slug.trim(), use_in_menu: body.use_in_menu ?? false };
}

// GET /v1/category/search?limit=&page=&fields=&use_in_menu=
async function search(query) {
  const { limit, page, offset, responseLimit } = parsePagination(query);
  const fields = parseFields(query.fields, FIELDS);

  const where = {};
  if (query.use_in_menu !== undefined) {
    if (!['true', 'false'].includes(query.use_in_menu)) throw new AppError(400, 'use_in_menu deve ser true ou false');
    where.use_in_menu = query.use_in_menu === 'true';
  }

  const total = await Category.count({ where });
  const rows = await Category.findAll({
    where,
    attributes: fields || FIELDS,
    order: [['id', 'ASC']],
    ...(limit ? { limit, offset } : {}),
  });

  const data = rows.map((row) => {
    const full = serialize(row);
    return fields ? Object.fromEntries(fields.map((f) => [f, full[f]])) : full;
  });
  return { data, total, limit: responseLimit, page };
}

async function getById(rawId) {
  const category = await Category.findByPk(parseId(rawId));
  if (!category) throw new AppError(404, 'Categoria não encontrada');
  return serialize(category);
}

async function create(body) {
  const category = await Category.create(validate(body));
  return serialize(category);
}

async function update(rawId, body) {
  const category = await Category.findByPk(parseId(rawId));
  if (!category) throw new AppError(404, 'Categoria não encontrada');
  await category.update(validate(body));
}

async function remove(rawId) {
  const category = await Category.findByPk(parseId(rawId));
  if (!category) throw new AppError(404, 'Categoria não encontrada');
  await category.destroy();
}

module.exports = { search, getById, create, update, remove };
