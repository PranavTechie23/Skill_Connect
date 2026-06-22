import { Pool } from "pg";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";

config({ path: "./server/.env" });

const host = process.env.POSTGRES_HOST || "localhost";
const port = Number(process.env.POSTGRES_PORT || 5432);
const user = process.env.POSTGRES_USER || "postgres";
const password = process.env.POSTGRES_PASSWORD || "";
const database = process.env.POSTGRES_DB || "skillconnect";

const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
});

type SeedUser = {
  email: string;
  firstName: string;
  lastName: string;
  userType: "Professional" | "Employer" | "admin";
  location: string;
  telephoneNumber?: string;
};

const DEMO_PASSWORD = "Demo@123";
const BULK_EMPLOYERS = 28;
const BULK_PROFESSIONALS = 95;
const JOBS_PER_EMPLOYER = 14;
const APPLICATIONS_PER_PROFESSIONAL = 22;
const EXPERIENCES_PER_PROFESSIONAL = 4;
const STORIES_PER_USER = 2;
const MESSAGES_PER_APPLICATION = 2;

const users: SeedUser[] = [
  { email: "admin@skillconnect.com", firstName: "System", lastName: "Admin", userType: "admin", location: "Bangalore" },
  { email: "employer@skillconnect.com", firstName: "Priya", lastName: "Kapoor", userType: "Employer", location: "Mumbai", telephoneNumber: "+91-9000000001" },
  { email: "hr@skillconnect.com", firstName: "Rahul", lastName: "Mehta", userType: "Employer", location: "Pune", telephoneNumber: "+91-9000000002" },
  { email: "employee@skillconnect.com", firstName: "Aman", lastName: "Sharma", userType: "Professional", location: "Delhi", telephoneNumber: "+91-9000000003" },
  { email: "candidate2@skillconnect.com", firstName: "Sneha", lastName: "Patel", userType: "Professional", location: "Hyderabad", telephoneNumber: "+91-9000000004" },
];

const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Sai", "Krishna", "Ishaan", "Kabir",
  "Anaya", "Diya", "Kiara", "Saanvi", "Aadhya", "Myra", "Anika", "Riya", "Meera", "Ira"
];
const lastNames = [
  "Sharma", "Verma", "Gupta", "Patel", "Reddy", "Nair", "Khan", "Malhotra", "Joshi", "Singh",
  "Kapoor", "Chopra", "Mishra", "Yadav", "Bansal", "Iyer", "Pillai", "Deshmukh", "Kulkarni", "Das"
];
const cities = [
  "Bangalore", "Mumbai", "Pune", "Hyderabad", "Delhi", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Noida"
];
const companyPrefixes = ["Nova", "Future", "Quantum", "Vertex", "Nimbus", "Summit", "Pixel", "Blue", "Core", "Prime"];
const companySuffixes = ["Labs", "Tech", "Systems", "Works", "Solutions", "Dynamics", "Innovations", "Global"];
const industries = ["Technology", "FinTech", "HealthTech", "EdTech", "SaaS", "E-commerce"];
const jobTitles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Data Analyst",
  "UI/UX Designer",
  "QA Engineer",
  "Product Analyst",
  "Mobile Developer",
  "Cloud Engineer",
];
const seniorityLevels = ["Junior", "Senior", "Lead", "Principal", "Staff"];

