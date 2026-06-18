const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:root123@localhost:5432/skillconnect'
});

async function run() {
  console.log("Connecting to db...");
  const result = await pool.query('SELECT * FROM applications');
  const allApplications = result.rows;
  console.log(`Fetched ${allApplications.length} applications`);
  
  const countsMap = new Map();
  for (const app of allApplications) {
    const jobId = app.jobId || app.job_id;
    if (jobId) {
      const idStr = String(jobId);
      countsMap.set(idStr, (countsMap.get(idStr) || 0) + 1);
    }
  }
  console.log(`Counts map size: ${countsMap.size}`);
  
  process.exit(0);
}

run().catch(console.error);
