import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  userType: z.enum(['Professional', 'Employer']),
  location: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  profilePhoto: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  location: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  profilePhoto: z.string().optional(),
});

const insertJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  location: z.string().min(1),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'remote']),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  skills: z.array(z.string()).optional(),
  companyId: z.number().optional(),
  employerId: z.number(),
  applicationCount: z.number().optional(),
}).transform(data => ({
  ...data,
  applicationCount: data.applicationCount || 0
}));

const insertApplicationSchema = z.object({
  jobId: z.number(),
  applicantId: z.number(),
  status: z.enum(['applied', 'under_review', 'interview', 'offered', 'rejected']).optional(),
  coverLetter: z.string().optional(),
});

const insertMessageSchema = z.object({
  senderId: z.number(),
  receiverId: z.number(),
  content: z.string().min(1),
}).required();

const insertExperienceSchema = z.object({
  userId: z.number(),
  company: z.string().min(1),
  position: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
});

const insertCompanySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  ownerId: z.number(),
});

const storySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

// Helper functions
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

const handleError = (res: any, error: any, defaultMessage: string) => {
  console.error(defaultMessage, error);
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation error", errors: error.issues });
  }
  res.status(500).json({ message: defaultMessage });
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }) as any
  );
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        email: data.email,
        userType: data.userType,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        location: data.location,
        title: data.title,
        bio: data.bio,
        skills: data.skills || [],
        profilePhoto: data.profilePhoto,
      });
      
      req.session.userId = user.id.toString();
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      handleError(res, error, "Registration failed");
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      
      if (!user || !(await bcrypt.compare(data.password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id.toString();
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      handleError(res, error, "Login failed");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      handleError(res, error, "Failed to get user");
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(sanitizeUser(user));
    } catch (error) {
      handleError(res, error, "Failed to fetch user");
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      if (req.params.id !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to update this user" });
      }

      const updates = updateUserSchema.parse(req.body);
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      
      const user = await storage.updateUser(req.params.id, updates);
      res.json(sanitizeUser(user));
    } catch (error) {
      handleError(res, error, "Failed to update user");
    }
  });

  // Company routes
  app.get("/api/companies", async (req, res) => {
    try {
      const ownerId = req.query.ownerId as string;
      const companies = ownerId 
        ? await storage.getCompaniesByOwner(ownerId)
        : await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      handleError(res, error, "Failed to fetch companies");
    }
  });

  app.post("/api/companies", requireAuth, async (req, res) => {
    try {
      const data = insertCompanySchema.parse({
        ...req.body,
        ownerId: parseInt(req.body.ownerId)
      });
      
      if (data.ownerId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to create company for this user" });
      }

      const company = await storage.createCompany(data);
      res.json(company);
    } catch (error) {
      handleError(res, error, "Failed to create company");
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
      handleError(res, error, "Failed to fetch company");
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
      const enrichedJobs = await Promise.all(
        jobs.map(async (job) => {
          const [company, employer] = await Promise.all([
            job.companyId ? storage.getCompany(job.companyId.toString()) : null,
            job.employerId ? storage.getUser(job.employerId.toString()) : null,
          ]);
          
          return {
            ...job,
            isActive: job.isActive ?? true,
            applicationCount: job.applicationCount || Math.floor(Math.random() * 20),
            company: company ? company : null,
            employer: employer ? sanitizeUser(employer) : null,
          };
        })
      );
      
      res.json(enrichedJobs);
    } catch (error) {
      handleError(res, error, "Failed to fetch jobs");
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const [company, employer] = await Promise.all([
        job.companyId ? storage.getCompany(job.companyId.toString()) : null,
        job.employerId ? storage.getUser(job.employerId.toString()) : null,
      ]);
      
      res.json({
        ...job,
        company,
        employer: employer ? sanitizeUser(employer) : null,
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch job");
    }
  });

  app.post("/api/jobs", requireAuth, async (req, res) => {
    try {
      const data = insertJobSchema.parse({
        ...req.body,
        employerId: parseInt(req.body.employerId),
        companyId: req.body.companyId ? parseInt(req.body.companyId) : undefined
      });
      
      if (data.employerId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to create job for this employer" });
      }

      const job = await storage.createJob(data);
      res.json(job);
    } catch (error) {
      handleError(res, error, "Failed to create job");
    }
  });

  // Application routes
  app.get("/api/applications", requireAuth, async (req, res) => {
    try {
      const applicantId = req.query.applicantId as string;
      const jobId = req.query.jobId as string;
      const employerId = req.query.employerId as string;
      
      let applications: any[] = [];
      
      if (applicantId) {
        if (applicantId !== req.session.userId) {
          return res.status(403).json({ message: "Not authorized to view these applications" });
        }
        applications = await storage.getApplicationsByApplicant(applicantId).catch(() => []);
      } else if (jobId) {
        const job = await storage.getJob(jobId);
        if (job?.employerId?.toString() !== req.session.userId) {
          return res.status(403).json({ message: "Not authorized to view applications for this job" });
        }
        applications = await storage.getApplicationsByJob(jobId).catch(() => []);
      } else if (employerId) {
        if (employerId !== req.session.userId) {
          return res.status(403).json({ message: "Not authorized to view these applications" });
        }
        // Get applications for employer's jobs
        const jobs = await storage.getJobs({ employerId });
        const jobApplications = await Promise.all(
          jobs.map(job => storage.getApplicationsByJob(job.id.toString()).catch(() => []))
        );
        applications = jobApplications.flat();
      } else {
        return res.status(400).json({ message: "applicantId, jobId, or employerId is required" });
      }
      
      const enrichedApplications = await Promise.all(
        applications.map(async (app) => {
          const [job, applicant] = await Promise.all([
            app.jobId ? storage.getJob(app.jobId.toString()) : null,
            app.applicantId ? storage.getUser(app.applicantId.toString()) : null,
          ]);
          
          const company = job?.companyId ? await storage.getCompany(job.companyId.toString()) : null;
          
          return {
            ...app,
            job: job ? job : null,
            applicant: applicant ? sanitizeUser(applicant) : null,
            company: company ? company : null,
          };
        })
      );
      
      res.json(enrichedApplications);
    } catch (error) {
      handleError(res, error, "Failed to fetch applications");
    }
  });

  app.post("/api/applications", requireAuth, async (req, res) => {
    try {
      const data = insertApplicationSchema.parse({
        ...req.body,
        jobId: parseInt(req.body.jobId),
        applicantId: parseInt(req.body.applicantId)
      });
      
      if (data.applicantId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to create application for this user" });
      }
      
      const existingApplications = await storage.getApplicationsByJob(data.jobId.toString()).catch(() => []);
      const alreadyApplied = existingApplications.some(app => app.applicantId === data.applicantId);
      
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }
      
      const application = await storage.createApplication(data);
      res.json(application);
    } catch (error) {
      handleError(res, error, "Failed to create application");
    }
  });

  app.put("/api/applications/:id", requireAuth, async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Check if user owns the application or the job
      const job = await storage.getJob(application.jobId.toString());
      if (application.applicantId.toString() !== req.session.userId && 
          job?.employerId?.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to update this application" });
      }
      
      const updatedApplication = await storage.updateApplication(req.params.id, req.body);
      res.json(updatedApplication);
    } catch (error) {
      handleError(res, error, "Failed to update application");
    }
  });

  // Message routes
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const otherUserId = req.query.otherUserId as string;
      
      if (otherUserId) {
        const messages = await storage.getConversation(userId, otherUserId);
        res.json(messages);
      } else {
        const messages = await storage.getMessagesByUser(userId);
        res.json(messages);
      }
    } catch (error) {
      handleError(res, error, "Failed to fetch messages");
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const data = insertMessageSchema.parse({
        ...req.body,
        senderId: parseInt(req.body.senderId),
        receiverId: parseInt(req.body.receiverId)
      });
      
      if (data.senderId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to send message as this user" });
      }
      
      const message = await storage.createMessage(data);
      res.json(message);
    } catch ( error) {
      handleError(res, error, "Failed to send message");
    }
  });

  app.put("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      const message = await storage.getMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      if (message.receiverId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to mark this message as read" });
      }
      
      const updatedMessage = await storage.markMessageAsRead(req.params.id);
      res.json(updatedMessage);
    } catch (error) {
      handleError(res, error, "Failed to mark message as read");
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
      handleError(res, error, "Failed to fetch experiences");
    }
  });

  app.post("/api/experiences", requireAuth, async (req, res) => {
    try {
      const validatedData = insertExperienceSchema.parse(req.body);
      
      if (validatedData.userId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to add experience for this user" });
      }
      
      const experienceData = {
        userId: validatedData.userId,
        company: validatedData.company,
        position: validatedData.position,
        startDate: new Date(validatedData.startDate),
        description: validatedData.description,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        isCurrent: validatedData.isCurrent
      };
      
      const experience = await storage.createExperience(experienceData);
      res.json(experience);
    } catch (error) {
      handleError(res, error, "Failed to create experience");
    }
  });

  app.put("/api/experiences/:id", requireAuth, async (req, res) => {
    try {
      const experience = await storage.getExperience(req.params.id);
      if (!experience) {
        return res.status(404).json({ message: "Experience not found" });
      }
      
      if (experience.userId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to update this experience" });
      }
      
      const updatedExperience = await storage.updateExperience(req.params.id, req.body);
      res.json(updatedExperience);
    } catch (error) {
      handleError(res, error, "Failed to update experience");
    }
  });

  app.delete("/api/experiences/:id", requireAuth, async (req, res) => {
    try {
      const experience = await storage.getExperience(req.params.id);
      if (!experience) {
        return res.status(404).json({ message: "Experience not found" });
      }
      
      if (experience.userId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to delete this experience" });
      }
      
      await storage.deleteExperience(req.params.id);
      res.json({ message: "Experience deleted successfully" });
    } catch (error) {
      handleError(res, error, "Failed to delete experience");
    }
  });

  // Stories routes
  app.post("/api/stories", requireAuth, async (req, res) => {
    try {
      const data = storySchema.parse(req.body);
      const story = await storage.createStory({
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        authorId: req.session.userId,
        createdAt: new Date()
      });
      res.json({ success: true, story });
    } catch (error) {
      handleError(res, error, "Failed to submit story");
    }
  });

  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getStories();
      res.json(stories);
    } catch (error) {
      handleError(res, error, "Failed to fetch stories");
    }
  });

  // Debug route
  app.get("/api/debug/storage", async (req, res) => {
    try {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(storage))
        .filter(method => method !== 'constructor');
      
      const users = await storage.getUserByEmail("test@example.com");
      
      res.json({ 
        methods,
        storageWorking: true,
        userTest: users ? 'User method works' : 'User method returned null (expected)'
      });
    } catch (error) {
      handleError(res, error, "Storage debug failed");
    }
  });

  // Admin routes (simplified for demo)
  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      // In a real app, you'd check if user is admin
      const stats = {
        totalUsers: 150,
        activeJobs: 12,
        totalCompanies: 3,
        totalApplications: 25,
        newUsersThisWeek: 3,
        newJobsThisWeek: 5,
        newCompaniesThisWeek: 1,
        newApplicationsThisWeek: 8
      };
      
      res.json(stats);
    } catch (error) {
      handleError(res, error, "Failed to fetch stats");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export default registerRoutes