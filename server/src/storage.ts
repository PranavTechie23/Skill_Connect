// server/src/storage.ts - CORRECT IMPORTS FOR DRIZZLE 0.44.6
import { type User, type InsertUser, type Company, type InsertCompany, type Job, type InsertJob, type Application, type InsertApplication, type Message, type InsertMessage, type Experience, type InsertExperience, type Story, type ProfessionalProfile, type InsertProfessionalProfile } from "../../shared/schema";
import { db } from "./db";
import { users, professionalProfiles, companies, jobs, applications, messages, experiences, stories } from "../../shared/schema";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string | number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string | number, updates: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string | number): Promise<void>;

  // Professional Profiles
  createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile>;
  getProfessionalProfileByUserId(userId: string | number): Promise<ProfessionalProfile | undefined>;
  updateProfessionalProfile(userId: string | number, updates: Partial<InsertProfessionalProfile>): Promise<ProfessionalProfile>;
  
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getCompany(id: string | number): Promise<Company | undefined>;
  getCompaniesByOwner(ownerId: string | number): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company>;
  getAllCompanies(): Promise<Company[]>;
  deleteCompany(id: string | number): Promise<void>;
  
  // Jobs
  getJob(id: string | number): Promise<Job | undefined>;
  getJobs(filters?: { location?: string; skills?: string[]; jobType?: string; search?: string }): Promise<Job[]>;
  getJobsByEmployer(employerId: string | number): Promise<Job[]>;
  getJobsByCompany(companyId: string | number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: string | number): Promise<void>;
  
  // Applications
  getApplication(id: string | number): Promise<Application | undefined>;
  getApplicationsByJob(jobId: string | number): Promise<Application[]>;
  getApplicationsByApplicant(applicantId: string | number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, updates: Partial<InsertApplication>): Promise<Application>;
  
  // Messages
  getMessage(id: string | number): Promise<Message | undefined>;
  getMessagesByUser(userId: string | number): Promise<Message[]>;
  getConversation(user1Id: string | number, user2Id: string | number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message>;
  
  // Experiences
  getExperience(id: string | number): Promise<Experience | undefined>;
  getExperiencesByUser(userId: string | number): Promise<Experience[]>;
  createExperience(experience: InsertExperience): Promise<Experience>;
  updateExperience(id: string, updates: Partial<InsertExperience>): Promise<Experience>;
  deleteExperience(id: string): Promise<void>;

  // Stories
  createStory(story: {
    title: string;
    content: string;
    tags: string[];
    authorId: number;
    createdAt: Date;
  }): Promise<Story>;
  getStories(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string | number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, String(id)));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log('🛠️ Storage: createUser payload:', insertUser);
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      console.log('✅ Storage: User created:', user);
      return user;
    } catch (error) {
      console.error('❌ Storage: Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string | number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, String(id)))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  
  async deleteUser(id: string | number): Promise<void> {
    await db.delete(users).where(eq(users.id, String(id)));
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }
  
  async deleteCompany(id: string | number): Promise<void> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    await db.delete(companies).where(eq(companies.id, nid as number));
  }
  
  async deleteJob(id: string | number): Promise<void> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    await db.delete(jobs).where(eq(jobs.id, nid as number));
  }
  
  // Professional Profiles
  async createProfessionalProfile(insertProfile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    const [profile] = await db
      .insert(professionalProfiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async getProfessionalProfileByUserId(userId: string | number): Promise<ProfessionalProfile | undefined> {
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, String(userId)));
    return profile || undefined;
  }

  async updateProfessionalProfile(userId: string | number, updates: Partial<InsertProfessionalProfile>): Promise<ProfessionalProfile> {
    const [profile] = await db
      .update(professionalProfiles)
      .set(updates)
      .where(eq(professionalProfiles.userId, String(userId)))
      .returning();
    if (!profile) throw new Error("Professional profile not found");
    return profile;
  }

  // Companies
  async getCompany(id: string | number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, String(id)));
    return company || undefined;
  }

  async getCompaniesByOwner(ownerId: string | number): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.ownerId, String(ownerId)));
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: string | number, updates: Partial<InsertCompany>): Promise<Company> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const [company] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, nid as number))
      .returning();
    if (!company) throw new Error("Company not found");
    return company;
  }

  async deleteCompany(id: string | number): Promise<void> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    await db.delete(companies).where(eq(companies.id, nid as number));
  }

  // Jobs
  async getJob(id: string | number): Promise<Job | undefined> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const [job] = await db.select().from(jobs).where(eq(jobs.id, nid as number));
    return job || undefined;
  }

  // Fix for getJobs method
  async getJobs(filters?: { location?: string; skills?: string[]; jobType?: string; search?: string }): Promise<Job[]> {
      const whereConditions: any[] = [];
      
      if (filters?.location) {
        whereConditions.push(ilike(jobs.location, `%${filters.location}%`));
      }
      
      if (filters?.jobType) {
        whereConditions.push(eq(jobs.jobType, filters.jobType));
      }
      
      if (filters?.search) {
        whereConditions.push(
          or(
            ilike(jobs.title, `%${filters.search}%`),
            ilike(jobs.description, `%${filters.search}%`)
          )
        );
      }
      
      if (whereConditions.length === 0) {
        return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
      }
      
      return await db.select().from(jobs)
        .where(and(...whereConditions))
        .orderBy(desc(jobs.createdAt));
  }
  
  
  async getJobsByEmployer(employerId: string | number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.employerId, String(employerId)));
  }

  async getJobsByCompany(companyId: string | number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.companyId, String(companyId)));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async updateJob(id: string | number, updates: Partial<InsertJob>): Promise<Job> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const [job] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, nid as number))
      .returning();
    if (!job) throw new Error("Job not found");
    return job;
  }

  async deleteJob(id: string | number): Promise<void> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    await db.delete(jobs).where(eq(jobs.id, nid as number));
  }

  // Applications
  async getApplication(id: string | number): Promise<Application | undefined> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const [application] = await db.select().from(applications).where(eq(applications.id, nid as number));
    return application || undefined;
  }

  async getApplicationsByJob(jobId: string | number): Promise<Application[]> {
    if (jobId === "all") {
      return await db.select().from(applications).orderBy(desc(applications.appliedAt));
    }
    return await db.select().from(applications).where(eq(applications.jobId, String(jobId)));
  }

  async getApplicationsByApplicant(applicantId: string | number): Promise<Application[]> {
    return await db.select().from(applications)
      .where(eq(applications.applicantId, String(applicantId)))
      .orderBy(desc(applications.appliedAt));
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async updateApplication(id: string | number, updates: Partial<InsertApplication>): Promise<Application> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const [application] = await db
      .update(applications)
      .set(updates)
      .where(eq(applications.id, nid as number))
      .returning();
    if (!application) throw new Error("Application not found");
    return application;
  }

  // Messages
  async getMessage(id: string | number): Promise<Message | undefined> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const [message] = await db.select().from(messages).where(eq(messages.id, nid as number));
    return message || undefined;
  }

  async getMessagesByUser(userId: string | number): Promise<Message[]> {
    const nid = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    return await db.select().from(messages)
      .where(or(eq(messages.senderId, nid as number), eq(messages.receiverId, nid as number)))
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(user1Id: string | number, user2Id: string | number): Promise<Message[]> {
    const n1 = typeof user1Id === 'string' ? parseInt(user1Id, 10) : user1Id;
    const n2 = typeof user2Id === 'string' ? parseInt(user2Id, 10) : user2Id;
    return await db.select().from(messages)
      .where(
        or(
          and(eq(messages.senderId, n1 as number), eq(messages.receiverId, n2 as number)),
          and(eq(messages.senderId, n2 as number), eq(messages.receiverId, n1 as number))
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

  async markMessageAsRead(id: string | number): Promise<Message> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const [message] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, nid as number))
      .returning();
    if (!message) throw new Error("Message not found");
    return message;
  }

  // Experiences
  async getExperience(id: string | number): Promise<Experience | undefined> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const [experience] = await db.select().from(experiences).where(eq(experiences.id, nid as number));
    return experience || undefined;
  }

  async getExperiencesByUser(userId: string | number): Promise<Experience[]> {
    const nid = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    return await db.select().from(experiences).where(eq(experiences.userId, nid as number));
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

  async updateExperience(id: string | number, updates: Partial<InsertExperience>): Promise<Experience> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const [experience] = await db
      .update(experiences)
      .set(updates)
      .where(eq(experiences.id, nid as number))
      .returning();
    if (!experience) throw new Error("Experience not found");
    return experience;
  }

  async deleteExperience(id: string | number): Promise<void> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    await db.delete(experiences).where(eq(experiences.id, nid as number));
  }

  // Helper to fetch all companies (used by routes)
  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  // Stories
  async createStory(story: {
    title: string;
    content: string;
    tags: string[];
    authorId: number;
    createdAt: Date;
  }): Promise<Story> {
    const result = await db.insert(stories).values({
      title: story.title,
      content: story.content,
      authorId: Number(story.authorId),
      tags: story.tags,
      createdAt: story.createdAt
    }).returning();
    
    return result[0];
  }

  async getStories(): Promise<any[]> { // The return type is now more complex
    const result = await db.query.stories.findMany({
      with: {
        author: {
          columns: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: desc(stories.createdAt),
    });
    return result;
  }
}
export const storage = new DatabaseStorage();