/** Distinct, realistic titles for demo jobs (no numeric suffixes). */
function buildJobTitle(index: number): string {
  const base = jobTitles[index % jobTitles.length];
  const tier = Math.floor(index / jobTitles.length);
  if (tier === 0) return base;
  const level = seniorityLevels[(tier - 1) % seniorityLevels.length];
  return `${level} ${base}`;
}
const skillPool = [
  "React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "Kubernetes", "Python", "Django", "AWS", "Tailwind",
  "Figma", "GraphQL", "REST API", "Redis", "Next.js", "CI/CD", "Testing", "Jest", "Selenium", "Golang"
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickMany<T>(items: T[], count: number): T[] {
  const copy = [...items];
  const result: T[] = [];
  while (result.length < count && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

function randomPhone(index: number) {
  return `+91-9${String(100000000 + index).slice(0, 9)}`;
}

function randomDateWithinLastYears(years: number) {
  const now = Date.now();
  const past = now - years * 365 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

function makeBulkUsers(): SeedUser[] {
  const generated: SeedUser[] = [];

  for (let i = 0; i < BULK_EMPLOYERS; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    generated.push({
      email: `employer${i + 1}@skillconnect.com`,
      firstName: first,
      lastName: last,
      userType: "Employer",
      location: pick(cities),
      telephoneNumber: randomPhone(i + 100),
    });
  }

  for (let i = 0; i < BULK_PROFESSIONALS; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    generated.push({
      email: `professional${i + 1}@skillconnect.com`,
      firstName: first,
      lastName: last,
      userType: "Professional",
      location: pick(cities),
      telephoneNumber: randomPhone(i + 500),
    });
  }

  return generated;
}

async function getOrCreateUser(seed: SeedUser) {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [seed.email]);
  if (existing.rowCount && existing.rows[0]?.id) {
    return existing.rows[0].id as string;
  }

  const id = randomUUID();
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const createdAt = randomDateWithinLastYears(2);
  await pool.query(
    `INSERT INTO users (id, email, password, first_name, last_name, user_type, location, telephone_number, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, seed.email, hash, seed.firstName, seed.lastName, seed.userType, seed.location, seed.telephoneNumber ?? null, createdAt]
  );
  return id;
}

async function getOrCreateCompany(ownerId: string, name: string, location: string, industry = "Technology") {
  const existing = await pool.query("SELECT id FROM companies WHERE owner_id = $1 LIMIT 1", [ownerId]);
  if (existing.rowCount && existing.rows[0]?.id) return existing.rows[0].id as string;

  const id = randomUUID();
  const createdAt = randomDateWithinLastYears(2);
  await pool.query(
    `INSERT INTO companies (id, name, description, website, location, size, industry, owner_id, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      name,
      `https://${name.toLowerCase().replace(/\s+/g, "")}.com`,
      location,
      "51-200",
      industry,
      ownerId,
      createdAt,
    ]
  );
  return id;
}

async function ensureProfessionalProfile(userId: string, headline: string, skills: string[]) {
  const existing = await pool.query("SELECT id FROM professional_profiles WHERE user_id = $1 LIMIT 1", [userId]);
  if (existing.rowCount) return;

  const nextId = await pool.query("SELECT COALESCE(MAX(id), 0) + 1 AS id FROM professional_profiles");
  const id = Number(nextId.rows[0].id);
  await pool.query(
    `INSERT INTO professional_profiles (id, user_id, headline, bio, skills)
     VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [id, userId, headline, `Experienced ${headline}.`, JSON.stringify(skills)]
  );
}

async function ensureJob(companyId: string, employerId: string, title: string, jobType: string, skills: string[], location: string) {
  const existing = await pool.query(
    "SELECT id FROM jobs WHERE employer_id = $1 AND title = $2 LIMIT 1",
    [employerId, title]
  );
  if (existing.rowCount) return;

  const createdAt = randomDateWithinLastYears(1.5);
  await pool.query(
    `INSERT INTO jobs (id, title, description, requirements, location, job_type, salary_min, salary_max, skills, company_id, employer_id, is_active, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13)`,
    [
      randomUUID(),
      title,
      `We are hiring for ${title}.`,
      "Relevant experience and strong communication skills.",
      location,
      jobType,
      600000,
      1500000,
      JSON.stringify(skills),
      companyId,
      employerId,
      true,
      createdAt,
    ]
  );
}

async function ensureApplication(jobTitle: string, applicantId: string, status: "applied" | "reviewing" | "shortlisted" | "interview" | "hired" | "rejected", coverLetter: string) {
  const job = await pool.query("SELECT id FROM jobs WHERE title = $1 LIMIT 1", [jobTitle]);
  if (!job.rowCount || !job.rows[0]?.id) return;
  const jobId = job.rows[0].id as string;

  const existing = await pool.query(
    "SELECT id FROM applications WHERE job_id = $1 AND applicant_id = $2 LIMIT 1",
    [jobId, applicantId]
  );
  if (existing.rowCount) return;

  const appliedAt = randomDateWithinLastYears(1.2);
  const updatedAt = new Date(appliedAt);
  updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 21) + 1);

  await pool.query(
    `INSERT INTO applications (job_id, applicant_id, status, cover_letter, resume, notes, applied_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      jobId,
      applicantId,
      status,
      coverLetter,
      "/resumes/demo-resume.pdf",
      "Seeded demo application",
      appliedAt,
      status === "hired" ? updatedAt : appliedAt,
    ]
  );
}

async function ensureExperience(userId: string, title: string, company: string, index: number) {
  const existing = await pool.query(
    "SELECT id FROM experiences WHERE user_id = $1 AND title = $2 AND company = $3 LIMIT 1",
    [userId, title, company]
  );
  if (existing.rowCount) return;

  const startDate = randomDateWithinLastYears(8);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 12 + index * 3);

  await pool.query(
    `INSERT INTO experiences (user_id, title, company, description, start_date, end_date, is_current)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      userId,
      title,
      company,
      `Worked as ${title} at ${company}, contributing to product delivery and team outcomes.`,
      startDate,
      index === 0 ? null : endDate,
      index === 0,
    ]
  );
}

async function ensureStory(authorId: string, title: string, content: string, tags: string[]) {
  const existing = await pool.query(
    "SELECT id FROM stories WHERE author_id = $1 AND title = $2 LIMIT 1",
    [authorId, title]
  );
  if (existing.rowCount) return;

  await pool.query(
    `INSERT INTO stories (title, content, tags, author_id, approved, featured, views)
     VALUES ($1,$2,$3::text[],$4,$5,$6,$7)`,
    [title, content, tags, authorId, true, Math.random() > 0.85, Math.floor(Math.random() * 1200)]
  );
}

async function ensureMessage(senderId: string, receiverId: string, applicationId: number, content: string) {
  const existing = await pool.query(
    "SELECT id FROM messages WHERE sender_id = $1 AND receiver_id = $2 AND application_id = $3 AND content = $4 LIMIT 1",
    [senderId, receiverId, applicationId, content]
  );
  if (existing.rowCount) return;

  await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, application_id, content, is_read)
     VALUES ($1,$2,$3,$4,$5)`,
    [senderId, receiverId, applicationId, content, Math.random() > 0.3]
  );
}

async function ensureSession(userId: string, email: string) {
  try {
    const sid = `seed-${userId}`;
    const existing = await pool.query("SELECT sid FROM session WHERE sid = $1 LIMIT 1", [sid]);
    if (existing.rowCount) return;

    const expire = new Date();
    expire.setDate(expire.getDate() + 7);

    const sessionPayload = {
      cookie: {
        originalMaxAge: 7 * 24 * 60 * 60 * 1000,
        expires: expire.toISOString(),
        secure: false,
        httpOnly: true,
        path: "/",
      },
      userId,
      email,
    };

    await pool.query(
      `INSERT INTO session (sid, sess, expire)
       VALUES ($1, $2::json, $3)`,
      [sid, JSON.stringify(sessionPayload), expire]
    );
  } catch (error) {
    console.warn("Skipping session seed (table may differ):", error);
  }
}

async function backdateExistingRecords() {
  const users = await pool.query(`SELECT id FROM users ORDER BY email`);
  for (const row of users.rows as Array<{ id: string }>) {
    await pool.query(`UPDATE users SET created_at = $2 WHERE id = $1`, [row.id, randomDateWithinLastYears(2)]);
  }

  const companies = await pool.query(`SELECT id FROM companies ORDER BY name`);
  for (const row of companies.rows as Array<{ id: string }>) {
    await pool.query(
      `UPDATE companies SET created_at = $2, industry = $3 WHERE id = $1`,
      [row.id, randomDateWithinLastYears(2), pick(industries)]
    );
  }

  const jobs = await pool.query(`SELECT id FROM jobs ORDER BY created_at NULLS LAST`);
  for (const row of jobs.rows as Array<{ id: string }>) {
    await pool.query(`UPDATE jobs SET created_at = $2 WHERE id = $1`, [row.id, randomDateWithinLastYears(1.5)]);
  }

  const apps = await pool.query(`SELECT id, status FROM applications ORDER BY id`);
  for (const row of apps.rows as Array<{ id: number; status: string }>) {
    const appliedAt = randomDateWithinLastYears(1.2);
    const updatedAt = new Date(appliedAt);
    updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 28) + 2);
    const isHired = String(row.status).toLowerCase() === "hired";
    await pool.query(
      `UPDATE applications SET applied_at = $2, updated_at = $3 WHERE id = $1`,
      [row.id, appliedAt, isHired ? updatedAt : appliedAt]
    );
  }
}

