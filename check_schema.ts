import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

const host = process.env.POSTGRES_HOST || "localhost";
const port = process.env.POSTGRES_PORT || "5432";
const user = process.env.POSTGRES_USER || "postgres";
const password = process.env.POSTGRES_PASSWORD || "root123";
const database = process.env.POSTGRES_DB || "skillconnect";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function check() {
  try {
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('users', 'professional_profiles')
    `);
    console.log("Columns:", result.rows);
    
    const seqs = await pool.query(`
      SELECT sequence_name FROM information_schema.sequences
    `);
    console.log("Sequences:", seqs.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
