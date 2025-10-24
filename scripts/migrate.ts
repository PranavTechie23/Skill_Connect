import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dsa@localhost:5432/graphicgenie'
  });

  try {
    // Read and execute migrations in order
    const sql = fs.readFileSync(path.join(__dirname, '../migrations/0000_eager_dragon_lord.sql'), 'utf8');
    await pool.query(sql);
    console.log('Initial migration completed successfully');

    // Run subsequent migrations
    const migrations = [
      '0001_security.sql',
      '0002_add_telephone_number.sql',
      '0003_fix_skills_column.sql',
      '0004_convert_skills_to_jsonb.sql'
    ];

    for (const migration of migrations) {
      const sql = fs.readFileSync(path.join(__dirname, '../migrations', migration), 'utf8');
      await pool.query(sql);
      console.log(`Migration ${migration} completed successfully`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();