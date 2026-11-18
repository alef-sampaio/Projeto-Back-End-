const { parsePagination, parseFields } = require('../src/utils/pagination');

describe('parsePagination', () => {
  test('usa limit 12 e page 1 por padrão', () => {
    expect(parsePagination({})).toMatchObject({ limit: 12, page: 1, offset: 0 });
  });

  test('calcula o offset da página', () => {
    expect(parsePagination({ limit: '10', page: '3' }).offset).toBe(20);
  });

  test('limit=-1 busca todos os itens e ignora page', () => {
    expect(parsePagination({ limit: '-1', page: '5' })).toMatchObject({ limit: null, page: 1, offset: 0, responseLimit: -1 });
  });

  test.each([{ limit: '0' }, { limit: 'abc' }, { page: '0' }, { page: 'x' }])('400 para %o', (q) => {
    expect(() => parsePagination(q)).toThrow(expect.objectContaining({ status: 400 }));
  });
});

describe('parseFields', () => {
  const allowed = ['id', 'name', 'slug'];

  test('retorna null quando não informado', () => {
    expect(parseFields(undefined, allowed)).toBeNull();
  });

  test('lê lista separada por vírgula', () => {
    expect(parseFields('name,slug', allowed)).toEqual(['name', 'slug']);
  });

  test('400 para campo desconhecido', () => {
    expect(() => parseFields('name,senha', allowed)).toThrow(expect.objectContaining({ status: 400 }));
  });
});
