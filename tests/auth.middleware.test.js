process.env.JWT_SECRET = 'segredo-de-teste';
const jwt = require('jsonwebtoken');
const { authenticate } = require('../src/middleware/auth');

// Executa o middleware e devolve o erro passado ao next() (se houver)
function run(authorization) {
  const req = { headers: authorization ? { authorization } : {} };
  let error;
  authenticate(req, {}, (e) => { error = e; });
  return { req, error };
}

describe('middleware authenticate', () => {
  test('401 quando não envia o header Authorization', () => {
    expect(run().error.status).toBe(401);
  });

  test('401 quando o esquema não é Bearer', () => {
    expect(run('Basic abc').error.status).toBe(401);
  });

  test('401 quando o token é inválido', () => {
    expect(run('Bearer token-falso').error.status).toBe(401);
  });

  test('401 quando o token está expirado', () => {
    const token = jwt.sign({}, 'segredo-de-teste', { subject: '1', expiresIn: -10 });
    expect(run(`Bearer ${token}`).error.status).toBe(401);
  });

  test('passa e preenche req.userId com um token válido', () => {
    const token = jwt.sign({}, 'segredo-de-teste', { subject: '7', expiresIn: '1h' });
    const { req, error } = run(`Bearer ${token}`);
    expect(error).toBeUndefined();
    expect(req.userId).toBe(7);
  });
});
