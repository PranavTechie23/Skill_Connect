import { db } from "../server/src/db";
import { 
  users, 
  professionalProfiles, 
  companies, 
  jobs, 
  applications, 
  notifications, 
  agentRuns, 
  agentSteps 
} from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { generateGeminiAssistantReply } from "../server/src/ai/provider";
import { createAssistantReply } from "../server/src/ai/assistant-service";
import { executeAgentSteps } from "../server/src/ai/agent-executor";

// Mock global fetch for testing timeout and retry behavior
const originalFetch = global.fetch;

async function runTests() {
  console.log("=== STARTING AI ROADMAP VERIFICATION TESTS ===");

  try {
    // -------------------------------------------------------------
    // Test 1: AI Provider Timeout & Retry Behavior
    // -------------------------------------------------------------
    console.log("\n--- Test 1: AI Provider Timeout & Retry ---");
    let fetchAttempts = 0;
    
    // Mock fetch to simulate 2 failures (rate limits or timeout) then 1 success
    global.fetch = (async (url: string, options: any) => {
      fetchAttempts++;
      console.log(`[Mock Fetch] Attempt ${fetchAttempts} to ${url}`);
      
      if (fetchAttempts === 1) {
        // First attempt: simulate a 15-second timeout (AbortError)
        return new Promise((_, reject) => {
          const err = new Error("The user aborted a request.");
          err.name = "AbortError";
          setTimeout(() => reject(err), 50); // Complete quickly in tests
        });
      }
      
      if (fetchAttempts === 2) {
        // Second attempt: transient 500 error
        return {
          ok: false,
          status: 502,
          text: async () => "Bad Gateway"
        } as any;
      }
      
      // Third attempt: success
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: "Mock Gemini success response on attempt 3" }]
            }
          }]
        })
      } as any;
    }) as any;

    // Call provider helper, should retry twice and succeed on 3rd attempt
    process.env.GEMINI_API_KEY = "dummy-key-for-test";
    const reply = await generateGeminiAssistantReply([{ role: "user", text: "Hello AI" }]);
    console.log("[Test 1] Provider reply:", reply);
    
    if (fetchAttempts !== 3 || reply !== "Mock Gemini success response on attempt 3") {
      throw new Error(`Test 1 Failed: Expected 3 attempts and specific reply. Got attempts=${fetchAttempts}, reply=${reply}`);
    }
    console.log("✅ Test 1 Passed: Retries and timeouts handled correctly.");

    // Restore fetch
    global.fetch = originalFetch;

    // -------------------------------------------------------------
    // Setup Temporary Test Data
    // -------------------------------------------------------------
    console.log("\nSetting up test data in PostgreSQL...");
    
    const testAdminId = "test-admin-" + Date.now();
    const testProfessionalId = "test-prof-" + Date.now();
    const testEmployerId = "test-emp-" + Date.now();
    const testJobId = "test-job-" + Date.now();
    const testCompanyId = "test-comp-" + Date.now();

    // Insert Admin
    await db.insert(users).values({
      id: testAdminId,
      email: `admin-${Date.now()}@example.com`,
      password: "hashedpassword",
      firstName: "Test",
      lastName: "Admin",
      userType: "admin",
      accountStatus: "active"
    }).execute();

    // Insert Professional
    await db.insert(users).values({
      id: testProfessionalId,
      email: `prof-${Date.now()}@example.com`,
      password: "hashedpassword",
      firstName: "Jane",
      lastName: "Developer",
      userType: "Professional",
      accountStatus: "active"
    }).execute();

    // Insert Professional Profile
    await db.insert(professionalProfiles).values({
      id: Math.floor(Math.random() * 1000000),
      userId: testProfessionalId,
      headline: "Senior React Engineer",
      bio: "Crafting beautiful interfaces",
      skills: JSON.stringify(["React", "TypeScript", "Node.js"]) as any,
    }).execute();

    // Insert Employer
    await db.insert(users).values({
      id: testEmployerId,
      email: `emp-${Date.now()}@example.com`,
      password: "hashedpassword",
      firstName: "Recruiter",
      lastName: "Bob",
      userType: "Employer",
      accountStatus: "active"
    }).execute();

    // Insert Company
    await db.insert(companies).values({
      id: testCompanyId,
      name: "Tech Solutions Corp",
      ownerId: testEmployerId,
      status: "approved"
    }).execute();

    // Insert Job
    await db.insert(jobs).values({
      id: testJobId,
      title: "Senior React Developer",
      description: "Looking for an expert React programmer.",
      requirements: "5+ years experience.",
      location: "San Francisco, CA",
      jobType: "full-time",
      skills: JSON.stringify(["React", "TypeScript"]) as any,
      employerId: testEmployerId,
      companyId: testCompanyId,
      isActive: true,
      status: "active"
    }).execute();

    // Insert Application
    const [testApp] = await db.insert(applications).values({
      jobId: testJobId,
      applicantId: testProfessionalId,
      status: "applied",
      coverLetter: "I would love to apply for this job.",
      notes: ""
    }).returning().execute();

    console.log("Database test records inserted successfully.");

    // -------------------------------------------------------------
    // Test 2: Chatbot Context & Support Escalation
    // -------------------------------------------------------------
    console.log("\n--- Test 2: Chatbot Context & Support Escalation ---");
    
    // We mock fetch again to simply capture the messages sent to Gemini
    let capturedMessages: any[] = [];
    global.fetch = (async (url: string, options: any) => {
      const body = JSON.parse(options.body);
      capturedMessages = body.contents;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "Mock response" }] } }]
        })
      } as any;
    }) as any;

    // Call chatbot reply with professional user
    await createAssistantReply({
      messages: [{ role: "user", text: "Show me my application status" }]
    }, testProfessionalId);

    // Verify context injection (Jane Developer and application should be in prompt)
    const injectedSystemPrompt = capturedMessages[0]?.parts?.[0]?.text || "";
    console.log("[Test 2] Injected context snippet:", injectedSystemPrompt.substring(0, 300));

    if (!injectedSystemPrompt.includes("Jane Developer") || !injectedSystemPrompt.includes("Senior React Developer")) {
      throw new Error("Test 2 Failed: Application details and candidate profile were not injected into context.");
    }
    console.log("✅ Context injection verified.");

    // Trigger support escalation trigger
    await createAssistantReply({
      messages: [{ role: "user", text: "Please escalate my request to human support immediately." }]
    }, testProfessionalId);

    // Give some time for background setImmediate notifications task to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Assert that a notification of type 'support_escalation' is inserted for the admin user
    const dbNotifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, testAdminId), eq(notifications.type, "support_escalation")))
      .execute();

    console.log("[Test 2] Support escalation notifications found for admin:", dbNotifications.length);
    if (dbNotifications.length === 0) {
      throw new Error("Test 2 Failed: Admin support escalation notification was not created.");
    }

    const adminNotification = dbNotifications[0];
    console.log("[Test 2] Notification Body:", adminNotification.body);
    console.log("[Test 2] Notification Metadata:", adminNotification.metadata);

    if (adminNotification.title !== "Support Escalation Request") {
      throw new Error("Test 2 Failed: Incomplete support escalation fields.");
    }
    console.log("✅ Escalation notification successfully created and verified.");

    // Restore fetch
    global.fetch = originalFetch;

    // -------------------------------------------------------------
    // Test 3: Agent Executor Running, Pausing & Resuming Approval
    // -------------------------------------------------------------
    console.log("\n--- Test 3: Agent Executor Workflow & Approvals ---");

    // Insert new agent run
    const [agentRun] = await db
      .insert(agentRuns)
      .values({
        userId: testProfessionalId,
        agentType: "candidate_career",
        goal: "Help me find and apply for jobs",
        status: "running"
      })
      .returning()
      .execute();

    console.log(`Created agent run ID: ${agentRun.id}. Starting execution...`);

    // Execute first run (should pause at Step 3 requires_approval)
    await executeAgentSteps(agentRun.id);

    // Check DB status of run
    const [pausedRun] = await db.select().from(agentRuns).where(eq(agentRuns.id, agentRun.id)).execute();
    console.log(`[Test 3] Paused run status: '${pausedRun.status}'`);
    
    // Check steps logged
    const loggedSteps = await db
      .select()
      .from(agentSteps)
      .where(eq(agentSteps.runId, agentRun.id))
      .orderBy(agentSteps.stepOrder)
      .execute();
      
    console.log(`[Test 3] Steps completed before approval hold:`, loggedSteps.map(s => `${s.stepOrder}: ${s.toolName} (${s.status})`));

    if (pausedRun.status !== "requires_approval" || loggedSteps.length !== 3) {
      throw new Error(`Test 3 Failed: Agent did not pause at step 3. Run status: ${pausedRun.status}, steps logged: ${loggedSteps.length}`);
    }

    // Now approve the checkpoint: set run status back to 'running'
    await db
      .update(agentRuns)
      .set({ status: "running" })
      .where(eq(agentRuns.id, agentRun.id))
      .execute();

    console.log("[Test 3] Checkpoint approved. Resuming execution...");
    
    // Resume executor
    await executeAgentSteps(agentRun.id);

    // Verify completion
    const [completedRun] = await db.select().from(agentRuns).where(eq(agentRuns.id, agentRun.id)).execute();
    const finalSteps = await db
      .select()
      .from(agentSteps)
      .where(eq(agentSteps.runId, agentRun.id))
      .execute();

    console.log(`[Test 3] Final run status: '${completedRun.status}', total steps logged: ${finalSteps.length}`);
    if (completedRun.status !== "completed" || finalSteps.length !== 4) {
      throw new Error(`Test 3 Failed: Resumed run did not complete successfully. Status: ${completedRun.status}`);
    }
    console.log("✅ Agent runs, steps, and requires_approval checkpoints verified.");

    // -------------------------------------------------------------
    // Test 4: Between-Step Cancellation
    // -------------------------------------------------------------
    console.log("\n--- Test 4: Between-Step Cancellation ---");

    const [cancelRun] = await db
      .insert(agentRuns)
      .values({
        userId: testProfessionalId,
        agentType: "candidate_career",
        goal: "Find engineering jobs near me",
        status: "running"
      })
      .returning()
      .execute();

    console.log(`Created agent run ID: ${cancelRun.id} for cancellation test.`);

    // Start execution and cancel it asynchronously after 1.5 seconds (during Step 2)
    const execPromise = executeAgentSteps(cancelRun.id);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`[Test 4] Simulating user cancel mid-run...`);
    await db
      .update(agentRuns)
      .set({ status: "cancelled" })
      .where(eq(agentRuns.id, cancelRun.id))
      .execute();

    await execPromise;

    // Check final status and steps of the run
    const [finalCancelRun] = await db.select().from(agentRuns).where(eq(agentRuns.id, cancelRun.id)).execute();
    const cancelSteps = await db
      .select()
      .from(agentSteps)
      .where(eq(agentSteps.runId, cancelRun.id))
      .orderBy(agentSteps.stepOrder)
      .execute();

    console.log(`[Test 4] Final run status: '${finalCancelRun.status}', completed step orders:`, cancelSteps.map(s => `${s.stepOrder}: ${s.toolName} (${s.status})`));

    // Since cancel happened after step 1 finished (at 1s), step 2 (started at 1s, delay 1s) was cancel-checked.
    // It should check and abort before step 3 or during step 2.
    if (finalCancelRun.status !== "cancelled" || cancelSteps.length > 2) {
      throw new Error(`Test 4 Failed: Executor did not halt on cancellation. Status: ${finalCancelRun.status}, steps run: ${cancelSteps.length}`);
    }
    console.log("✅ Agent between-step cancellation successfully verified.");

    // -------------------------------------------------------------
    // Clean up temporary test data
    // -------------------------------------------------------------
    console.log("\nCleaning up test database records...");
    await db.delete(notifications).where(eq(notifications.userId, testAdminId)).execute();
    await db.delete(agentSteps).where(eq(agentSteps.runId, agentRun.id)).execute();
    await db.delete(agentSteps).where(eq(agentSteps.runId, cancelRun.id)).execute();
    await db.delete(agentRuns).where(eq(agentRuns.userId, testProfessionalId)).execute();
    await db.delete(applications).where(eq(applications.id, testApp.id)).execute();
    await db.delete(jobs).where(eq(jobs.id, testJobId)).execute();
    await db.delete(companies).where(eq(companies.id, testCompanyId)).execute();
    await db.delete(professionalProfiles).where(eq(professionalProfiles.userId, testProfessionalId)).execute();
    await db.delete(users).where(eq(users.id, testAdminId)).execute();
    await db.delete(users).where(eq(users.id, testProfessionalId)).execute();
    await db.delete(users).where(eq(users.id, testEmployerId)).execute();
    console.log("Test records cleaned up successfully.");

    console.log("\n=== ALL AI ROADMAP VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
    process.exit(0);

  } catch (error) {
    // Restore fetch in case of error
    global.fetch = originalFetch;
    console.error("\n❌ TESTS FAILED:", error);
    process.exit(1);
  }
}

runTests();
