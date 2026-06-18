import { db } from "../server/src/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Connecting to db using drizzle...");
  try {
    const result = await db.execute(sql`SELECT * FROM applications`);
    console.log("Returned rows:", result.rows.length);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run().catch(console.error);
