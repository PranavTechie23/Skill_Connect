import * as dotenv from "dotenv";
dotenv.config();

console.log("DB.ts — DATABASE_URL =", process.env.DATABASE_URL);

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const enableSsl = (process.env.PGSSLMODE === 'require' || process.env.DATABASE_SSL === 'true');
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: enableSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });