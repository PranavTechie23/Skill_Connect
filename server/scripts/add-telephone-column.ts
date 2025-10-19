import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function addTelephoneNumberColumn() {
  try {
    // Add the column if it doesn't exist
    await db.execute(sql.raw(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE users ADD COLUMN telephone_number TEXT;
          RAISE NOTICE 'Column telephone_number added successfully';
        EXCEPTION 
          WHEN duplicate_column THEN 
            RAISE NOTICE 'Column telephone_number already exists';
        END;
      END $$;
    `));
    
    // Verify the column exists
    const result = await db.execute(sql.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'telephone_number';
    `));
    
    console.log('Column check result:', result.rows);
    console.log('Database schema update completed');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    process.exit();
  }
}

addTelephoneNumberColumn();