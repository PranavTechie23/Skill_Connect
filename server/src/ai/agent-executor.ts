import { db } from "../db";
import { agentRuns, agentSteps, users, professionalProfiles, jobs, companies, applications, messages, notifications } from "../../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateGeminiAssistantReply } from "./provider";
import { generateTextEmbedding, calculateCosineSimilarity, buildProfileEmbeddingText } from "./embeddings";

interface AgentStepDefinition {
  stepOrder: number;
  toolName: string;
  inputJson: Record<string, any>;
  execute: (runId: number, input: Record<string, any>) => Promise<Record<string, any>>;
  requiresApproval?: boolean;
}

const AGENT_WORKFLOWS: Record<string, AgentStepDefinition[]> = {
  candidate_career: [
    {
      stepOrder: 1,
      toolName: "ProfileAnalyzer",
      inputJson: {},
      execute: async (runId) => {
        const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
        if (!run) throw new Error("Run not found");
        
        const [user] = await db.select().from(users).where(eq(users.id, run.userId!)).execute();
        if (!user) throw new Error("User not found");

        const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, run.userId!)).execute();

        const headline = profile?.headline ?? "Professional";
        const bio = profile?.bio ?? "No bio added yet.";
        let skillsList: string[] = [];
        try {
          skillsList = Array.isArray(profile?.skills)
            ? (profile.skills as string[])
            : (typeof profile?.skills === "string" ? JSON.parse(profile.skills) : []);
        } catch {
          skillsList = [];
        }
        let expList: any[] = [];
        try {
          expList = Array.isArray(profile?.experience)
            ? (profile.experience as any[])
            : (typeof profile?.experience === "string" ? JSON.parse(profile.experience) : []);
        } catch {
          expList = [];
        }
        let eduList: any[] = [];
        try {
          eduList = Array.isArray(profile?.education)
            ? (profile.education as any[])
            : (typeof profile?.education === "string" ? JSON.parse(profile.education) : []);
        } catch {
          eduList = [];
        }

        const prompt = `
You are an AI Professional Profile Analyzer.
Analyze the following candidate profile:
First Name: ${user.firstName}
Last Name: ${user.lastName}
Headline: ${headline}
Bio: ${bio}
Skills: ${skillsList.join(", ")}
Experience: ${JSON.stringify(expList)}
Education: ${JSON.stringify(eduList)}

Identify missing fields, completeness score, and give tailored advice.
Return ONLY a valid JSON object matching this schema. Do not include markdown formatting (like \`\`\`json) or extra text outside the JSON block.
{
  "completenessScore": 85,
  "missingFields": ["certifications", "bio"],
  "advice": "Add certifications to increase match rate."
}
`;
        const replyText = await generateGeminiAssistantReply([
          { role: "user", text: prompt.trim() }
        ]);

        let jsonString = replyText.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.slice(7);
        }
        if (jsonString.startsWith("```")) {
          jsonString = jsonString.slice(3);
        }
        if (jsonString.endsWith("```")) {
          jsonString = jsonString.slice(0, -3);
        }
        return JSON.parse(jsonString.trim());
      }
    },
    {
      stepOrder: 2,
      toolName: "SemanticJobSearcher",
      inputJson: { limit: 5 },
      execute: async (runId) => {
        const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
        if (!run) throw new Error("Run not found");
        
        const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, run.userId!)).execute();
        if (!profile) throw new Error("Professional profile not found. Please create a profile first.");

        const headline = profile.headline ?? "";
        const bio = profile.bio ?? "";
        let skillsList: string[] = [];
        try {
          skillsList = Array.isArray(profile.skills)
            ? (profile.skills as string[])
            : (typeof profile.skills === "string" ? JSON.parse(profile.skills) : []);
        } catch {
          skillsList = [];
        }

        let queryEmbedding = profile.embedding as number[] | null;
        if (!queryEmbedding || queryEmbedding.length === 0) {
          const profileText = buildProfileEmbeddingText({ headline, bio, skills: skillsList });
          queryEmbedding = await generateTextEmbedding(profileText);
        }

        if (!queryEmbedding || queryEmbedding.length === 0) {
          throw new Error("Failed to generate embedding for profile");
        }

        const allJobs = await db.select().from(jobs).where(eq(jobs.isActive, true)).execute();
        const jobsWithEmbeddings = allJobs.filter((job) => Array.isArray(job.embedding) && job.embedding.length > 0);

        if (jobsWithEmbeddings.length === 0) {
          return {
            matchedCount: 0,
            bestMatch: "None",
            matchScore: 0
          };
        }

        const matches = jobsWithEmbeddings
          .map((job) => {
            const similarity = calculateCosineSimilarity(queryEmbedding!, job.embedding as number[]);
            return { job, similarity };
          })
          .sort((a, b) => b.similarity - a.similarity);

        const bestMatch = matches[0];
        if (!bestMatch) {
          return {
            matchedCount: 0,
            bestMatch: "None",
            matchScore: 0
          };
        }

        let companyName = "Unknown Company";
        if (bestMatch.job.companyId) {
          const [company] = await db.select().from(companies).where(eq(companies.id, bestMatch.job.companyId)).execute();
          if (company) {
            companyName = company.name;
          }
        }

        let jobSkills: string[] = [];
        try {
          jobSkills = Array.isArray(bestMatch.job.skills)
            ? (bestMatch.job.skills as string[])
            : (typeof bestMatch.job.skills === "string" ? JSON.parse(bestMatch.job.skills) : []);
        } catch {
          jobSkills = [];
        }

        return {
          matchedCount: matches.length,
          bestMatch: `${bestMatch.job.title} at ${companyName}`,
          matchScore: Math.round(bestMatch.similarity * 100),
          bestJobId: bestMatch.job.id,
          bestJobTitle: bestMatch.job.title,
          bestJobDescription: bestMatch.job.description,
          bestJobRequirements: bestMatch.job.requirements || "",
          bestJobLocation: bestMatch.job.location || "",
          bestJobSkills: jobSkills,
          bestJobCompanyId: bestMatch.job.companyId || "",
          bestJobCompanyName: companyName
        };
      }
    },
    {
      stepOrder: 3,
      toolName: "CoverLetterDrafter",
      inputJson: { tone: "professional" },
      requiresApproval: true,
      execute: async (runId, input) => {
        const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
        if (!run) throw new Error("Run not found");
        
        const [user] = await db.select().from(users).where(eq(users.id, run.userId!)).execute();
        if (!user) throw new Error("User not found");

        const tone = input.tone || "professional";
        const bestJobTitle = input.bestJobTitle || "Software Engineer";
        const bestJobCompanyName = input.bestJobCompanyName || "TechCorp";
        const bestJobDescription = input.bestJobDescription || "";
        const bestJobRequirements = input.bestJobRequirements || "";

        const prompt = `
You are an AI Cover Letter Assistant.
Draft a cover letter for the candidate:
Candidate: ${user.firstName} ${user.lastName}
Target Job Title: ${bestJobTitle}
Target Company: ${bestJobCompanyName}
Job Description: ${bestJobDescription}
Job Requirements: ${bestJobRequirements}
Tone: ${tone}

Return ONLY a valid JSON object matching this schema. Do not include markdown formatting (like \`\`\`json) or extra text outside the JSON block.
{
  "draft": "Dear Hiring Manager...",
  "requiresUserReview": true
}
`;
        const replyText = await generateGeminiAssistantReply([
          { role: "user", text: prompt.trim() }
        ]);

        let jsonString = replyText.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.slice(7);
        }
        if (jsonString.startsWith("```")) {
          jsonString = jsonString.slice(3);
        }
        if (jsonString.endsWith("```")) {
          jsonString = jsonString.slice(0, -3);
        }
        return JSON.parse(jsonString.trim());
      }
    },
    {
      stepOrder: 4,
      toolName: "ApplicationCompleter",
      inputJson: {},
      execute: async (runId, input) => {
        const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
        if (!run) throw new Error("Run not found");

        const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, run.userId!)).execute();
        
        const bestJobId = input.bestJobId;
        const draft = input.draft;
        const bestJobTitle = input.bestJobTitle || "Job";

        if (!bestJobId) {
          throw new Error("Missing bestJobId from job search step.");
        }

        const [existing] = await db
          .select()
          .from(applications)
          .where(and(eq(applications.applicantId, run.userId!), eq(applications.jobId, bestJobId)))
          .execute();

        if (existing) {
          return {
            status: "already_applied",
            success: true,
            summary: `Already applied to ${bestJobTitle}.`,
            applicationId: existing.id
          };
        }

        const attachments = [];
        if (profile?.resumeUrl) {
          attachments.push({
            name: profile.resumeName || "Resume.pdf",
            url: profile.resumeUrl,
            mimeType: "application/pdf"
          });
        } else {
          attachments.push({
            name: "Profile_Resume.pdf",
            url: "https://example.com/resume.pdf",
            mimeType: "application/pdf"
          });
        }

        const [application] = await db
          .insert(applications)
          .values({
            applicantId: run.userId!,
            jobId: bestJobId,
            coverLetter: draft || null,
            resume: JSON.stringify(attachments),
            status: "applied"
          })
          .returning()
          .execute();

        return {
          status: "submitted",
          success: true,
          summary: `Application for ${bestJobTitle} successfully submitted.`,
          applicationId: application.id
        };
      }
    }
  ],
  hiring_pipeline: [
    {
      stepOrder: 1,
      toolName: "PipelineAnalyzer",
      inputJson: {},
      execute: async (runId) => {
        const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
        if (!run) throw new Error("Run not found");

        const employerJobs = await db.select().from(jobs).where(eq(jobs.employerId, run.userId!)).execute();
        if (employerJobs.length === 0) {
          return {
            totalOpenJobs: 0,
            totalApplications: 0,
            pendingCount: 0,
            actionItems: ["Create a job posting to start receiving applications."],
            recommendedCandidateId: null,
            recommendedCandidateName: null,
            recommendedJobId: null
          };
        }

        const jobIds = employerJobs.map(j => j.id);
        const apps = await db.select().from(applications).execute();
        const filteredApps = apps.filter(app => jobIds.includes(app.jobId!));

        const pendingApps = filteredApps.filter(app => app.status === "applied" || app.status === "review" || app.status === "pending");

        if (pendingApps.length === 0) {
          return {
            totalOpenJobs: employerJobs.length,
            totalApplications: filteredApps.length,
            pendingCount: 0,
            actionItems: ["No pending applications to review."],
            recommendedCandidateId: null,
            recommendedCandidateName: null,
            recommendedJobId: null
          };
        }

        const candidatesWithDetails = await Promise.all(pendingApps.map(async (app) => {
          const [user] = await db.select().from(users).where(eq(users.id, app.applicantId!)).execute();
          const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, app.applicantId!)).execute();
          const job = employerJobs.find(j => j.id === app.jobId);
          return {
            applicationId: app.id,
            jobId: app.jobId,
            jobTitle: job?.title || "Job",
            candidateId: app.applicantId,
            candidateName: user ? `${user.firstName} ${user.lastName}` : "Unknown Candidate",
            skills: profile?.skills || [],
            experience: profile?.experience || []
          };
        }));

        const prompt = `
You are an AI Recruitment Assistant.
Analyze the following list of pending job applications:
${JSON.stringify(candidatesWithDetails)}

Highlight key candidates, identify action items (e.g. who should be reviewed first), and recommend one candidate to interview.
Return ONLY a valid JSON object matching this schema. Do not include markdown formatting (like \`\`\`json) or extra text outside the JSON block.
{
  "totalOpenJobs": 5,
  "totalApplications": 12,
  "pendingCount": 4,
  "actionItems": ["Highlight candidate X for Y role due to skill Z"],
  "recommendedCandidateId": "candidate_user_id",
  "recommendedCandidateName": "Candidate Name",
  "recommendedJobId": "job_id"
}
`;
        const replyText = await generateGeminiAssistantReply([
          { role: "user", text: prompt.trim() }
        ]);

        let jsonString = replyText.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.slice(7);
        }
        if (jsonString.startsWith("```")) {
          jsonString = jsonString.slice(3);
        }
        if (jsonString.endsWith("```")) {
          jsonString = jsonString.slice(0, -3);
        }
        const parsed = JSON.parse(jsonString.trim());
        
        return {
          totalOpenJobs: employerJobs.length,
          totalApplications: filteredApps.length,
          pendingCount: pendingApps.length,
          actionItems: parsed.actionItems || [],
          recommendedCandidateId: parsed.recommendedCandidateId || null,
          recommendedCandidateName: parsed.recommendedCandidateName || null,
          recommendedJobId: parsed.recommendedJobId || null
        };
      }
    },
    {
      stepOrder: 2,
      toolName: "MessageDrafter",
      inputJson: {},
      requiresApproval: true,
      execute: async (runId, input) => {
        const recommendedCandidateName = input.recommendedCandidateName;
        const recommendedJobId = input.recommendedJobId;

        if (!recommendedCandidateName) {
          return {
            draft: "Hello, thank you for your interest in our roles. We would love to chat further.",
            requiresUserReview: true
          };
        }

        let jobTitle = "our open role";
        if (recommendedJobId) {
          const [job] = await db.select().from(jobs).where(eq(jobs.id, recommendedJobId)).execute();
          if (job) {
            jobTitle = job.title;
          }
        }

        const prompt = `
You are an AI Recruitment Outreach writer.
Write a friendly, professional invitation message to ${recommendedCandidateName} inviting them for an interview for the role of ${jobTitle}.
Return ONLY a valid JSON object matching this schema. Do not include markdown formatting (like \`\`\`json) or extra text outside the JSON block.
{
  "messageText": "Hi Candidate...",
  "requiresUserReview": true
}
`;
        const replyText = await generateGeminiAssistantReply([
          { role: "user", text: prompt.trim() }
        ]);

        let jsonString = replyText.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.slice(7);
        }
        if (jsonString.startsWith("```")) {
          jsonString = jsonString.slice(3);
        }
        if (jsonString.endsWith("```")) {
          jsonString = jsonString.slice(0, -3);
        }
        return JSON.parse(jsonString.trim());
      }
    },
    {
      stepOrder: 3,
      toolName: "MessageSender",
      inputJson: {},
      execute: async (runId, input) => {
        const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
        if (!run) throw new Error("Run not found");

        const recommendedCandidateId = input.recommendedCandidateId;
        const recommendedCandidateName = input.recommendedCandidateName || "Candidate";
        const recommendedJobId = input.recommendedJobId;
        const messageText = input.messageText;

        if (!recommendedCandidateId || !messageText) {
          return {
            status: "skipped",
            success: false,
            summary: "No candidate recommended or message text empty."
          };
        }

        const [app] = await db
          .select()
          .from(applications)
          .where(and(eq(applications.applicantId, recommendedCandidateId), eq(applications.jobId, recommendedJobId!)))
          .execute();

        const [msg] = await db
          .insert(messages)
          .values({
            senderId: run.userId!,
            receiverId: recommendedCandidateId,
            applicationId: app?.id || null,
            content: messageText,
            isRead: false
          })
          .returning()
          .execute();

        return {
          status: "sent",
          success: true,
          summary: `Message sent to ${recommendedCandidateName}.`,
          messageId: msg.id
        };
      }
    }
  ],
  default: [
    {
      stepOrder: 1,
      toolName: "GeneralTaskPlanner",
      inputJson: {},
      execute: async () => ({ status: "plan_ready", plan: ["Analyze", "Execute", "Verify"] })
    },
    {
      stepOrder: 2,
      toolName: "GeneralTaskExecutor",
      inputJson: {},
      execute: async () => ({ status: "executed", output: "Work completed successfully" })
    }
  ]
};

