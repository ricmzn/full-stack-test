import axios from "axios";
import bcrypt from "bcrypt";
import { Application, NextFunction, Request, Response } from "express";
import jwtMiddleware from "express-jwt";
import fs from "fs";
import Fuse from "fuse.js";
import JWT from "jsonwebtoken";
import { Token } from "../web/src/auth";
import { Beer } from "../web/src/punkAPI";
import { User } from "./entities/User";
import { validatePassword, validateUsername } from "./validation";

export interface BeerAPIResponse {
  data: Beer[],
  pages: number,
}

export const passwordStrength = 10;
export const placeholderPassword = bcrypt.hashSync("foobar", passwordStrength);
const jwtKey = fs.readFileSync("jwt.key");
const jwtAlgorithm = "HS256";

// Embrulha um handler do Express em tratamento de erro async
function handler(h: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    h(req, res, next).catch((reason) => {
      console.error("Error: ", reason);
      res.status(500).send({ message: "Internal server error" });
    });
  }
}

// Busca o usuário de acordo com a token
async function getUser(req: Request) {
  const uid = (req.user as Token)?.uid;
  if (uid != null) {
    return await User.findOne(uid);
  }
}

// Realiza um pedido à PunkAPI e retorna os dados
async function punkApiRequest(uri: string) {
  if (uri.startsWith("/")) {
    uri = uri.replace("/", "");
  }
  const url = `https://api.punkapi.com/v2/${uri}`;
  console.log(`GET ${url}`);
  return axios.get<Beer[]>(url).then((response) => response.data);
}

// Salva os dados da PunkAPI locamente para paginação
let cachedData: Beer[] = [];
let searcher: Fuse<Beer>;
let lastLoaded: number;
async function updateData(dataFetcher: (uri: string) => Promise<Beer[]>) {
  if (lastLoaded == null) {
    let page = 1;
    while (true) {
      const data = await dataFetcher(`beers?page=${page}&per_page=80`);
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

/**
 * @param base Caminho base da API
 * @param app Aplicação do Express
 * @param dataFetcher Fonte de dados do back-end
 * @param username Força usuário na API, pulando autenticação
 */
export default async function (base: string, app: Application, dataFetcher = punkApiRequest, username?: string) {
  // Atualiza a base de dados em memória
  await updateData(dataFetcher);

  // Autenticação
  app.post(`${base}/login`, handler(async (req, res) => {
    const user = await loginUser(req.body.username, req.body.password);
    if (user == null) {
      return res.status(401).send({});
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

  ///////////////////////////////////////////////////////////////
  // Requer login para as rotas definidas a partir desse ponto //
  ///////////////////////////////////////////////////////////////
  if (username == null) {
    app.use(base, jwtMiddleware({ secret: jwtKey, algorithms: [jwtAlgorithm] }));
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error("cannot force username in production; aborting");
    }
    const user = await User.findOne({ username });
    app.use(base, handler(async (req, res, next) => {
      if (user) {
        req.user = {
          uid: user.id
        };
        next();
      } else {
        res.status(401).send({});
      }
    }));
  }

  // Criação de usuários
  app.post(`${base}/users`, handler(async (req, res) => {
    const [password, passwordMessage] = validatePassword(req.body.password);
    if (!password) {
      return res.status(400).send({ message: passwordMessage });
    }
    const [username, usernameMessage] = validateUsername(req.body.username);
    if (!username) {
      return res.status(400).send({ message: usernameMessage });
    }
    const user = await User.findOne({ username });
    if (user != null) {
      return res
        .status(400)
        .send({ message: "'username' must be unique" });
    }
    await User.insert({
      username,
      password: await bcrypt.hash(password, passwordStrength),
    });
    res.status(200).send({});
  }));

  // Atualização de usuários
  app.put(`${base}/users/self`, handler(async (req, res) => {
    if (typeof req.body.username !== "undefined") {
      return res.status(400).send({ message: "'username' cannot be changed" });
    }
    const [password, passwordMessage] = validatePassword(req.body.password);
    if (!password) {
      return res.status(400).send({ message: passwordMessage });
    }
    if (typeof password !== "string" || password.length < 6 || password.length > 64) {
      return res
        .status(400)
        .send({ message: "'password' must be a string between 6 and 64 characters in length" });
    }
    const user = await getUser(req);
    if (user == null) {
      return res
        .status(401)
        .send({ message: "logged in user does not exist" });
    }
    user.password = await bcrypt.hash(password, passwordStrength);
    await user.save();
    res.status(200).send({});
  }));

  // Remoção de usuários
  app.delete(`${base}/users/self`, handler(async (req, res) => {
    const user = await getUser(req);
    if (user == null) {
      return res
        .status(401)
        .send({ message: "logged in user does not exist" });
    }
    await user.remove();
    res.status(200).send({});
  }));

  // Listagem de cervejas
  app.get(`${base}/beers`, handler(async (req, res) => {
    const { search, page } = req.query;
    const perPage = 20;
    let data = cachedData;
    let pageNum = 1;
    if (typeof search === "string") {
      if (search.length > 0) {
        data = searcher.search(search).map((result) => result.item);
      }
    }
    if (typeof page === "string") {
      pageNum = parseInt(page, 10);
    }
    res.send({
      data: data.slice((pageNum - 1) * perPage, pageNum * perPage),
      pages: Math.max(Math.ceil(data.length / perPage), 1),
    } as BeerAPIResponse);
  }));
}
