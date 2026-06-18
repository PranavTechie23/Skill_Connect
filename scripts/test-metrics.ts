import { config } from "dotenv";
import * as storagePkg from "../server/src/storage.js";

config({ path: "./server/.env" });

async function run() {
  const cjsModule = (storagePkg as any).default;
  console.log("CJS Module keys:", Object.keys(cjsModule));
  const storage = cjsModule.storage;
  console.log("storage exists:", !!storage);
  console.log("storage checkConnection exists:", typeof storage.checkConnection);
  
  const { jobs } = await storage.getJobs({ includeInactive: true });
  const allApplications = await storage.getApplicationsByJob("all");
  
  console.log("Total jobs:", jobs.length);
  console.log("Total applications:", allApplications.length);
  
  const countsMap = new Map<string, number>();
  for (const app of allApplications) {
    const jobId = app.jobId || (app as any).job_id;
    if (jobId) {
      const idStr = String(jobId);
      countsMap.set(idStr, (countsMap.get(idStr) || 0) + 1);
    }
  }
  
  console.log("countsMap size:", countsMap.size);
  let mappedWithCount = 0;
  for (const job of jobs) {
    const count = countsMap.get(String(job.id)) || 0;
    if (count > 0) {
      mappedWithCount++;
    }
  }
  console.log("Jobs with application count > 0:", mappedWithCount);
}

run().catch(console.error);
