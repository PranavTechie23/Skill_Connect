import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  userType: text("user_type").notNull(), // 'Professional' | 'Employer' | 'admin'
  location: text("location"),
  profilePhoto: text("profile_photo"),
  telephoneNumber: text("telephone_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionalProfiles = pgTable("professional_profiles", {
    id: integer("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
    headline: text("headline"),
    bio: text("bio"),
    skills: jsonb("skills").default('[]'), // Store as native JSON
});

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  location: text("location"),
  size: text("size"),
  industry: text("industry"),
  logo: text("logo"),
  ownerId: text("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  location: text("location").notNull(),
  jobType: text("job_type").notNull(), // 'full-time' | 'part-time' | 'contract' | 'remote'
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  skills: jsonb("skills").default('[]'), // Store as native JSON
  companyId: text("company_id").references(() => companies.id, { onDelete: 'cascade' }),
  employerId: text("employer_id").references(() => users.id, { onDelete: 'cascade' }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: integer("id").primaryKey(),
  jobId: text("job_id").references(() => jobs.id),
  applicantId: text("applicant_id").references(() => users.id, { onDelete: 'cascade' }),
  status: text("status").notNull().default("applied"),
  coverLetter: text("cover_letter"),
  resume: text("resume"),
  notes: text("notes"),
  appliedAt: timestamp("applied_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: integer("id").primaryKey(),
  senderId: text("sender_id").references(() => users.id, { onDelete: 'cascade' }),
  receiverId: text("receiver_id").references(() => users.id, { onDelete: 'cascade' }),
  applicationId: integer("application_id").references(() => applications.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const experiences = pgTable("experiences", {
  id: integer("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isCurrent: boolean("is_current").default(false),
});

export const stories = pgTable('stories', {
  id: integer('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  tags: text("tags").array().default([]),
  submitterName: varchar('submitter_name', { length: 255 }),
  submitterEmail: varchar('submitter_email', { length: 255 }),
  authorId: text("author_id").references(() => users.id, { onDelete: 'set null' }),
  approved: boolean("approved").default(false),
  featured: boolean("featured").default(false),
  views: integer("views").default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});



// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  telephoneNumber: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertProfessionalProfileSchema = createInsertSchema(professionalProfiles).omit({
    id: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertJobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().min(1, "Requirements are required"),
  location: z.string().min(1, "Location is required"),
  jobType: z.enum(["full-time", "part-time", "contract", "remote"]),
  salaryMin: z.number().int().min(0).nullable(),
  salaryMax: z.number().int().min(0).nullable(),
  skills: z.array(z.string()).default([]),
  companyId: z.string(),
  employerId: z.string(),
  isActive: z.boolean().default(true),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertExperienceSchema = createInsertSchema(experiences).omit({
  id: true,
});

export const insertStorySchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()).optional(),
  submitterName: z.string().max(255).optional(),
  submitterEmail: z.string().email().max(255).optional(),
  authorId: z.string().nullable(),
});


// Auth schemas
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  userType: z.enum(["Professional", "Employer", "admin"]),
  location: z.string().optional(),
  profilePhoto: z.string().optional(),
  confirmPassword: z.string(),
  telephoneNumber: z.string().optional(),
  companyName: z.string().optional(),
  companyBio: z.string().optional(),
  companyWebsite: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
}).loose().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const adminCreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  userType: z.enum(["Professional", "Employer", "admin"]),
  location: z.string().optional(),
  title: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type InsertProfessionalProfile = z.infer<typeof insertProfessionalProfileSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;