const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function run() {
  const migrationsDir = path.join(__dirname, "..", "src", "lib", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const DB_HOST = process.env.DB_HOST || "localhost";
  const DB_USER = process.env.DB_USER || "root";
  const DB_PASSWORD = process.env.DB_PASSWORD || "";
  const DB_NAME = process.env.DB_NAME || "lostfound";

  console.log("Running migrations against", DB_HOST, DB_NAME);

  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });
  try {
    // ensure database exists
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await conn.changeUser({ database: DB_NAME });

    for (const file of files) {
      const p = path.join(migrationsDir, file);
      console.log("Applying", file);
      const sql = fs.readFileSync(p, "utf8");
      try {
        await conn.query(sql);
        console.log("Applied", file);
      } catch (err) {
        console.error("Failed to apply", file, err.message);
        throw err;
      }
    }

    console.log("All migrations applied");
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error("Migration runner failed:", err);
  process.exit(1);
});
