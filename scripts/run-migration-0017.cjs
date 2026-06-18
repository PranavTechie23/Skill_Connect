const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:root123@localhost:5432/skillconnect",
  });

  const sqlPath = path.resolve(__dirname, "../migrations/0017_moderation_governance.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("✅ Migration 0017_moderation_governance applied successfully");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});
