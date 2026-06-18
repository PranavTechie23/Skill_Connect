import { Pool } from "pg";
import fs from "fs";
import path from "path";

const pool = new Pool({
  connectionString: "postgresql://postgres:root123@localhost:5432/skillconnect",
});

async function run() {
  try {
    const sql = fs.readFileSync(path.join(process.cwd(), "migrations/0019_responsible_ai.sql"), "utf-8");
    await pool.query(sql);
    console.log("Migration 0019 applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
