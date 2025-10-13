import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:dsa@localhost:5432/graphicgenie";

async function testConnection() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful!');
    console.log('Current timestamp:', result.rows[0].now);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();