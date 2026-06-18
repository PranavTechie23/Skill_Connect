import { pool } from "../src/db";
import { v4 as uuidv4 } from "uuid";

async function seedStories() {
  console.log("Seeding stories data...");
  const client = await pool.connect();

  try {
    // 1. Get some professional users
    const usersRes = await client.query(`SELECT id, first_name, last_name, email FROM users WHERE user_type = 'Professional' LIMIT 5`);
    const users = usersRes.rows;

    if (users.length === 0) {
      console.log("No professionals found. Can't seed stories.");
      return;
    }

    const storiesToInsert = [
      {
        title: "How I Landed My Dream Job Through Skill Connect",
        content: "Skill Connect completely transformed my job hunt. After months of applying on generic boards, I found a startup that perfectly aligned with my values. The platform's direct messaging feature let me talk to the hiring manager directly!",
        tags: ["success", "tech", "career-growth"],
        approved: true,
        featured: true,
        views: 1240,
        author: users[0]
      },
      {
        title: "From Junior Developer to Tech Lead in 2 Years",
        content: "I started my journey using the resources available in the Skill Connect community. The mentorship I received and the opportunities I found here accelerated my career exponentially. Highly recommend optimizing your profile!",
        tags: ["mentorship", "promotion", "advice"],
        approved: true,
        featured: false,
        views: 842,
        author: users[1] || users[0]
      },
      {
        title: "Transitioning from Healthcare to Tech",
        content: "It was a daunting move, but the companies on Skill Connect value transferable skills. I applied for a HealthTech role and was able to leverage my clinical background. The interview process was so transparent.",
        tags: ["career-change", "healthtech"],
        approved: false,
        featured: false,
        views: 15,
        author: users[2] || users[0]
      },
      {
        title: "Remote Work: A Game Changer for My Family",
        content: "Finding fully remote roles that actually pay well is tough. Skill Connect's filters and verified employers gave me peace of mind. I've now been working remotely for 6 months and it's incredible.",
        tags: ["remote-work", "work-life-balance"],
        approved: true,
        featured: true,
        views: 2100,
        author: users[3] || users[0]
      },
      {
        title: "My Top 5 Interview Tips for Frontend Roles",
        content: "After interviewing with 10 companies through this platform, I've noticed a pattern in what hiring managers look for. Here are my top tips for nailing that technical interview...",
        tags: ["interview-prep", "tips"],
        approved: false,
        featured: false,
        views: 0,
        author: users[4] || users[0]
      }
    ];

    for (const s of storiesToInsert) {
      const displayName = `${s.author.first_name} ${s.author.last_name}`;
      
      await client.query(`
        INSERT INTO stories (
          title, content, tags, author_id, submitter_name, submitter_email,
          approved, featured, views, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - interval '1 day' * floor(random() * 30), NOW()
        )
      `, [
        s.title,
        s.content,
        s.tags,
        s.author.id,
        displayName,
        s.author.email,
        s.approved,
        s.featured,
        s.views
      ]);
    }

    console.log("Successfully inserted 5 stories!");
  } catch (err) {
    console.error("Failed to seed stories:", err);
  } finally {
    client.release();
    pool.end();
  }
}

seedStories();
