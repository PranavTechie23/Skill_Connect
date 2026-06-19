import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { users, companies, jobs, applications, messages, aiEvents } from "../../../shared/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { generateGeminiAssistantReply } from "../ai/provider";
import { getCachedWeeklyReport, setCachedWeeklyReport } from "../ai/suggestions-cache";
import { storage } from "../storage";

const router = Router();

// Middleware to authorize employer/admin
async function requireEmployer(req: Request, res: Response, next: () => void) {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }
    const role = String(user.userType || (user as any).user_type || "").toLowerCase().trim();
    if (role !== "employer" && role !== "admin") {
      return res.status(403).json({ success: false, error: "Access denied. Recruiters only." });
    }
    next();
  } catch (err) {
    console.error("Authorization middleware error:", err);
    return res.status(500).json({ success: false, error: "Authorization error" });
  }
}

// Check rate limit per feature in last 24 hours
async function checkRateLimit(userId: string, feature: string, limit: number): Promise<boolean> {
  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
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
    return true; // fallback
  }
}

// Log AI event to ai_events table
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

// -------------------------------------------------------------
// Endpoint: POST /api/ai/employer/jobs/draft
// -------------------------------------------------------------
router.post("/jobs/draft", requireEmployer, async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;
  const startTime = Date.now();

  try {
    const bodySchema = z.object({
      title: z.string().optional(),
      requirements: z.string().optional(),
      keyResponsibilities: z.string().optional(),
      customInstructions: z.string().optional(),
      companyId: z.string().optional(),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { companyId } = parsed.data;

    // Verify company scope if provided
    if (companyId) {
      const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
      if (!company) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }
      if (company.ownerId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized to draft jobs for this company" });
      }
    }

    // Check rate limit (15/day for job drafts)
    const withinLimit = await checkRateLimit(userId, "job_draft", 15);
    if (!withinLimit) {
      return res.status(429).json({ success: false, error: "Job draft generation limit reached. Please try again tomorrow." });
    }

    // Combined input truncation at 600 characters
    let title = parsed.data.title || "";
    let requirements = parsed.data.requirements || "";
    let keyResponsibilities = parsed.data.keyResponsibilities || "";
    let customInstructions = parsed.data.customInstructions || "";

    const totalLength = title.length + requirements.length + keyResponsibilities.length + customInstructions.length;
    if (totalLength > 600) {
      const budgetRemaining = 600 - title.length;
      if (budgetRemaining <= 0) {
        title = title.substring(0, 600);
        requirements = "";
        keyResponsibilities = "";
        customInstructions = "";
      } else {
        const perFieldBudget = Math.floor(budgetRemaining / 3);
        requirements = requirements.substring(0, perFieldBudget);
        keyResponsibilities = keyResponsibilities.substring(0, perFieldBudget);
        customInstructions = customInstructions.substring(0, perFieldBudget);
      }
    }

    const prompt = `Draft a professional job description, key responsibilities, requirements, and target skills based on:
Title: ${title}
Requirements summary: ${requirements}
Key responsibilities summary: ${keyResponsibilities}
Custom instructions: ${customInstructions}

Return ONLY a valid JSON object matching this structure (no markdown, no code blocks):
{
  "description": "drafted detailed paragraph of the job role",
  "requirements": "bullet points of skills and certifications required",
  "keyResponsibilities": "bullet points of day-to-day duties",
  "skills": ["skill1", "skill2", "skill3"]
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
        if (dataObj.description && dataObj.requirements && dataObj.keyResponsibilities && Array.isArray(dataObj.skills)) {
          break;
        }
      } catch (err) {
        console.warn(`Gemini Job Draft JSON parsing failed on attempt ${i + 1}:`, err);
      }
    }

    if (!dataObj) {
      dataObj = {
        description: `We are looking for a qualified ${title || "Professional"} to join our team. In this role, you will work collaboratively to support key operational activities.`,
        requirements: requirements || "- Experience in the role or relevant field\n- Strong collaboration and communication skills\n- Willingness to learn",
        keyResponsibilities: keyResponsibilities || "- Assist with daily tasks and deliverables\n- Participate in team meetings and reviews\n- Maintain documentation and project standards",
        skills: ["Teamwork", "Communication", title || "General Skills"].filter(Boolean),
        fallbackUsed: true,
      };
    }

    await logAiEvent(userId, "job_draft", "success", Date.now() - startTime);
    return res.json({ success: true, ...dataObj });
  } catch (error: any) {
    console.error("Job draft endpoint failed:", error);
    await logAiEvent(userId, "job_draft", "error", Date.now() - startTime, error.message);
    return res.status(500).json({ success: false, error: "Failed to generate job description draft" });
  }
});

// -------------------------------------------------------------
// Endpoint: POST /api/ai/employer/messages/draft
// -------------------------------------------------------------
router.post("/messages/draft", requireEmployer, async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;
  const startTime = Date.now();

  try {
    const bodySchema = z.object({
      applicationId: z.number().int(),
      customInstructions: z.string().optional(),
      type: z.enum(["interview", "rejection", "general"]),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { applicationId, type } = parsed.data;

    // Verify application existence and cross-tenant job authorization scope
    const [application] = await db.select().from(applications).where(eq(applications.id, applicationId));
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }
    const [job] = await db.select().from(jobs).where(eq(jobs.id, application.jobId as string));
    if (!job) {
      return res.status(404).json({ success: false, error: "Job associated with application not found" });
    }
    if (job.employerId !== userId) {
      return res.status(403).json({ success: false, error: "Not authorized to draft messages for this application" });
    }

    // Check rate limit (25/day message draft limit for headroom)
    const withinLimit = await checkRateLimit(userId, "message_draft", 25);
    if (!withinLimit) {
      return res.status(429).json({ success: false, error: "Message draft limit reached. Please try again tomorrow." });
    }

    // Input truncation
    const customInstructions = (parsed.data.customInstructions || "").substring(0, 600);

    const [applicant] = await db.select().from(users).where(eq(users.id, application.applicantId as string));
    if (applicant && (applicant.privacySettings as any)?.aiOptOut) {
      return res.status(403).json({ success: false, error: "Candidate has opted out of AI processing. Please write the message manually." });
    }
    const candidateName = applicant ? `${applicant.firstName} ${applicant.lastName}` : "Candidate";

    const prompt = `Draft a polite, professional outreach message to a job applicant:
Candidate Name: ${candidateName}
Job Title: ${job.title}
Message Type: ${type}
Custom Instructions: ${customInstructions}

Start directly with the greeting (e.g. "Dear ${candidateName}," or "Hi ${candidateName},").
Keep the tone professional, encouraging, and clear. Do not include signature blocks, placeholders, or dates. Just write the message body itself.`;

    let messageDraft = "";
    try {
      messageDraft = await generateGeminiAssistantReply([{ role: "user", text: prompt }]);
    } catch (err) {
      console.error("Gemini message draft failed:", err);
      // Fallback
      if (type === "interview") {
        messageDraft = `Hi ${candidateName},\n\nThank you for applying for the ${job.title} position. We were impressed by your background and would like to invite you for an interview. Please let us know your availability.\n\nBest regards,\nRecruitment Team`;
      } else if (type === "rejection") {
        messageDraft = `Hi ${candidateName},\n\nThank you for your interest in the ${job.title} position. After careful review, we have decided to move forward with other candidates. We appreciate your time and wish you the best in your search.\n\nBest regards,\nRecruitment Team`;
      } else {
        messageDraft = `Hi ${candidateName},\n\nThank you for your application for the ${job.title} position. We are currently reviewing applications and will be in touch shortly.\n\nBest regards,\nRecruitment Team`;
      }
    }

    await logAiEvent(userId, "message_draft", "success", Date.now() - startTime);
    return res.json({ success: true, messageDraft });
  } catch (error: any) {
    console.error("Message draft endpoint failed:", error);
    await logAiEvent(userId, "message_draft", "error", Date.now() - startTime, error.message);
    return res.status(500).json({ success: false, error: "Failed to generate message draft" });
  }
});

// -------------------------------------------------------------
// Endpoint: GET /api/ai/employer/pipeline/recommendations
// -------------------------------------------------------------
// Deterministic endpoint: no Gemini call, exempt from rate limits
router.get("/pipeline/recommendations", requireEmployer, async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;

  try {
    // 1. Fetch active jobs for this recruiter
    const activeJobs = await db.select().from(jobs).where(
      and(
        eq(jobs.employerId, userId),
        eq(jobs.isActive, true)
      )
    );

    const recommendations = [];
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 2. Identify stale jobs (> 30 days active or past deadline)
    for (const job of activeJobs) {
      const isPastDeadline = job.deadline && new Date(job.deadline) < new Date();
      const isOld = job.createdAt && new Date(job.createdAt) < thirtyDaysAgo;

      if (isPastDeadline) {
        recommendations.push({
          type: "stale_job_deadline",
          jobId: job.id,
          jobTitle: job.title,
          message: `The application deadline for "${job.title}" has passed. Consider archiving or extending the job listing.`,
          suggestedAction: "Archive or Extend deadline",
        });
      } else if (isOld) {
        recommendations.push({
          type: "stale_job_old",
          jobId: job.id,
          jobTitle: job.title,
          message: `"${job.title}" has been active for more than 30 days. Review current applicants or refresh the listing details.`,
          suggestedAction: "Review / Refresh listing",
        });
      }

      // 3. Identify stale applications (> 6 days pending in review states)
      const staleApps = await db.select().from(applications).where(
        and(
          eq(applications.jobId, job.id),
          sql`${applications.status} IN ('applied', 'new', 'under_review', 'pending')`,
          sql`${applications.updatedAt} < ${sixDaysAgo}`
        )
      );

      for (const app of staleApps) {
        const applicant = await db.select().from(users).where(eq(users.id, app.applicantId as string)).then((r) => r[0]);
        const name = applicant ? `${applicant.firstName} ${applicant.lastName}` : "Candidate";

        recommendations.push({
          type: "stale_application",
          jobId: job.id,
          jobTitle: job.title,
          applicationId: app.id,
          applicantName: name,
          message: `${name}'s application for "${job.title}" has been pending for over 6 days. Consider scheduling an interview or sending an update.`,
          suggestedAction: "Send Outreach or Update status",
        });
      }
    }

    return res.json({ success: true, recommendations });
  } catch (error) {
    console.error("Pipeline recommendations endpoint failed:", error);
    return res.status(500).json({ success: false, error: "Failed to generate pipeline recommendations" });
  }
});

