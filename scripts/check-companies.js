import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dsa@localhost:5432/graphicgenie'
});

async function checkCompanies() {
  try {
    console.log('Checking companies table structure...');
    
    // Check companies table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\nCompanies table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check sample company data
    const sampleResult = await pool.query('SELECT id, name, owner_id FROM companies LIMIT 3');
    console.log('\nSample companies:');
    sampleResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Owner ID: ${row.owner_id} (type: ${typeof row.owner_id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCompanies();
















