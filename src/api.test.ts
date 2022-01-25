import bodyParser from "body-parser";
import express from "express";
import request, { Response } from "supertest";
import { createConnection, getConnectionManager } from "typeorm";
import ormconfig from "../ormconfig.json";
import { sample } from "../web/src/punkAPI";
import useAPI from "./api";

async function dataFetcher(uri: string) {
  if (!uri.includes("page=1")) {
    return [];
  }
  return [sample];
}

async function API(username?: string) {
  const app = express();
  app.use(bodyParser.json());
  if (!getConnectionManager().has("default")) {
    const conn = await createConnection({ ...ormconfig as any, database: ":memory:" });
    await conn.synchronize();
    await conn.runMigrations();
  }
  await useAPI("/api", app, dataFetcher, username);
  return app;
}

function data(res: Response) {
  if (typeof res.body !== "object") {
    throw "res.body must be an object";
  }
  if (!Array.isArray(res.body.data)) {
    throw "res.body.data must be an array";
  }
  return res.body.data;
}

function zeroResults(res: Response) {
  if (data(res).length > 0) {
    throw new Error("api returned results when none were expected");
  }
}

function oneResult(res: Response) {
  if (data(res).length < 1) {
    throw new Error("api search did not return at least 1 result");
  }
  if (data(res)[0].name !== sample.name) {
    throw new Error("api search data does not match sample data");
  }
}

test("POST /api/login rejects missing body", async () => {
  await request(await API())
    .post("/api/login")
    .expect(401);
});

test("POST /api/login rejects body without data", async () => {
  await request(await API())
    .post("/api/login")
    .send({})
    .expect(401);
});

test("POST /api/login rejects bad credentials", async () => {
  await request(await API())
    .post("/api/login")
    .send({
      username: "john",
      password: "doe",
    })
    .expect(401);
});

test("POST /api/login accepts good credentials", async () => {
  await request(await API())
    .post("/api/login")
    .send({
      username: "admin",
      password: "batata",
    })
    .expect(200)
    .expect((res) => {
      if (res.text.length === 0) {
        throw new Error("body must not be empty");
      }
    });
});

test("POST /api/users requires valid username and password", async () => {
  await request(await API())
    .post("/api/users")
    .expect(401);

  await request(await API("admin"))
    .post("/api/users")
    .expect(400);

  await request(await API("admin"))
    .post("/api/users")
    .send({ username: "", password: "" })
    .expect(400);

  await request(await API("admin"))
    .post("/api/users")
    .send({ username: "asdf", password: "" })
    .expect(400);

  await request(await API("admin"))
    .post("/api/users")
    .send({ username: "asdf", password: "123" })
    .expect(400);

  await request(await API("admin"))
    .post("/api/users")
    .send({ username: "asdf", password: "123456" })
    .expect(200);
});

test("PUT /api/users/self allows own password update", async () => {
  await request(await API())
    .put("/api/users")
    .expect(401);

  await request(await API("admin"))
    .post("/api/users")
    .send({ username: "put-test", password: "foobar" })
    .expect(200);

  // Mudança de username não permitida
  await request(await API("put-test"))
    .put("/api/users/self")
    .send({ username: "ababa", password: "barfoo" })
    .expect(400);

  // Senha curta
  await request(await API("put-test"))
    .put("/api/users/self")
    .send({ password: "bar" })
    .expect(400);

  // Ok
  await request(await API("put-test"))
    .put("/api/users/self")
    .send({ password: "barfoo" })
    .expect(200);

  await request(await API())
    .post("/api/login")
    .send({ username: "put-test", password: "foobar" })
    .expect(401);

  await request(await API())
    .post("/api/login")
    .send({ username: "put-test", password: "barfoo" })
    .expect(200);
});

test("DELETE /api/users allows self-deletion", async () => {
  await request(await API())
    .delete("/api/users")
    .expect(401);

  await request(await API("admin"))
    .post("/api/users")
    .send({ username: "delete-test", password: "foobar" })
    .expect(200);

  // Existe
  await request(await API())
    .post("/api/login")
    .send({ username: "delete-test", password: "foobar" })
    .expect(200);

  await request(await API("delete-test"))
    .delete("/api/users/self")
    .expect(200);

  // Não existe
  await request(await API("delete-test"))
    .delete("/api/users/self")
    .expect(401);

  await request(await API())
    .post("/api/login")
    .send({ username: "delete-test", password: "foobar" })
    .expect(401);
});

test("GET /api/beers fails without authentication", async () => {
  await request(await API())
    .get("/api/beers")
    .expect(401);
});

test("GET /api/beers succeeds with authentication", async () => {
  await request(await API("admin"))
    .get("/api/beers")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect((res) => {
      if (data(res).length < 1) {
        throw new Error("api did not return at least 1 result");
      }
      if (data(res)[0].name !== sample.name) {
        throw new Error("api data does not match sample data");
      }
    });
});

test("GET /api/beers search with valid name returns results", async () => {
  await request(await API("admin"))
    .get("/api/beers")
    .query("search=IPA")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(oneResult);
});

test("GET /api/beers search with invalid name returns empty array", async () => {
  await request(await API("admin"))
    .get("/api/beers")
    .query("search=foobar")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(zeroResults);
});

test("GET /api/beers paging works", async () => {
  await request(await API("admin"))
    .get("/api/beers")
    .query("page=1")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(oneResult);
});

test("GET /api/beers paging and search work", async () => {
  await request(await API("admin"))
    .get("/api/beers")
    .query("page=1")
    .query("search=IPA")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(oneResult);
});

test("GET /api/beers paging returns nothing after last page", async () => {
  await request(await API("admin"))
    .get("/api/beers")
    .query("page=10")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(zeroResults);
});
