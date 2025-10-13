import { db } from "../server/src/db";
import { sql } from "drizzle-orm";

async function fixTelephoneNumber() {
  try {
    await db.execute(sql`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE users ADD COLUMN telephone_number TEXT;
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;
      END $$;
    `);
    console.log("✅ telephone_number column added successfully");
  } catch (error) {
    console.error("❌ Error adding telephone_number column:", error);
  }
}

fixTelephoneNumber().then(() => process.exit(0)).catch(() => process.exit(1));