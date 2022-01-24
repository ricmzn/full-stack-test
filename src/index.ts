import bodyParser from "body-parser";
import express from "express";
import morgan from "morgan";
import serveStatic from "serve-static";
import useAPI from "./api";

const app = express();
const address = process.env["NODE_ENV"] === "production" ? "0.0.0.0" : "localhost";
const port = 8080;

app.use(morgan("dev"));
app.use(bodyParser.json());
useAPI("/api", app);
app.use(serveStatic("web"));

app.listen(port, address, () => {
  console.log(`Listening on ${address}:${port}`);
});
