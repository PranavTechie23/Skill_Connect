import { db } from "../server/src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Applying index user_created_idx...");
  try {
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "user_created_idx" ON "ai_events" ("user_id", "created_at")`);
    console.log("✅ Compound index user_created_idx successfully applied to ai_events table.");
  } catch (error) {
    console.error("❌ Failed to apply index:", error);
  }
  process.exit(0);
}

main();
