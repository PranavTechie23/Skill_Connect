import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { users, professionalProfiles, jobs, aiEvents, applications } from "../../../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { generateGeminiAssistantReply } from "../ai/provider";
import { getCachedSuggestions, setCachedSuggestions } from "../ai/suggestions-cache";
import type { AssistantMessage } from "../ai/schemas";

const router = Router();

const MIN_BIO_LENGTH = 40; // in characters

// Middleware to check authentication
function requireCandidate(req: Request, res: Response, next: () => void) {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }
  next();
}

// Utility to enforce rate limits per feature via ai_events table
async function checkRateLimit(userId: string, feature: string, limit: number): Promise<boolean> {
  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiEvents)
      .where(
        and(
          eq(aiEvents.userId, userId),
          eq(aiEvents.feature, feature),
          eq(aiEvents.status, "success"),
          sql`${aiEvents.createdAt} > ${startTime}`
        )
      );
    return Number(result?.count ?? 0) < limit;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return true; // Fallback to allow if query fails
  }
}

// Utility to log AI events
async function logAiEvent(
  userId: string,
  feature: string,
  status: "success" | "error",
  latencyMs: number,
  errorMessage?: string
) {
  try {
    await db.insert(aiEvents).values({
      userId,
      feature,
      provider: "gemini",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      status,
      latencyMs,
      errorMessage: errorMessage || null,
      metadata: {},
    });
  } catch (err) {
    console.error("Failed to log AI event:", err);
  }
}

// Deterministic Profile Completeness score calculation
function calculateCompletenessScore(user: any, profile: any): number {
  if (!user) return 0;
  const bio = (profile?.bio ?? "").toString().trim();
  const headline = (profile?.headline ?? "").toString().trim();
  
  let skillsList: any[] = [];
  try {
    skillsList = Array.isArray(profile?.skills) 
      ? profile.skills 
      : (typeof profile?.skills === "string" ? JSON.parse(profile.skills) : []);
  } catch {
    skillsList = [];
  }

  let expList: any[] = [];
  try {
    expList = Array.isArray(profile?.experience)
      ? profile.experience
      : (typeof profile?.experience === "string" ? JSON.parse(profile.experience) : []);
  } catch {
    expList = [];
  }

  let eduList: any[] = [];
  try {
    eduList = Array.isArray(profile?.education)
      ? profile.education
      : (typeof profile?.education === "string" ? JSON.parse(profile.education) : []);
  } catch {
    eduList = [];
  }

  const checks = [
    !!user.firstName?.toString().trim(),
    !!user.lastName?.toString().trim(),
    !!user.email?.toString().trim(),
    !!user.telephoneNumber?.toString().trim(),
    !!user.location?.toString().trim(),
    !!headline,
    bio.length > 0,
    bio.length >= MIN_BIO_LENGTH,
    skillsList.length > 0,
    expList.length > 0 || eduList.length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

// -------------------------------------------------------------
// Endpoint: GET /api/ai/candidate/profile-suggestions
// -------------------------------------------------------------
router.get("/profile-suggestions", requireCandidate, async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;
  const startTime = Date.now();

  try {
    // 1. Fetch User and Profile
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, userId));

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const score = calculateCompletenessScore(user, profile);

    // 2. Check Cache
    const cached = getCachedSuggestions(userId);
    if (cached) {
      return res.json({ success: true, score, ...cached, fromCache: true });
    }

    // Check rate limit (15/day for suggestions)
    const withinLimit = await checkRateLimit(userId, "profile_suggestions", 15);
    if (!withinLimit) {
      return res.status(429).json({
        success: false,
        error: "Suggestions limit reached. Please try again tomorrow.",
        score,
        suggestions: ["Upload your resume to autocomplete profile fields", "Keep bio detailed and headline matching your target role"],
        missingSkills: [],
        careerAdvice: "Review active job vacancies to see skills in demand."
      });
    }

    // 3. Prompt Gemini
    const headline = profile?.headline ?? "Professional";
    const bio = profile?.bio ?? "No bio added yet.";
    const skills = Array.isArray(profile?.skills) ? profile.skills.join(", ") : "";

    const prompt = `Analyze this profile metadata for a job platform candidate:
Headline: ${headline}
Bio: ${bio}
Skills: ${skills}

Generate improvement suggestions and missing skills. Return ONLY a valid JSON object matching this structure (no markdown, no code blocks):
{
  "suggestions": ["specific improvement action item 1", "action item 2"],
  "missingSkills": ["skill 1", "skill 2"],
  "careerAdvice": "general short professional guidance sentence"
}`;

    let dataObj: any = null;
    let attempts = 2;

    for (let i = 0; i < attempts; i++) {
      try {
        const reply = await generateGeminiAssistantReply([{ role: "user", text: prompt }]);
        const cleanJson = reply
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        dataObj = JSON.parse(cleanJson);
        if (dataObj.suggestions && dataObj.missingSkills && dataObj.careerAdvice) {
          break;
        }
      } catch (err) {
        console.warn(`Gemini Suggestions JSON parsing failed on attempt ${i + 1}:`, err);
      }
    }

    // Fallback if AI fail or malformed
    if (!dataObj) {
      dataObj = {
        suggestions: ["Expand your professional bio to cover key accomplishments", "List your core technical and soft skills"],
        missingSkills: [],
        careerAdvice: "Analyze job listings in your sector to identify in-demand qualifications."
      };
    }

    setCachedSuggestions(userId, dataObj);
    await logAiEvent(userId, "profile_suggestions", "success", Date.now() - startTime);

    return res.json({ success: true, score, ...dataObj });
  } catch (error: any) {
    console.error("Suggestions endpoint failed:", error);
    await logAiEvent(userId, "profile_suggestions", "error", Date.now() - startTime, error.message);
    return res.status(500).json({ success: false, error: "Failed to generate suggestions" });
  }
});

