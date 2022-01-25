import bodyParser from "body-parser";
import express from "express";
import request, { Response } from "supertest";
import { sample } from "../web/src/punkAPI";
import useAPI from "./api";

async function dataFetcher(uri: string) {
  if (!uri.includes("page=1")) {
    return [];
  }
  return [sample];
}

async function API(uid?: number) {
  const app = express();
  app.use(bodyParser.json());
  await useAPI("/api", app, dataFetcher, uid);
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

test("/api/login rejects missing body", async () => {
  await request(await API())
    .post("/api/login")
    .expect(401);
});

test("/api/login rejects body without data", async () => {
  await request(await API())
    .post("/api/login")
    .send({})
    .expect(401);
});

test("/api/login rejects bad credentials", async () => {
  await request(await API())
    .post("/api/login")
    .send({
      username: "john",
      password: "doe",
    })
    .expect(401);
});

test("/api/login accepts good credentials", async () => {
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

test("/api/beers fails without authentication", async () => {
  await request(await API())
    .get("/api/beers")
    .expect(401);
});

test("/api/beers succeeds with authentication", async () => {
  await request(await API(1))
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

test("/api/beers search with valid name returns results", async () => {
  await request(await API(1))
    .get("/api/beers")
    .query("search=IPA")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(oneResult);
});

test("/api/beers search with invalid name returns empty array", async () => {
  await request(await API(1))
    .get("/api/beers")
    .query("search=foobar")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(zeroResults);
});

test("/api/beers paging works", async () => {
  await request(await API(1))
    .get("/api/beers")
    .query("page=1")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(oneResult);
});

test("/api/beers paging and search work", async () => {
  await request(await API(1))
    .get("/api/beers")
    .query("page=1")
    .query("search=IPA")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(oneResult);
});

test("/api/beers paging returns nothing after last page", async () => {
  await request(await API(1))
    .get("/api/beers")
    .query("page=10")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect(zeroResults);
});
