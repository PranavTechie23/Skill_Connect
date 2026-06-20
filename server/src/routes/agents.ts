import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { agentRuns, agentSteps, aiEvents } from "../../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { storage } from "../storage";
import { startAgentExecution } from "../ai/agent-executor";

const router = Router();

// Zod validation for running an agent
const runAgentSchema = z.object({
  agentType: z.enum([
    "candidate_career",
    "resume_intelligence",
    "job_recommendation",
    "recruiter_screening",
    "job_description",
    "hiring_pipeline",
    "admin_trust",
    "support_assistant",
  ]),
  goal: z.string()
    .min(5, "Goal description must be at least 5 characters long")
    .max(500, "Goal description must not exceed 500 characters"),
});

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: any) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

/**
 * POST /api/agents/run
 * Initiates a new background agent run
 */
router.post("/run", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  try {
    const body = runAgentSchema.parse(req.body);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const role = String(user.userType || (user as any).user_type || "").toLowerCase();

    // Enforce rate limits (using aiEvents table)
    // professionals: 5 per day. employers/admins: 10 per day.
    const dailyLimit = (role === "employer" || role === "admin") ? 10 : 5;
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiEvents)
      .where(
        and(
          eq(aiEvents.userId, userId),
          eq(aiEvents.feature, "agent_run"),
          eq(aiEvents.status, "success"),
          sql`${aiEvents.createdAt} > ${startTime}`
        )
      );

    if (Number(result?.count ?? 0) >= dailyLimit) {
      return res.status(429).json({ message: "Daily agent execution limit reached" });
    }

    // Role-based authorization rules
    if (body.agentType === "candidate_career" || body.agentType === "resume_intelligence") {
      if (role !== "professional" && role !== "job_seeker" && role !== "job-seeker" && role !== "admin") {
        return res.status(403).json({ message: "Only professional users can start candidate/resume agents" });
      }
    } else if (
      body.agentType === "recruiter_screening" ||
      body.agentType === "job_description" ||
      body.agentType === "hiring_pipeline"
    ) {
      if (role !== "employer" && role !== "admin") {
        return res.status(403).json({ message: "Only employers can start recruiter/hiring agents" });
      }
    } else if (body.agentType === "admin_trust") {
      if (role !== "admin") {
        return res.status(403).json({ message: "Only administrators can start admin trust agents" });
      }
    }

    // Insert agent run record in DB
    const [run] = await db
      .insert(agentRuns)
      .values({
        userId,
        agentType: body.agentType,
        goal: body.goal,
        status: "running"
      })
      .returning()
      .execute();

    // Log to aiEvents
    await db.insert(aiEvents).values({
      userId,
      feature: "agent_run",
      provider: "gemini",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      status: "success",
      latencyMs: 0,
    }).execute();

    // Trigger async execution
    startAgentExecution(run.id);

    return res.status(202).json({
      message: "Agent run started in the background",
      runId: run.id,
      status: run.status,
      agentType: run.agentType,
      goal: run.goal
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid parameters", errors: error.errors });
    }
    console.error("Error starting agent:", error);
    return res.status(500).json({ message: "Failed to start agent run" });
  }
});

/**
 * GET /api/agents/runs
 * Lists agent runs for the authenticated user, or all for admins
 */
router.get("/runs", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const role = String(user.userType || (user as any).user_type || "").toLowerCase();
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    let runs;
    if (role === "admin") {
      runs = await db
        .select()
        .from(agentRuns)
        .orderBy(agentRuns.createdAt)
        .limit(limit)
        .offset(offset)
        .execute();
    } else {
      runs = await db
        .select()
        .from(agentRuns)
        .where(eq(agentRuns.userId, userId))
        .orderBy(agentRuns.createdAt)
        .limit(limit)
        .offset(offset)
        .execute();
    }

    return res.json(runs);
  } catch (error) {
    console.error("Error listing agent runs:", error);
    return res.status(500).json({ message: "Failed to list agent runs" });
  }
});

/**
 * GET /api/agents/runs/:id
 * Fetches detail of a specific agent run and its execution steps
 */
router.get("/runs/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const runId = Number(req.params.id);

  if (isNaN(runId)) {
    return res.status(400).json({ message: "Invalid run ID" });
  }

  try {
    const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
    if (!run) {
      return res.status(404).json({ message: "Agent run not found" });
    }

    // Authorization check
    const user = await storage.getUser(userId);
    const role = String(user?.userType || (user as any)?.user_type || "").toLowerCase();
    
    if (run.userId !== userId && role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this run" });
    }

    const steps = await db
      .select()
      .from(agentSteps)
      .where(eq(agentSteps.runId, runId))
      .orderBy(agentSteps.stepOrder)
      .execute();

    return res.json({
      ...run,
      steps
    });

  } catch (error) {
    console.error("Error fetching run details:", error);
    return res.status(500).json({ message: "Failed to fetch agent run details" });
  }
});

/**
 * POST /api/agents/runs/:id/approve
 * Approves a paused step checkpoint and resumes execution
 */
router.post("/runs/:id/approve", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const runId = Number(req.params.id);

  if (isNaN(runId)) {
    return res.status(400).json({ message: "Invalid run ID" });
  }

  try {
    const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
    if (!run) {
      return res.status(404).json({ message: "Agent run not found" });
    }

    // Authorization check
    const user = await storage.getUser(userId);
    const role = String(user?.userType || (user as any)?.user_type || "").toLowerCase();
    
    if (run.userId !== userId && role !== "admin") {
      return res.status(403).json({ message: "Not authorized to approve this run" });
    }

    if (run.status !== "requires_approval") {
      return res.status(400).json({ message: `Agent run is in status: '${run.status}', cannot approve.` });
    }

    // Resume: set status to running and invoke the executor
    await db
      .update(agentRuns)
      .set({ status: "running" })
      .where(and(eq(agentRuns.id, runId), eq(agentRuns.status, "requires_approval")))
      .execute();

    // Trigger async execution to continue
    startAgentExecution(runId);

    return res.json({ message: "Agent execution resumed", status: "running" });

  } catch (error) {
    console.error("Error approving run:", error);
    return res.status(500).json({ message: "Failed to approve agent run" });
  }
});

/**
 * POST /api/agents/runs/:id/cancel
 * Cancels a running or paused agent run
 */
router.post("/runs/:id/cancel", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const runId = Number(req.params.id);

  if (isNaN(runId)) {
    return res.status(400).json({ message: "Invalid run ID" });
  }

  try {
    const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).execute();
    if (!run) {
      return res.status(404).json({ message: "Agent run not found" });
    }

    // Authorization check
    const user = await storage.getUser(userId);
    const role = String(user?.userType || (user as any)?.user_type || "").toLowerCase();
    
    if (run.userId !== userId && role !== "admin") {
      return res.status(403).json({ message: "Not authorized to cancel this run" });
    }

    if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
      return res.status(400).json({ message: "Agent run has already finished." });
    }

    // Set status to cancelled (between-step executor check will halt it)
    await db
      .update(agentRuns)
      .set({ 
        status: "cancelled",
        completedAt: new Date()
      })
      .where(eq(agentRuns.id, runId))
      .execute();

    return res.json({ message: "Agent execution cancelled successfully", status: "cancelled" });

  } catch (error) {
    console.error("Error cancelling run:", error);
    return res.status(500).json({ message: "Failed to cancel agent run" });
  }
});

export default router;
