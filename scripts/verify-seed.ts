import { config } from "dotenv";
import { Pool } from "pg";

config({ path: "./server/.env" });

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "root123",
  database: process.env.POSTGRES_DB || "skillconnect",
});

async function run() {
  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM companies) AS companies,
      (SELECT COUNT(*)::int FROM jobs) AS jobs,
      (SELECT COUNT(*)::int FROM applications) AS applications
  `);

  const appStatuses = await pool.query(`
    SELECT status, COUNT(*)::int AS count
    FROM applications
    GROUP BY status
    ORDER BY status
  `);

  console.log("Seed verification:");
  console.log(JSON.stringify({
    counts: counts.rows[0],
    applicationStatuses: appStatuses.rows,
  }, null, 2));
}

run()
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