// -------------------------------------------------------------
// Endpoint: GET /api/ai/employer/reports/weekly
// -------------------------------------------------------------
router.get("/reports/weekly", requireEmployer, async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId || (req.user as any)?.id;
  const startTime = Date.now();
  const refresh = req.query.refresh === "true";

  try {
    // 1. Check Cache first (if not forcing refresh)
    if (!refresh) {
      const cached = getCachedWeeklyReport(userId);
      if (cached) {
        return res.json({ success: true, ...cached, fromCache: true });
      }
    }

    // 2. Rate limit check (10/day headroom)
    const withinLimit = await checkRateLimit(userId, "weekly_report", 10);
    if (!withinLimit) {
      const cached = getCachedWeeklyReport(userId);
      if (cached) {
        return res.json({
          success: true,
          ...cached,
          fromCache: true,
          message: "Rate limit reached. Displaying cached report.",
        });
      }
      return res.status(429).json({ success: false, error: "Weekly report generation limit reached. Please try again tomorrow." });
    }

    // 3. Compile Recruiter Stats
    const activeJobs = await db.select().from(jobs).where(
      and(
        eq(jobs.employerId, userId),
        eq(jobs.isActive, true)
      )
    );
    const activeJobsCount = activeJobs.length;

    const allJobs = await db.select().from(jobs).where(eq(jobs.employerId, userId));
    const totalJobsCount = allJobs.length;

    const employerJobIds = allJobs.map((j) => j.id);

    let totalAppsCount = 0;
    let newAppsCount = 0;
    let interviewingCount = 0;
    let rejectedCount = 0;
    let hiredCount = 0;
    let velocityCount = 0;

    if (employerJobIds.length > 0) {
      const apps = await db.select().from(applications).where(inArray(applications.jobId, employerJobIds));
      totalAppsCount = apps.length;
      newAppsCount = apps.filter((a) => ["applied", "new"].includes(a.status)).length;
      interviewingCount = apps.filter((a) => ["interviewing", "shortlisted"].includes(a.status)).length;
      rejectedCount = apps.filter((a) => ["rejected"].includes(a.status)).length;
      hiredCount = apps.filter((a) => ["hired", "offered"].includes(a.status)).length;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      velocityCount = apps.filter((a) => a.appliedAt && new Date(a.appliedAt) > sevenDaysAgo).length;
    }

    const prompt = `You are an executive hiring assistant. Analyze these platform hiring metrics for the recruiter's active jobs:
- Active Jobs: ${activeJobsCount}
- Total Posted Jobs: ${totalJobsCount}
- Total Candidate Applications: ${totalAppsCount}
- Applications Received in Last 7 Days (Velocity): ${velocityCount}
- Candidates Pending Review: ${newAppsCount}
- Candidates Interviewing/Shortlisted: ${interviewingCount}
- Candidates Hired/Offered: ${hiredCount}
- Applications Rejected: ${rejectedCount}

Generate an executive weekly hiring report. Return ONLY a valid JSON object matching this structure (no markdown, no code blocks):
{
  "summary": "a short 2-3 sentence overview of this week's progress",
  "highlights": ["highlight 1 (e.g. increase in velocity)", "highlight 2"],
  "bottlenecks": ["bottleneck 1 (e.g. pending reviews)", "bottleneck 2"],
  "actions": ["suggested action 1", "suggested action 2"]
}`;

    let reportData: any = null;
    let attempts = 2;

    for (let i = 0; i < attempts; i++) {
      try {
        const reply = await generateGeminiAssistantReply([{ role: "user", text: prompt }]);
        const cleanJson = reply
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        reportData = JSON.parse(cleanJson);
        if (reportData.summary && Array.isArray(reportData.highlights) && Array.isArray(reportData.bottlenecks) && Array.isArray(reportData.actions)) {
          break;
        }
      } catch (err) {
        console.warn(`Gemini Weekly Report JSON parsing failed on attempt ${i + 1}:`, err);
      }
    }

    if (!reportData) {
      reportData = {
        summary: `Hiring activities remain steady across your ${activeJobsCount} active job postings. Review and screening of the ${newAppsCount} pending applicants is recommended.`,
        highlights: [`Currently tracking ${totalAppsCount} total applications`, `${interviewingCount} candidates in interviewing stages`],
        bottlenecks: [`${newAppsCount} new applicants are awaiting review`],
        actions: ["Review pending applicants to move them to interviewing or rejection stages", "Examine listings with low applicant volume to refine requirements"],
        fallbackUsed: true,
      };
    }

    setCachedWeeklyReport(userId, reportData);
    await logAiEvent(userId, "weekly_report", "success", Date.now() - startTime);

    return res.json({ success: true, ...reportData });
  } catch (error: any) {
    console.error("Weekly report endpoint failed:", error);
    await logAiEvent(userId, "weekly_report", "error", Date.now() - startTime, error.message);
    return res.status(500).json({ success: false, error: "Failed to generate weekly report" });
  }
});

export default router;
