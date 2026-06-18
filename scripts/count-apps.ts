import { db } from "../server/src/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Connecting to db...");
  const result = await db.execute(sql`SELECT COUNT(*) FROM applications`);
  console.log("Total applications:", result.rows[0].count);
  process.exit(0);
}

run().catch(console.error);
