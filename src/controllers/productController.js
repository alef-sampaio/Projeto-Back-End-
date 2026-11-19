const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const productService = require('../services/productService');

// URL base usada nos links das imagens (BASE_URL do .env ou o host da requisição)
const baseUrl = (req) => process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

// Lê os filtros option[id]=valor1,valor2 direto da URL.
// O parser padrão do Express (qs) transforma option[2] em lista e perde o id.
function parseOptionFilters(req) {
  const filters = {};
  const params = new URLSearchParams(req.url.split('?')[1] || '');
  for (const [key, value] of params) {
    if (key !== 'option' && !key.startsWith('option[')) continue;
    const match = /^option\[(\d+)\]$/.exec(key);
    if (!match) throw new AppError(400, 'option deve seguir o formato option[id]=valor1,valor2');
    filters[match[1]] = value;
  }
  return filters;
}

exports.search = asyncHandler(async (req, res) => {
  res.status(200).json(await productService.search(req.query, baseUrl(req), parseOptionFilters(req)));
});

exports.getById = asyncHandler(async (req, res) => {
  res.status(200).json(await productService.getById(req.params.id, baseUrl(req)));
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await productService.create(req.body, baseUrl(req)));
});

exports.update = asyncHandler(async (req, res) => {
  await productService.update(req.params.id, req.body);
  res.status(204).send();
});

exports.remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id);
  res.status(204).send();
});