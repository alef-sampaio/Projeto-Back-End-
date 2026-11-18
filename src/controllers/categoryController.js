const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/categoryService');

exports.search = asyncHandler(async (req, res) => {
  res.status(200).json(await categoryService.search(req.query));
});

exports.getById = asyncHandler(async (req, res) => {
  res.status(200).json(await categoryService.getById(req.params.id));
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await categoryService.create(req.body));
});

exports.update = asyncHandler(async (req, res) => {
  await categoryService.update(req.params.id, req.body);
  res.status(204).send();
});

exports.remove = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  res.status(204).send();
});
