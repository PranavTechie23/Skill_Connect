import { pool } from "../src/db";
import { v4 as uuidv4 } from "uuid";

const MOCK_TITLES = [
  "How I Landed My Dream Job Through Skill Connect",
  "From Junior Developer to Tech Lead in 2 Years",
  "Transitioning from Healthcare to Tech",
  "Remote Work: A Game Changer for My Family",
  "My Top 5 Interview Tips for Frontend Roles",
  "Why I left Big Tech for a Startup",
  "Building a Career in Data Science",
  "Overcoming Imposter Syndrome in Tech",
  "The Importance of Mentorship in My Career",
  "How to Negotiate Your Salary Like a Pro"
];

const MOCK_TAGS = [
  ["success", "tech", "career-growth"],
  ["mentorship", "promotion", "advice"],
  ["career-change", "healthtech"],
  ["remote-work", "work-life-balance"],
  ["interview-prep", "tips"],
  ["startup", "culture"],
  ["data-science", "ai", "machine-learning"],
  ["mental-health", "imposter-syndrome"],
  ["salary", "negotiation", "career-advice"]
];

const MOCK_CONTENT = "This is a placeholder story content to simulate user submissions. Finding the right role is always a challenge, but with the right tools, communities, and continuous learning, it is entirely possible to pivot your career or accelerate your growth. I highly recommend networking, optimizing your profile, and staying up to date with industry trends. This platform has been instrumental in my journey, and I hope sharing this helps someone else out there.";

async function seed100Stories() {
  console.log("Seeding 120 stories data...");
  const client = await pool.connect();

  try {
    const usersRes = await client.query(`SELECT id, first_name, last_name, email FROM users WHERE user_type = 'Professional' LIMIT 50`);
    const users = usersRes.rows;

    if (users.length === 0) {
      console.log("No professionals found. Can't seed stories.");
      return;
    }

    let insertedCount = 0;
    
    for (let i = 0; i < 120; i++) {
      const author = users[i % users.length];
      const displayName = `${author.first_name} ${author.last_name}`;
      const title = `${MOCK_TITLES[i % MOCK_TITLES.length]} - Part ${Math.floor(i / 10) + 1}`;
      const tags = MOCK_TAGS[i % MOCK_TAGS.length];
      const approved = Math.random() > 0.2; // 80% approved
      const featured = approved && Math.random() > 0.8; // 20% of approved are featured
      const views = Math.floor(Math.random() * 5000);
      
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

    console.log(`Successfully inserted ${insertedCount} stories!`);
  } catch (err) {
    console.error("Failed to seed stories:", err);
  } finally {
    client.release();
    pool.end();
  }
}

seed100Stories();