async function cleanupStaleRuns() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
  try {
    const updated = await db
      .update(agentRuns)
      .set({ status: "cancelled", completedAt: new Date() })
      .where(
        and(
          eq(agentRuns.status, "requires_approval"),
          sql`${agentRuns.createdAt} < ${cutoff}`
        )
      )
      .execute();
    if (updated) {
      console.log(`[Agent Executor] Stale runs cleanup complete.`);
    }
  } catch (err) {
    console.error(`[Agent Executor] Failed to cleanup stale runs:`, err);
  }
}

export function startAgentExecution(runId: number) {
  setImmediate(() => executeAgentSteps(runId));
}

export async function executeAgentSteps(runId: number) {
  console.log(`[Agent Executor] Starting execution of run ${runId}`);
  
  // Clean up stale runs first
  await cleanupStaleRuns();

  try {
    const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
    if (!run) {
      console.error(`[Agent Executor] Run ${runId} not found in database.`);
      return;
    }

    if (run.status === "cancelled" || run.status === "completed" || run.status === "failed") {
      console.log(`[Agent Executor] Run ${runId} is already in terminal status: ${run.status}`);
      return;
    }

    const workflow = AGENT_WORKFLOWS[run.agentType] || AGENT_WORKFLOWS.default;

    const executedSteps = await db
      .select()
      .from(agentSteps)
      .where(and(eq(agentSteps.runId, runId), eq(agentSteps.status, "success")))
      .execute();
      
    const completedStepOrders = new Set(executedSteps.map(s => s.stepOrder));
    const pendingSteps = workflow.filter(s => !completedStepOrders.has(s.stepOrder));

    let currentInput = run.resultJson as Record<string, any>;

    for (const step of pendingSteps) {
      // Cancellation check BEFORE step execution
      const [currentRunState] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
      if (!currentRunState || currentRunState.status === "cancelled") {
        console.log(`[Agent Executor] Run ${runId} was cancelled before starting step ${step.stepOrder}.`);
        return;
      }

      if (currentRunState.status !== "running") {
        await db
          .update(agentRuns)
          .set({ status: "running" })
          .where(and(eq(agentRuns.id, runId), eq(agentRuns.status, currentRunState.status)))
          .execute();
      }

      console.log(`[Agent Executor] Run ${runId} executing step ${step.stepOrder}: ${step.toolName}`);

      const [insertedStep] = await db
        .insert(agentSteps)
        .values({
          runId,
          stepOrder: step.stepOrder,
          toolName: step.toolName,
          inputJson: { ...step.inputJson, ...currentInput },
          status: "pending"
        })
        .returning()
        .execute();

      await new Promise(resolve => setTimeout(resolve, 1000));

      let output: Record<string, any> = {};
      let attemptFailed = false;
      let errorReason = "";

      // 1-retry fallback per step
      try {
        output = await step.execute(runId, { ...step.inputJson, ...currentInput });
      } catch (firstErr: any) {
        console.warn(`[Agent Executor] Step ${step.stepOrder} failed on first attempt in run ${runId}. Retrying once...`, firstErr);
        try {
          output = await step.execute(runId, { ...step.inputJson, ...currentInput });
        } catch (secondErr: any) {
          attemptFailed = true;
          errorReason = secondErr.message || String(secondErr);
          console.error(`[Agent Executor] Step ${step.stepOrder} failed on retry in run ${runId}:`, secondErr);
        }
      }

      // Re-verify cancellation check right before saving step results / output
      const [postExecutionRunState] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
      if (!postExecutionRunState || postExecutionRunState.status === "cancelled") {
        console.log(`[Agent Executor] Run ${runId} was cancelled during/after execution of step ${step.stepOrder}. Discarding output.`);
        await db
          .update(agentSteps)
          .set({ status: "failed", outputJson: { error: "Execution cancelled" } })
          .where(eq(agentSteps.id, insertedStep.id))
          .execute();
        return;
      }

      if (attemptFailed) {
        await db
          .update(agentSteps)
          .set({ status: "failed", outputJson: { error: errorReason } })
          .where(eq(agentSteps.id, insertedStep.id))
          .execute();

        await db
          .update(agentRuns)
          .set({ status: "failed", completedAt: new Date() })
          .where(and(eq(agentRuns.id, runId), eq(agentRuns.status, "running")))
          .execute();
        return;
      }

      await db
        .update(agentSteps)
        .set({ status: "success", outputJson: output })
        .where(eq(agentSteps.id, insertedStep.id))
        .execute();

      currentInput = { ...currentInput, ...output };

      if (step.requiresApproval) {
        console.log(`[Agent Executor] Run ${runId} paused at step ${step.stepOrder} awaiting candidate approval.`);
        
        await db
          .update(agentRuns)
          .set({ 
            status: "requires_approval",
            resultJson: currentInput
          })
          .where(and(eq(agentRuns.id, runId), eq(agentRuns.status, "running")))
          .execute();

        // Proactively alert the user via the notifications table if the run was triggered by the cron scheduler
        if (run.source === "cron") {
          await db
            .insert(notifications)
            .values({
              userId: run.userId!,
              type: "agent_requires_approval",
              title: "Agent Run Requires Approval",
              body: `Your weekly scheduled agent run (${run.agentType}) requires your review and approval at step ${step.stepOrder}.`,
              isRead: false,
              linkTab: "agents"
            })
            .execute();
        }

        return;
      }
    }

    const finalUpdate = await db
      .update(agentRuns)
      .set({ 
        status: "completed", 
        resultJson: currentInput,
        completedAt: new Date() 
      })
      .where(and(eq(agentRuns.id, runId), eq(agentRuns.status, "running")))
      .returning()
      .execute();
      
    if (finalUpdate.length > 0) {
      console.log(`[Agent Executor] Run ${runId} completed successfully.`);
    }

  } catch (globalErr) {
    console.error(`[Agent Executor] Global execution failure on run ${runId}:`, globalErr);
  }
}
