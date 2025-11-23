#!/usr/bin/env node
/**
 * Simple migration runner for development.
 * Reads .sql files in src/lib/migrations and executes them against the database.
 * Usage: node ./scripts/run-migrations.js
 */

import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const migrationsDir = path.resolve(process.cwd(), "src", "lib", "migrations");

async function run() {
  if (!fs.existsSync(migrationsDir)) {
    console.error("Migrations directory not found:", migrationsDir);
    process.exit(1);
  }

  // Allow running a single migration file by passing its name as the first CLI arg.
  const fileArg = process.argv[2] || process.env.MIGRATION_FILE || null;
  let files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (fileArg) {
    // accept either filename or basename
    const matched = files.filter(
      (f) => f === fileArg || path.basename(f) === fileArg
    );
    if (matched.length === 0) {
      console.error("Migration file not found:", fileArg);
      process.exit(1);
    }
    files = matched;
    console.log("Running only migration file(s):", files.join(", "));
  }
  if (!files.length) {
    console.log("No migration files found.");
    return;
  }

  const pool = await mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "lostfound",
    waitForConnections: true,
    connectionLimit: 2,
  });

  const conn = await pool.getConnection();
  try {
    for (const file of files) {
      const fp = path.join(migrationsDir, file);
      console.log("Running migration:", file);
      let sql = fs.readFileSync(fp, "utf8");

      // Some Drizzle/exports include custom markers like '--> statement-breakpoint'.
      // Normalize by splitting on that marker, then execute individual statements.
      const chunks = sql.split("--> statement-breakpoint");
      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (!trimmed) continue;

        // Further split by semicolon to run multiple statements safely.
        const statements = trimmed
          .split(/;\s*\n?/g)
          .map((s) => s.trim())
          .filter(Boolean);
        for (const stmt of statements) {
          try {
            await conn.query(stmt);
          } catch (err) {
            // If table already exists, log and continue. Useful when migrations partially applied.
            if (
              err &&
              (err.code === "ER_TABLE_EXISTS_ERROR" || err.errno === 1050)
            ) {
              console.warn(
                "Skipping existing-table statement in",
                file,
                ":",
                stmt.slice(0, 200)
              );
              continue;
            }
            // If referencing missing table for FK or other recoverable errors, we show the statement and abort.
            console.error("Failed statement in", file, ":", stmt.slice(0, 200));
            throw err;
          }
        }
      }

      console.log("Applied", file);
    }
    console.log("All migrations applied.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(2);
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
