// @ts-nocheck
import { db, pool } from "../src/db";
import { jobs, users, applications } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function seedApplications() {
  try {
    console.log("Fetching jobs and users...");
    const allJobs = await db.select().from(jobs);
    const allUsers = await db.select().from(users).where(eq(users.userType, "Professional"));

    if (allJobs.length === 0) {
      console.log("No jobs found to apply to.");
      return;
    }
    
    if (allUsers.length === 0) {
      console.log("No professional users found to create applications for.");
      // If no professionals exist, let's grab any user
      const anyUsers = await db.select().from(users);
      if (anyUsers.length === 0) {
        console.log("No users found at all.");
        return;
      }
      allUsers.push(...anyUsers);
    }

    console.log(`Found ${allJobs.length} jobs and ${allUsers.length} users.`);
    
    let inserted = 0;
    
    for (const job of allJobs) {
      // Pick random number of applications for this job (e.g., 1 to 5)
      const numApps = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < numApps; i++) {
        const userIndex = Math.floor(Math.random() * allUsers.length);
        const applicant = allUsers[userIndex];
        
        // Check if application already exists
        const existing = await db.select().from(applications).where(
          eq(applications.jobId, job.id)
        );
        const hasApplied = existing.some(app => app.applicantId === applicant.id);
        
        if (!hasApplied) {
          await db.insert(applications).values({
            jobId: job.id,
            applicantId: applicant.id,
            status: ["applied", "reviewing", "interviewing", "rejected"][Math.floor(Math.random() * 4)],
            coverLetter: "I am very interested in this position and believe my skills are a great match.",
          });
          inserted++;
        }
      }
    }
    
    console.log(`Successfully seeded ${inserted} applications.`);
  } catch (error) {
    console.error("Error seeding applications:", error);
  } finally {
    await pool.end();
  }
}

seedApplications();
