import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:root123@localhost:5432/skillconnect');

async function check() {
  try {
    const res = await sql`
      insert into "audit_logs" ("admin_id", "action", "target_type", "target_id", "admin_reason", "ai_risk_level", "ai_suggested", "ai_reasoning", "ai_followed") 
      values ('admin-123', 'rejected', 'job', 'test-job-999', 'Clear spam', 'high', 'reject', 'spam text', true) 
      returning *`;
    console.log(res);
  } catch (err) {
    console.error("PG ERROR:", err);
  }
  await sql.end();
}
check();
