import { pgTable, serial, text, varchar, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const userTypeEnum = pgEnum('user_type', ['Professional', 'Employer', 'Admin']);
export const jobTypeEnum = pgEnum('job_type', ['full-time', 'part-time', 'contract', 'remote']);
export const applicationStatusEnum = pgEnum('application_status', ['applied', 'under_review', 'interview', 'offered', 'rejected']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  userType: userTypeEnum("user_type").notNull(),
  location: text("location"),
  title: text("title"),
  bio: text("bio"),
  skills: json("skills").$type<string[]>(),
  profilePhoto: text("profile_photo"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Companies table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  website: text("website"),
  location: text("location"),
  industry: text("industry"),
  size: text("size"),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  location: text("location").notNull(),
  jobType: jobTypeEnum("job_type").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  skills: json("skills").$type<string[]>(),
  companyId: integer("company_id").references(() => companies.id),
  employerId: integer("employer_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Applications table
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  applicantId: integer("applicant_id").references(() => users.id).notNull(),
  status: applicationStatusEnum("status").default('applied'),
  appliedAt: timestamp("applied_at").defaultNow(),
  coverLetter: text("cover_letter"),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Experiences table
export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isCurrent: boolean("is_current").default(false),
});

// Stories table
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = typeof experiences.$inferInsert;
export type Story = typeof stories.$inferSelect;