async function seedBulkData(idMap: Record<string, string>) {
  const employerEmails = Object.keys(idMap).filter((email) => email.startsWith("employer"));
  const professionalEmails = Object.keys(idMap).filter((email) => email.startsWith("professional") || email === "employee@skillconnect.com" || email === "candidate2@skillconnect.com");

  const employerCompanyMap = new Map<string, string>();
  for (let i = 0; i < employerEmails.length; i++) {
    const email = employerEmails[i];
    const ownerId = idMap[email];
    const companyName = `${pick(companyPrefixes)} ${pick(companySuffixes)} ${i + 1}`;
    const companyId = await getOrCreateCompany(ownerId, companyName, pick(cities), pick(industries));
    employerCompanyMap.set(email, companyId);
  }

  for (const email of professionalEmails) {
    const userId = idMap[email];
    await ensureProfessionalProfile(
      userId,
      pick(["Frontend Engineer", "Backend Engineer", "Product Designer", "Data Analyst", "QA Specialist"]),
      pickMany(skillPool, 4)
    );

    for (let i = 0; i < EXPERIENCES_PER_PROFESSIONAL; i++) {
      await ensureExperience(userId, pick(jobTitles), `${pick(companyPrefixes)} ${pick(companySuffixes)}`, i);
    }

    for (let i = 0; i < STORIES_PER_USER; i++) {
      await ensureStory(
        userId,
        `Career Journey ${i + 1} - ${email}`,
        `I improved my skills in ${pickMany(skillPool, 3).join(", ")} and grew my impact across teams.`,
        pickMany(["career", "growth", "jobs", "mentorship", "learning", "technology"], 3)
      );
    }
  }

  for (const email of employerEmails) {
    const employerId = idMap[email];
    const companyId = employerCompanyMap.get(email);
    if (!companyId) continue;

    for (let i = 0; i < JOBS_PER_EMPLOYER; i++) {
      const title = buildJobTitle(i);
      await ensureJob(
        companyId,
        employerId,
        title,
        pick(["full-time", "part-time", "contract", "remote"]),
        pickMany(skillPool, 5),
        pick(cities)
      );
    }
  }

  const jobsResult = await pool.query("SELECT id, title, employer_id FROM jobs");
  const jobs = jobsResult.rows as Array<{ id: string; title: string; employer_id: string }>;

  const statusValues: Array<"applied" | "reviewing" | "shortlisted" | "interview" | "hired" | "rejected"> = [
    "applied",
    "reviewing",
    "shortlisted",
    "interview",
    "hired",
    "rejected",
  ];

  for (const professionalEmail of professionalEmails) {
    const applicantId = idMap[professionalEmail];
    const sampleJobs = pickMany(jobs, Math.min(APPLICATIONS_PER_PROFESSIONAL, jobs.length));
    for (const job of sampleJobs) {
      await ensureApplication(
        job.title,
        applicantId,
        pick(statusValues),
        `I am excited to apply for ${job.title}. My background includes ${pickMany(skillPool, 3).join(", ")}.`
      );
    }
  }

  const appsResult = await pool.query(`
    SELECT a.id, a.applicant_id, a.job_id, j.employer_id
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
  `);

  for (const app of appsResult.rows as Array<{ id: number; applicant_id: string; employer_id: string }>) {
    for (let i = 0; i < MESSAGES_PER_APPLICATION; i++) {
      const senderId = i % 2 === 0 ? app.applicant_id : app.employer_id;
      const receiverId = i % 2 === 0 ? app.employer_id : app.applicant_id;
      await ensureMessage(
        senderId,
        receiverId,
        app.id,
        i % 2 === 0
          ? "Hello, I am interested in this role and available for discussion."
          : "Thanks for applying. Please share your availability for an interview."
      );
    }
  }

  for (const [email, userId] of Object.entries(idMap)) {
    await ensureSession(userId, email);
  }
}

