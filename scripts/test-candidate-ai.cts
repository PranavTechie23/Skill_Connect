import { db } from "../server/src/db";
import { 
  users, 
  professionalProfiles, 
  jobs, 
  aiEvents,
  applications
} from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import aiCandidateRouter from "../server/src/routes/ai-candidate";
import { getCachedSuggestions } from "../server/src/ai/suggestions-cache";
import { storage } from "../server/src/storage";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockResponse() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
}

function findRouteHandler(path: string, method: string) {
  const layer = (aiCandidateRouter as any).stack.find(
    (s: any) => s.route?.path === path && s.route?.methods?.[method]
  );
  if (!layer) {
    throw new Error(`Could not find route handler for ${method.toUpperCase()} ${path}`);
  }
  // Stack has: 0 = requireCandidate, 1 = actual handler (if middleware is present)
  const stack = layer.route.stack;
  return stack[stack.length - 1].handle;
}

async function runTests() {
  console.log("=== STARTING PHASE 4 CANDIDATE AI EXPERIENCE VERIFICATION TESTS ===");

  const testUserId = "test-cand-" + Math.floor(Math.random() * 100000);
  const testJobId = "test-job-" + Math.floor(Math.random() * 100000);
  const testAppId = Math.floor(Math.random() * 100000);

  try {
    // -------------------------------------------------------------
    // Set up database test data
    // -------------------------------------------------------------
    console.log("Setting up temporary database test records...");
    
    // Create test user (Professional)
    await db.insert(users).values({
      id: testUserId,
      email: `${testUserId}@example.com`,
      password: "password123",
      firstName: "Alex",
      lastName: "Developer",
      userType: "Professional",
      location: "San Francisco",
      telephoneNumber: "555-0199"
    });

    // Create test professional profile
    await db.insert(professionalProfiles).values({
      id: Math.floor(Math.random() * 1000000),
      userId: testUserId,
      headline: "Senior React Engineer",
      bio: "I build high-performance React frontends with TypeScript. I love CSS and clean UI components.", // length is 90 (> 40)
      skills: ["React", "TypeScript", "HTML", "CSS"],
      experience: [{ title: "Frontend Developer", company: "WebCorp", duration: "2 years" }],
      education: [{ degree: "B.S. Computer Science", school: "State University" }]
    });

    // Create test active job
    await db.insert(jobs).values({
      id: testJobId,
      title: "Senior UI Engineer",
      description: "We are seeking a React expert with a passion for beautiful, premium UI designs.",
      requirements: "Must have 3+ years experience with React, TypeScript, and styling frameworks.",
      location: "Remote",
      jobType: "remote",
      skills: ["React", "TypeScript", "CSS"],
      isActive: true,
      status: "active"
    });

    // Create stale application (submitted 7 days ago)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await db.insert(applications).values({
      id: testAppId,
      jobId: testJobId,
      applicantId: testUserId,
      status: "applied",
      appliedAt: sevenDaysAgo,
      updatedAt: sevenDaysAgo
    });

    console.log("Test records created successfully.");

    // -------------------------------------------------------------
    // Test 1: Profile Completeness Score & Suggestions Caching
    // -------------------------------------------------------------
    console.log("\n--- Test 1: Profile Suggestions & Caching ---");
    const suggestionsHandler = findRouteHandler("/profile-suggestions", "get");
    
    const req1: any = { session: { userId: testUserId } };
    const res1 = mockResponse();

    await suggestionsHandler(req1, res1, () => {});
    console.log("Suggestions API Status Code:", res1.statusCode || 200);
    console.log("Calculated Completeness Score:", res1.body?.score);
    console.log("Generated AI Suggestions:", res1.body?.suggestions);
    console.log("Generated Career Advice:", res1.body?.careerAdvice);

    if (res1.body?.score !== 100) {
      throw new Error(`Expected profile score to be 100 since all fields are complete. Got ${res1.body?.score}`);
    }

    // Verify it is cached
    const isCached = getCachedSuggestions(testUserId);
    console.log("Suggestions saved in cache:", !!isCached);
    if (!isCached) {
      throw new Error("Suggestions were not cached.");
    }

    // Call suggestions endpoint again to verify cached response
    const res1Cached = mockResponse();
    await suggestionsHandler(req1, res1Cached, () => {});
    console.log("Cached response returned:", res1Cached.body?.fromCache === true);
    if (res1Cached.body?.fromCache !== true) {
      throw new Error("Expected suggestions response to be served from cache.");
    }

    // Invalidate cache by updating user location
    console.log("Updating user location to trigger cache invalidation...");
    await storage.updateUser(testUserId, { location: "New York" });
    // Verify cache is evicted
    const isCachedAfterUpdate = getCachedSuggestions(testUserId);
    console.log("Suggestions cache cleared after update:", !isCachedAfterUpdate);
    if (isCachedAfterUpdate) {
      throw new Error("Expected cache to be cleared after user write operation.");
    }

    console.log("✅ Test 1 Passed: Score calculations, caching, and eviction triggers successfully verified.");

    // -------------------------------------------------------------
    // Test 2: Cover Letter Tailoring & Authorization Scope
    // -------------------------------------------------------------
    console.log("\n--- Test 2: Cover Letter Generator & Authorization Scope ---");
    const coverLetterHandler = findRouteHandler("/cover-letter", "post");

    // Test with valid active jobId
    const req2Valid: any = {
      session: { userId: testUserId },
      body: { jobId: testJobId, customInstructions: "Focus on web accessibility and micro-interactions." }
    };
    const res2Valid = mockResponse();
    await coverLetterHandler(req2Valid, res2Valid, () => {});
    console.log("Cover Letter Status Code (Valid Job):", res2Valid.statusCode || 200);
    console.log("Generated Cover Letter exists:", !!res2Valid.body?.coverLetter);
    if (!res2Valid.body?.coverLetter) {
      throw new Error("Failed to generate cover letter.");
    }

    // Test with invalid jobId
    const req2Invalid: any = {
      session: { userId: testUserId },
      body: { jobId: "non-existent-job-id" }
    };
    const res2Invalid = mockResponse();
    await coverLetterHandler(req2Invalid, res2Invalid, () => {});
    console.log("Cover Letter Status Code (Invalid Job):", res2Invalid.statusCode);
    if (res2Invalid.statusCode !== 404) {
      throw new Error(`Expected 404 for invalid job ID. Got ${res2Invalid.statusCode}`);
    }

    console.log("✅ Test 2 Passed: Cover letter generated and job scope checks verified.");

    // -------------------------------------------------------------
    // Test 3: Interview Prep Pack Generation
    // -------------------------------------------------------------
    console.log("\n--- Test 3: Interview Prep Generator ---");
    const prepHandler = findRouteHandler("/interview-prep", "post");

    const req3: any = {
      session: { userId: testUserId },
      body: { jobId: testJobId }
    };
    const res3 = mockResponse();
    await prepHandler(req3, res3, () => {});
    console.log("Interview Prep Status Code:", res3.statusCode || 200);
    console.log("Questions generated:", res3.body?.questions?.length);
    if (!res3.body?.questions || res3.body.questions.length === 0) {
      throw new Error("No questions returned by prep pack generator.");
    }
    console.log("Sample prep question:", res3.body.questions[0].question);
    console.log("✅ Test 3 Passed: Interview prep questions successfully generated.");

    // -------------------------------------------------------------
    // Test 4: Next Steps Follow-Up Reminders
    // -------------------------------------------------------------
    console.log("\n--- Test 4: Next Steps Follow-Up Recommendations ---");
    const nextStepsHandler = findRouteHandler("/next-steps", "get");

    const req4: any = { session: { userId: testUserId } };
    const res4 = mockResponse();
    await nextStepsHandler(req4, res4, () => {});
    console.log("Next Steps Status Code:", res4.statusCode || 200);
    console.log("Stale applications recommendations count:", res4.body?.recommendations?.length);

    const recs = res4.body?.recommendations || [];
    if (recs.length === 0) {
      throw new Error("Expected at least 1 stale application recommendation.");
    }
    console.log("Recommendation text:", recs[0].recommendationText);
    console.log("Draft follow-up template generated:", !!recs[0].draftMessage);
    if (!recs[0].draftMessage.includes("Senior UI Engineer")) {
      throw new Error("Draft message does not reference the correct job title.");
    }

    console.log("✅ Test 4 Passed: Next steps stale application recommendations verified.");

    // -------------------------------------------------------------
    // Test 5: Coach Chat History & Rate Limits
    // -------------------------------------------------------------
    console.log("\n--- Test 5: Coach Chat History & 429 Rate Limits ---");
    const chatHandler = findRouteHandler("/coach-chat", "post");

    const req5: any = {
      session: { userId: testUserId },
      body: {
        messages: [
          { role: "user", text: "Hello coach, I need resume tips." }
        ]
      }
    };
    const res5 = mockResponse();
    await chatHandler(req5, res5, () => {});
    console.log("Coach Chat Status Code:", res5.statusCode || 200);
    console.log("Coach Reply exists:", !!res5.body?.reply);

    // Test 429 rate limit enforcement: seed 30 successful chat events in ai_events
    console.log("Seeding 30 successful chat events into ai_events...");
    const eventValues = Array.from({ length: 30 }).map(() => ({
      userId: testUserId,
      feature: "coach_chat",
      provider: "gemini",
      model: "gemini-2.5-flash",
      status: "success",
      latencyMs: 120
    }));
    await db.insert(aiEvents).values(eventValues);

    // Try chat again — should fail with 429
    const res5Blocked = mockResponse();
    await chatHandler(req5, res5Blocked, () => {});
    console.log("Blocked response Status Code (31st message):", res5Blocked.statusCode);
    if (res5Blocked.statusCode !== 429) {
      throw new Error(`Expected 429 rate limit block on 31st message. Got ${res5Blocked.statusCode}`);
    }

    console.log("✅ Test 5 Passed: Coach chat history constraints and 429 rate limiting verified.");

    // -------------------------------------------------------------
    // Clean up temporary test data
    // -------------------------------------------------------------
    console.log("\nCleaning up database test records...");
    await db.delete(aiEvents).where(eq(aiEvents.userId, testUserId));
    await db.delete(applications).where(eq(applications.id, testAppId));
    await db.delete(jobs).where(eq(jobs.id, testJobId));
    await db.delete(professionalProfiles).where(eq(professionalProfiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    console.log("Cleanup completed successfully.");

    console.log("\n=== ALL PHASE 4 CANDIDATE AI EXPERIENCE TESTS PASSED! ===");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ TESTS FAILED:", error);
    // Cleanup on failure
    await db.delete(aiEvents).where(eq(aiEvents.userId, testUserId)).catch(() => {});
    await db.delete(applications).where(eq(applications.id, testAppId)).catch(() => {});
    await db.delete(jobs).where(eq(jobs.id, testJobId)).catch(() => {});
    await db.delete(professionalProfiles).where(eq(professionalProfiles.userId, testUserId)).catch(() => {});
    await db.delete(users).where(eq(users.id, testUserId)).catch(() => {});
    process.exit(1);
  }
}

runTests();
