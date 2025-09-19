
import express from 'express';
import { db } from '../db';
import { stories } from '../../shared/schema';

const router = express.Router();

router.post('/submit-story', async (req, res) => {
  try {
    const { name, email, role, title, story } = req.body;

    // Validate input
    if (!name || !email || !role || !title || !story) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Insert the story into the database
    await db.insert(stories).values({
      name,
      email,
      role,
      title,
      content: story,
    });

    res.status(201).json({ message: 'Story submitted successfully' });
  } catch (error) {
    console.error('Error submitting story:', error);
    res.status(500).json({ error: 'An error occurred while submitting the story' });
  }
});

export default router;
