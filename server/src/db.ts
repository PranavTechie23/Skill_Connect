
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../shared/schema";
import * as relations from "./relations";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:dsa@localhost:5432/graphicgenie";
console.log("Using database URL:", DATABASE_URL);

const pool = new Pool({
  connectionString: DATABASE_URL
});

export const db = drizzle(pool, { schema: { ...schema, ...relations } });
export default db;
