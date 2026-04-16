import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: './server/.env' });

const host = process.env.POSTGRES_HOST || 'localhost';
const port = Number(process.env.POSTGRES_PORT || 5432);
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || '';
const database = process.env.POSTGRES_DB || 'graphicgenie';

export default {
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    port,
    user,
    password,
    database,
    ssl: false
  }
} satisfies Config;