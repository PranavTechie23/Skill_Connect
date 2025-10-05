// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './server/src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres:dsa@localhost:5432/graphicgenie', // ✅ Hardcoded URL
  },
  verbose: true,
  strict: true
} satisfies Config;