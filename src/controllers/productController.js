const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/productService');

// URL base usada nos links das imagens (BASE_URL do .env ou o host da requisição)
const baseUrl = (req) => process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

exports.search = asyncHandler(async (req, res) => {
  res.status(200).json(await productService.search(req.query, baseUrl(req)));
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
