import type { Express } from "express";
import { createServer, type Server } from "http";
import { loginSchema, registerSchema, insertJobSchema, insertApplicationSchema, insertMessageSchema, insertExperienceSchema, insertCompanySchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: data.userType,
        location: data.location,
        title: data.title,
        bio: data.bio,
        skills: data.skills || [],
        profilePhoto: data.profilePhoto,
      });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      
      const user = await storage.updateUser(req.params.id, updates);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Company routes
  app.get("/api/companies", async (req, res) => {
    try {
      const ownerId = req.query.ownerId as string;
      if (ownerId) {
        const companies = await storage.getCompaniesByOwner(ownerId);
        res.json(companies);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const data = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(data);
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Job routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const filters = {
        location: req.query.location as string,
        skills: req.query.skills ? (req.query.skills as string).split(',') : undefined,
        jobType: req.query.jobType as string,
        search: req.query.search as string,
      };
      
      const jobs = await storage.getJobs(filters);
      
      // Enrich jobs with company and employer data
      const enrichedJobs = await Promise.all(jobs.map(async (job) => {
        const company = job.companyId ? await storage.getCompany(job.companyId) : null;
        const employer = job.employerId ? await storage.getUser(job.employerId) : null;
        
        return {
          ...job,
          company: company ? { ...company } : null,
          employer: employer ? { ...employer, password: undefined } : null,
        };
      }));
      
      res.json(enrichedJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const company = job.companyId ? await storage.getCompany(job.companyId) : null;
      const employer = job.employerId ? await storage.getUser(job.employerId) : null;
      
      res.json({
        ...job,
        company: company ? { ...company } : null,
        employer: employer ? { ...employer, password: undefined } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const data = insertJobSchema.parse(req.body);
      const job = await storage.createJob(data);
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Application routes
  app.get("/api/applications", async (req, res) => {
    try {
      const applicantId = req.query.applicantId as string;
      const jobId = req.query.jobId as string;
      
      let applications;
      if (applicantId) {
        applications = await storage.getApplicationsByApplicant(applicantId);
      } else if (jobId) {
        applications = await storage.getApplicationsByJob(jobId);
      } else {
        return res.status(400).json({ message: "Either applicantId or jobId is required" });
      }
      
      // Enrich applications with job, company, and user data
      const enrichedApplications = await Promise.all(applications.map(async (app) => {
        const job = app.jobId ? await storage.getJob(app.jobId) : null;
        const applicant = app.applicantId ? await storage.getUser(app.applicantId) : null;
        const company = job?.companyId ? await storage.getCompany(job.companyId) : null;
        
        return {
          ...app,
          job: job ? { ...job } : null,
          applicant: applicant ? { ...applicant, password: undefined } : null,
          company: company ? { ...company } : null,
        };
      }));
      
      res.json(enrichedApplications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const data = insertApplicationSchema.parse(req.body);
      
      // Check if user already applied to this job
      const existingApplications = await storage.getApplicationsByJob(data.jobId!);
      const alreadyApplied = existingApplications.some(app => app.applicantId === data.applicantId);
      
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }
      
      const application = await storage.createApplication(data);
      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.put("/api/applications/:id", async (req, res) => {
    try {
      const updates = req.body;
      const application = await storage.updateApplication(req.params.id, updates);
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const otherUserId = req.query.otherUserId as string;
      
      if (userId && otherUserId) {
        const messages = await storage.getConversation(userId, otherUserId);
        res.json(messages);
      } else if (userId) {
        const messages = await storage.getMessagesByUser(userId);
        res.json(messages);
      } else {
        res.status(400).json({ message: "userId is required" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(data);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Experience routes
  app.get("/api/experiences", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const experiences = await storage.getExperiencesByUser(userId);
      res.json(experiences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch experiences" });
    }
  });

  app.post("/api/experiences", async (req, res) => {
    try {
      const data = insertExperienceSchema.parse(req.body);
      const experience = await storage.createExperience(data);
      res.json(experience);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create experience" });
    }
  });

  app.put("/api/experiences/:id", async (req, res) => {
    try {
      const updates = req.body;
      const experience = await storage.updateExperience(req.params.id, updates);
      res.json(experience);
    } catch (error) {
      res.status(500).json({ message: "Failed to update experience" });
    }
  });

  app.delete("/api/experiences/:id", async (req, res) => {
    try {
      await storage.deleteExperience(req.params.id);
      res.json({ message: "Experience deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete experience" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      // Get various statistics for admin dashboard
      const totalUsers = await storage.getUserByEmail("admin123") ? 1 : 0; // Simple count for demo
      const activeJobs = 12; // Demo data
      const totalCompanies = 3;
      const totalApplications = 25;
      
      res.json({
        totalUsers: totalUsers + 10, // Demo numbers
        activeJobs,
        totalCompanies,
        totalApplications,
        newUsersThisWeek: 3,
        newJobsThisWeek: 5,
        newCompaniesThisWeek: 1,
        newApplicationsThisWeek: 8
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      // In a real app, you'd have proper user management
      res.json([
        {
          id: "1",
          firstName: "Admin",
          lastName: "User", 
          email: "admin123",
          userType: "admin",
          location: "New York"
        },
        {
          id: "2",
          firstName: "John",
          lastName: "Smith",
          email: "employer1@example.com",
          userType: "employer",
          location: "San Francisco"
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/jobs", async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/admin/companies", async (req, res) => {
    try {
      // Get all companies - in real app you'd have proper admin access
      res.json([
        { id: "1", name: "TechCorp Solutions", location: "San Francisco, CA", industry: "Technology", size: "50-200 employees", description: "Leading software development company" },
        { id: "2", name: "Austin Innovations", location: "Austin, TX", industry: "AI", size: "10-50 employees", description: "AI and ML solutions" },
        { id: "3", name: "Seattle Tech Hub", location: "Seattle, WA", industry: "Cloud Computing", size: "200-500 employees", description: "Cloud infrastructure services" }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
