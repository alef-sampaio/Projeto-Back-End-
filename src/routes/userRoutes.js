const router = require('express').Router();
const c = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Públicas: login (gera o token) e cadastro, senão ninguém conseguiria o primeiro token
router.post('/token', c.token);
router.post('/', c.create);
router.get('/:id', c.getById);
router.put('/:id', authenticate, c.update);
router.delete('/:id', authenticate, c.remove);

module.exports = router;
