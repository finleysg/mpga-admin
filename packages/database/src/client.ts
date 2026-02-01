import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "./schema";

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST ?? "localhost",
  user: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "mpga",
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

export const db = drizzle(pool, { schema, mode: "default" });
