const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Banco de dados conectado');
    app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT} (docs em /docs)`));
  } catch (err) {
    console.error('Não foi possível conectar ao banco de dados:', err.message);
    process.exit(1);
  }
}

start();
