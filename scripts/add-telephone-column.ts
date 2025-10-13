import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:dsa@localhost:5432/graphicgenie";

async function addTelephoneColumn() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log("Starting migration: Adding telephone_number column...");
    
    await pool.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telephone_number" TEXT;
    `);
    
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addTelephoneColumn();