// -------------------------------------------------------------
// Endpoint: POST /api/ai/candidate/cover-letter
// -------------------------------------------------------------
router.post("/cover-letter", requireCandidate, async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;
  const startTime = Date.now();

  try {
    const bodySchema = z.object({
      jobId: z.string().min(1, "Job ID is required"),
      customInstructions: z.string().optional(),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { jobId, customInstructions } = parsed.data;

    // Check rate limit (10/day for cover letters)
    const withinLimit = await checkRateLimit(userId, "cover_letter", 10);
    if (!withinLimit) {
      return res.status(429).json({ success: false, error: "Cover letter limit reached. Please try again tomorrow." });
    }

    // Verify Job exists and is active/visible
    const [job] = await db.select().from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.isActive, true)));
    if (!job) {
      return res.status(404).json({ success: false, error: "Active job listing not found" });
    }

    // Fetch user profile context
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, userId));

    const name = user ? `${user.firstName} ${user.lastName}` : "Applicant";
    const headline = profile?.headline ?? "Professional";
    const bio = profile?.bio ?? "";
    const skills = Array.isArray(profile?.skills) ? profile.skills.join(", ") : "";

    const prompt = `Write a professional, compelling, 3-paragraph cover letter for:
Candidate Name: ${name}
Candidate Headline: ${headline}
Candidate Bio: ${bio}
Candidate Skills: ${skills}

Applying to Job:
Title: ${job.title}
Company: ${job.location} (Remote/Hybrid)
Description: ${job.description}
Requirements: ${job.requirements}

Custom Instructions: ${customInstructions || "None"}

Generate a warm, professional, markdown cover letter template ready to copy. Do not include address blocks or dates, start directly with "Dear Hiring Manager,".`;

    let coverLetter = "";
    try {
      coverLetter = await generateGeminiAssistantReply([{ role: "user", text: prompt }]);
    } catch (err) {
      console.error("Gemini failed to generate cover letter:", err);
      coverLetter = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${job.title} position at your company. With my background as a ${headline} and expertise in ${skills || 'relevant skills'}, I am confident in my ability to deliver immediate value.\n\nI am excited about this opportunity and look forward to discussing how my experience matches your team's needs.\n\nSincerely,\n${name}`;
    }

    await logAiEvent(userId, "cover_letter", "success", Date.now() - startTime);
    return res.json({ success: true, coverLetter });
  } catch (error: any) {
    console.error("Cover letter endpoint failed:", error);
    await logAiEvent(userId, "cover_letter", "error", Date.now() - startTime, error.message);
    return res.status(500).json({ success: false, error: "Failed to generate cover letter" });
  }
});

