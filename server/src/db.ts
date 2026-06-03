import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../shared/schema";
import * as relations from "./relations";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const host = process.env.POSTGRES_HOST || "localhost";
const port = process.env.POSTGRES_PORT || "5432";
const user = process.env.POSTGRES_USER || "postgres";
const password = process.env.POSTGRES_PASSWORD || "root123";
const database = process.env.POSTGRES_DB || "skillconnect";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
console.log("Using database URL:", DATABASE_URL);

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait before timing out when connecting a new client
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Test the connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    client.release();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  }
}

testConnection();

export const db = drizzle(pool, { schema: { ...schema, ...relations } });

// Add a health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

const NOTIFICATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  link_tab text,
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
`;

/** Ensures notifications table exists (migration 0009 may not have been applied). */
export async function ensureNotificationsTable(): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<{ tbl: string | null }>(
        "SELECT to_regclass('public.notifications') AS tbl",
      );
      if (rows[0]?.tbl) return;
      await client.query(NOTIFICATIONS_TABLE_SQL);
      console.log('✅ Created missing notifications table');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to ensure notifications table:', error);
  }
}

export { pool };
export default db;
