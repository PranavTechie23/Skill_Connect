import express, { Request, Response, NextFunction } from "express";
import { db } from "../src/db"; // ✅ Make sure this path correctly points to your db instance
import { stories } from "../../shared/schema"; // ✅ Adjust if schema path differs

const router = express.Router();

/**
 * ✅ Middleware to ensure user is authenticated
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized: Please log in first." });
  }
  next();
};

/**
 * ✅ Route to submit a story (Protected)
 */
router.post("/submit-story", requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, story, tags } = req.body;
    const authorId = req.session?.userId;

    // Basic validation
    if (!title?.trim() || !story?.trim()) {
      return res.status(400).json({ error: "Title and story content are required." });
    }

    // Insert story into DB
    const [newStory] = await db
      .insert(stories)
      .values({
        title: title.trim(),
        content: story.trim(),
        authorId: Number(authorId),
        tags: Array.isArray(tags) ? tags : [],
      })
      .returning();

    res.status(201).json({
      message: "Story submitted successfully",
      story: newStory,
    });
  } catch (error: any) {
    console.error("❌ Error submitting story:", error);
    res.status(500).json({ error: "Internal Server Error while submitting story" });
  }
});

/**
 * ✅ Optional route to fetch all stories (useful for testing)
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const allStories = await db.select().from(stories);
    res.status(200).json(allStories);
  } catch (error: any) {
    console.error("❌ Error fetching stories:", error);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

export default router;
