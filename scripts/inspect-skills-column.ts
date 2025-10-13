import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:dsa@localhost:5432/graphicgenie";

async function inspect() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'skills'
    `);
    console.log('Column info:', res.rows);
  } catch (err) {
    console.error('Inspect failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

inspect();