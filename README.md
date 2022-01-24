## Teste full-stack developer myTapp

Enviado por Ricardo Maes

Linguagem:

* TypeScript

Frameworks:

* Servidor: Node.js + Express
* Front-end: React.js

## Preparação do App

A aplicação requer Node.js v16 ou superior

> Recomenda-se o uso do Yarn como gerenciador de pacotes

Execute no diretório:

* `yarn install`
* `yarn typeorm schema:sync`
* `yarn typeorm migration:run`
* `yarn keygen`

## Execução em ambiente dev

Back-end: `yarn server:dev`

Front-end: `yarn vite:dev`

## Compilação e execução em prod

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

A aplicação será servida em http://localhost:8080/, e contém um único usuário com as credenciais:

* Usuário: `admin`
* Senha: `batata`
