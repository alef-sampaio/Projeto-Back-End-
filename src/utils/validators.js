const AppError = require('./AppError');

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isBool = (v) => typeof v === 'boolean';

// Converte o :id da rota. Id inválido é tratado como recurso inexistente (404)
function parseId(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new AppError(404, 'Recurso não encontrado');
  return n;
}

// Converte "1,2,3" em [1, 2, 3] (400 se algum valor for inválido)
function parseIntList(raw, name) {
  const parts = String(raw).split(',').map((p) => p.trim());
  const nums = parts.map(Number);
  if (!parts.length || nums.some((n) => !Number.isInteger(n) || n < 1)) {
    throw new AppError(400, `${name} deve ser uma lista de ids separados por vírgula`);
  }
  return [...new Set(nums)];
}

module.exports = { isNonEmptyString, isEmail, isBool, parseId, parseIntList };
