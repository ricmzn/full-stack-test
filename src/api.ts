import axios from "axios";
import bcrypt from "bcrypt";
import { Application, NextFunction, Request, Response } from "express";
import jwtMiddleware from "express-jwt";
import fs from "fs";
import JWT from "jsonwebtoken";
import { createConnection } from "typeorm";
import { User } from "./entities/User";

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
async function requestPunkAPI(uri: string) {
  if (uri.startsWith("/")) {
    uri = uri.replace("/", "");
  }
  const response = await axios.get(`https://api.punkapi.com/v2/${uri}`);
  return response.data;
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

export default function (base: string, app: Application) {
  // Instancia a conexão configurada no ormconfig.json
  createConnection();

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
    res.send(await requestPunkAPI("/beers"));
  }));
}
