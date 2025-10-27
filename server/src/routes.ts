import dashboardRouter from "./routes/dashboard";
import jobsRouter from "./routes/jobs";
import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";
import { loginSchema as sharedLoginSchema, registerSchema } from "../../shared/schema";
import { handleError } from "./utils";

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

const insertCompanySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  ownerId: z.number().int().positive(),
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
    console.warn('⚠️ requireAdmin: Not authenticated, userId missing from session.');
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Handle the hardcoded admin user
  if (req.session.userId === 'admin-001') {
    return next();
  }

  // For regular users, check their userType in the database
  const user = await storage.getUser(req.session.userId);
  if (user?.userType === 'admin') {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: Admin access required" });
};

const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
      },
      name: 'skillconnect.sid'
    }) as any
  );
  
  // Job routes
  app.use("/api/jobs", jobsRouter);

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
      console.log('🔑 Processing login request');
      const data = sharedLoginSchema.parse(req.body);

      // Hardcoded admin user check
      if (data.email === 'admin@gmail.com' && data.password === 'admin123') {
        console.log('👑 Admin user login');
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

      // Get user and handle database errors with fallback
      let user;
      try {
        console.log('🔍 Looking up user in database');
        user = await storage.getUserByEmail(data.email);
      } catch (dbError: any) {
        console.error('❌ Database error during login:', dbError);
        
        // Development mode fallback for database issues
        if (process.env.NODE_ENV === 'development') {
          const errorMessage = String(dbError instanceof Error ? dbError.message : dbError);
          const isDbConnectionError = 
            errorMessage.toLowerCase().includes('connect econnrefused') ||
            errorMessage.toLowerCase().includes('connection refused') ||
            errorMessage.toLowerCase().includes('password authentication failed');
            
          if (isDbConnectionError) {
            console.warn('⚠️ Using development fallback for database connection issue');
            // Only allow admin login in fallback mode
            if (data.email === 'admin@gmail.com' && data.password === 'admin123') {
              const fallbackAdmin = {
                id: 'dev-admin',
                email: data.email,
                firstName: 'Admin',
                lastName: 'User',
                userType: 'admin'
              };
              req.session.userId = fallbackAdmin.id;
              return res.json({ user: sanitizeUser(fallbackAdmin), _devFallback: true });
            }
          }
        }
        
        // Re-throw for normal error handling if not handled by fallback
        throw dbError;
      }
      
      // Check credentials
      if (!user) {
        console.log('❌ No user found with email:', data.email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        console.log('❌ Invalid password for user:', data.email);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log('✅ Login successful for user:', { id: user.id, email: user.email });
      req.session.userId = user.id.toString();
      res.json({ user: sanitizeUser(user) });
      
    } catch (error) {
      console.error('❌ Error in login route:', error);
      const isValidationError = error instanceof z.ZodError;
      
      // Return appropriate error response
      if (isValidationError) {
        return res.status(400).json({
          message: "Invalid login data",
          errors: error.issues
        });
      }
      
      // Development mode: include error details
      if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
          message: "Login failed",
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // Production: generic error
      res.status(500).json({ message: "Login failed. Please try again later." });
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
      
      const user = await storage.updateUser(req.params.id, updates as any);
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
        const jobs = await storage.getJobsByEmployer(employerId);
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
      const data = {
        ...req.body,
        applicantId: parseInt(req.session.userId)
      };

      const existingApplications = await storage.getApplicationsByJob(data.jobId).catch(() => []);
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

      const experience = await storage.createExperience(experienceData as any);
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
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const enrichedUsers = await Promise.all(users.map(async (user) => {
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
      }));
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
      console.log('Received /api/admin/users POST request. req.body:', req.body);
      // Use a simpler schema for admin user creation, as not all registration fields are present.
      const adminCreateUserSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        userType: z.enum(['Professional', 'Employer', 'admin', 'job_seeker', 'employer', 'professional']),
        location: z.string().optional(),
        title: z.string().optional(), // For professionals
        confirmPassword: z.string().optional(), // Added to allow frontend to send it without validation error
      });

      console.log('AdminCreateUserSchema userType options at runtime:', adminCreateUserSchema.shape.userType._def.options);
      const data = adminCreateUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Normalize userType to 'Professional' or 'Employer' for database consistency
      let normalizedUserType: 'Professional' | 'Employer' | 'admin';
      if (data.userType === 'job_seeker' || data.userType === 'professional') {
        normalizedUserType = 'Professional';
      } else if (data.userType === 'employer') {
        normalizedUserType = 'Employer';
      } else {
        normalizedUserType = data.userType;
      }

      const userPayload: any = {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: normalizedUserType, // Use the normalized type for storage
        location: data.location || null, // Ensure optional fields are null if not provided
        profilePhoto: null, // Explicitly set to null as it's not provided by admin form
        telephoneNumber: null, // Explicitly set to null as it's not provided by admin form
      };

      const user = await storage.createUser(userPayload);

      // Create associated profile or company
      if (normalizedUserType === 'Employer') {
        await storage.createCompany({
          name: `${data.firstName}'s Company`, // Default company name
          description: null, // Explicitly set optional fields to null
          website: null,
          location: null,
          industry: null,
          size: null,
          ownerId: user.id,
          logo: null, // Explicitly set optional fields to null
        });
      } else if (normalizedUserType === 'Professional') {
        await storage.createProfessionalProfile({
          userId: user.id,
          headline: data.title || null, // Ensure optional fields are null if not provided
          bio: null, // Explicitly set optional fields to null
          skills: [], // Start with empty skills
        });
      }
      
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

      const user = await storage.updateUser(req.params.id, updates as any);
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

  // Admin: Get all jobs
  app.get("/api/admin/jobs", requireAdmin, async (req, res) => {
    try {
      const { jobs } = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      handleError(res, error, "Failed to fetch jobs");
    }
  });

  // Admin: Get all companies
  app.get("/api/admin/companies", requireAdmin, async (req, res) => {
    try {
      console.log('✅ Admin API: Request received for /api/admin/companies');
      const companies = await storage.getAllCompanies();
      console.log('✅ Admin API: Successfully fetched companies from storage.');
      res.json(companies);
    } catch (error) {
      console.error('❌ Admin API: Error in /api/admin/companies route handler:', error);
      handleError(res, error, "Failed to fetch companies");
    }
  });

  // Admin: Get all applications
  app.get("/api/admin/applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getApplicationsByJob("all");
      res.json(applications);
    } catch (error) {
      handleError(res, error, "Failed to fetch applications");
    }
  });

  // Admin: Get pending approvals (mocked for now)
  app.get("/api/admin/approvals", requireAdmin, async (req, res) => {
    try {
      // This is a placeholder. You'll need to implement logic
      // in your storage layer to fetch items pending approval.
      res.json([]);
    } catch (error) {
      handleError(res, error, "Failed to fetch approvals");
    }
  });

  // Admin: Get analytics data (mocked for now)
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      // This is a placeholder. You would build a real analytics object here.
      res.json({ recentActivities: [] });
    } catch (error) {
      handleError(res, error, "Failed to fetch analytics");
    }
  });

  // Admin statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const [users, jobsResult, companies, applications] = await Promise.all([
        storage.getAllUsers(),
        storage.getJobs(),
        storage.getAllCompanies(),
        storage.getApplicationsByJob("all"),
      ]);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const stats = {
        totalUsers: users.length,
        activeJobs: jobsResult.jobs.filter(job => job.isActive).length,
        totalCompanies: companies.length,
        totalApplications: applications.length,
        newUsersThisWeek: users.filter(user => new Date(user.createdAt) >= oneWeekAgo).length,
        newJobsThisWeek: jobsResult.jobs.filter(job => new Date(job.createdAt) >= oneWeekAgo).length,
        newCompaniesThisWeek: companies.filter(company => new Date(company.createdAt) >= oneWeekAgo).length,
        newApplicationsThisWeek: applications.filter(app => new Date(app.appliedAt) >= oneWeekAgo).length
      };
      
      res.json(stats);
    } catch (error) {
      handleError(res, error, "Failed to fetch stats");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export default registerRoutes;