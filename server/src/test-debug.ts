import { storage } from "./storage";

async function run() {
  console.log("Fetching jobs...");
  const { jobs } = await storage.getJobs({ includeInactive: true });
  console.log("Fetched jobs:", jobs.length);
  
  console.log("Fetching applications...");
  const allApplications = await storage.getApplicationsByJob("all");
  console.log("Fetched applications:", allApplications.length);
  
  process.exit(0);
}

run().catch(console.error);
