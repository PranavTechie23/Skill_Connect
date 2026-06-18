import { db } from "../server/src/db";
import { users, agentRuns } from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { executeAgentSteps } from "../server/src/ai/agent-executor";

async function runWeeklyCron() {
  console.log("[Weekly Cron] Fetching active users...");
  try {
    const activeUsers = await db.select().from(users).where(eq(users.accountStatus, "active")).execute();
    console.log(`[Weekly Cron] Found ${activeUsers.length} active users.`);

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    for (const user of activeUsers) {
      const role = String(user.userType || (user as any).user_type || "").toLowerCase();
      let agentType = "";
      let goal = "";

      if (role === "professional" || role === "job_seeker" || role === "job-seeker") {
        agentType = "candidate_career";
        goal = "Weekly summary: Analyze my profile progress, search for relevant jobs matching my background, and draft an updated cover letter for the best match.";
      } else if (role === "employer" || role === "recruiter") {
        agentType = "hiring_pipeline";
        goal = "Weekly summary: Fetch active job postings, scan candidate applications, identify top candidates, and draft interview outreach messages.";
      } else {
        // Skip admins or other roles
        continue;
      }

      // Check idempotency: has a cron run for this user/type been run in last 7 days?
      const [existing] = await db
        .select()
        .from(agentRuns)
        .where(
          and(
            eq(agentRuns.userId, user.id),
            eq(agentRuns.agentType, agentType),
            eq(agentRuns.source, "cron"),
            sql`${agentRuns.createdAt} > ${cutoff}`,
            sql`${agentRuns.goal} LIKE '%Weekly summary%'`
          )
        )
        .execute();

      if (existing) {
        console.log(`[Weekly Cron] Agent run of type "${agentType}" already created within last 7 days for user "${user.firstName} ${user.lastName}" (${user.id}). Skipping.`);
        continue;
      }

      console.log(`[Weekly Cron] Dispatching weekly insights run for user "${user.firstName} ${user.lastName}" (${user.id}) of type "${agentType}"...`);

      const [run] = await db
        .insert(agentRuns)
        .values({
          userId: user.id,
          agentType,
          source: "cron",
          goal,
          status: "running"
        })
        .returning()
        .execute();

      // Run execution steps synchronously for the cron script context
      await executeAgentSteps(run.id);
      console.log(`[Weekly Cron] Weekly insights run ${run.id} finished step sequence or paused.`);
    }

    console.log("[Weekly Cron] Cron execution completed successfully.");
  } catch (error) {
    console.error("[Weekly Cron] Failure running weekly insights:", error);
  } finally {
    // End the db connection pool if running standalone
    setTimeout(() => process.exit(0), 1000);
  }
}

runWeeklyCron().catch(console.error);
