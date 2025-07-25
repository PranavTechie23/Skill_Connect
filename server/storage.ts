import { type User, type InsertUser, type Company, type InsertCompany, type Job, type InsertJob, type Application, type InsertApplication, type Message, type InsertMessage, type Experience, type InsertExperience } from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private companies: Map<string, Company> = new Map();
  private jobs: Map<string, Job> = new Map();
  private applications: Map<string, Application> = new Map();
  private messages: Map<string, Message> = new Map();
  private experiences: Map<string, Experience> = new Map();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Companies
  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompaniesByOwner(ownerId: string): Promise<Company[]> {
    return Array.from(this.companies.values()).filter(company => company.ownerId === ownerId);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company: Company = {
      ...insertCompany,
      id,
      createdAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company> {
    const company = this.companies.get(id);
    if (!company) throw new Error("Company not found");
    
    const updatedCompany = { ...company, ...updates };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  // Jobs
  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobs(filters?: { location?: string; skills?: string[]; jobType?: string; search?: string }): Promise<Job[]> {
    let jobs = Array.from(this.jobs.values()).filter(job => job.isActive);
    
    if (filters?.location && filters.location !== "All Locations") {
      jobs = jobs.filter(job => job.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    
    if (filters?.skills && filters.skills.length > 0) {
      jobs = jobs.filter(job => 
        filters.skills!.some(skill => 
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }
    
    if (filters?.jobType && filters.jobType !== "All Jobs") {
      jobs = jobs.filter(job => job.jobType === filters.jobType);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }
    
    return jobs.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.employerId === employerId);
  }

  async getJobsByCompany(companyId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.companyId === companyId);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = {
      ...insertJob,
      id,
      createdAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: string, updates: Partial<InsertJob>): Promise<Job> {
    const job = this.jobs.get(id);
    if (!job) throw new Error("Job not found");
    
    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  // Applications
  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.jobId === jobId);
  }

  async getApplicationsByApplicant(applicantId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.applicantId === applicantId)
      .sort((a, b) => b.appliedAt!.getTime() - a.appliedAt!.getTime());
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const application: Application = {
      ...insertApplication,
      id,
      appliedAt: new Date(),
      updatedAt: new Date(),
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(id: string, updates: Partial<InsertApplication>): Promise<Application> {
    const application = this.applications.get(id);
    if (!application) throw new Error("Application not found");
    
    const updatedApplication = { 
      ...application, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.senderId === userId || msg.receiverId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getConversation(user1Id: string, user2Id: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === user1Id && msg.receiverId === user2Id) ||
        (msg.senderId === user2Id && msg.receiverId === user1Id)
      )
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: string): Promise<Message> {
    const message = this.messages.get(id);
    if (!message) throw new Error("Message not found");
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Experiences
  async getExperience(id: string): Promise<Experience | undefined> {
    return this.experiences.get(id);
  }

  async getExperiencesByUser(userId: string): Promise<Experience[]> {
    return Array.from(this.experiences.values()).filter(exp => exp.userId === userId);
  }

  async createExperience(insertExperience: InsertExperience): Promise<Experience> {
    const id = randomUUID();
    const experience: Experience = {
      ...insertExperience,
      id,
    };
    this.experiences.set(id, experience);
    return experience;
  }

  async updateExperience(id: string, updates: Partial<InsertExperience>): Promise<Experience> {
    const experience = this.experiences.get(id);
    if (!experience) throw new Error("Experience not found");
    
    const updatedExperience = { ...experience, ...updates };
    this.experiences.set(id, updatedExperience);
    return updatedExperience;
  }

  async deleteExperience(id: string): Promise<void> {
    this.experiences.delete(id);
  }
}

export const storage = new MemStorage();