// -------------------------------------------------------------
// Endpoint: POST /api/ai/candidate/interview-prep
// -------------------------------------------------------------
router.post("/interview-prep", requireCandidate, async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;
  const startTime = Date.now();

  try {
    const bodySchema = z.object({
      jobId: z.string().min(1, "Job ID is required"),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { jobId } = parsed.data;

    // Check rate limit (10/day)
    const withinLimit = await checkRateLimit(userId, "interview_prep", 10);
    if (!withinLimit) {
      return res.status(429).json({ success: false, error: "Interview prep limit reached. Please try again tomorrow." });
    }

    // Verify Job exists and is active/visible
    const [job] = await db.select().from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.isActive, true)));
    if (!job) {
      return res.status(404).json({ success: false, error: "Active job listing not found" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, userId));

    const headline = profile?.headline ?? "Candidate";
    const skills = Array.isArray(profile?.skills) ? profile.skills.join(", ") : "";

    const prompt = `Generate 3 technical and 2 behavioral mock interview questions for a candidate:
Headline: ${headline}
Skills: ${skills}

Applying to Job:
Title: ${job.title}
Requirements: ${job.requirements}
Description: ${job.description}

Return ONLY a valid JSON object matching this structure (no markdown, no code blocks):
{
  "questions": [
    {
      "id": 1,
      "question": "question text",
      "type": "technical or behavioral",
      "tips": "how to answer guidance",
      "sampleOutline": "bullet points structure for answer"
    }
  ]
}`;

    let dataObj: any = null;
    let attempts = 2;

    for (let i = 0; i < attempts; i++) {
      try {
        const reply = await generateGeminiAssistantReply([{ role: "user", text: prompt }]);
        const cleanJson = reply
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        dataObj = JSON.parse(cleanJson);
        if (dataObj.questions && Array.isArray(dataObj.questions)) {
          break;
        }
      } catch (err) {
        console.warn(`Gemini Interview Prep JSON parsing failed on attempt ${i + 1}:`, err);
      }
    }

    // Fallback if AI fail or malformed
    if (!dataObj) {
      dataObj = {
        questions: [
          {
            id: 1,
            question: `Tell me about your experience working with ${skills.split(',')[0] || 'your core skills'}.`,
            type: "technical",
            tips: "Walk through projects where you applied these skills and solve specific problems.",
            sampleOutline: "1. State technology, 2. Project context, 3. Results achieved."
          },
          {
            id: 2,
            question: "Describe a challenging situation at work and how you handled it.",
            type: "behavioral",
            tips: "Use the STAR method (Situation, Task, Action, Result) to structure your answer.",
            sampleOutline: "1. The context, 2. Your specific role, 3. The resolutions, 4. Learnings."
          }
        ]
      };
    }

    await logAiEvent(userId, "interview_prep", "success", Date.now() - startTime);
    return res.json({ success: true, ...dataObj });
  } catch (error: any) {
    console.error("Interview prep endpoint failed:", error);
    await logAiEvent(userId, "interview_prep", "error", Date.now() - startTime, error.message);
    return res.status(500).json({ success: false, error: "Failed to generate interview prep" });
  }
});

