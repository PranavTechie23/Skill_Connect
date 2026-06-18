import { db } from "../server/src/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { checkHallucination, checkBias } from "../server/src/ai/evaluation";
import { validateCandidateScreening } from "../server/src/ai/guardrails";

async function run() {
  console.log("=== Testing Responsible AI ===");

  // 1. Hallucination Test
  console.log("\n[1] Testing Hallucination Guardrail...");
  const fakeResume = "Candidate has 5 years of React experience and 2 years of Node.js.";
  const hallucinatedSummary = "The candidate is an expert in React, Node.js, and Kubernetes, having led a team of 50 developers.";
  const accurateSummary = "The candidate has React and Node.js experience.";

  const halluRes1 = await checkHallucination(hallucinatedSummary, fakeResume);
  console.log("Hallucination check (bad):", halluRes1);

  const halluRes2 = await checkHallucination(accurateSummary, fakeResume);
  console.log("Hallucination check (good):", halluRes2);

  // 2. Bias Test
  console.log("\n[2] Testing Bias Guardrail...");
  const biasedText = "We are looking for a young, energetic female developer to join our team.";
  const neutralText = "We are looking for an experienced developer to join our team.";

  const biasRes1 = await checkBias(biasedText, "job_description");
  console.log("Bias check (bad):", biasRes1);

  const biasRes2 = await checkBias(neutralText, "job_description");
  console.log("Bias check (good):", biasRes2);

  // 3. Combined Guardrails Test (Candidate Screening)
  console.log("\n[3] Testing Combined Candidate Screening Guardrails...");
  const res = await validateCandidateScreening(hallucinatedSummary, fakeResume);
  if (!res.isValid) {
    console.log("Combined screening (bad) correctly blocked:", res.error);
  } else {
    console.log("Combined screening (bad): FAILED to catch hallucination");
  }

  // 4. Privacy Settings Update Test
  console.log("\n[4] Testing Privacy Settings persistence...");
  try {
    const userList = await db.select().from(users).limit(1);
    if (userList.length > 0) {
      const testUser = userList[0];
      console.log(`Initial privacy settings for ${testUser.id}:`, testUser.privacySettings);

      // Opt out of AI
      await db.update(users)
        .set({ privacySettings: { aiOptOut: true } })
        .where(eq(users.id, testUser.id));

      const updatedUser = await db.select().from(users).where(eq(users.id, testUser.id));
      console.log(`Updated privacy settings:`, updatedUser[0].privacySettings);

      // Revert back
      await db.update(users)
        .set({ privacySettings: { aiOptOut: false } })
        .where(eq(users.id, testUser.id));

    } else {
      console.log("No users found to test privacy settings update.");
    }
  } catch (err) {
    console.error("Privacy settings test failed:", err);
  }

  console.log("\n=== Test Complete ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
