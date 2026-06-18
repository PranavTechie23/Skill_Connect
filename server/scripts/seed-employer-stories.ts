import { pool } from "../src/db";
import { v4 as uuidv4 } from "uuid";

const MOCK_TITLES = [
  "How We Scaled Our Engineering Team in 3 Months",
  "Finding Top Remote Talent with Skill Connect",
  "Why We Switched from Traditional Agencies to This Platform",
  "Hiring a Lead Designer was Never Easier",
  "The Quality of Candidates Here is Unmatched",
  "Streamlining Our Recruitment Process",
  "From 100 Bad Resumes to 3 Perfect Fits",
  "Our Experience Hiring International Talent",
  "Building a Diverse Tech Team",
  "How We Reduced Our Time-to-Hire by 50%"
];

const MOCK_TAGS = [
  ["hiring", "success", "engineering"],
  ["remote", "talent-acquisition"],
  ["recruitment", "startup"],
  ["design", "leadership", "hiring"],
  ["quality", "candidates"],
  ["process-improvement", "hr"],
  ["efficiency", "matching"],
  ["international", "diversity"],
  ["team-building", "culture"],
  ["time-to-hire", "metrics"]
];

const MOCK_CONTENT = "As an employer, finding the right talent has always been our biggest bottleneck. Since switching to this platform, the quality of candidates we've interviewed has skyrocketed. The matching algorithm really understands what we are looking for, not just in terms of skills, but culture fit. We successfully filled a critical role in half the time it usually takes. We highly recommend this platform to any growing company looking to scale their team efficiently.";

async function seedEmployerStories() {
  console.log("Seeding employer stories data...");
  const client = await pool.connect();

  try {
    const usersRes = await client.query(`SELECT id, first_name, last_name, email FROM users WHERE user_type = 'Employer' LIMIT 20`);
    const users = usersRes.rows;

    if (users.length === 0) {
      console.log("No employers found. Can't seed employer stories.");
      return;
    }

    let insertedCount = 0;
    
    for (let i = 0; i < 40; i++) {
      const author = users[i % users.length];
      const displayName = `${author.first_name} ${author.last_name}`;
      const title = `${MOCK_TITLES[i % MOCK_TITLES.length]} - Update ${Math.floor(i / 10) + 1}`;
      const tags = MOCK_TAGS[i % MOCK_TAGS.length];
      const approved = Math.random() > 0.1; // 90% approved
      const featured = approved && Math.random() > 0.7; // 30% of approved are featured
      const views = Math.floor(Math.random() * 8000) + 500;
      
      // Random date within the last 365 days
      const daysAgo = Math.floor(Math.random() * 365);
      
      await client.query(`
        INSERT INTO stories (
          title, content, tags, author_id, submitter_name, submitter_email,
          approved, featured, views, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - interval '1 day' * $10, NOW() - interval '1 day' * $10
        )
      `, [
        title,
        MOCK_CONTENT,
        tags,
        author.id,
        displayName,
        author.email,
        approved,
        featured,
        views,
        daysAgo
      ]);
      
      insertedCount++;
    }

    console.log(`Successfully inserted ${insertedCount} employer stories!`);
  } catch (err) {
    console.error("Failed to seed employer stories:", err);
  } finally {
    client.release();
    pool.end();
  }
}

seedEmployerStories();
