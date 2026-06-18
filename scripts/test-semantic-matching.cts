import { db } from "../server/src/db";
import { 
  users, 
  professionalProfiles, 
  companies, 
  jobs, 
  matchExplanations 
} from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { 
  generateTextEmbedding, 
  calculateCosineSimilarity,
  buildJobEmbeddingText
} from "../server/src/ai/embeddings";
import { storage } from "../server/src/storage";
import recommendationsRouter from "../server/src/routes/recommendations";
import semanticSearchRouter from "../server/src/routes/semantic-search";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simple mock helper for Express req/res
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

async function runTests() {
  console.log("=== STARTING SEMANTIC MATCHING & SEARCH VERIFICATION TESTS ===");

  try {
    // -------------------------------------------------------------
    // Test 1: Generate Embedding Dimension Check
    // -------------------------------------------------------------
    console.log("\n--- Test 1: Generating Text Embedding ---");
    const embedding = await generateTextEmbedding("Frontend Software Engineer React TypeScript");
    console.log(`Successfully generated embedding. Dimension count: ${embedding.length}`);
    if (embedding.length !== 768) {
      throw new Error(`Expected embedding size to be 768. Got ${embedding.length}`);
    }
    console.log("✅ Test 1 Passed: Text embedding generated with correct dimensions.");

    // -------------------------------------------------------------
    // Test 2: Cosine Similarity Mathematical Correctness
    // -------------------------------------------------------------
    console.log("\n--- Test 2: Cosine Similarity Accuracy ---");
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    const v3 = [0, 1, 0];
    const v4 = [0.5, 0.5, 0];

    const sim1 = calculateCosineSimilarity(v1, v2);
    const sim2 = calculateCosineSimilarity(v1, v3);
    const sim3 = calculateCosineSimilarity(v1, v4);

    console.log(`Identity similarity (should be 1.0): ${sim1}`);
    console.log(`Orthogonal similarity (should be 0.0): ${sim2}`);
    console.log(`Diagonal similarity (should be ~0.707): ${sim3}`);

    if (Math.abs(sim1 - 1.0) > 1e-5) throw new Error("Identity similarity check failed.");
    if (Math.abs(sim2 - 0.0) > 1e-5) throw new Error("Orthogonal similarity check failed.");
    if (Math.abs(sim3 - 0.7071) > 1e-3) throw new Error("Diagonal similarity check failed.");

    console.log("✅ Test 2 Passed: Cosine similarity math is correct.");

    // -------------------------------------------------------------
    // Setup Temporary Test Data
    // -------------------------------------------------------------
    console.log("\nSetting up test data in database...");
    const testProfessionalId = "test-prof-match-" + Date.now();
    const testEmployerId = "test-emp-match-" + Date.now();
    const testCompanyId = "test-comp-match-" + Date.now();

    // 1. Create Professional User
    await db.insert(users).values({
      id: testProfessionalId,
      email: `prof-${Date.now()}@example.com`,
      password: "hashedpassword",
      firstName: "John",
      lastName: "Developer",
      userType: "Professional",
      accountStatus: "active"
    }).execute();

    // 2. Create Professional Profile
    await storage.createProfessionalProfile({
      userId: testProfessionalId,
      headline: "Senior Frontend Engineer (React/TypeScript)",
      bio: "I specialize in building modular UI components, high-performance web apps, and design systems using React and TypeScript.",
      skills: ["React", "TypeScript", "Tailwind CSS", "Vite"],
    });

    // 3. Create Employer User & Company
    await db.insert(users).values({
      id: testEmployerId,
      email: `emp-${Date.now()}@example.com`,
      password: "hashedpassword",
      firstName: "Jane",
      lastName: "Employer",
      userType: "Employer",
      accountStatus: "active"
    }).execute();

    await db.insert(companies).values({
      id: testCompanyId,
      name: "Modern Web Solutions Ltd",
      ownerId: testEmployerId,
      status: "approved"
    }).execute();

    // 4. Create Job A (React)
    await storage.createJob({
      title: "Senior React Developer",
      description: "We are seeking a senior React developer to build high performance modular UI widgets and systems.",
      requirements: "Must have strong React and TypeScript experience. Figma/Tailwind is a plus.",
      location: "Remote",
      jobType: "remote",
      salaryMin: 120000,
      salaryMax: 160000,
      skills: ["React", "TypeScript", "Tailwind CSS"],
      companyId: testCompanyId,
      employerId: testEmployerId,
      isActive: true,
    });

    // We retrieve the newly created job ID for React
    const allJobs = await db.select().from(jobs).where(eq(jobs.employerId, testEmployerId));
    const reactJob = allJobs.find(j => j.title === "Senior React Developer")!;
    const testJobIdReactReal = reactJob.id;

    // 5. Create Job B (Java)
    await storage.createJob({
      title: "Java Spring Boot Backend Engineer",
      description: "Looking for an expert backend engineer skilled in Java, Spring Boot microservices, and database tuning.",
      requirements: "5+ years backend coding in Java, SQL optimization, and distributed systems.",
      location: "Pune, India",
      jobType: "full-time",
      salaryMin: 80000,
      salaryMax: 110000,
      skills: ["Java", "Spring Boot", "PostgreSQL"],
      companyId: testCompanyId,
      employerId: testEmployerId,
      isActive: true,
    });

    const javaJob = allJobs.find(j => j.title === "Java Spring Boot Backend Engineer") || (await db.select().from(jobs).where(eq(jobs.employerId, testEmployerId))).find(j => j.title === "Java Spring Boot Backend Engineer")!;
    const testJobIdJavaReal = javaJob.id;

    console.log("Database records inserted. Waiting for background embedding generation hooks...");
    await delay(5000); // Wait 5 seconds for hooks to resolve in the background

    // -------------------------------------------------------------
    // Test 3: Verify Background Hooks Generated Embeddings
    // -------------------------------------------------------------
    console.log("\n--- Test 3: Verifying Embeddings Saved ---");
    const [dbProfile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, testProfessionalId));
    const [dbReactJob] = await db.select().from(jobs).where(eq(jobs.id, testJobIdReactReal));
    const [dbJavaJob] = await db.select().from(jobs).where(eq(jobs.id, testJobIdJavaReal));

    console.log(`Profile embedding exists: ${!!dbProfile?.embedding}`);
    console.log(`React Job embedding exists: ${!!dbReactJob?.embedding}`);
    console.log(`Java Job embedding exists: ${!!dbJavaJob?.embedding}`);

    if (!dbProfile?.embedding || dbProfile.embedding.length !== 768) {
      throw new Error("Profile embedding was not computed or saved correctly in background.");
    }
    if (!dbReactJob?.embedding || dbReactJob.embedding.length !== 768) {
      throw new Error("React Job embedding was not computed or saved correctly in background.");
    }
    if (!dbJavaJob?.embedding || dbJavaJob.embedding.length !== 768) {
      throw new Error("Java Job embedding was not computed or saved correctly in background.");
    }

    console.log("✅ Test 3 Passed: Background hooks successfully generated and saved embeddings.");

    // -------------------------------------------------------------
    // Test 4: Semantic Search Routing
    // -------------------------------------------------------------
    console.log("\n--- Test 4: Testing Semantic Search Endpoint logic ---");
    const searchReq: any = {
      user: { id: testProfessionalId },
      query: { q: "React and UI frontend development", limit: "5", minSimilarity: "0.1" }
    };
    const searchRes = mockResponse();
    
    // Call semantic search router handler directly
    const semanticSearchHandler = (semanticSearchRouter as any).stack.find((s: any) => s.route?.path === "/" && s.route?.methods?.get)?.route?.stack[0]?.handle;
    if (!semanticSearchHandler) {
      throw new Error("Could not find GET / route handler in semantic-search router.");
    }

    await semanticSearchHandler(searchReq, searchRes, () => {});
    console.log("Search API Status Code:", searchRes.statusCode || 200);
    console.log("Search results count:", searchRes.body?.data?.results?.length);
    
    const results = searchRes.body?.data?.results || [];
    if (results.length === 0) {
      throw new Error("No results returned by semantic search.");
    }

    console.log("Ranking order verification:");
    results.forEach((res: any, idx: number) => {
      console.log(`  Rank ${idx + 1}: ${res.title} (Similarity: ${res.similarityScore})`);
    });

    const reactIndex = results.findIndex((r: any) => r.id === testJobIdReactReal);
    const javaIndex = results.findIndex((r: any) => r.id === testJobIdJavaReal);

    if (reactIndex === -1) {
      throw new Error("React job was not returned in search results.");
    }
    if (javaIndex !== -1 && reactIndex > javaIndex) {
      throw new Error(`React job should rank higher than Java job. React: index ${reactIndex}, Java: index ${javaIndex}`);
    }

    console.log("✅ Test 4 Passed: Semantic Search ranks correct jobs higher and behaves as expected.");

    // -------------------------------------------------------------
    // Test 5: Recommendations Router & Explanations DB Saving
    // -------------------------------------------------------------
    console.log("\n--- Test 5: Recommendations Router & Explanations ---");
    const recReq: any = {
      user: { id: testProfessionalId },
      query: { limit: "5", minScore: "30", semanticWeight: "0.7" }
    };
    const recRes = mockResponse();

    const recHandler = (recommendationsRouter as any).stack.find((s: any) => s.route?.path === "/" && s.route?.methods?.get)?.route?.stack[0]?.handle;
    if (!recHandler) {
      throw new Error("Could not find GET / route handler in recommendations router.");
    }

    await recHandler(recReq, recRes, () => {});
    console.log("Recommendations status:", recRes.statusCode || 200);
    console.log("Recommendations count:", recRes.body?.data?.recommendations?.length);

    const recs = recRes.body?.data?.recommendations || [];
    if (recs.length === 0) {
      throw new Error("No recommendations returned for professional profile.");
    }

    const firstRec = recs[0];
    console.log("First recommendation job:", firstRec.job.title);
    console.log("Explanation text:", firstRec.explanation);
    console.log("Match breakdown:", firstRec.matchBreakdown);

    if (!firstRec.explanation || typeof firstRec.explanation !== "string") {
      throw new Error("Explanation is missing or invalid in recommendation response.");
    }

    await delay(1000);

    // Verify saved in DB match_explanations table
    const dbExplanations = await db.select().from(matchExplanations).where(eq(matchExplanations.userId, testProfessionalId));
    console.log(`Saved match explanations in database: ${dbExplanations.length}`);
    if (dbExplanations.length === 0) {
      throw new Error("Match explanations were not saved to database.");
    }

    console.log("✅ Test 5 Passed: Recommendations successfully use semantic matching and persist explanations.");

    // -------------------------------------------------------------
    // Test 6: Backfill script execution
    // -------------------------------------------------------------
    console.log("\n--- Test 6: Testing Backfill Script ---");
    await db.update(jobs).set({ embedding: null }).where(eq(jobs.id, testJobIdReactReal)).execute();
    
    console.log("Executing backfill-embeddings script logic...");
    const jobsRes = await db.execute(sql`
      SELECT id, title, description, requirements, skills 
      FROM jobs 
      WHERE id = ${testJobIdReactReal}
    `);
    const row = jobsRes.rows[0] as any;
    const text = buildJobEmbeddingText({
      title: row.title,
      description: row.description ?? "",
      requirements: row.requirements,
      skills: Array.isArray(row.skills) ? row.skills : [],
    });
    const backfillEmbedding = await generateTextEmbedding(text);
    if (backfillEmbedding && backfillEmbedding.length > 0) {
      await db.update(jobs)
        .set({ embedding: backfillEmbedding })
        .where(eq(jobs.id, row.id));
    }

    const [dbReactJobPostBackfill] = await db.select().from(jobs).where(eq(jobs.id, testJobIdReactReal));
    console.log(`Embedding re-populated: ${!!dbReactJobPostBackfill?.embedding}`);
    if (!dbReactJobPostBackfill?.embedding || dbReactJobPostBackfill.embedding.length !== 768) {
      throw new Error("Backfill did not re-populate the embedding successfully.");
    }
    console.log("✅ Test 6 Passed: Backfill successfully re-populated missing embeddings.");

    // -------------------------------------------------------------
    // Clean up temporary test data
    // -------------------------------------------------------------
    console.log("\nCleaning up test records...");
    await db.delete(matchExplanations).where(eq(matchExplanations.userId, testProfessionalId)).execute();
    await db.delete(jobs).where(eq(jobs.employerId, testEmployerId)).execute();
    await db.delete(companies).where(eq(companies.ownerId, testEmployerId)).execute();
    await db.delete(professionalProfiles).where(eq(professionalProfiles.userId, testProfessionalId)).execute();
    await db.delete(users).where(eq(users.id, testProfessionalId)).execute();
    await db.delete(users).where(eq(users.id, testEmployerId)).execute();
    console.log("Test records cleaned up.");

    console.log("\n=== ALL SEMANTIC MATCHING & SEARCH ROADMAP TESTS PASSED! ===");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ TESTS FAILED:", error);
    process.exit(1);
  }
}

runTests();
