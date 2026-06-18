import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  await pool.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';");
  console.log('Column added successfully');
  process.exit(0);
}

main().catch(err => {
  console.error('Error adding column:', err);
  process.exit(1);
});
