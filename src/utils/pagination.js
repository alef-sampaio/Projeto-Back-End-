const AppError = require('./AppError');

// Lê limit/page da query string. limit=-1 significa "sem limite".
function parsePagination(query) {
  const limit = query.limit === undefined ? 12 : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);

  if (!Number.isInteger(limit) || (limit !== -1 && limit < 1)) {
    throw new AppError(400, 'limit deve ser -1 ou um inteiro maior que 0');
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(400, 'page deve ser um inteiro maior que 0');
  }

  if (limit === -1) return { limit: null, page: 1, offset: 0, responseLimit: -1 };
  return { limit, page, offset: (page - 1) * limit, responseLimit: limit };
}

// Lê "fields=a,b" e valida contra a lista de campos permitidos
function parseFields(raw, allowed) {
  if (raw === undefined) return null;
  const fields = String(raw).split(',').map((f) => f.trim()).filter(Boolean);
  if (!fields.length || fields.some((f) => !allowed.includes(f))) {
    throw new AppError(400, `fields inválido. Campos permitidos: ${allowed.join(', ')}`);
  }
  return [...new Set(fields)];
}

module.exports = { parsePagination, parseFields };
