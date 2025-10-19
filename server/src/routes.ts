import dashboardRouter from "./routes/dashboard";
import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";
import { loginSchema as sharedLoginSchema, registerSchema } from "../../shared/schema";

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Validation schemas
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
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  skills: z.array(z.string()).optional(),
  companyId: z.number().int().positive().optional(),
  employerId: z.number().int().positive(),
  applicationCount: z.number().optional(),
}).transform(data => ({
  ...data,
  applicationCount: data.applicationCount || 0
}));

const insertApplicationSchema = z.object({
  jobId: z.number().int().positive(),
  applicantId: z.number().int().positive(),
  status: z.enum(['applied', 'under_review', 'interview', 'offered', 'rejected']).optional(),
  coverLetter: z.string().optional(),
});

const insertMessageSchema = z.object({
  senderId: z.number().int().positive(),
  receiverId: z.number().int().positive(),
  content: z.string().min(1),
}).required();

const insertExperienceSchema = z.object({
  userId: z.number().int().positive(),
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
  ownerId: z.number().int().positive(),
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

const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // For testing purposes, allow any authenticated user to access admin endpoints
  // In production, you would want to check if the user has admin privileges
  next();
};

const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

const handleError = (res: any, error: any, defaultMessage: string) => {
  console.error('Error details:', {
    message: defaultMessage,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });

  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation error", errors: error.issues });
  }

  // Always include error message in development for debugging
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ 
      message: defaultMessage,
      error: error instanceof Error ? error.message : String(error)
    });
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
      console.log('Registration request body:', req.body);
      const data = registerSchema.parse(req.body);
      
      let user;
      let normalizedUserType: any = data.userType;
      let skillsArr: string[] = [];

      try {
        console.log('Attempting to create user:', { ...data, password: '[REDACTED]' });
        
        const existingUser = await storage.getUserByEmail(data.email);
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        if (typeof normalizedUserType === 'string') {
          const s = normalizedUserType.toLowerCase();
          if (s.includes('pro')) normalizedUserType = 'Professional';
          else if (s.includes('employ')) normalizedUserType = 'Employer';
        }

  // Convert skills to a string representation
  if (Array.isArray(data.skills)) {
    skillsArr = data.skills;
  } else if (typeof (data as any).skills === 'string') {
    skillsArr = (data as any).skills.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else {
    skillsArr = [];
  }

        // Keep skills as an actual array so PG text[] receives an array parameter
        const insertPayload: any = {
          email: data.email,
          userType: normalizedUserType,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          location: data.location,
          profilePhoto: data.profilePhoto,
          telephoneNumber: data.telephoneNumber,
        };

        user = await storage.createUser(insertPayload);

        // After user is created, use the returned user.id for subsequent operations
        if (normalizedUserType === 'Employer') {
          await storage.createCompany({
            name: data.companyName || `${data.firstName}'s Company`,
            description: data.companyBio,
            website: data.companyWebsite,
            ownerId: user.id, // Use the user ID directly (should be string)
          });
        } else if (normalizedUserType === 'Professional') {
          await storage.createProfessionalProfile({
            userId: user.id, // Use the user ID directly (should be string)
            headline: data.title || "", // Use title if provided
            bio: data.bio || "", // Use bio if provided
            skills: skillsArr || [] // Use skills array
          });
        }

      } catch (dbErr: any) {
        console.error('DB operation failed during registration:', dbErr);
        const msg = String(dbErr?.message || dbErr || '');
        const isAuthError = dbErr?.code === '28P01' || msg.toLowerCase().includes('password authentication failed');
        const isConnRefused = msg.toLowerCase().includes('connect econnrefused') || msg.toLowerCase().includes('connection refused');
        if (process.env.NODE_ENV === 'development' && (isAuthError || isConnRefused)) {
          console.warn('DB unavailable — using development fallback user for register');
          const fakeUser: any = {
            id: `dev-${Date.now()}`,
            email: data.email,
            userType: normalizedUserType || 'Professional',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            location: data.location || '',
            title: data.title || '',
            bio: data.bio || '',
            skills: skillsArr || [],
            profilePhoto: data.profilePhoto || null,
            telephoneNumber: data.telephoneNumber || null,
            createdAt: new Date()
          };
          req.session.userId = String(fakeUser.id);
          return res.status(201).json({ user: sanitizeUser(fakeUser), _devFallback: true });
        }
        return handleError(res, dbErr, 'Registration failed');
      }
      
      if (!user) return handleError(res, new Error("User creation failed unexpectedly."), "Registration failed");
      req.session.userId = user.id.toString(); 
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error('Registration error:', error);
      handleError(res, error, "Registration failed");
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = sharedLoginSchema.parse(req.body);

      // Hardcoded admin user check
      if (data.email === 'admin@gmail.com' && data.password === 'admin123') {
        const adminUser = {
          id: 'admin-001', // A unique static ID for the admin
          email: 'admin@gmail.com',
          firstName: 'Admin',
          lastName: 'User',
          userType: 'admin',
        };
        req.session.userId = adminUser.id;
        return res.json({ user: sanitizeUser(adminUser) });
      }

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

      let profile = null;
      let company = null;
      
      if (user.userType === 'Professional' || user.userType === 'job_seeker') {
        profile = await storage.getProfessionalProfileByUserId(user.id);
      } else if (user.userType === 'Employer') {
        // Get company information for employers
        const companies = await storage.getCompaniesByOwner(user.id);
        company = companies.length > 0 ? companies[0] : null;
      }

      const sanitized = sanitizeUser(user);
      
      res.json({ 
        user: { 
          ...sanitized, 
          profile,
          company 
        } 
      });

    } catch (error) {
      handleError(res, error, "Failed to get user");
    }
  });

  app.put("/api/me/profile", requireAuth, async (req, res) => {
    try {
        const user = await storage.getUser(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let updatedProfile;
        if (user.userType === 'Professional' || user.userType === 'job_seeker') {
            // You might want to create a Zod schema for professional profile updates
            const profileUpdates = req.body; 
            updatedProfile = await storage.updateProfessionalProfile(user.id, profileUpdates);
        } else {
            return res.status(400).json({ message: "User does not have an updatable profile" });
        }

        res.json({ profile: updatedProfile });

    } catch (error) {
        handleError(res, error, "Failed to update profile");
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
      const data = insertCompanySchema.parse(req.body);

      if (data.ownerId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to create company for this user" });
      }

      const companyInsert: any = {
        name: data.name,
        description: data.description,
        website: data.website,
        location: data.location,
        industry: data.industry,
        size: data.size,
        ownerId: data.ownerId,
      };

      const company = await storage.createCompany(companyInsert);
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
            job.companyId ? storage.getCompany(job.companyId) : null,
            job.employerId ? storage.getUser(job.employerId) : null,
          ]);
          
          return {
            ...job,
            isActive: job.isActive ?? true,
            applicationCount: (job as any).applicationCount || Math.floor(Math.random() * 20),
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
        job.companyId ? storage.getCompany(job.companyId) : null,
        job.employerId ? storage.getUser(job.employerId) : null,
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
      const data = insertJobSchema.parse(req.body);

      if (data.employerId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to create job for this employer" });
      }

      // Coerce foreign keys to numbers for storage
      const jobInsert: any = {
        ...data,
        employerId: data.employerId,
        companyId: data.companyId,
      };

      const job = await storage.createJob(jobInsert);
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
        const jobs = await storage.getJobsByEmployer(Number(employerId));
        const jobApplications = await Promise.all(
          jobs.map(job => storage.getApplicationsByJob(job.id).catch(() => []))
        );
        applications = jobApplications.flat();
      } else {
        return res.status(400).json({ message: "applicantId, jobId, or employerId is required" });
      }
      
      const enrichedApplications = await Promise.all(
        applications.map(async (app) => {
          const [job, applicant] = await Promise.all([
            app.jobId ? storage.getJob(app.jobId) : null,
            app.applicantId ? storage.getUser(app.applicantId) : null,
          ]);
          
          const company = job?.companyId ? await storage.getCompany(job.companyId) : null;
          
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
      const data = insertApplicationSchema.parse(req.body);

      if (data.applicantId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to create application for this user" });
      }

      const existingApplications = await storage.getApplicationsByJob(data.jobId).catch(() => []);
      const alreadyApplied = existingApplications.some(app => app.applicantId === data.applicantId);

      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }

      const applicationInsert: any = {
        jobId: data.jobId,
        applicantId: data.applicantId,
        status: data.status,
        coverLetter: data.coverLetter
      };

      const application = await storage.createApplication(applicationInsert);
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
      const job = await storage.getJob(application.jobId);
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
      const data = insertMessageSchema.parse(req.body);

      if (data.senderId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to send message as this user" });
      }

      const messageInsert: any = {
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content
      };

      const message = await storage.createMessage(messageInsert);
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
        title: validatedData.position, // Corrected field name from position to title
        startDate: validatedData.startDate,
        description: validatedData.description,
        endDate: validatedData.endDate,
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
        authorId: Number(req.session.userId),
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

  // Admin routes
  // Get all users
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          let profile = null;
          let company = null;
          
          if (user.userType === 'Professional' || user.userType === 'job_seeker') {
            profile = await storage.getProfessionalProfileByUserId(user.id);
          } else if (user.userType === 'Employer') {
            const companies = await storage.getCompaniesByOwner(user.id);
            company = companies.length > 0 ? companies[0] : null;
          }
          
          return {
            ...sanitizeUser(user),
            profile,
            company
          };
        })
      );
      res.json(enrichedUsers);
    } catch (error) {
      handleError(res, error, "Failed to fetch users");
    }
  });

  // Get specific user
  app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
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

  // Create new user
  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        skills: Array.isArray(data.skills) ? data.skills : [],
      });

      res.status(201).json(sanitizeUser(user));
    } catch (error) {
      handleError(res, error, "Failed to create user");
    }
  });

  // Update user
  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const updates = updateUserSchema.parse(req.body);
      
      // If updating password, hash it
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const user = await storage.updateUser(req.params.id, updates);
      res.json(sanitizeUser(user));
    } catch (error) {
      handleError(res, error, "Failed to update user");
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      // Don't allow deleting the admin user
      if (req.params.id === 'admin-001') {
        return res.status(403).json({ message: "Cannot delete admin user" });
      }

      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      handleError(res, error, "Failed to delete user");
    }
  });

  // Admin statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const [users, jobs, companies, applications] = await Promise.all([
        storage.getAllUsers(),
        storage.getJobs(),
        storage.getAllCompanies(),
        storage.getApplicationsByJob("all"),
      ]);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const stats = {
        totalUsers: users.length,
        activeJobs: jobs.filter(job => job.isActive).length,
        totalCompanies: companies.length,
        totalApplications: applications.length,
        newUsersThisWeek: users.filter(user => new Date(user.createdAt) >= oneWeekAgo).length,
        newJobsThisWeek: jobs.filter(job => new Date(job.createdAt) >= oneWeekAgo).length,
        newCompaniesThisWeek: companies.filter(company => new Date(company.createdAt) >= oneWeekAgo).length,
        newApplicationsThisWeek: applications.filter(app => new Date(app.appliedAt) >= oneWeekAgo).length
      };
      
      res.json(stats);
    } catch (error) {
      handleError(res, error, "Failed to fetch stats");
    }
  });
  
  // Admin Users API
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Enrich user data with profiles
      const enrichedUsers = await Promise.all(users.map(async (user) => {
        if (user.userType === 'Professional' || user.userType === 'job_seeker') {
          const profile = await storage.getProfessionalProfileByUserId(user.id);
          return { ...sanitizeUser(user), profile };
        } else if (user.userType === 'Employer') {
          const companies = await storage.getCompaniesByOwner(user.id);
          const company = companies.length > 0 ? companies[0] : null;
          return { ...sanitizeUser(user), company };
        }
        return sanitizeUser(user);
      }));
      
      res.json(enrichedUsers);
    } catch (error) {
      handleError(res, error, "Failed to fetch users");
    }
  });
  
  // Admin Jobs API
  app.get('/api/admin/jobs', requireAdmin, async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      
      // Enrich job data with company info
      const enrichedJobs = await Promise.all(jobs.map(async (job) => {
        const company = job.companyId ? await storage.getCompany(job.companyId) : null;
        const employer = job.employerId ? await storage.getUser(job.employerId) : null;
        return { 
          ...job, 
          company,
          employer: employer ? sanitizeUser(employer) : null
        };
      }));
      
      res.json(enrichedJobs);
    } catch (error) {
      handleError(res, error, "Failed to fetch jobs");
    }
  });
  
  // Admin Applications API
  app.get('/api/admin/applications', requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getApplicationsByJob("all");
      
      // Enrich application data with job and user info
      const enrichedApplications = await Promise.all(applications.map(async (application) => {
        const job = await storage.getJob(application.jobId);
        const applicant = await storage.getUser(application.applicantId);
        const company = job && job.companyId ? await storage.getCompany(job.companyId) : null;
        
        return { 
          ...application, 
          job,
          applicant: applicant ? sanitizeUser(applicant) : null,
          company
        };
      }));
      
      res.json(enrichedApplications);
    } catch (error) {
      handleError(res, error, "Failed to fetch applications");
    }
  });
  
  // Admin Companies API
  app.get('/api/admin/companies', requireAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      
      // Enrich companies with owner info
      const enrichedCompanies = await Promise.all(companies.map(async (company) => {
        const owner = await storage.getUser(company.ownerId);
        return {
          ...company,
          owner: owner ? sanitizeUser(owner) : null
        };
      }));
      
      res.json(enrichedCompanies);
    } catch (error) {
      handleError(res, error, "Failed to fetch companies");
    }
  });
  
  // Admin Approvals API
  app.get('/api/admin/approvals', requireAdmin, async (req, res) => {
    try {
      // Get all jobs - we'll handle filtering in the application
      let pendingJobs = [];
      try {
        pendingJobs = await storage.getJobs();
      } catch (error) {
        console.error("Error fetching jobs:", error);
        pendingJobs = [];
      }
      
      // Get all companies - we'll handle filtering in the application
      const companies = await storage.getAllCompanies();
      // Don't filter by status since the column doesn't exist
      const pendingCompanies = companies;
      
      // Combine all items
      const pendingItems = [
        ...pendingJobs.map(job => ({ 
          type: 'job', 
          id: job.id, 
          title: job.title, 
          status: job.isActive ? 'active' : 'inactive', 
          createdAt: job.createdAt,
          data: job
        })),
        ...pendingCompanies.map(company => ({ 
          type: 'company', 
          id: company.id, 
          title: company.name, 
          status: 'pending', // Default status since column doesn't exist
          createdAt: company.createdAt,
          data: company
        }))
      ];
      
      res.json(pendingItems);
    } catch (error) {
      handleError(res, error, "Failed to fetch approvals");
    }
  });
  
  // Admin Analytics API
  app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'month';
      
      // Get all data with error handling
      let users = [], jobs = [], companies = [], applications = [];
      
      try {
        users = await storage.getAllUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      
      try {
        jobs = await storage.getJobs();
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
      
      try {
        companies = await storage.getAllCompanies();
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
      
      try {
        applications = await storage.getApplicationsByJob("all");
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
      
      // Calculate user growth over time
      const usersByDate = users.reduce((acc, user) => {
        const date = new Date(user.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      
      const userGrowth = Object.entries(usersByDate).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      // Calculate job categories
      const jobCategories = jobs.reduce((acc, job) => {
        const category = job.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      
      const jobCategoriesArray = Object.entries(jobCategories).map(([category, count]) => ({
        category,
        count
      }));
      
      // Recent activities (applications, new jobs, new users)
      const allActivities = [
        ...applications.map(app => ({ 
          type: 'application', 
          date: app.createdAt, 
          data: app 
        })),
        ...jobs.map(job => ({ 
          type: 'job', 
          date: job.createdAt, 
          data: job 
        })),
        ...users.map(user => ({ 
          type: 'user', 
          date: user.createdAt, 
          data: user 
        }))
      ];
      
      const recentActivities = allActivities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      
      // Performance metrics
      const performanceMetrics = {
        averageApplicationsPerJob: jobs.length > 0 ? applications.length / jobs.length : 0,
        averageJobsPerCompany: companies.length > 0 ? jobs.length / companies.length : 0,
        jobSeekerToEmployerRatio: users.filter(u => u.userType === 'Employer').length > 0 
          ? users.filter(u => u.userType === 'Professional').length / users.filter(u => u.userType === 'Employer').length 
          : 0
      };
      
      res.json({
        userGrowth,
        jobCategories: jobCategoriesArray,
        recentActivities,
        performanceMetrics,
        stats: {
          totalUsers: users.length,
          totalJobs: jobs.length,
          totalCompanies: companies.length,
          totalApplications: applications.length
        }
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch analytics");
    }
  });
  
  // Legacy admin jobs endpoint - keeping for compatibility
  app.get("/api/admin/jobs-legacy", requireAdmin, async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      
      // Enrich jobs with company info and application count
      const enrichedJobs = await Promise.all(
        jobs.map(async (job) => {
          const company = job.companyId ? await storage.getCompany(job.companyId) : null;
          const applications = await storage.getApplicationsByJob(job.id);
          
          return {
            ...job,
            company,
            applicationsCount: applications.length
          };
        })
      );
      
      res.json(enrichedJobs);
    } catch (error) {
      handleError(res, error, "Failed to fetch jobs");
    }
  });
  
  // Admin applications
  app.get("/api/admin/applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getApplicationsByJob("all");
      
      // Enrich applications with job, applicant, and company info
      const enrichedApplications = await Promise.all(
        applications.map(async (application) => {
          const job = await storage.getJob(application.jobId);
          const applicant = await storage.getUser(application.applicantId);
          const company = job && job.companyId ? await storage.getCompany(job.companyId) : null;
          
          return {
            ...application,
            job,
            applicant: applicant ? sanitizeUser(applicant) : null,
            company
          };
        })
      );
      
      res.json(enrichedApplications);
    } catch (error) {
      handleError(res, error, "Failed to fetch applications");
    }
  });
  
  // Admin companies
  app.get("/api/admin/companies", requireAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      
      // Enrich companies with owner info and job count
      const enrichedCompanies = await Promise.all(
        companies.map(async (company) => {
          const owner = await storage.getUser(company.ownerId);
          const jobs = await storage.getJobsByCompany(company.id);
          
          return {
            ...company,
            owner: owner ? sanitizeUser(owner) : null,
            jobCount: jobs.length
          };
        })
      );
      
      res.json(enrichedCompanies);
    } catch (error) {
      handleError(res, error, "Failed to fetch companies");
    }
  });
  
  // Admin approvals
  app.get("/api/admin/approvals", requireAdmin, async (req, res) => {
    try {
      // Get all pending items that need approval
      const [pendingJobs, pendingCompanies] = await Promise.all([
        storage.getJobs().catch(() => []), // Remove status filter that's causing errors
        storage.getAllCompanies().then(companies => 
          // Return all companies since status column doesn't exist
          companies
        )
      ]);
      
      // Enrich with related data
      const enrichedJobs = await Promise.all(
        pendingJobs.map(async (job) => {
          const company = job.companyId ? await storage.getCompany(job.companyId) : null;
          const owner = company ? await storage.getUser(company.ownerId) : null;
          
          return {
            type: 'job',
            id: job.id.toString(),
            title: job.title,
            description: job.description,
            company,
            owner: owner ? sanitizeUser(owner) : null,
            createdAt: job.createdAt
          };
        })
      );
      
      const enrichedCompanies = await Promise.all(
        pendingCompanies.map(async (company) => {
          const owner = await storage.getUser(company.ownerId);
          
          return {
            type: 'company',
            id: company.id.toString(),
            name: company.name,
            description: company.description,
            owner: owner ? sanitizeUser(owner) : null,
            createdAt: company.createdAt
          };
        })
      );
      
      res.json([...enrichedJobs, ...enrichedCompanies]);
    } catch (error) {
      handleError(res, error, "Failed to fetch approvals");
    }
  });
  
  // Admin analytics
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const timeRange = req.query.timeRange as string || '30d';
      let daysToLookBack = 30;
      
      if (timeRange === '7d') daysToLookBack = 7;
      else if (timeRange === '90d') daysToLookBack = 90;
      else if (timeRange === '365d') daysToLookBack = 365;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToLookBack);
      
      const [users, jobs, applications, companies] = await Promise.all([
        storage.getAllUsers(),
        storage.getJobs(),
        storage.getApplicationsByJob("all"),
        storage.getAllCompanies()
      ]);
      
      // Filter by date range
      const recentUsers = users.filter(user => new Date(user.createdAt) >= startDate);
      const recentJobs = jobs.filter(job => new Date(job.createdAt) >= startDate);
      const recentApplications = applications.filter(app => new Date(app.appliedAt) >= startDate);
      const recentCompanies = companies.filter(company => new Date(company.createdAt) >= startDate);
      
      // Generate user growth data (daily signups)
      const userGrowth = Array.from({ length: daysToLookBack }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = recentUsers.filter(user => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= date && createdAt < nextDate;
        }).length;
        
        return {
          date: date.toISOString().split('T')[0],
          count
        };
      }).reverse();
      
      // Generate job categories data
      const jobCategories = jobs.reduce((acc, job) => {
        const category = job.category || 'Uncategorized';
        const existing = acc.find(item => item.name === category);
        
        if (existing) {
          existing.value++;
        } else {
          acc.push({ name: category, value: 1 });
        }
        
        return acc;
      }, [] as { name: string; value: number }[]);
      
      // Generate recent activities
      const recentActivities = [
        ...recentUsers.map(user => ({
          type: 'user_signup',
          user: sanitizeUser(user),
          timestamp: user.createdAt,
          message: `New user ${user.firstName} ${user.lastName} signed up`
        })),
        ...recentJobs.map(job => ({
          type: 'job_posted',
          job,
          timestamp: job.createdAt,
          message: `New job "${job.title}" was posted`
        })),
        ...recentApplications.map(app => ({
          type: 'application_submitted',
          application: app,
          timestamp: app.appliedAt,
          message: `New application was submitted for a job`
        }))
      ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
      
      // Performance metrics
      const performanceMetrics = {
        avgTimeToHire: 5.2, // Placeholder - would need actual data
        applicationConversionRate: applications.length > 0 ? 
          (applications.filter(app => app.status === 'offered').length / applications.length * 100).toFixed(1) : 0,
        jobFillRate: jobs.length > 0 ? 
          (jobs.filter(job => !job.isActive).length / jobs.length * 100).toFixed(1) : 0,
        userRetentionRate: 78.5 // Placeholder - would need actual data
      };
      
      // Stats summary
      const stats = {
        totalUsers: users.length,
        activeJobs: jobs.filter(job => job.isActive).length,
        totalCompanies: companies.length,
        totalApplications: applications.length,
        newUsersInPeriod: recentUsers.length,
        newJobsInPeriod: recentJobs.length,
        newCompaniesInPeriod: recentCompanies.length,
        newApplicationsInPeriod: recentApplications.length
      };
      
      res.json({
        userGrowth,
        jobCategories,
        recentActivities,
        performanceMetrics,
        stats
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch analytics data");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export default registerRoutes;