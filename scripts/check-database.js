import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dsa@localhost:5432/graphicgenie'
});

async function checkDatabase() {
  try {
    console.log('Checking database structure...');
    
    // Check users table structure
    const usersResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\nUsers table structure:');
    usersResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if professional_profiles table exists
    const profResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'professional_profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\nProfessional profiles table structure:');
    if (profResult.rows.length > 0) {
      profResult.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('  Table does not exist');
    }
    
    // Check sample user data
    const sampleResult = await pool.query('SELECT id, email, first_name FROM users LIMIT 3');
    console.log('\nSample users:');
    sampleResult.rows.forEach(row => {
      console.log(`  ID: ${row.id} (type: ${typeof row.id}), Email: ${row.email}, Name: ${row.first_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();







