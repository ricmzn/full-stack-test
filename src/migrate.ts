import { createConnection } from "typeorm";
import ormconfig from "../ormconfig.json";

createConnection({ ...ormconfig, logging: "all" } as any).then((connection) => {
  connection.synchronize();
  connection.runMigrations();
});
