import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, serial } from "drizzle-orm/pg-core";
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
  accountStatus: text("account_status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionalProfiles = pgTable("professional_profiles", {
    id: integer("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
    headline: text("headline"),
    bio: text("bio"),
    skills: jsonb("skills").default('[]'), // Store as native JSON
    resumeUrl: text("resume_url"),
    resumeName: text("resume_name"),
    experience: jsonb("experience").default('[]'),
    education: jsonb("education").default('[]'),
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
  coverImage: text("cover_image"),
  culture: jsonb("culture").default({ tags: [], benefits: [] }),
  ownerId: text("owner_id").references(() => users.id),
  status: text("status").notNull().default("approved"),
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
  deadline: timestamp("deadline"),
  isActive: boolean("is_active").default(true),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),

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
  id: serial("id").primaryKey(),

  senderId: text("sender_id").references(() => users.id, { onDelete: 'cascade' }),
  receiverId: text("receiver_id").references(() => users.id, { onDelete: 'cascade' }),
  applicationId: integer("application_id").references(() => applications.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),

  userId: text("user_id").references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isCurrent: boolean("is_current").default(false),
});

export const stories = pgTable('stories', {
  id: serial('id').primaryKey(),

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

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // application_status | new_message | application_submitted
  title: text("title").notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata").default({}),
  isRead: boolean("is_read").default(false),
  linkTab: text("link_tab"), // activity | applications | messages
  createdAt: timestamp("created_at").defaultNow(),
});


export const aiEvents = pgTable("ai_events", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  feature: text("feature").notNull(),
  provider: text("provider"),
  model: text("model"),
  status: text("status").notNull(), // success | error
  latencyMs: integer("latency_ms"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resumeParses = pgTable("resume_parses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  resumeUrl: text("resume_url").notNull(),
  extractedText: text("extracted_text"),
  parseStatus: text("parse_status").notNull().default("pending"), // pending | success | error
  errorMessage: text("error_message"),
  aiModel: text("ai_model"),
  metadata: jsonb("metadata").default({}), // { name?, email?, phone?, skills: [], experience: [], education: [] }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  deadline: z.union([z.string(), z.date()]).nullable().optional(),
  isActive: z.boolean().default(true),
  status: z.string().optional(),
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

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAiEventSchema = createInsertSchema(aiEvents).omit({
  id: true,
  createdAt: true,
});

export const insertResumeParseSchema = createInsertSchema(resumeParses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const reviewPackSchema = z.object({
  candidateSummary: z.string().describe("A short paragraph summarizing the candidate's fit for the job"),
  matchedSkills: z.array(z.string()).describe("Skills that match the job requirements"),
  missingSkills: z.array(z.string()).describe("Required or desired skills the candidate lacks"),
  suggestedInterviewQuestions: z.array(z.string()).describe("3-4 tailored interview questions based on the candidate's background and the job"),
});

export const moderationResultSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high"]),
  flags: z.array(z.string()).describe("Specific policy violations or suspicious signals detected"),
  reasoning: z.string().describe("Explanation for the assigned risk level and flags"),
  suggestedAction: z.enum(["approve", "reject", "suspend", "flag_for_review", "none"]),
});

// Profile update schema (professional_profiles table)
export const updateProfileSchema = z.object({
  headline: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
});

// Combined employee profile update (users + professional_profiles)
export const updateMeProfileSchema = updateProfileSchema.extend({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  location: z.string().optional(),
  telephoneNumber: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type InsertProfessionalProfile = Omit<typeof professionalProfiles.$inferInsert, 'id'>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type UpdateMeProfile = z.infer<typeof updateMeProfileSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Application = typeof applications.$inferSelect;

export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AiEvent = typeof aiEvents.$inferSelect;
export type InsertAiEvent = z.infer<typeof insertAiEventSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ReviewPack = z.infer<typeof reviewPackSchema>;
export type ModerationResult = z.infer<typeof moderationResultSchema>;
