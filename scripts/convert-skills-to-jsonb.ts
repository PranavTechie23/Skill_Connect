import { Pool } from 'pg';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:dsa@localhost:5432/graphicgenie";

async function run() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const sql = fs.readFileSync('./migrations/0004_convert_skills_to_jsonb.sql', 'utf8');
    console.log('Running migration: convert skills to jsonb');
    await pool.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();