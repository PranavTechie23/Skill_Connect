
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const stories = pgTable('stories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
