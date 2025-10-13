import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:dsa@localhost:5432/graphicgenie";

async function fixSkillsColumn() {
  fixSkillsColumn();
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log("Starting migration: Converting skills column to TEXT...");
    
    await pool.query(`
      ALTER TABLE "users" ALTER COLUMN "skills" TYPE TEXT;
    `);

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}