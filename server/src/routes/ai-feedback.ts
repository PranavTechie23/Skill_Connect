import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { aiFeedback } from "../../../shared/schema";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

const feedbackSchema = z.object({
  feature: z.string(),
  rating: z.enum(["thumbs_up", "thumbs_down", "accepted", "rejected"]),
  feedbackText: z.string().optional(),
  promptSnippet: z.string().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const data = feedbackSchema.parse(req.body);
    await db.insert(aiFeedback).values({
      userId: req.session.userId,
      feature: data.feature,
      rating: data.rating,
      feedbackText: data.feedbackText,
      promptSnippet: data.promptSnippet,
    });
    res.json({ message: "Feedback submitted successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid parameters", errors: error.errors });
    }
    console.error("Failed to submit AI feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
