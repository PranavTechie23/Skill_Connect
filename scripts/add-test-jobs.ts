import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
config();

const host = process.env.POSTGRES_HOST || 'localhost';
const port = parseInt(process.env.POSTGRES_PORT || '5432');
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || 'postgres123';
const database = process.env.POSTGRES_DB || 'jobportal';

const connectionString = `postgres://${user}:${password}@${host}:${port}/${database}?sslmode=disable`;
const queryClient = postgres(connectionString, { 
  ssl: false,
  onnotice: () => {}, // Ignore notice messages
  max: 1 // Use a single connection
});
const db = drizzle(queryClient);

async function addTestData() {
  try {
    // Create test employers
    console.log('🧑‍💼 Creating test employers...');
    const employers = [
      {
        id: uuidv4(),
        email: 'employer1@techcorp.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'John',
        lastName: 'Tech',
        userType: 'employer',
        location: 'Mumbai',
      },
      {
        id: uuidv4(),
        email: 'employer2@webtech.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Jane',
        lastName: 'Web',
        userType: 'employer',
        location: 'Pune',
      },
      {
        id: uuidv4(),
        email: 'employer3@datatech.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Mike',
        lastName: 'Data',
        userType: 'employer',
        location: 'Bangalore',
      }
    ];

    for (const employer of employers) {
      // First check if the user exists
      const existingUser = await db.execute(sql`
        SELECT id FROM users WHERE email = ${employer.email};
      `);

      if (existingUser.length > 0) {
        console.log(`👥 Using existing employer: ${employer.email}`, existingUser[0]);
        employer.id = existingUser[0].id as string;
      } else {
        // Create new user if they don't exist
        const query = sql`
          INSERT INTO users (
            id, email, password, first_name, last_name, user_type, location
          ) VALUES (
            ${employer.id},
            ${employer.email},
            ${employer.password},
            ${employer.firstName},
            ${employer.lastName},
            ${employer.userType},
            ${employer.location}
          )
          RETURNING id;
        `;

        const result = await db.execute(query);
        console.log(`✅ Created new employer: ${employer.email}`, result[0]);
        employer.id = result[0].id as string;
      }
    }

    // Create test companies
    console.log('🏢 Creating test companies...');
    const companies = [
      {
        id: uuidv4(),
        name: 'Tech Corp',
        description: 'Leading technology solutions provider',
        website: 'https://techcorp.example.com',
        location: 'Mumbai',
        size: '500+',
        industry: 'Technology',
        ownerId: employers[0].id,
      },
      {
        id: uuidv4(),
        name: 'WebTech Solutions',
        description: 'Modern web development company',
        website: 'https://webtech.example.com',
        location: 'Pune',
        size: '50-200',
        industry: 'Technology',
        ownerId: employers[1].id,
      },
      {
        id: uuidv4(),
        name: 'DataTech',
        description: 'Data analytics and processing solutions',
        website: 'https://datatech.example.com',
        location: 'Bangalore',
        size: '200-500',
        industry: 'Technology',
        ownerId: employers[2].id,
      }
    ];

    for (const company of companies) {
      const query = sql`
        INSERT INTO companies (
          id, name, description, website, location, size, industry, owner_id
        ) VALUES (
          ${company.id},
          ${company.name},
          ${company.description},
          ${company.website},
          ${company.location},
          ${company.size},
          ${company.industry},
          ${company.ownerId}
        )
        ON CONFLICT DO NOTHING
        RETURNING id;
      `;

      const result = await db.execute(query);
      console.log(`✅ Created company: ${company.name}`, result[0]);
    }

    // Create test jobs
    console.log('💼 Creating test jobs...');
    const testJobs = [
      {
        id: uuidv4(),
        title: 'Senior Software Engineer',
        description: 'Looking for an experienced software engineer to join our team.',
        requirements: 'At least 5 years of experience in web development.',
        location: 'Mumbai, India',
        job_type: 'full-time',
        salary_min: 1500000,
        salary_max: 2500000,
        skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
        company_id: companies[0].id,
        employer_id: employers[0].id,
        is_active: true
      },
      {
        id: uuidv4(),
        title: 'Frontend Developer',
        description: 'Join our team as a frontend developer.',
        requirements: 'Experience with React and modern JavaScript.',
        location: 'Pune, India',
        job_type: 'full-time',
        salary_min: 800000,
        salary_max: 1500000,
        skills: ['HTML', 'CSS', 'JavaScript', 'React'],
        company_id: companies[1].id,
        employer_id: employers[1].id,
        is_active: true
      },
      {
        id: uuidv4(),
        title: 'Backend Developer',
        description: 'Backend developer needed for our growing team.',
        requirements: 'Strong understanding of Node.js and databases.',
        location: 'Bangalore, India',
        job_type: 'full-time',
        salary_min: 1000000,
        salary_max: 1800000,
        skills: ['Node.js', 'PostgreSQL', 'Express', 'TypeScript'],
        company_id: companies[2].id,
        employer_id: employers[2].id,
        is_active: true
      },
      {
        id: uuidv4(),
        title: 'DevOps Engineer',
        description: 'Looking for a DevOps engineer to improve our infrastructure.',
        requirements: 'Experience with AWS and containerization.',
        location: 'Mumbai, India',
        job_type: 'full-time',
        salary_min: 1200000,
        salary_max: 2000000,
        skills: ['Docker', 'Kubernetes', 'AWS', 'Jenkins'],
        company_id: companies[0].id,
        employer_id: employers[0].id,
        is_active: true
      },
      {
        id: uuidv4(),
        title: 'UI/UX Designer',
        description: 'Creative designer needed for our product team.',
        requirements: 'Portfolio showcasing user interface designs.',
        location: 'Pune, India',
        job_type: 'full-time',
        salary_min: 800000,
        salary_max: 1500000,
        skills: ['Figma', 'Adobe XD', 'UI Design', 'UX Research'],
        company_id: companies[1].id,
        employer_id: employers[1].id,
        is_active: true
      }
    ];

    for (const job of testJobs) {
      const query = sql`
        INSERT INTO jobs (
          id,
          title,
          description,
          requirements,
          location,
          job_type,
          salary_min,
          salary_max,
          skills,
          company_id,
          employer_id,
          is_active,
          created_at
        ) VALUES (
          ${job.id},
          ${job.title},
          ${job.description},
          ${job.requirements},
          ${job.location},
          ${job.job_type},
          ${job.salary_min},
          ${job.salary_max},
          ARRAY[${sql.join(job.skills.map(s => sql`${s}`), sql`, `)}],
          ${job.company_id},
          ${job.employer_id},
          ${job.is_active},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;

      const result = await db.execute(query);
      console.log(`✅ Created job: ${job.title}`, result[0]);
    }

    console.log('✅ Successfully added test data');
    await queryClient.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test data:', error);
    await queryClient.end();
    process.exit(1);
  }
}

addTestData();