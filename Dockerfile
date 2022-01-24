FROM node:16-slim as build

COPY package.json \
  yarn.lock \
  tsconfig.json \
  vite.config.ts \
  ormconfig.json \
  keygen.ts \
  ./

COPY src src
COPY web web
COPY migrations migrations

RUN yarn install
RUN yarn server:build
RUN yarn vite:build
RUN yarn keygen

FROM node:16-slim
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build package.json .
COPY --from=build dist/src src
COPY --from=build dist/web web
COPY --from=build dist/migrations migrations
COPY --from=build ormconfig.json .
COPY --from=build jwt.key .

RUN yarn install

CMD ["node", "src/index.js"]
