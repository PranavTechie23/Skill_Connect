// server/src/storage.ts - CORRECT IMPORTS FOR DRIZZLE 0.44.6
import { type User, type InsertUser, type Company, type InsertCompany, type Job, type InsertJob, type Application, type InsertApplication, type Message, type InsertMessage, type Experience, type InsertExperience, type Story } from "./schema";
import { db } from "./db";
import { users, companies, jobs, applications, messages, experiences, stories } from "./schema";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getCompaniesByOwner(ownerId: string): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company>;
  
  // Jobs
  getJob(id: string): Promise<Job | undefined>;
  getJobs(filters?: { location?: string; skills?: string[]; jobType?: string; search?: string }): Promise<Job[]>;
  getJobsByEmployer(employerId: string): Promise<Job[]>;
  getJobsByCompany(companyId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<InsertJob>): Promise<Job>;
  
  // Applications
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsByJob(jobId: string): Promise<Application[]>;
  getApplicationsByApplicant(applicantId: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, updates: Partial<InsertApplication>): Promise<Application>;
  
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  getConversation(user1Id: string, user2Id: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message>;
  
  // Experiences
  getExperience(id: string): Promise<Experience | undefined>;
  getExperiencesByUser(userId: string): Promise<Experience[]>;
  createExperience(experience: InsertExperience): Promise<Experience>;
  updateExperience(id: string, updates: Partial<InsertExperience>): Promise<Experience>;
  deleteExperience(id: string): Promise<void>;

  // Stories
  createStory(story: {
    title: string;
    content: string;
    tags: string[];
    authorId: string;
    createdAt: Date;
  }): Promise<Story>;
  getStories(): Promise<Story[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, parseInt(id)))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // Companies
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, parseInt(id)));
    return company || undefined;
  }

  async getCompaniesByOwner(ownerId: string): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.ownerId, parseInt(ownerId)));
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, parseInt(id)))
      .returning();
    if (!company) throw new Error("Company not found");
    return company;
  }

  // Jobs
  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, parseInt(id)));
    return job || undefined;
  }

  async getJobs(filters?: { location?: string; skills?: string[]; jobType?: string; search?: string }): Promise<Job[]> {
    let whereConditions: any[] = [eq(jobs.isActive, true)];
    
    if (filters?.location && filters.location !== "All Locations") {
      whereConditions.push(ilike(jobs.location, `%${filters.location}%`));
    }
    
    if (filters?.jobType && filters.jobType !== "All Jobs") {
      whereConditions.push(eq(jobs.jobType, filters.jobType as "full-time" | "part-time" | "contract" | "remote"));
    }
    
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      whereConditions.push(
        or(
          ilike(jobs.title, searchPattern),
          ilike(jobs.description, searchPattern)
        )
      );
    }
    
    const allJobs = await db.select().from(jobs)
      .where(and(...whereConditions))
      .orderBy(desc(jobs.createdAt));
    
    // Filter by skills
    if (filters?.skills && filters.skills.length > 0) {
      return allJobs.filter(job => 
        job.skills && job.skills.some((jobSkill: string) =>
          filters.skills!.some(skill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }
    
    return allJobs;
  }

  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.employerId, parseInt(employerId)));
  }

  async getJobsByCompany(companyId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.companyId, parseInt(companyId)));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async updateJob(id: string, updates: Partial<InsertJob>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, parseInt(id)))
      .returning();
    if (!job) throw new Error("Job not found");
    return job;
  }

  // Applications
  async getApplication(id: string): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, parseInt(id)));
    return application || undefined;
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.jobId, parseInt(jobId)));
  }

  async getApplicationsByApplicant(applicantId: string): Promise<Application[]> {
    return await db.select().from(applications)
      .where(eq(applications.applicantId, parseInt(applicantId)))
      .orderBy(desc(applications.appliedAt));
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async updateApplication(id: string, updates: Partial<InsertApplication>): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set(updates)
      .where(eq(applications.id, parseInt(id)))
      .returning();
    if (!application) throw new Error("Application not found");
    return application;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, parseInt(id)));
    return message || undefined;
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(or(eq(messages.senderId, parseInt(userId)), eq(messages.receiverId, parseInt(userId))))
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(user1Id: string, user2Id: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(
        or(
          and(eq(messages.senderId, parseInt(user1Id)), eq(messages.receiverId, parseInt(user2Id))),
          and(eq(messages.senderId, parseInt(user2Id)), eq(messages.receiverId, parseInt(user1Id)))
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async markMessageAsRead(id: string): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, parseInt(id)))
      .returning();
    if (!message) throw new Error("Message not found");
    return message;
  }

  // Experiences
  async getExperience(id: string): Promise<Experience | undefined> {
    const [experience] = await db.select().from(experiences).where(eq(experiences.id, parseInt(id)));
    return experience || undefined;
  }

  async getExperiencesByUser(userId: string): Promise<Experience[]> {
    return await db.select().from(experiences).where(eq(experiences.userId, parseInt(userId)));
  }

  async createExperience(insertExperience: InsertExperience): Promise<Experience> {
    try {
      console.log('🛠️ Storage: Creating experience with:', insertExperience);
      
      const [experience] = await db
        .insert(experiences)
        .values(insertExperience)
        .returning();
      
      console.log('✅ Storage: Experience created:', experience);
      return experience;
    } catch (error) {
      console.error('❌ Storage: Error creating experience:', error);
      throw error;
    }
  }

  async updateExperience(id: string, updates: Partial<InsertExperience>): Promise<Experience> {
    const [experience] = await db
      .update(experiences)
      .set(updates)
      .where(eq(experiences.id, parseInt(id)))
      .returning();
    if (!experience) throw new Error("Experience not found");
    return experience;
  }

  async deleteExperience(id: string): Promise<void> {
    await db.delete(experiences).where(eq(experiences.id, parseInt(id)));
  }

  // Stories
  async createStory(story: {
    title: string;
    content: string;
    tags: string[];
    authorId: string;
    createdAt: Date;
  }): Promise<Story> {
    const result = await db.insert(stories).values({
      title: story.title,
      content: story.content,
      authorId: parseInt(story.authorId),
      tags: story.tags,
      createdAt: story.createdAt
    }).returning();
    
    return result[0];
  }

  async getStories(): Promise<Story[]> {
    return await db.select().from(stories).orderBy(desc(stories.createdAt));
  }
}
export const storage = new DatabaseStorage();