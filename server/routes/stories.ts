import express from 'express';
import { db } from '../src/db'; // Corrected path to db
import { stories } from '../../shared/schema';

const router = express.Router();

// Middleware to ensure user is authenticated
// This logic is similar to what's in the main routes file.
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

router.post('/submit-story', requireAuth, async (req, res) => {
  try {
    const { title, story, tags } = req.body;
    const authorId = req.session.userId;

    // Validate input
    if (!title || !story) {
      return res.status(400).json({ error: 'Title and story content are required' });
    }

    // Insert the story into the database, linking it to the authenticated user
    const [newStory] = await db.insert(stories).values({
      title,
      content: story,
      authorId: parseInt(authorId, 10), // Get the author from the session
      tags: tags || [],
    }).returning();

    res.status(201).json({ message: 'Story submitted successfully', story: newStory });
  } catch (error) {
    console.error('Error submitting story:', error);
    res.status(500).json({ error: 'An error occurred while submitting the story' });
  }
});

export default router;