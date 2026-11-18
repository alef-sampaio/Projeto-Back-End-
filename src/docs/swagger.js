// Documentação OpenAPI 3 da API (servida em /docs)
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });
const body = (schema) => ({ required: true, content: json(schema) });
const ok = (description, schema) => ({ description, ...(schema ? { content: json(schema) } : {}) });
const secured = [{ bearerAuth: [] }];
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };

const err = {
  400: ok('Dados da requisição incorretos', ref('Error')),
  401: ok('Token não enviado ou inválido', ref('Error')),
  404: ok('Recurso não encontrado', ref('Error')),
};

const paging = [
  { name: 'limit', in: 'query', description: 'Itens por página (-1 = todos). Padrão 12', schema: { type: 'integer', default: 12 } },
  { name: 'page', in: 'query', description: 'Página. Padrão 1', schema: { type: 'integer', default: 1 } },
  { name: 'fields', in: 'query', description: 'Campos a retornar, separados por vírgula', schema: { type: 'string' } },
];

module.exports = {
  openapi: '3.0.3',
  info: { title: 'Projeto Back-end - API de e-commerce', version: '1.0.0', description: 'CRUD de usuários, categorias e produtos com autenticação JWT.' },
  servers: [{ url: '/v1' }],
  tags: [{ name: 'Usuários' }, { name: 'Categorias' }, { name: 'Produtos' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { message: { type: 'string' } } },
      User: { type: 'object', properties: { id: { type: 'integer' }, firstname: { type: 'string' }, surname: { type: 'string' }, email: { type: 'string' } } },
      UserCreate: {
        type: 'object',
        required: ['firstname', 'surname', 'email', 'password', 'confirmPassword'],
        properties: { firstname: { type: 'string' }, surname: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' }, confirmPassword: { type: 'string' } },
      },
      UserUpdate: {
        type: 'object',
        required: ['firstname', 'surname', 'email'],
        properties: { firstname: { type: 'string' }, surname: { type: 'string' }, email: { type: 'string' } },
      },
      Login: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } },
      Token: { type: 'object', properties: { token: { type: 'string' } } },
      Category: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, slug: { type: 'string' }, use_in_menu: { type: 'boolean' } } },
      CategoryInput: {
        type: 'object',
        required: ['name', 'slug'],
        properties: { name: { type: 'string', example: 'Shoes' }, slug: { type: 'string', example: 'shoes' }, use_in_menu: { type: 'boolean' } },
      },
      CategoryPage: {
        type: 'object',
        properties: { data: { type: 'array', items: ref('Category') }, total: { type: 'integer' }, limit: { type: 'integer' }, page: { type: 'integer' } },
      },
      Option: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, title: { type: 'string' }, shape: { type: 'string', enum: ['square', 'circle'] },
          radius: { type: 'integer' }, type: { type: 'string', enum: ['text', 'color'] }, values: { type: 'array', items: { type: 'string' } },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, enabled: { type: 'boolean' }, name: { type: 'string' }, slug: { type: 'string' }, use_in_menu: { type: 'boolean' },
          stock: { type: 'integer' }, description: { type: 'string' }, price: { type: 'number' }, price_with_discount: { type: 'number' },
          category_ids: { type: 'array', items: { type: 'integer' } },
          images: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, content: { type: 'string' } } } },
          options: { type: 'array', items: ref('Option') },
        },
      },
      ProductInput: {
        type: 'object',
        required: ['name', 'slug', 'price', 'price_with_discount'],
        properties: {
          enabled: { type: 'boolean' }, name: { type: 'string' }, slug: { type: 'string' }, use_in_menu: { type: 'boolean' }, stock: { type: 'integer' },
          description: { type: 'string' }, price: { type: 'number' }, price_with_discount: { type: 'number' },
          category_ids: { type: 'array', items: { type: 'integer' } },
          images: {
            type: 'array',
            description: 'No POST: {type, content(base64)}. No PUT também: {id, deleted:true}, {id, type, content} (troca) ou {id, content:url} (mantém).',
            items: { type: 'object', properties: { id: { type: 'integer' }, type: { type: 'string', example: 'image/png' }, content: { type: 'string' }, deleted: { type: 'boolean' } } },
          },
          options: {
            type: 'array',
            description: 'No PUT: {id, deleted:true} remove, {id, ...campos} atualiza e sem id cria.',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' }, title: { type: 'string' }, shape: { type: 'string', enum: ['square', 'circle'] }, radius: { type: 'string', example: '4px' },
                type: { type: 'string', enum: ['text', 'color'] }, values: { type: 'array', items: { type: 'string' } }, deleted: { type: 'boolean' },
              },
            },
          },
        },
      },
      ProductPage: {
        type: 'object',
        properties: { data: { type: 'array', items: ref('Product') }, total: { type: 'integer' }, limit: { type: 'integer' }, page: { type: 'integer' } },
      },
    },
  },
  paths: {
    '/user/token': {
      post: { tags: ['Usuários'], summary: 'Gera o token JWT', requestBody: body(ref('Login')), responses: { 200: ok('Token gerado', ref('Token')), 400: err[400] } },
    },
    '/user': {
      post: { tags: ['Usuários'], summary: 'Cadastra usuário', requestBody: body(ref('UserCreate')), responses: { 201: ok('Criado', ref('User')), 400: err[400] } },
    },
    '/user/{id}': {
      get: { tags: ['Usuários'], summary: 'Busca usuário por id', parameters: [idParam], responses: { 200: ok('OK', ref('User')), 404: err[404] } },
      put: { tags: ['Usuários'], summary: 'Atualiza usuário', security: secured, parameters: [idParam], requestBody: body(ref('UserUpdate')), responses: { 204: ok('Atualizado'), 400: err[400], 401: err[401], 404: err[404] } },
      delete: { tags: ['Usuários'], summary: 'Remove usuário', security: secured, parameters: [idParam], responses: { 204: ok('Removido'), 401: err[401], 404: err[404] } },
    },
    '/category/search': {
      get: {
        tags: ['Categorias'], summary: 'Lista categorias',
        parameters: [...paging, { name: 'use_in_menu', in: 'query', schema: { type: 'boolean' } }],
        responses: { 200: ok('OK', ref('CategoryPage')), 400: err[400] },
      },
    },
    '/category': {
      post: { tags: ['Categorias'], summary: 'Cria categoria', security: secured, requestBody: body(ref('CategoryInput')), responses: { 201: ok('Criada', ref('Category')), 400: err[400], 401: err[401] } },
    },
    '/category/{id}': {
      get: { tags: ['Categorias'], summary: 'Busca categoria por id', parameters: [idParam], responses: { 200: ok('OK', ref('Category')), 404: err[404] } },
      put: { tags: ['Categorias'], summary: 'Atualiza categoria', security: secured, parameters: [idParam], requestBody: body(ref('CategoryInput')), responses: { 204: ok('Atualizada'), 400: err[400], 401: err[401], 404: err[404] } },
      delete: { tags: ['Categorias'], summary: 'Remove categoria', security: secured, parameters: [idParam], responses: { 204: ok('Removida'), 401: err[401], 404: err[404] } },
    },
    '/product/search': {
      get: {
        tags: ['Produtos'], summary: 'Lista produtos com filtros',
        parameters: [
          ...paging,
          { name: 'match', in: 'query', description: 'Termo no nome ou descrição', schema: { type: 'string' } },
          { name: 'category_ids', in: 'query', description: 'Ex.: 15,24', schema: { type: 'string' } },
          { name: 'price-range', in: 'query', description: 'Ex.: 100-200', schema: { type: 'string' } },
          { name: 'option[id]', in: 'query', description: 'Ex.: option[45]=GG,PP (id da opção e valores)', schema: { type: 'string' } },
        ],
        responses: { 200: ok('OK', ref('ProductPage')), 400: err[400] },
      },
    },
    '/product': {
      post: { tags: ['Produtos'], summary: 'Cria produto', security: secured, requestBody: body(ref('ProductInput')), responses: { 201: ok('Criado', ref('Product')), 400: err[400], 401: err[401] } },
    },
    '/product/{id}': {
      get: { tags: ['Produtos'], summary: 'Busca produto por id', parameters: [idParam], responses: { 200: ok('OK', ref('Product')), 404: err[404] } },
      put: { tags: ['Produtos'], summary: 'Atualiza produto', security: secured, parameters: [idParam], requestBody: body(ref('ProductInput')), responses: { 204: ok('Atualizado'), 400: err[400], 401: err[401], 404: err[404] } },
      delete: { tags: ['Produtos'], summary: 'Remove produto', security: secured, parameters: [idParam], responses: { 204: ok('Removido'), 401: err[401], 404: err[404] } },
    },
  },
};
