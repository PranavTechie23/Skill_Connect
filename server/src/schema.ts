
import { pgTable, serial, text, integer, varchar } from "drizzle-orm/pg-core";

export const userGrowth = pgTable("user_growth", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(),
  users: integer("users").notNull(),
});

export const jobCategories = pgTable("job_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: integer("value").notNull(),
});

export const applicationStatus = pgTable("application_status", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: integer("value").notNull(),
});

export const engagement = pgTable("engagement", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(),
  messages: integer("messages").notNull(),
  applications: integer("applications").notNull(),
});

export const quickStats = pgTable("quick_stats", {
    id: serial("id").primaryKey(),
    totalUsers: integer("total_users").notNull(),
    activeJobs: integer("active_jobs").notNull(),
    applicationsToday: integer("applications_today").notNull(),
    successfulMatches: integer("successful_matches").notNull(),
});

export const topJobListings = pgTable("top_job_listings", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    views: integer("views").notNull(),
    applications: integer("applications").notNull(),
});
