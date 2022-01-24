## Teste full-stack developer myTapp

Enviado por Ricardo Maes

Linguagem:

* TypeScript

Frameworks:

* Servidor: Node.js + Express
* Front-end: React.js

## Preparação do App

A aplicação requer Node.js v16 ou superior

Execute no diretório:

* `yarn install`
* `yarn typeorm schema:sync`
* `yarn typeorm migration:run`
* `yarn keygen`

## Execução em ambiente de desenvolvimento

Back-end: `yarn server:dev`

Front-end: `yarn vite:dev`

## Compilação e execução em modo produção

### Sem Docker

* `yarn server:build`
* `yarn vite:build`
* `cd dist`
* `node src/index.js`

### Com Docker

* `docker build . -t app-cervejas-ricardo`
* `docker volume create app-cervejas-ricardo_data`
* `docker run -it --rm -v app-cervejas-ricardo_data:/app/data app-cervejas-ricardo src/migrate.js`
* `docker run -d -p 8080:8080 -v app-cervejas-ricardo_data:/app/data app-cervejas-ricardo`

## Usando a aplicação

Em modo de produção, a aplicação inteira será servida em http://localhost:8080/, e em modo de
desenvolvimento, a API será servida na porta 8080 e o front-end na porta 3000 (com proxy para a API)

Durante a prepação, é criado um único usuário com as credenciais:

* Usuário: `admin`
* Senha: `batata`

## Endpoints back-end

> A autenticação dos endpoints deve ser por meio de Bearer Token no header `Authorization`

---
* POST `/api/login` - Geração de Token
  - Aceita corpo JSON
  - Parâmetros de corpo:
    - `username`: Nome do usuário
    - `password`: Senha do usuário
  - Retornos:
    - Status 401: Credenciais inválidas ou não fornecidas
    - Status 200: Sucesso; corpo contém a token (string) para autenticação
---
* GET `/api/beers` - Listagem de cervejas
  - Requer autenticação
  - Parâmetros de query:
    - `search`: Opcional; termo de busca (nome da cerveja)
    - `page`: Opcional; número da página na busca
  - Retorno:
    - JSON:
    ```js
    {
      "data": [...data] /* Dados da PunkAPI */,
      "pages": 10 /* Páginas disponíveis */
    }
    ```
---
