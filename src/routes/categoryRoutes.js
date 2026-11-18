const router = require('express').Router();
const c = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');

// /search precisa vir antes de /:id
router.get('/search', c.search);
router.get('/:id', c.getById);
router.post('/', authenticate, c.create);
router.put('/:id', authenticate, c.update);
router.delete('/:id', authenticate, c.remove);

module.exports = router;
