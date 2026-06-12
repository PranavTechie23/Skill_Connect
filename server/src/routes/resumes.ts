import { Router, Request, Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  insertResumeParseSchema,
  resumeParses,
  aiEvents,
  professionalProfiles,
} from "../../../shared/schema";
import { extractTextFromUrl } from "../lib/pdf-extract";
import { parseResumeWithAI } from "../ai/resume-parser";
import {
  suggestProfileUpdates,
  applyProfileUpdates,
  type ParsedResumeMetadata,
  type ProfessionalProfile,
} from "../ai/profile-updater";

const router = Router();

// Input validation schema
const parseResumeRequestSchema = z.object({
  resumeUrl: z.string().url("resumeUrl must be a valid URL"),
});

type ParseResumeRequest = z.infer<typeof parseResumeRequestSchema>;

/**
 * POST /api/resumes/parse
 * Parse a resume from a public URL and extract structured data
 */
router.post("/parse", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req.user as any)?.id;

  try {
    // Validate request
    const body = parseResumeRequestSchema.parse(req.body);
    const { resumeUrl } = body as ParseResumeRequest;

    // Insert pending parse record
    const [pendingRecord] = await db
      .insert(resumeParses)
      .values({
        userId: userId || "anonymous",
        resumeUrl,
        parseStatus: "pending",
      })
      .returning();

    let extractedText = "";
    let parseStatus = "success";
    let errorMessage: string | undefined;
    let parsedData: any = {};

    try {
      // Step 1: Extract text from URL
      extractedText = await extractTextFromUrl(resumeUrl);

      if (extractedText.length === 0) {
        throw new Error("No text could be extracted from the file");
      }

      // Step 2: Parse with AI
      parsedData = await parseResumeWithAI(extractedText);
    } catch (error) {
      parseStatus = "error";
      errorMessage =
        error instanceof Error ? error.message : String(error);
    }

    // Step 3: Update parse record with results
    const [updatedRecord] = await db
      .update(resumeParses)
      .set({
        extractedText: extractedText || null,
        parseStatus,
        errorMessage: errorMessage || null,
        aiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        metadata: parseStatus === "success" ? parsedData : {},
        updatedAt: new Date(),
      })
      .where(eq(resumeParses.id, pendingRecord.id))
      .returning();

    // Step 4: Log to ai_events
    const latencyMs = Date.now() - startTime;
    await db.insert(aiEvents).values({
      userId: userId || null,
      feature: "resume_parsing",
      provider: "gemini",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      status: parseStatus,
      latencyMs,
      errorMessage: errorMessage || null,
      metadata: {
        resumeParseId: updatedRecord.id,
        fileUrl: resumeUrl,
        textLength: extractedText.length,
      },
    });

    // Return result
    if (parseStatus === "success") {
      res.json({
        success: true,
        data: {
          parseId: updatedRecord.id,
          parsed: parsedData,
          extractedTextLength: extractedText.length,
          latencyMs,
        },
      });
    } else {
      res.status(422).json({
        success: false,
        error: errorMessage,
        parseId: updatedRecord.id,
        latencyMs,
      });
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Log error to ai_events
    if (userId) {
      await db
        .insert(aiEvents)
        .values({
          userId,
          feature: "resume_parsing",
          provider: "gemini",
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          status: "error",
          latencyMs,
          errorMessage,
          metadata: {},
        })
        .catch(() => {
          // Silently fail if logging fails
        });
    }

    // Return error response
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid request",
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }
});

/**
 * POST /api/resumes/parse-and-suggest
 * Parse a resume and suggest profile updates (without applying them)
 */
router.post("/parse-and-suggest", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req.user as any)?.id;

  try {
    // Validate request
    const body = parseResumeRequestSchema.parse(req.body);
    const { resumeUrl } = body as ParseResumeRequest;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "User must be authenticated",
      });
      return;
    }

    // Fetch user's existing professional profile
    const [existingProfile] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId));

    if (!existingProfile) {
      res.status(404).json({
        success: false,
        error: "Professional profile not found. Create one first.",
      });
      return;
    }

    // Insert pending parse record
    const [pendingRecord] = await db
      .insert(resumeParses)
      .values({
        userId,
        resumeUrl,
        parseStatus: "pending",
      })
      .returning();

    let extractedText = "";
    let parseStatus = "success";
    let errorMessage: string | undefined;
    let parsedData: ParsedResumeMetadata = {};

    try {
      // Step 1: Extract text from URL
      extractedText = await extractTextFromUrl(resumeUrl);

      if (extractedText.length === 0) {
        throw new Error("No text could be extracted from the file");
      }

      // Step 2: Parse with AI
      parsedData = await parseResumeWithAI(extractedText);
    } catch (error) {
      parseStatus = "error";
      errorMessage =
        error instanceof Error ? error.message : String(error);
    }

    // Step 3: Update parse record with results
    const [updatedRecord] = await db
      .update(resumeParses)
      .set({
        extractedText: extractedText || null,
        parseStatus,
        errorMessage: errorMessage || null,
        aiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        metadata: parseStatus === "success" ? parsedData : {},
        updatedAt: new Date(),
      })
      .where(eq(resumeParses.id, pendingRecord.id))
      .returning();

    // Step 4: Log to ai_events
    const latencyMs = Date.now() - startTime;
    await db
      .insert(aiEvents)
      .values({
        userId,
        feature: "profile_update_suggestion",
        provider: "gemini",
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        status: parseStatus,
        latencyMs,
        errorMessage: errorMessage || null,
        metadata: {
          resumeParseId: updatedRecord.id,
          fileUrl: resumeUrl,
          textLength: extractedText.length,
        },
      })
      .catch(() => {
        // Silently fail if logging fails
      });

    // Return error if parse failed
    if (parseStatus !== "success") {
      res.status(422).json({
        success: false,
        error: errorMessage,
        parseId: updatedRecord.id,
        latencyMs,
      });
      return;
    }

    // Step 5: Generate suggestions (non-destructive)
    const suggestions = suggestProfileUpdates(
      existingProfile as ProfessionalProfile,
      parsedData
    );

    // Return suggestions without applying
    res.json({
      success: true,
      data: {
        parseId: updatedRecord.id,
        parsed: parsedData,
        suggestions,
        extractedTextLength: extractedText.length,
        latencyMs,
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Log error to ai_events
    if (userId) {
      await db
        .insert(aiEvents)
        .values({
          userId,
          feature: "profile_update_suggestion",
          provider: "gemini",
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          status: "error",
          latencyMs,
          errorMessage,
          metadata: {},
        })
        .catch(() => {
          // Silently fail if logging fails
        });
    }

    // Return error response
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid request",
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }
});

