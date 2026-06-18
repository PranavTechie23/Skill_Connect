const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:root123@localhost:5432/skillconnect'
});

async function run() {
  console.log("Connecting to db...");
  const result = await pool.query('SELECT COUNT(*) FROM applications');
  console.log("Total applications:", result.rows[0].count);
  process.exit(0);
}

run().catch(console.error);
