# Projeto Back-end — API de e-commerce

API REST em **Node.js + Express** com **MySQL + Sequelize**, autenticação **JWT** e documentação **Swagger**.
Escopo: https://github.com/digitalcollegebr/projeto-backend

**Equipe:** Álef Alexandre

## Tecnologias

Node.js, Express, MySQL, Sequelize (ORM + migrations), bcryptjs, jsonwebtoken, dotenv, swagger-ui-express, Jest e Supertest, Nodemon.

Usei `bcryptjs` (bcrypt em JavaScript puro) em vez de `bcrypt` por compatibilidade com o Node 24, sem necessidade de compilação.

## Como rodar

Pré-requisitos: **Node 18+** e **MySQL 8** rodando.

```bash
# 1. instalar dependências
npm install

# 2. configurar variáveis de ambiente
cp .env.example .env        # edite DB_USER, DB_PASS, DB_NAME e JWT_SECRET

# 3. criar o banco e rodar as migrations
npm run db:create
npm run migrate

# 4. subir a API
npm run dev                 # desenvolvimento (nodemon)
npm start                   # produção
```

- API: `http://localhost:3000/v1`
- Documentação Swagger: `http://localhost:3000/docs`
- Para desfazer as migrations: `npm run migrate:undo`

## Testes

```bash
npm test
```

Os testes cobrem o middleware de autenticação, a paginação/`fields` e a validação dos produtos. Não precisam de banco de dados.

## Estrutura

```
src/
├── config/        # banco (database.js) e JWT (auth.js)
├── controllers/   # recebem a requisição e devolvem a resposta HTTP
├── services/      # regras de negócio e acesso ao banco
├── models/        # models do Sequelize e associações
├── migrations/    # criação das 6 tabelas
├── middleware/    # autenticação JWT e tratamento de erros
├── routes/        # definição das rotas
├── validators/    # validação do corpo dos produtos
├── utils/         # paginação, imagens, erros, helpers
├── docs/          # documento OpenAPI (Swagger)
├── app.js
└── server.js
tests/
```

Fluxo: `rota → controller → service → model`.

## Endpoints

| Método | Rota | Auth | Sucesso |
|---|---|---|---|
| POST | `/v1/user/token` | não | 200 |
| POST | `/v1/user` | não | 201 |
| GET | `/v1/user/:id` | não | 200 |
| PUT | `/v1/user/:id` | sim | 204 |
| DELETE | `/v1/user/:id` | sim | 204 |
| GET | `/v1/category/search` | não | 200 |
| GET | `/v1/category/:id` | não | 200 |
| POST / PUT / DELETE | `/v1/category[/:id]` | sim | 201 / 204 / 204 |
| GET | `/v1/product/search` | não | 200 |
| GET | `/v1/product/:id` | não | 200 |
| POST / PUT / DELETE | `/v1/product[/:id]` | sim | 201 / 204 / 204 |

Rotas protegidas exigem `Authorization: Bearer <token>`. O token é obtido em `POST /v1/user/token`.

### Filtros de `GET /v1/product/search`

`limit`, `page`, `fields`, `match` (nome ou descrição), `category_ids=15,24`, `price-range=100-200` e `option[45]=GG,PP`.
`limit=-1` retorna todos os itens.

## Decisões de Projeto

- **Token ausente ou inválido retorna 401** (o escopo cita 400 na Seção 05 e 401 nos demais endpoints; usamos 401 em todos).
- **`POST /v1/user` (cadastro) e `POST /v1/user/token` (login) são públicos**, senão não seria possível obter o primeiro token. Os demais POST, PUT e DELETE exigem token.
- Nas opções do produto, `values` é a chave oficial; `value` também é aceito. `radius` aceita `4` ou `"4px"` (a coluna é INTEGER).
- As imagens chegam em base64, são salvas em `uploads/products/` e servidas em `/media/...`. O banco guarda só o caminho relativo.
- No `PUT` de produto, os campos são opcionais; imagens e opções aceitam `{ id, deleted: true }` para remover.
- `option[id]` filtra pelo **id da opção** e compara com os valores cadastrados nela.
- Exclusão de produto remove imagens, opções e vínculos de categoria em cascata (`ON DELETE CASCADE`).
- A senha é salva com hash bcrypt e nunca é devolvida nas respostas.