/**
 * PUT /api/resumes/:parseId/apply-suggestions
 * Apply user-selected profile updates
 */
router.put("/:parseId/apply-suggestions", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req.user as any)?.id;
  const { parseId } = req.params;

  try {
    if (!userId) {
      res.status(401).json({
        success: false,
        error: "User must be authenticated",
      });
      return;
    }

    // Validate parseId
    const parseIdNum = parseInt(parseId, 10);
    if (isNaN(parseIdNum)) {
      res.status(400).json({
        success: false,
        error: "Invalid parseId format",
      });
      return;
    }

    // Validate request body
    const updateSchema = z.object({
      updates: z.object({
        skills: z.boolean().optional(),
        headline: z.boolean().optional(),
        bio: z.boolean().optional(),
        experience: z.boolean().optional(),
        education: z.boolean().optional(),
      }),
    });

    const body = updateSchema.parse(req.body);
    const { updates: selectedUpdates } = body;

    // Fetch the parse record
    const [parseRecord] = await db
      .select()
      .from(resumeParses)
      .where(eq(resumeParses.id, parseIdNum));

    if (!parseRecord) {
      res.status(404).json({
        success: false,
        error: "Parse record not found",
      });
      return;
    }

    // Verify ownership
    if (parseRecord.userId !== userId) {
      res.status(403).json({
        success: false,
        error: "Unauthorized: You do not own this parse record",
      });
      return;
    }

    // Verify parse was successful
    if (parseRecord.parseStatus !== "success") {
      res.status(400).json({
        success: false,
        error: "Cannot apply suggestions: Parse record status is not success",
      });
      return;
    }

    // Fetch user's existing professional profile
    const [existingProfile] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId));

    if (!existingProfile) {
      res.status(404).json({
        success: false,
        error: "Professional profile not found",
      });
      return;
    }

    // Generate suggestions
    const parsedData = (parseRecord.metadata as ParsedResumeMetadata) || {};
    const suggestions = suggestProfileUpdates(
      existingProfile as ProfessionalProfile,
      parsedData
    );

    // Apply selected updates (non-destructive)
    const result = applyProfileUpdates(
      existingProfile as ProfessionalProfile,
      suggestions,
      selectedUpdates
    );

    // Update profile in database
    const [updatedProfile] = await db
      .update(professionalProfiles)
      .set({
        ...result.updatedProfile,
        // Note: id and userId are immutable
      })
      .where(eq(professionalProfiles.userId, userId))
      .returning();

    // Log to ai_events
    const latencyMs = Date.now() - startTime;
    await db
      .insert(aiEvents)
      .values({
        userId,
        feature: "profile_update_applied",
        provider: "gemini",
        model: parseRecord.aiModel || "gemini-2.5-flash",
        status: "success",
        latencyMs,
        metadata: {
          resumeParseId: parseIdNum,
          appliedUpdates: result.appliedUpdates,
          skippedUpdates: result.skippedUpdates,
          before: result.before,
          after: result.after,
        },
      })
      .catch(() => {
        // Silently fail if logging fails
      });

    // Return updated profile
    res.json({
      success: true,
      data: {
        profile: updatedProfile,
        appliedUpdates: result.appliedUpdates,
        skippedUpdates: result.skippedUpdates,
        latencyMs,
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Log error to ai_events
    if (userId) {
      await db
        .insert(aiEvents)
        .values({
          userId,
          feature: "profile_update_applied",
          provider: "gemini",
          status: "error",
          latencyMs,
          errorMessage,
          metadata: {},
        })
        .catch(() => {
          // Silently fail if logging fails
        });
    }

    // Return error response
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid request",
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }
});

export default router;
