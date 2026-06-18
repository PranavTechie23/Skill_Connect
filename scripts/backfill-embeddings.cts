import { db } from "../server/src/db";
import { sql, eq } from "drizzle-orm";
import { jobs, professionalProfiles } from "../shared/schema";
import {
  generateTextEmbedding,
  buildJobEmbeddingText,
  buildProfileEmbeddingText,
} from "../server/src/ai/embeddings";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function backfill() {
  console.log("Starting backfill script for embeddings...");

  // Fetch jobs with no embedding
  const jobsRes = await db.execute(sql`
    SELECT id, title, description, requirements, skills 
    FROM jobs 
    WHERE embedding IS NULL
  `);
  console.log(`Found ${jobsRes.rows.length} jobs to backfill.`);

  let jobCount = 0;
  for (const row of jobsRes.rows as any[]) {
    jobCount++;
    console.log(`[${jobCount}/${jobsRes.rows.length}] Backfilling job: ${row.title} (ID: ${row.id})`);
    
    const text = buildJobEmbeddingText({
      title: row.title,
      description: row.description ?? "",
      requirements: row.requirements,
      skills: Array.isArray(row.skills) ? row.skills : [],
    });

    try {
      const embedding = await generateTextEmbedding(text);
      if (embedding && embedding.length > 0) {
        await db.update(jobs)
          .set({ embedding })
          .where(eq(jobs.id, row.id));
      }
      // Delay to respect rate limits
      await delay(1000);
    } catch (err) {
      console.error(`Failed to backfill job ${row.id}:`, err);
    }
  }

  // Fetch professional profiles with no embedding
  const profilesRes = await db.execute(sql`
    SELECT id, headline, bio, skills 
    FROM professional_profiles 
    WHERE embedding IS NULL
  `);
  console.log(`Found ${profilesRes.rows.length} profiles to backfill.`);

  let profileCount = 0;
  for (const row of profilesRes.rows as any[]) {
    profileCount++;
    console.log(`[${profileCount}/${profilesRes.rows.length}] Backfilling profile (ID: ${row.id})`);

    const text = buildProfileEmbeddingText({
      headline: row.headline,
      bio: row.bio,
      skills: Array.isArray(row.skills) ? row.skills : [],
    });

    try {
      const embedding = await generateTextEmbedding(text);
      if (embedding && embedding.length > 0) {
        await db.update(professionalProfiles)
          .set({ embedding })
          .where(eq(professionalProfiles.id, row.id));
      }
      // Delay to respect rate limits
      await delay(1000);
    } catch (err) {
      console.error(`Failed to backfill profile ${row.id}:`, err);
    }
  }

  console.log("Backfill completed successfully.");
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
