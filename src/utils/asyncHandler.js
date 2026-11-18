// Encaminha erros de funções async para o middleware de erros do Express
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
