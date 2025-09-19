import { defineConfig } from 'drizzle-kit';
import { DrizzleConfig } from 'drizzle-orm';

export default defineConfig({
  schema: './shared/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} as DrizzleConfig);