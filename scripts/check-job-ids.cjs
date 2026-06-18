const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:root123@localhost:5432/skillconnect',
});

async function run() {
  const res = await pool.query('SELECT job_id FROM applications LIMIT 5');
  console.log("Sample job_ids from applications:");
  console.log(res.rows);
  
  const jobs = await pool.query('SELECT id, title FROM jobs LIMIT 5');
  console.log("Sample jobs:");
  console.log(jobs.rows);
  
  process.exit(0);
}
run();
