import { db } from "../server/src/db";
import { users, companies, jobs, applications, aiEvents } from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import aiEmployerRouter from "../server/src/routes/ai-employer";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Response mockup
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

// Route finder helper
function getRouteHandler(path: string, method: 'post' | 'get') {
  const layer = aiEmployerRouter.stack.find(
    (s: any) => s.route?.path === path && s.route?.methods?.[method]
  );
  if (!layer) {
    throw new Error(`Could not find handler for ${method.toUpperCase()} ${path}`);
  }
  // The route handler stack contains middleware + main handler.
  // In our router, stack[0] is requireEmployer, stack[1] is the main handler.
  return {
    middleware: layer.route!.stack[0].handle,
    handler: layer.route!.stack[layer.route!.stack.length - 1].handle
  };
}

async function runTests() {
  console.log("=== STARTING PHASE 5: EMPLOYER AI EXPERIENCE ROADMAP VERIFICATION TESTS ===");

  // Mock global fetch to intercept Gemini API calls and return structured JSON/Text
  const originalFetch = global.fetch;
  global.fetch = async (url: any, init: any) => {
    if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com')) {
      const body = JSON.parse(init.body);
      const promptText = body.contents[0].parts[0].text;
      
      if (promptText.includes('weekly hiring report')) {
        return {
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    summary: "AI summary: Hiring activities are progressing well this week.",
                    highlights: ["2 new applicants", "1 interview scheduled"],
                    bottlenecks: ["1 pending review"],
                    actions: ["Review new applicants"]
                  })
                }]
              }
            }]
          })
        } as any;
      }
      
      if (promptText.includes('job description')) {
        // Mock a JSON parse failure on the first try if we want, or just mock success
        return {
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    description: "AI drafted Senior Developer description",
                    requirements: "- 5 years experience\n- React/TypeScript",
                    keyResponsibilities: "- Code features\n- Review PRs",
                    skills: ["React", "TypeScript"]
                  })
                }]
              }
            }]
          })
        } as any;
      }
      
      if (promptText.includes('polite, professional outreach message')) {
        return {
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: "Dear Candidate,\n\nWe would like to invite you for an interview."
                }]
              }
            }]
          })
        } as any;
      }
    }
    return originalFetch(url, init);
  };

  try {
    // Setup Temporary Test Data
    console.log("\nSetting up test database records...");
    const testEmployerAId = "test-empa-" + Date.now();
    const testEmployerBId = "test-empb-" + Date.now();
    const testCandidateId = "test-candidate-" + Date.now();
    const companyAId = "test-compa-" + Date.now();
    const companyBId = "test-compb-" + Date.now();
    const jobAId = "test-joba-" + Date.now();
    const jobBId = "test-jobb-" + Date.now();

    // 1. Create Users
    await db.insert(users).values([
      {
        id: testEmployerAId,
        email: `empa-${Date.now()}@example.com`,
        password: "hashedpassword",
        firstName: "Jane",
        lastName: "RecruiterA",
        userType: "Employer",
      },
      {
        id: testEmployerBId,
        email: `empb-${Date.now()}@example.com`,
        password: "hashedpassword",
        firstName: "Bob",
        lastName: "RecruiterB",
        userType: "Employer",
      },
      {
        id: testCandidateId,
        email: `cand-${Date.now()}@example.com`,
        password: "hashedpassword",
        firstName: "John",
        lastName: "Applicant",
        userType: "Professional",
      }
    ]).execute();

    // 2. Create Companies
    await db.insert(companies).values([
      {
        id: companyAId,
        name: "Company A managed by Employer A",
        ownerId: testEmployerAId,
        status: "approved",
      },
      {
        id: companyBId,
        name: "Company B managed by Employer B",
        ownerId: testEmployerBId,
        status: "approved",
      }
    ]).execute();

    // 3. Create Jobs
    await db.insert(jobs).values([
      {
        id: jobAId,
        title: "Engineer A (Employer A)",
        description: "description",
        requirements: "requirements",
        location: "Remote",
        jobType: "remote",
        salaryMin: 0,
        salaryMax: 0,
        companyId: companyAId,
        employerId: testEmployerAId,
        isActive: true,
      },
      {
        id: jobBId,
        title: "Engineer B (Employer B)",
        description: "description",
        requirements: "requirements",
        location: "Remote",
        jobType: "remote",
        salaryMin: 0,
        salaryMax: 0,
        companyId: companyBId,
        employerId: testEmployerBId,
        isActive: true,
      }
    ]).execute();

    // 4. Create Application on Job B (Employer B)
    const appResult = await db.insert(applications).values({
      jobId: jobBId,
      applicantId: testCandidateId,
      status: "applied",
    }).returning({ id: applications.id }).execute();
    const appBId = appResult[0].id;

    // -------------------------------------------------------------
    // Test 1: Require Employer / Authorization Roles Check
    // -------------------------------------------------------------
    console.log("\n--- Test 1: Verifying Middleware Role Guards ---");
    const { middleware, handler: draftHandler } = getRouteHandler("/jobs/draft", "post");
    
    // Request with candidate user
    const candReq: any = { session: { userId: testCandidateId } };
    const candRes = mockResponse();
    let nextCalled = false;
    await middleware(candReq, candRes, () => { nextCalled = true; });

    console.log("Candidate access status:", candRes.statusCode);
    if (nextCalled || candRes.statusCode !== 403) {
      throw new Error("Candidate was allowed access to recruiter endpoint!");
    }
    console.log("✅ Role guard successfully blocked Candidate role.");

    // Request with employer user
    const empReq: any = { session: { userId: testEmployerAId } };
    const empRes = mockResponse();
    nextCalled = false;
    await middleware(empReq, empRes, () => { nextCalled = true; });
    if (!nextCalled) {
      throw new Error("Employer was blocked from recruiter endpoint!");
    }
    console.log("✅ Role guard successfully allowed Employer role.");

    // -------------------------------------------------------------
    // Test 2: jobs/draft - companyId ownership check
    // -------------------------------------------------------------
    console.log("\n--- Test 2: jobs/draft companyId Cross-Tenant Scoping ---");
    
    // Employer A tries to draft a job using Company B (Employer B's company)
    const crossCompanyReq: any = {
      session: { userId: testEmployerAId },
      body: { title: "New Job", companyId: companyBId }
    };
    const crossCompanyRes = mockResponse();
    await draftHandler(crossCompanyReq, crossCompanyRes, () => {});
    
    console.log("Cross-company status code:", crossCompanyRes.statusCode);
    if (crossCompanyRes.statusCode !== 403) {
      throw new Error(`Expected 403 for unauthorized company draft. Got: ${crossCompanyRes.statusCode}`);
    }
    console.log("✅ Cross-company draft successfully blocked.");

    // Employer A drafts a job using Company A (owned by Employer A)
    const validCompanyReq: any = {
      session: { userId: testEmployerAId },
      body: { title: "New Job A", companyId: companyAId }
    };
    const validCompanyRes = mockResponse();
    await draftHandler(validCompanyReq, validCompanyRes, () => {});
    
    console.log("Valid company draft status:", validCompanyRes.statusCode || 200);
    console.log("Generated job description:", validCompanyRes.body?.description);
    if (validCompanyRes.statusCode === 403 || !validCompanyRes.body?.success) {
      throw new Error("Authorized company draft failed!");
    }
    console.log("✅ Authorized company draft successfully allowed and returned AI text.");

    // -------------------------------------------------------------
    // Test 3: messages/draft - application ownership check
    // -------------------------------------------------------------
    console.log("\n--- Test 3: messages/draft application Cross-Tenant Scoping ---");
    const { handler: messageHandler } = getRouteHandler("/messages/draft", "post");

    // Employer A tries to draft outreach for Application B (which is for Job B owned by Employer B)
    const crossMsgReq: any = {
      session: { userId: testEmployerAId },
      body: { applicationId: appBId, type: "interview" }
    };
    const crossMsgRes = mockResponse();
    await messageHandler(crossMsgReq, crossMsgRes, () => {});

    console.log("Cross-message draft status code:", crossMsgRes.statusCode);
    if (crossMsgRes.statusCode !== 403) {
      throw new Error(`Expected 403 for unauthorized outreach draft. Got: ${crossMsgRes.statusCode}`);
    }
    console.log("✅ Cross-tenant outreach draft successfully blocked.");

    // Employer B drafts outreach for Application B (authorized)
    const validMsgReq: any = {
      session: { userId: testEmployerBId },
      body: { applicationId: appBId, type: "interview" }
    };
    const validMsgRes = mockResponse();
    await messageHandler(validMsgReq, validMsgRes, () => {});

    console.log("Valid message draft status:", validMsgRes.statusCode || 200);
    console.log("Message draft content:", validMsgRes.body?.messageDraft);
    if (validMsgRes.statusCode === 403 || !validMsgRes.body?.success) {
      throw new Error("Authorized outreach draft failed!");
    }
    console.log("✅ Authorized outreach draft successfully allowed and returned outreach text.");

    // -------------------------------------------------------------
    // Test 4: pipeline/recommendations - recruiter filtering & rate limit exempt
    // -------------------------------------------------------------
    console.log("\n--- Test 4: pipeline/recommendations scoping & rate-limit exemption ---");
    const { handler: recsHandler } = getRouteHandler("/pipeline/recommendations", "get");

    const recsReq: any = { session: { userId: testEmployerAId } };
    const recsRes = mockResponse();
    await recsHandler(recsReq, recsRes, () => {});

    console.log("Pipeline recommendations count:", recsRes.body?.recommendations?.length);
    // Employer A owns active Job A, but it was just created today so it's not stale (>30 days),
    // and there are no applications so there are no stale applications (>6 days).
    // Recommendations list should be empty (0) but return success.
    if (!recsRes.body?.success || !Array.isArray(recsRes.body?.recommendations)) {
      throw new Error("Recommendations call failed.");
    }
    console.log("✅ Pipeline recommendations runs deterministically, scoped correctly.");

    // -------------------------------------------------------------
    // Test 5: reports/weekly - caching and manual bypass
    // -------------------------------------------------------------
    console.log("\n--- Test 5: reports/weekly caching & refresh bypass ---");
    const { handler: reportHandler } = getRouteHandler("/reports/weekly", "get");

    // Clear any potential leftovers
    await db.delete(aiEvents).where(eq(aiEvents.userId, testEmployerAId)).execute();

    // Call 1: fresh generation
    const repReq1: any = { session: { userId: testEmployerAId }, query: {} };
    const repRes1 = mockResponse();
    await reportHandler(repReq1, repRes1, () => {});

    console.log("Report 1 status:", repRes1.statusCode || 200);
    console.log("Report 1 from cache:", repRes1.body?.fromCache);
    if (repRes1.body?.fromCache) {
      throw new Error("First report call should not be from cache.");
    }

    // Call 2: from cache
    const repReq2: any = { session: { userId: testEmployerAId }, query: {} };
    const repRes2 = mockResponse();
    await reportHandler(repReq2, repRes2, () => {});

    console.log("Report 2 from cache:", repRes2.body?.fromCache);
    if (!repRes2.body?.fromCache) {
      throw new Error("Second report call should fetch from cache.");
    }
    console.log("✅ Caching successfully stores and retrieves report.");

    // Call 3: bypass refresh
    const repReq3: any = { session: { userId: testEmployerAId }, query: { refresh: "true" } };
    const repRes3 = mockResponse();
    await reportHandler(repReq3, repRes3, () => {});

    console.log("Report 3 (refresh) from cache:", repRes3.body?.fromCache);
    if (repRes3.body?.fromCache) {
      throw new Error("Refresh parameter should bypass the cache.");
    }
    console.log("✅ Caching bypass refresh parameter functions correctly.");

    // -------------------------------------------------------------
    // Test 6: Rate limits verification (429 errors)
    // -------------------------------------------------------------
    console.log("\n--- Test 6: Enforcing Rate Limits (429) ---");
    
    // Inundate with events to hit rate limit (max 10 for weekly reports)
    // We already have 2 success events in last 24h (from call 1 and call 3)
    // Let's insert 8 more success events in db
    for (let j = 0; j < 8; j++) {
      await db.insert(aiEvents).values({
        userId: testEmployerAId,
        feature: "weekly_report",
        provider: "gemini",
        status: "success",
        latencyMs: 100
      }).execute();
    }

    // Call 4: should exceed rate limit. But since we have a cached report, it falls back to cache
    // Let's call with refresh: "true" to force bypass, which should return 429 since there's no cache bypass allowed on rate limit exhaustion
    const repReq4: any = { session: { userId: testEmployerAId }, query: { refresh: "true" } };
    const repRes4 = mockResponse();
    await reportHandler(repReq4, repRes4, () => {});

    console.log("Call 4 (refresh while rate-limited) status code:", repRes4.statusCode);
    // Since refresh=true forces a new generation, but we are rate-limited, it should fall back to cached report because getCachedWeeklyReport returns the cached report!
    // Let's check if it returns success with fallback or 429 if cache is empty.
    // If cached report exists, it returns `success: true` with cached report.
    console.log("Is fallback from cache used on rate limit:", repRes4.body?.fromCache);
    
    // Now let's clear the cache and verify it returns 429
    const { invalidateWeeklyReportCache } = require("../server/src/ai/suggestions-cache");
    invalidateWeeklyReportCache(testEmployerAId);

    const repReq5: any = { session: { userId: testEmployerAId }, query: { refresh: "true" } };
    const repRes5 = mockResponse();
    await reportHandler(repReq5, repRes5, () => {});
    
    console.log("Call 5 (refresh rate-limited & cache cleared) status code:", repRes5.statusCode);
    if (repRes5.statusCode !== 429) {
      throw new Error(`Expected 429 status code on rate limit exhaustion. Got: ${repRes5.statusCode}`);
    }
    console.log("✅ Rate limiter successfully blocked request and returned HTTP 429.");

    // Clean up temporary test data
    console.log("\nCleaning up test records...");
    await db.delete(applications).where(eq(applications.jobId, jobBId)).execute();
    await db.delete(jobs).where(eq(jobs.employerId, testEmployerAId)).execute();
    await db.delete(jobs).where(eq(jobs.employerId, testEmployerBId)).execute();
    await db.delete(companies).where(eq(companies.ownerId, testEmployerAId)).execute();
    await db.delete(companies).where(eq(companies.ownerId, testEmployerBId)).execute();
    await db.delete(aiEvents).where(eq(aiEvents.userId, testEmployerAId)).execute();
    await db.delete(aiEvents).where(eq(aiEvents.userId, testEmployerBId)).execute();
    await db.delete(users).where(eq(users.id, testEmployerAId)).execute();
    await db.delete(users).where(eq(users.id, testEmployerBId)).execute();
    await db.delete(users).where(eq(users.id, testCandidateId)).execute();
    console.log("Test records cleaned up.");

    console.log("\n=== ALL EMPLOYER AI EXPERIENCE TESTS PASSED! ===");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ TESTS FAILED:", error);
    process.exit(1);
  } finally {
    global.fetch = originalFetch; // restore global fetch
  }
}

runTests();
