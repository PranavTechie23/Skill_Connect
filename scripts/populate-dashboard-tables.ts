
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:dsa@localhost:5432/graphicgenie',
});

const userGrowthData = [
  { month: "Jan", users: 1000 },
  { month: "Feb", users: 1500 },
  { month: "Mar", users: 2000 },
  { month: "Apr", users: 2500 },
  { month: "May", users: 3000 },
  { month: "Jun", users: 3500 },
];

const jobCategoriesData = [
  { name: "Technology", value: 400 },
  { name: "Design", value: 300 },
  { name: "Marketing", value: 300 },
  { name: "Sales", value: 200 },
  { name: "Other", value: 100 },
];

const applicationStatusData = [
  { name: "Pending", value: 50 },
  { name: "Reviewed", value: 30 },
  { name: "Interviewed", value: 15 },
  { name: "Hired", value: 5 },
];

const engagementData = [
  { day: "Mon", messages: 120, applications: 50 },
  { day: "Tue", messages: 150, applications: 60 },
  { day: "Wed", messages: 180, applications: 70 },
  { day: "Thu", messages: 190, applications: 80 },
  { day: "Fri", messages: 160, applications: 65 },
  { day: "Sat", messages: 100, applications: 40 },
  { day: "Sun", messages: 80, applications: 30 },
];

const quickStatsData = {
    totalUsers: 3500,
    activeJobs: 250,
    applicationsToday: 75,
    successfulMatches: 120,
};

const topJobListingsData = [
    { title: "Senior Software Engineer", views: 1200, applications: 45 },
    { title: "UX Designer", views: 980, applications: 38 },
    { title: "Marketing Manager", views: 850, applications: 30 },
    { title: "Data Analyst", views: 720, applications: 25 },
    { title: "Customer Support Specialist", views: 650, applications: 20 },
];

async function populateTables() {
  const client = await pool.connect();
  try {
    for (const data of userGrowthData) {
      await client.query('INSERT INTO user_growth (month, users) VALUES ($1, $2)', [data.month, data.users]);
    }

    for (const data of jobCategoriesData) {
      await client.query('INSERT INTO job_categories (name, value) VALUES ($1, $2)', [data.name, data.value]);
    }

    for (const data of applicationStatusData) {
      await client.query('INSERT INTO application_status (name, value) VALUES ($1, $2)', [data.name, data.value]);
    }

    for (const data of engagementData) {
      await client.query('INSERT INTO engagement (day, messages, applications) VALUES ($1, $2, $3)', [data.day, data.messages, data.applications]);
    }

    await client.query('INSERT INTO quick_stats (total_users, active_jobs, applications_today, successful_matches) VALUES ($1, $2, $3, $4)', [quickStatsData.totalUsers, quickStatsData.activeJobs, quickStatsData.applicationsToday, quickStatsData.successfulMatches]);

    for (const data of topJobListingsData) {
      await client.query('INSERT INTO top_job_listings (title, views, applications) VALUES ($1, $2, $3)', [data.title, data.views, data.applications]);
    }

    console.log('Tables populated successfully');
  } catch (err) {
    console.error('Error populating tables', err);
  } finally {
    client.release();
  }
}

populateTables();
