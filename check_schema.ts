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
    console.log("Running manual schema migration for Phase 3...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "match_explanations" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
        "job_id" text NOT NULL REFERENCES "jobs"("id") ON DELETE cascade,
        "explanation_text" text NOT NULL,
        "match_score" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "recommendation_feedback" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
        "job_id" text NOT NULL REFERENCES "jobs"("id") ON DELETE cascade,
        "rating" text NOT NULL,
        "comments" text,
        "created_at" timestamp DEFAULT now()
      );

      ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "embedding" real[];
      ALTER TABLE "professional_profiles" ADD COLUMN IF NOT EXISTS "embedding" real[];
    `);
    console.log("Manual migration successful!");



    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('users', 'professional_profiles', 'agent_runs', 'agent_steps', 'companies', 'jobs')
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
