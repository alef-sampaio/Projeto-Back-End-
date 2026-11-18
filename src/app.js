require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { UPLOAD_DIR } = require('./utils/images');

const app = express();

// Imagens chegam em base64, então o limite do corpo é maior que o padrão
app.use(express.json({ limit: '25mb' }));

app.use('/media', express.static(UPLOAD_DIR)); // imagens dos produtos
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); // documentação Swagger
app.use('/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
