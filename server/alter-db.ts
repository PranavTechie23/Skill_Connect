import { pool } from "./src/db";

async function run() {
  try {
    await pool.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;");
    console.log("Successfully added deadline column to jobs.");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    pool.end();
  }
}

run();
