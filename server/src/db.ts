import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres"; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/skillconnect"
});

export const db = drizzle(pool);
export default db;