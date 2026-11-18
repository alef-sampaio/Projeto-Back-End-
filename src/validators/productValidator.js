const AppError = require('../utils/AppError');
const { isNonEmptyString, isBool } = require('../utils/validators');
const { EXTENSIONS } = require('../utils/images');

const SHAPES = ['square', 'circle'];
const OPTION_TYPES = ['text', 'color'];
const bad = (msg) => new AppError(400, msg);
const isId = (v) => Number.isInteger(v) && v > 0;
const isUrl = (v) => /^https?:\/\//i.test(v);

// "4px", "4" ou 4 -> 4 (a coluna radius é INTEGER)
function parseRadius(v) {
  if (typeof v === 'number' && Number.isInteger(v) && v >= 0) return v;
  if (typeof v === 'string' && /^\d+(px)?$/.test(v.trim())) return parseInt(v, 10);
  throw bad('radius deve ser um inteiro maior ou igual a 0 (ex.: 4 ou "4px")');
}

function validateImage(img, partial) {
  if (!img || typeof img !== 'object') throw bad('Imagem inválida');

  if (img.id !== undefined) {
    if (!partial) throw bad('id de imagem só pode ser enviado na atualização');
    if (!isId(img.id)) throw bad('id de imagem inválido');
    if (img.deleted === true) return { id: img.id, deleted: true };
    if (!isNonEmptyString(img.content)) throw bad('content da imagem é obrigatório');
    if (isUrl(img.content)) return { id: img.id, keep: true }; // já existe: nada a fazer
    if (!EXTENSIONS[img.type]) throw bad('type da imagem inválido');
    return { id: img.id, type: img.type, content: img.content };
  }

  if (!EXTENSIONS[img.type]) throw bad('type da imagem inválido (use image/png, image/jpg, ...)');
  if (!isNonEmptyString(img.content)) throw bad('content da imagem (base64) é obrigatório');
  return { type: img.type, content: img.content };
}

function validateOption(opt, partial) {
  if (!opt || typeof opt !== 'object') throw bad('Opção inválida');
  const hasId = opt.id !== undefined;

  if (hasId) {
    if (!partial) throw bad('id de opção só pode ser enviado na atualização');
    if (!isId(opt.id)) throw bad('id de opção inválido');
    if (opt.deleted === true) return { id: opt.id, deleted: true };
  }

  const out = hasId ? { id: opt.id } : {};

  if (!hasId || opt.title !== undefined) {
    if (!isNonEmptyString(opt.title)) throw bad('title da opção é obrigatório');
    out.title = opt.title.trim();
  }
  if (opt.shape !== undefined) {
    if (!SHAPES.includes(opt.shape)) throw bad('shape deve ser square ou circle');
    out.shape = opt.shape;
  }
  if (opt.type !== undefined) {
    if (!OPTION_TYPES.includes(opt.type)) throw bad('type da opção deve ser text ou color');
    out.type = opt.type;
  }
  if (opt.radius !== undefined) out.radius = parseRadius(opt.radius);

  // Aceita "values" (padrão) e "value" (aparece assim no exemplo do escopo)
  const raw = opt.values !== undefined ? opt.values : opt.value;
  if (!hasId || raw !== undefined) {
    const list = Array.isArray(raw) ? raw : null;
    if (!list || !list.length || list.some((v) => !isNonEmptyString(v) || String(v).includes(','))) {
      throw bad('values deve ser uma lista de textos não vazios e sem vírgula');
    }
    out.values = list.map((v) => v.trim()).join(',');
  }
  return out;
}

// Valida o corpo de POST (partial=false) e PUT (partial=true) de produtos
function validateProduct(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw bad('Corpo da requisição inválido');
  const out = {};

  for (const key of ['name', 'slug']) {
    if (!partial || body[key] !== undefined) {
      if (!isNonEmptyString(body[key])) throw bad(`${key} é obrigatório`);
      out[key] = body[key].trim();
    }
  }
  for (const key of ['price', 'price_with_discount']) {
    if (!partial || body[key] !== undefined) {
      if (typeof body[key] !== 'number' || !Number.isFinite(body[key]) || body[key] < 0) {
        throw bad(`${key} é obrigatório e deve ser um número maior ou igual a 0`);
      }
      out[key] = body[key];
    }
  }
  for (const key of ['enabled', 'use_in_menu']) {
    if (body[key] !== undefined) {
      if (!isBool(body[key])) throw bad(`${key} deve ser booleano`);
      out[key] = body[key];
    }
  }
  if (body.stock !== undefined) {
    if (!Number.isInteger(body.stock) || body.stock < 0) throw bad('stock deve ser um inteiro maior ou igual a 0');
    out.stock = body.stock;
  }
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') throw bad('description deve ser texto');
    out.description = body.description;
  }
  if (body.category_ids !== undefined) {
    if (!Array.isArray(body.category_ids) || !body.category_ids.every(isId)) {
      throw bad('category_ids deve ser uma lista de ids');
    }
    out.category_ids = [...new Set(body.category_ids)];
  }
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) throw bad('images deve ser uma lista');
    out.images = body.images.map((i) => validateImage(i, partial));
  }
  if (body.options !== undefined) {
    if (!Array.isArray(body.options)) throw bad('options deve ser uma lista');
    out.options = body.options.map((o) => validateOption(o, partial));
  }
  return out;
}

module.exports = { validateProduct, validateOption, validateImage };
