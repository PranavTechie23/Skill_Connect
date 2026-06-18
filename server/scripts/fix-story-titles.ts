import { db } from '../src/db';
import { sql } from 'drizzle-orm';

const GOOD_TITLES = [
  "From Junior to Senior Developer",
  "Landing a Dream Role in Tech",
  "Transitioning into Data Science",
  "How I Got My First Remote Job",
  "Mastering React and Getting Hired",
  "Leveling Up My Career with Node.js",
  "Building a Portfolio That Got Me Hired",
  "My Journey to Becoming a Full-Stack Dev",
  "Breaking into Tech Without a CS Degree",
  "Getting Promoted in Just 6 Months",
  "Securing a Role at a Top Tech Company",
  "Learning Python Changed My Career",
  "My Path to Cloud Engineering",
  "Navigating the Tech Interview Process",
  "Finding the Perfect Startup Job",
  "Overcoming Imposter Syndrome",
  "Upskilling and Changing Careers",
  "From Support to Software Engineering",
  "Becoming a DevOps Engineer",
  "Winning a Hackathon and Getting a Job",
  "Designing My Way into Tech",
  "Landing a Machine Learning Role",
  "The Power of Networking in Tech",
  "Building Full-Stack Applications",
  "My Experience as a Freelance Developer",
  "Discovering a Passion for UI/UX",
  "Mastering Algorithms to Land a Job",
  "How Open Source Contributions Helped Me",
  "Becoming a Tech Lead",
  "Transitioning from Sales to Software Engineering"
];

async function updateStoryTitles() {
  try {
    const storiesResult = await db.execute(sql`SELECT id FROM stories`);
    const stories = (storiesResult as any).rows || (storiesResult as any);
    
    let updatedCount = 0;
    
    for (const story of stories) {
      const randomTitle = GOOD_TITLES[Math.floor(Math.random() * GOOD_TITLES.length)];
      await db.execute(sql`UPDATE stories SET title = ${randomTitle} WHERE id = ${story.id}`);
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} stories with new titles!`);
  } catch (error) {
    console.error('Error updating stories table:', error);
  } finally {
    process.exit(0);
  }
}

updateStoryTitles();
