const { Op } = require('sequelize');
const { sequelize, Product, ProductImage, ProductOption, ProductCategory, Category } = require('../models');
const AppError = require('../utils/AppError');
const { parseId, parseIntList } = require('../utils/validators');
const { parsePagination, parseFields } = require('../utils/pagination');
const { saveBase64Image, deleteImageFile, imageUrl } = require('../utils/images');
const { validateProduct } = require('../validators/productValidator');

const COLUMNS = ['id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description', 'price', 'price_with_discount'];
const RELATIONS = ['category_ids', 'images', 'options'];
const ALL_FIELDS = [...COLUMNS, ...RELATIONS];

// ---------- helpers de leitura ----------

// Só carrega as relações que foram pedidas em "fields" (separate evita duplicar linhas no limit/offset)
function buildIncludes(fields) {
  const want = (f) => !fields || fields.includes(f);
  const includes = [];
  if (want('images')) includes.push({ model: ProductImage, as: 'images', separate: true, order: [['id', 'ASC']] });
  if (want('options')) includes.push({ model: ProductOption, as: 'options', separate: true, order: [['id', 'ASC']] });
  if (want('category_ids')) {
    includes.push({ model: ProductCategory, as: 'productCategories', separate: true, attributes: ['product_id', 'category_id'] });
  }
  return includes;
}

// Monta o JSON de resposta no formato do escopo
function serialize(product, baseUrl, fields) {
  const want = (f) => !fields || fields.includes(f);
  const out = {};
  for (const col of COLUMNS) {
    if (!want(col)) continue;
    out[col] = ['enabled', 'use_in_menu'].includes(col) ? Boolean(product[col]) : product[col];
  }
  if (want('category_ids')) out.category_ids = product.productCategories.map((pc) => pc.category_id);
  if (want('images')) {
    out.images = product.images.map((img) => ({ id: img.id, content: imageUrl(baseUrl, img.path) }));
  }
  if (want('options')) {
    out.options = product.options.map((o) => ({
      id: o.id,
      title: o.title,
      shape: o.shape,
      radius: o.radius,
      type: o.type,
      values: o.values.split(','),
    }));
  }
  return out;
}

async function assertCategoriesExist(ids) {
  if (!ids || !ids.length) return;
  const count = await Category.count({ where: { id: { [Op.in]: ids } } });
  if (count !== ids.length) throw new AppError(400, 'category_ids contém categorias inexistentes');
}

// Une várias listas de ids numa só, mantendo apenas os ids presentes em todas
const intersect = (sets) => sets.reduce((acc, s) => acc.filter((id) => s.includes(id)));

// ---------- consultas ----------

async function getById(rawId, baseUrl) {
  const product = await Product.findByPk(parseId(rawId), { include: buildIncludes(null) });
  if (!product) throw new AppError(404, 'Produto não encontrado');
  return serialize(product, baseUrl, null);
}

// GET /v1/product/search
async function search(query, baseUrl) {
  const { limit, page, offset, responseLimit } = parsePagination(query);
  const fields = parseFields(query.fields, ALL_FIELDS);

  const where = {};
  const idSets = []; // conjuntos de ids vindos de filtros que dependem de outras tabelas

  // match: termo no nome ou na descrição
  if (query.match !== undefined && String(query.match).trim()) {
    const term = `%${String(query.match).trim()}%`;
    where[Op.or] = [{ name: { [Op.like]: term } }, { description: { [Op.like]: term } }];
  }

  // category_ids=15,24: produtos de qualquer uma das categorias
  if (query.category_ids !== undefined) {
    const ids = parseIntList(query.category_ids, 'category_ids');
    const rows = await ProductCategory.findAll({ where: { category_id: { [Op.in]: ids } }, attributes: ['product_id'], raw: true });
    idSets.push(rows.map((r) => r.product_id));
  }

  // price-range=100-200
  if (query['price-range'] !== undefined) {
    const m = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(String(query['price-range']));
    if (!m || Number(m[1]) > Number(m[2])) throw new AppError(400, 'price-range deve seguir o formato 100-200');
    where.price = { [Op.between]: [Number(m[1]), Number(m[2])] };
  }

  // option[45]=GG,PP: produtos cuja opção 45 contenha algum dos valores
  if (query.option !== undefined) {
    if (typeof query.option !== 'object' || Array.isArray(query.option)) {
      throw new AppError(400, 'option deve seguir o formato option[id]=valor1,valor2');
    }
    for (const [optionId, raw] of Object.entries(query.option)) {
      const id = Number(optionId);
      const wanted = String(raw).split(',').map((v) => v.trim()).filter(Boolean);
      if (!Number.isInteger(id) || id < 1 || !wanted.length) throw new AppError(400, 'option inválido');
      const rows = await ProductOption.findAll({ where: { id }, raw: true });
      const matches = rows.filter((r) => r.values.split(',').some((v) => wanted.includes(v.trim())));
      idSets.push(matches.map((r) => r.product_id));
    }
  }

  if (idSets.length) where.id = { [Op.in]: intersect(idSets) };

  const attributes = fields ? COLUMNS.filter((c) => c === 'id' || fields.includes(c)) : COLUMNS;
  const total = await Product.count({ where });
  const rows = await Product.findAll({
    where,
    attributes,
    include: buildIncludes(fields),
    order: [['id', 'ASC']],
    ...(limit ? { limit, offset } : {}),
  });

  return { data: rows.map((p) => serialize(p, baseUrl, fields)), total, limit: responseLimit, page };
}

