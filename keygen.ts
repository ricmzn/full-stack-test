import crypto from "crypto";
import fs from "fs";

fs.writeFileSync("jwt.key", crypto.randomBytes(64));
