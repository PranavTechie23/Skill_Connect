
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:dsa@localhost:5432/graphicgenie',
});

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_growth (
        id serial PRIMARY KEY,
        month text NOT NULL,
        users integer NOT NULL
      );

      CREATE TABLE IF NOT EXISTS job_categories (
        id serial PRIMARY KEY,
        name text NOT NULL,
        value integer NOT NULL
      );

      CREATE TABLE IF NOT EXISTS application_status (
        id serial PRIMARY KEY,
        name text NOT NULL,
        value integer NOT NULL
      );

      CREATE TABLE IF NOT EXISTS engagement (
        id serial PRIMARY KEY,
        day text NOT NULL,
        messages integer NOT NULL,
        applications integer NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quick_stats (
        id serial PRIMARY KEY,
        total_users integer NOT NULL,
        active_jobs integer NOT NULL,
        applications_today integer NOT NULL,
        successful_matches integer NOT NULL
      );

      CREATE TABLE IF NOT EXISTS top_job_listings (
        id serial PRIMARY KEY,
        title varchar(255) NOT NULL,
        views integer NOT NULL,
        applications integer NOT NULL
      );
    `);
    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables', err);
  } finally {
    client.release();
  }
}

createTables();
