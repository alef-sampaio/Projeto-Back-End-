const { validateProduct } = require('../src/validators/productValidator');

const valid = { name: 'Produto 01', slug: 'produto-01', price: 119.9, price_with_discount: 99.9 };

describe('validateProduct (POST)', () => {
  test('aceita um produto mínimo válido', () => {
    expect(validateProduct(valid)).toMatchObject({ name: 'Produto 01', price: 119.9 });
  });

  test('400 sem name ou com price negativo', () => {
    expect(() => validateProduct({ ...valid, name: '' })).toThrow(expect.objectContaining({ status: 400 }));
    expect(() => validateProduct({ ...valid, price: -1 })).toThrow(expect.objectContaining({ status: 400 }));
  });

  test('converte radius "4px" em inteiro e junta values com vírgula', () => {
    const out = validateProduct({ ...valid, options: [{ title: 'Tamanho', radius: '4px', values: ['PP', 'GG'] }] });
    expect(out.options[0]).toMatchObject({ radius: 4, values: 'PP,GG' });
  });

  test('aceita "value" como apelido de "values"', () => {
    const out = validateProduct({ ...valid, options: [{ title: 'Cor', value: ['M'] }] });
    expect(out.options[0].values).toBe('M');
  });

  test('400 para shape inválido e para imagem com type inválido', () => {
    expect(() => validateProduct({ ...valid, options: [{ title: 'x', shape: 'triangle', values: ['a'] }] })).toThrow();
    expect(() => validateProduct({ ...valid, images: [{ type: 'text/plain', content: 'abc' }] })).toThrow();
  });

  test('400 ao enviar id de imagem no POST', () => {
    expect(() => validateProduct({ ...valid, images: [{ id: 1, deleted: true }] })).toThrow();
  });
});

describe('validateProduct (PUT)', () => {
  test('campos obrigatórios viram opcionais', () => {
    expect(validateProduct({ stock: 20 }, { partial: true })).toEqual({ stock: 20 });
  });

  test('aceita remover imagem e manter imagem por URL', () => {
    const out = validateProduct(
      { images: [{ id: 2, deleted: true }, { id: 1, content: 'https://store.com/media/a.jpg' }] },
      { partial: true }
    );
    expect(out.images).toEqual([{ id: 2, deleted: true }, { id: 1, keep: true }]);
  });

  test('aceita remover e atualizar opção', () => {
    const out = validateProduct({ options: [{ id: 1, deleted: true }, { id: 2, radius: '10px' }] }, { partial: true });
    expect(out.options).toEqual([{ id: 1, deleted: true }, { id: 2, radius: 10 }]);
  });
});
