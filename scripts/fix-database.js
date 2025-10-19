import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dsa@localhost:5432/graphicgenie'
});

async function fixDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'add-professional-profiles-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('Executing SQL...');
    await pool.query(sql);
    
    console.log('✅ Professional profiles table created successfully!');
    
    // Check if table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'professional_profiles'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table verification successful!');
    } else {
      console.log('❌ Table verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixDatabase();