// -------------------------------------------------------------
// Endpoint: GET /api/ai/candidate/next-steps
// -------------------------------------------------------------
// Fully deterministic database statuses check. Does NOT charge paid AI requests.
router.get("/next-steps", requireCandidate, async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;

  try {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    // Query active applications where status is 'applied' or 'under_review' (the valid DB enums)
    const staleApps = await db
      .select({
        id: applications.id,
        status: applications.status,
        appliedAt: applications.appliedAt,
        jobId: applications.jobId,
      })
      .from(applications)
      .where(
        and(
          eq(applications.applicantId, userId),
          sql`${applications.status} IN ('applied', 'under_review', 'pending', 'new')`,
          sql`${applications.appliedAt} < ${fiveDaysAgo}`
        )
      )
      .orderBy(desc(applications.appliedAt));

    const recommendations = [];

    for (const app of staleApps) {
      if (!app.jobId) continue;
      
      const [job] = await db.select().from(jobs).where(eq(jobs.id, app.jobId));
      if (!job) continue;

      const formattedDate = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "stale date";
      const daysCount = Math.floor((Date.now() - (app.appliedAt ? new Date(app.appliedAt).getTime() : Date.now())) / (24 * 60 * 60 * 1000));

      const draftMessage = `Hi Hiring Team,\n\nI hope you are doing well. I wanted to follow up on my application for the ${job.title} position, which I submitted ${daysCount} days ago (${formattedDate}).\n\nI remain very interested in this opportunity and would love to connect. Thank you for your time.\n\nBest regards,\n[Your Name]`;

      recommendations.push({
        jobId: job.id,
        jobTitle: job.title,
        status: app.status,
        appliedDate: app.appliedAt,
        actionType: "follow_up",
        recommendationText: `You applied to ${job.title} ${daysCount} days ago and the status is still '${app.status}'. Consider sending a polite follow-up.`,
        draftMessage,
      });
    }

    return res.json({ success: true, recommendations });
  } catch (error) {
    console.error("Next steps endpoint failed:", error);
    return res.status(500).json({ success: false, error: "Failed to generate next steps recommendations" });
  }
});

// -------------------------------------------------------------
// Endpoint: POST /api/ai/candidate/coach-chat
// -------------------------------------------------------------
router.post("/coach-chat", requireCandidate, async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;
  const startTime = Date.now();

  try {
    const bodySchema = z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          text: z.string().min(1, "Message content is required"),
        })
      ),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    // Check rate limit (30/day for coach chat)
    const withinLimit = await checkRateLimit(userId, "coach_chat", 30);
    if (!withinLimit) {
      return res.status(429).json({ success: false, error: "Coach chat limit reached. Please try again tomorrow." });
    }

    // Limit message history to the last 6 messages
    const history = parsed.data.messages.slice(-6);

    // Truncate the latest user message content to 500 characters
    if (history.length > 0 && history[history.length - 1].role === "user") {
      const msg = history[history.length - 1];
      msg.text = msg.text.substring(0, 500);
    }

    // Fetch user profile metadata
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, userId));

    const name = user ? `${user.firstName} ${user.lastName}` : "Candidate";
    const headline = profile?.headline ?? "Professional";
    const bio = profile?.bio ?? "Not set yet.";
    const skills = Array.isArray(profile?.skills) ? profile.skills.join(", ") : "None";

    const systemPrompt = `You are a supportive, warm, and highly encouraging AI Career Coach on the SkillConnect hiring platform. Your mission is to provide personalized guidance to professionals. Help them prepare applications, discover their skill gaps, draft outlines, and build confidence.
Candidate Context:
- Name: ${name}
- Headline: ${headline}
- Bio: ${bio}
- Skills: ${skills}

Reply to the candidate in a warm, expert tone. Keep suggestions actionable, structured in markdown, and concise (under 250 words).`;

    const assistantMessages: AssistantMessage[] = [
      { role: "user", text: systemPrompt },
      ...history.map((m) => ({ role: m.role, text: m.text })),
    ];

    let reply = "";
    try {
      reply = await generateGeminiAssistantReply(assistantMessages);
    } catch (err) {
      console.error("Gemini coach chat failed:", err);
      reply = "I ran into a temporary issue retrieving my coaching notes. How else can I guide you in your job search?";
    }

    await logAiEvent(userId, "coach_chat", "success", Date.now() - startTime);
    return res.json({ success: true, reply });
  } catch (error: any) {
    console.error("Coach chat endpoint failed:", error);
    await logAiEvent(userId, "coach_chat", "error", Date.now() - startTime, error.message);
    return res.status(500).json({ success: false, error: "Failed to communicate with Career Coach" });
  }
});

export default router;
