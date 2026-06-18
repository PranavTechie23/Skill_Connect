import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:root123@localhost:5432/skillconnect');

async function migrate() {
  const file = fs.readFileSync(path.join(process.cwd(), 'migrations/0018_agent_source.sql'), 'utf-8');
  await sql.unsafe(file);
  console.log('Migration 0018 applied.');
  await sql.end();
}

migrate().catch(console.error);