async function run() {
  try {
    const idMap: Record<string, string> = {};
    const allUsers = [...users, ...makeBulkUsers()];
    for (const u of allUsers) {
      idMap[u.email] = await getOrCreateUser(u);
    }

    await ensureProfessionalProfile(idMap["employee@skillconnect.com"], "Full Stack Developer", ["React", "Node.js", "PostgreSQL"]);
    await ensureProfessionalProfile(idMap["candidate2@skillconnect.com"], "UI/UX Designer", ["Figma", "Design Systems", "User Research"]);

    const c1 = await getOrCreateCompany(idMap["employer@skillconnect.com"], "Wipro", "Mumbai");
    const c2 = await getOrCreateCompany(idMap["hr@skillconnect.com"], "TechNova", "Pune");

    await ensureJob(c1, idMap["employer@skillconnect.com"], "Senior Frontend Developer", "full-time", ["React", "TypeScript", "Tailwind"], "Mumbai");
    await ensureJob(c1, idMap["employer@skillconnect.com"], "Backend Engineer", "full-time", ["Node.js", "PostgreSQL", "API Design"], "Bangalore");
    await ensureJob(c2, idMap["hr@skillconnect.com"], "UI/UX Designer", "full-time", ["Figma", "Prototyping", "Accessibility"], "Pune");

    await ensureApplication(
      "Senior Frontend Developer",
      idMap["employee@skillconnect.com"],
      "shortlisted",
      "I have 4+ years building React and TypeScript applications and would love to contribute."
    );
    await ensureApplication(
      "Backend Engineer",
      idMap["employee@skillconnect.com"],
      "interview",
      "I have hands-on experience with Node.js, PostgreSQL, and production API architecture."
    );
    await ensureApplication(
      "UI/UX Designer",
      idMap["candidate2@skillconnect.com"],
      "reviewing",
      "I specialize in design systems, user flows, and high-fidelity prototyping."
    );
    await ensureApplication(
      "Senior Frontend Developer",
      idMap["candidate2@skillconnect.com"],
      "applied",
      "I can collaborate closely with frontend teams and deliver polished user experiences."
    );

    await seedBulkData(idMap);

    await backdateExistingRecords();

    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM companies) AS companies,
        (SELECT COUNT(*)::int FROM jobs) AS jobs,
        (SELECT COUNT(*)::int FROM applications) AS applications
    `);
    console.log("Platform totals:", counts.rows[0]);

    console.log("Seed complete.");
    console.log("Demo credentials:");
    console.log("Admin: admin@skillconnect.com / Demo@123");
    console.log("Employer: employer@skillconnect.com / Demo@123");
    console.log("Professional: employee@skillconnect.com / Demo@123");
  } finally {
    await pool.end();
  }
}

run().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

