import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../lib/schema/index.js";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "lostfound",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export const db = drizzle(pool, { schema, mode: "default" });
