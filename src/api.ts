import axios from "axios";
import bcrypt from "bcrypt";
import { Application, NextFunction, Request, Response } from "express";
import jwtMiddleware from "express-jwt";
import fs from "fs";
import Fuse from "fuse.js";
import JWT from "jsonwebtoken";
import { createConnection } from "typeorm";
import { Beer } from "../web/src/punkAPI";
import { User } from "./entities/User";

export interface BeerAPIResponse {
  data: Beer[],
  pages: number,
}

export const passwordStrength = 10;
export const placeholderPassword = bcrypt.hashSync("foobar", passwordStrength);
const jwtKey = fs.readFileSync("jwt.key");
const jwtAlgorithm = "HS256";

// Embrulha um handler do Express em tratamento de erro async
function handler(h: (req: Request, res: Response, next?: NextFunction) => Promise<any>) {
  return (req: Request, res: Response) => {
    h(req, res).catch((reason) => {
      console.error("Error: ", reason);
      res.status(500).send("Internal server error");
    });
  }
}

// Realiza um pedido à PunkAPI e retorna os dados
async function punkApiRequest<T>(uri: string) {
  if (uri.startsWith("/")) {
    uri = uri.replace("/", "");
  }
  const url = `https://api.punkapi.com/v2/${uri}`;
  console.log(`GET ${url}`);
  return axios.get<T>(url).then((response) => response.data);
}

// Salva os dados da PunkAPI locamente para paginação
let cachedData: Beer[] = [];
let searcher: Fuse<Beer>;
let lastLoaded: number;
async function updateData() {
  if (lastLoaded == null) {
    let page = 1;
    while (true) {
      const data = await punkApiRequest<Beer[]>(`beers?page=${page}&per_page=80`);
      if (data.length > 0) {
        cachedData = cachedData.concat(data);
        page += 1;
      } else {
        break;
      }
    }
    cachedData.sort((a, b) => a.name > b.name ? 1 : -1);
    searcher = new Fuse(cachedData, { keys: ["name"], shouldSort: true });
    lastLoaded = Date.now();
    console.log(`Cached ${cachedData.length} entries`);
  }
}

// Busca o usuário de acordo com o login e senha, retornando o objeto do usuário caso
// as credenciais estejam corretas
async function loginUser(username?: string, password?: string) {
  if (username && password) {
    const user = await User.findOne({ username });
    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        return user;
      }
    } else {
      await bcrypt.compare("barfoo", placeholderPassword);
    }
  }
}

export default async function (base: string, app: Application) {
  // Instancia a conexão configurada no ormconfig.json
  await createConnection();
  // Atualiza a base de dados em memória
  await updateData();

  app.post(`${base}/login`, handler(async (req, res) => {
    const user = await loginUser(req.body.username, req.body.password);
    if (user == null) {
      return res.status(401).send();
    }
    const payload = {
      uid: user.id
    };
    const options: JWT.SignOptions = {
      algorithm: jwtAlgorithm,
      expiresIn: "7 days",
    };
    res.send(JWT.sign(payload, jwtKey, options));
  }));

  // Requer login para as rotas definidas a partir desse ponto
  app.use(`${base}`, jwtMiddleware({ secret: jwtKey, algorithms: [jwtAlgorithm] }));

  app.get(`${base}/beers`, handler(async (req, res) => {
    const perPage = 20;
    console.log(req.query);
    let data = cachedData;
    let page = 1;
    if (typeof req.query.search === "string") {
      const search = req.query.search;
      if (search.length > 0) {
        data = searcher.search(req.query.search).map((result) => result.item);
      }
    }
    if (typeof req.query.page === "string") {
      page = parseInt(req.query.page, 10);
    }
    res.send({
      data: data.slice(page * perPage, (page + 1) * perPage),
      pages: Math.max(Math.ceil(data.length / perPage) - 1, 1),
    } as BeerAPIResponse);
  }));
}
