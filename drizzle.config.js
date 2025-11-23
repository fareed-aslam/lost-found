import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/schema/index.js",
  out: "./src/lib/migrations",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "lostfound",
  },
});