// ---------- escrita ----------

// POST /v1/product
async function create(body, baseUrl) {
  const data = validateProduct(body);
  await assertCategoriesExist(data.category_ids);

  const savedFiles = []; // para apagar do disco se a transação falhar
  try {
    const productId = await sequelize.transaction(async (t) => {
      const product = await Product.create(data, { transaction: t });

      if (data.category_ids?.length) {
        await ProductCategory.bulkCreate(data.category_ids.map((category_id) => ({ product_id: product.id, category_id })), { transaction: t });
      }
      for (const img of data.images || []) {
        const path = await saveBase64Image(img);
        savedFiles.push(path);
        await ProductImage.create({ product_id: product.id, path, enabled: true }, { transaction: t });
      }
      if (data.options?.length) {
        await ProductOption.bulkCreate(data.options.map((o) => ({ ...o, product_id: product.id })), { transaction: t });
      }
      return product.id;
    });
    return getById(productId, baseUrl);
  } catch (err) {
    await Promise.all(savedFiles.map(deleteImageFile));
    throw err;
  }
}

// PUT /v1/product/:id
async function update(rawId, body) {
  const product = await Product.findByPk(parseId(rawId));
  if (!product) throw new AppError(404, 'Produto não encontrado');

  const data = validateProduct(body, { partial: true });
  await assertCategoriesExist(data.category_ids);

  const newFiles = []; // arquivos criados (apagar se der erro)
  const oldFiles = []; // arquivos substituídos/removidos (apagar se der certo)

  try {
    await sequelize.transaction(async (t) => {
      const { category_ids, images, options, ...columns } = data;
      await product.update(columns, { transaction: t });

      // Categorias: substitui o conjunto inteiro
      if (category_ids) {
        await ProductCategory.destroy({ where: { product_id: product.id }, transaction: t });
        await ProductCategory.bulkCreate(category_ids.map((category_id) => ({ product_id: product.id, category_id })), { transaction: t });
      }

      // Imagens: criar, trocar, manter ou remover
      for (const item of images || []) {
        if (item.id === undefined) {
          const path = await saveBase64Image(item);
          newFiles.push(path);
          await ProductImage.create({ product_id: product.id, path, enabled: true }, { transaction: t });
          continue;
        }
        const image = await ProductImage.findOne({ where: { id: item.id, product_id: product.id }, transaction: t });
        if (!image) throw new AppError(400, `Imagem ${item.id} não pertence a este produto`);

        if (item.deleted) {
          oldFiles.push(image.path);
          await image.destroy({ transaction: t });
        } else if (!item.keep) {
          const path = await saveBase64Image(item);
          newFiles.push(path);
          oldFiles.push(image.path);
          await image.update({ path }, { transaction: t });
        }
      }

      // Opções: criar, atualizar ou remover
      for (const item of options || []) {
        if (item.id === undefined) {
          await ProductOption.create({ ...item, product_id: product.id }, { transaction: t });
          continue;
        }
        const option = await ProductOption.findOne({ where: { id: item.id, product_id: product.id }, transaction: t });
        if (!option) throw new AppError(400, `Opção ${item.id} não pertence a este produto`);

        if (item.deleted) await option.destroy({ transaction: t });
        else {
          const { id, ...fields } = item;
          await option.update(fields, { transaction: t });
        }
      }
    });
  } catch (err) {
    await Promise.all(newFiles.map(deleteImageFile));
    throw err;
  }
  await Promise.all(oldFiles.map(deleteImageFile));
}

// DELETE /v1/product/:id (imagens, opções e vínculos saem por ON DELETE CASCADE)
async function remove(rawId) {
  const product = await Product.findByPk(parseId(rawId), { include: [{ model: ProductImage, as: 'images' }] });
  if (!product) throw new AppError(404, 'Produto não encontrado');
  const files = product.images.map((i) => i.path);
  await product.destroy();
  await Promise.all(files.map(deleteImageFile));
}

module.exports = { search, getById, create, update, remove };
