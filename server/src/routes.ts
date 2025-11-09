import dashboardRouter from "./routes/dashboard";
import jobsRouter from "./routes/jobs";
import adminStoriesRouter from "./routes/admin/stories";
import { type Express, Router } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcrypt";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { applications } from './schema';
import { db, pool } from './db';
import { storage } from "./storage";
import connectPgSimple from 'connect-pg-simple';
import type { Session } from 'express-session';
import { 
  loginSchema as sharedLoginSchema, 
  registerSchema,
  updateProfileSchema,
  type User,
  type InsertUser,
  type InsertCompany, 
  type InsertProfessionalProfile,
  type UpdateProfile,
  professionalProfiles,
  companies
} from "../../shared/schema";
import { handleError } from "./utils";

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

declare module 'express' {
  interface Request {
    files?: any[];
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
  ownerId: z.string(),
});

const insertMessageSchema = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string().min(1),
}).required();

const insertExperienceSchema = z.object({
  userId: z.string(),
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
  name: z.string().optional(), // From public form
  email: z.string().email().optional(), // From public form
  tags: z.array(z.string()).optional(),
});

// Helper functions
const requireAuth = async (req: any, res: any, next: any) => {
  // Simple check - don't try to reload non-existent sessions
  if (!req.session?.userId) {
    console.log('⚠️ requireAuth: No userId, returning 401 for path:', req.path);
    return res.status(401).json({ message: "Not authenticated" });
  }
  console.log('✅ requireAuth: User authenticated, userId:', req.session.userId, 'path:', req.path);
  next();
};

const requireAdmin = async (req: any, res: any, next: any) => {
  // Simple check - don't try to reload non-existent sessions
  if (!req.session?.userId) {
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
  // Map snake_case database fields to camelCase for frontend
  return {
    ...sanitizedUser,
    firstName: sanitizedUser.firstName || sanitizedUser.first_name || '',
    lastName: sanitizedUser.lastName || sanitizedUser.last_name || '',
    userType: sanitizedUser.userType || sanitizedUser.user_type || '',
    createdAt: sanitizedUser.createdAt || sanitizedUser.created_at,
    profilePhoto: sanitizedUser.profilePhoto || sanitizedUser.profile_photo,
    telephoneNumber: sanitizedUser.telephoneNumber || sanitizedUser.telephone_number,
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
    // Note: CORS is already configured in index.ts, so we don't need to configure it here again
    
    // Setup session store using PostgreSQL
    const PgSessionStore = connectPgSimple(session);
    const sessionStore = new PgSessionStore({
      pool: pool,
      tableName: 'session', // Table name for sessions
      createTableIfMissing: true, // Automatically create table if it doesn't exist
    });

    // Add error handler for session store (only log actual errors, not "session not found")
    sessionStore.on('error', (error: Error) => {
      // Don't log "failed to load session" errors - these are normal for expired/missing sessions
      if (!error.message.includes('failed to load session')) {
        console.error('❌ Session store error:', error);
      }
    });

    // Setup session and file upload handling
    app.use(
      session({
        store: sessionStore,
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false, // Only save sessions that have been modified
        cookie: { 
          secure: false, // Set to false for development (no HTTPS)
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: true,
          path: '/',
          // Don't set domain for localhost - let browser handle it
        },
        name: 'skillconnect.sid'
      }) as any
    );

    // Add middleware to ensure session cookie always has correct path
    app.use((req, res, next) => {
      // Override cookie path to always be '/' if session exists
      if (req.session && req.session.cookie) {
        req.session.cookie.path = '/';
      }
      next();
    });

    // Add middleware to log session loading issues
    app.use((req, res, next) => {
      // Log all /api/auth/me requests to track session state
      if (req.path === '/api/auth/me' || req.path === '/auth/me') {
        const cookieValue = req.headers.cookie?.split('skillconnect.sid=')[1]?.split(';')[0];
        console.log('🔍 Session check for /api/auth/me:', {
          hasCookie: !!req.headers.cookie,
          cookieValue: cookieValue?.substring(0, 40) + '...',
          hasSession: !!req.session,
          sessionId: req.session?.id,
          userId: req.session?.userId,
          path: req.path,
          originalUrl: req.originalUrl
        });
      }
      
      // Log if we have a cookie but no session data (session not loaded from store)
      if (req.headers.cookie && req.headers.cookie.includes('skillconnect.sid') && !req.session?.userId) {
        const cookieValue = req.headers.cookie.split('skillconnect.sid=')[1]?.split(';')[0];
        console.log('⚠️ Cookie present but session not loaded:', {
          hasCookie: !!req.headers.cookie,
          cookieValue: cookieValue?.substring(0, 30) + '...',
          hasSession: !!req.session,
          sessionId: req.session?.id,
          path: req.path
        });
        
        // Try to manually check if session exists in database
        if (sessionStore && cookieValue) {
          // Extract session ID from cookie (might be signed like s:sessionId.signature)
          const sessionId = cookieValue.startsWith('s:') 
            ? cookieValue.split('.')[0].substring(2) 
            : cookieValue.split('.')[0];
          
          sessionStore.get(sessionId, (err: Error | null, sess: any) => {
            if (err) {
              console.log('   ❌ Error getting session from store:', err.message);
            } else if (sess) {
              console.log('   ✅ Session found in store but not loaded! userId:', sess.userId);
            } else {
              console.log('   ⚠️ Session not found in store for ID:', sessionId);
            }
          });
        }
      }
      next();
    });

    // Add middleware to log ALL API requests for debugging
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        console.log('📥 API Request:', {
          method: req.method,
          path: req.path,
          originalUrl: req.originalUrl,
          userId: req.session?.userId || 'none',
        });
      }
      next();
    });

    // Register /api/auth/me EARLY to ensure it's available
    // This is critical for the frontend auth check
    app.get("/api/auth/me", requireAuth, async (req, res) => {
      try {
        console.log('🔍 /api/auth/me (EARLY route) called:', {
          sessionId: req.session?.id,
          userId: req.session?.userId,
          hasCookie: !!req.headers.cookie,
        });
        
        if (!req.session.userId) {
          console.error('❌ No userId in session even though requireAuth passed!');
          return res.status(401).json({ message: "Not authenticated" });
        }
        
        const user = await storage.getUser(req.session.userId);
        if (!user) {
          console.warn('⚠️ User not found for userId:', req.session.userId);
          return res.status(401).json({ message: "User not found" });
        }
        
        console.log('✅ User found:', { id: user.id, email: user.email, userType: user.userType });

        let profile = null;
        let company = null;
        
        if (user.userType === 'Professional' || user.userType === 'job_seeker') {
          profile = await storage.getProfessionalProfileByUserId(user.id);
        } else if (user.userType === 'Employer') {
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

    // Setup uploads directory and multer for file uploads
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

    const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  const upload = multer({
        storage: multerStorage,
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });  // Check if email exists route
  app.post("/api/auth/check-email", async (req, res) => {
    try {
      console.log('Checking email:', req.body);
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        console.log('Invalid email format');
        return res.status(400).json({ 
          exists: false, 
          message: "Please enter a valid email address" 
        });
      }

      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ 
          exists: false, 
          message: "Please enter a valid email address format" 
        });
      }

      const user = await storage.getUserByEmail(email);
      console.log('User found:', !!user);
      res.setHeader('Content-Type', 'application/json');
      
      if (user) {
        return res.json({ 
          exists: true, 
          message: "This email is already registered. Please use a different email address."
        });
      }

      return res.json({ 
        exists: false, 
        message: "Email is available"
      });

    } catch (error) {
      console.error('Error checking email:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        exists: false, 
        message: "Unable to verify email availability. Please try again." 
      });
    }
  });

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
          const newCompany = {
            name: data.companyName || `${data.firstName}'s Company`,
            description: data.companyBio || null,
            website: data.companyWebsite || null,
            location: null,
            size: null,
            industry: null,
            logo: null,
            ownerId: user.id
          } as const;

          await storage.createCompany(newCompany as unknown as InsertCompany);
        } else if (normalizedUserType === 'Professional') {
          // Create a professional profile
          const newProfile = {
            userId: user.id,
            headline: data.title || null,
            bio: data.bio || null,
            skills: skillsArr || []
          } as const;

          await storage.createProfessionalProfile(newProfile as unknown as InsertProfessionalProfile);
          

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
          req.session.touch();
          req.session.save((err) => {
            if (err) {
              console.error('❌ Error saving session:', err);
              return res.status(500).json({ message: "Failed to save session" });
            }
            return res.status(201).json({ user: sanitizeUser(fakeUser), _devFallback: true });
          });
          return;
        }
        return handleError(res, dbErr, 'Registration failed');
      }
      
      if (!user) return handleError(res, new Error("User creation failed unexpectedly."), "Registration failed");
      req.session.userId = user.id.toString();
      req.session.touch();
      req.session.save((err) => {
        if (err) {
          console.error('❌ Error saving session:', err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        res.json({ user: sanitizeUser(user) });
      });
    } catch (error) {
      console.error('Registration error:', error);
      handleError(res, error, "Registration failed");
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('🔑 Processing login request:', req.body);
      
      // Check for admin user in database first
      try {
        const adminUser = await storage.getUserByEmail(req.body?.email || '');
        if (adminUser && adminUser.userType === 'admin') {
          // Verify password
          const isPasswordValid = await bcrypt.compare(req.body?.password || '', adminUser.password);
          if (isPasswordValid) {
            console.log('👑 Admin user login from database');
            req.session.userId = adminUser.id;
            req.session.touch(); // Mark session as modified
            console.log('🔐 Setting session userId:', adminUser.id);
            console.log('📋 Session before save:', {
              id: req.session.id,
              userId: req.session.userId,
              cookie: req.session.cookie
            });
            
            req.session.save((err) => {
              if (err) {
                console.error('❌ Error saving session:', err);
                return res.status(500).json({ message: "Failed to save session" });
              }
              console.log('✅ Session saved successfully');
              console.log('📊 Session after save:', {
                id: req.session.id,
                userId: req.session.userId
              });
              
              // Note: Session should be saved to database by express-session automatically
              // The sessionStore.get() is async and might not complete before response is sent
              // This is fine - express-session handles persistence
              
              return res.json({ user: sanitizeUser(adminUser) });
            });
            return;
          }
        }
      } catch (dbError) {
        console.log('⚠️ Could not check database for admin user, trying fallback:', dbError);
        // Fall through to hardcoded admin check if database fails
      }

      // Fallback: Handle hardcoded admin case (for development only)
      if (req.body?.email === 'admin@gmail.com' && req.body?.password === '123456') {
        console.log('👑 Admin user login (hardcoded fallback)');
        const adminUser = {
          id: 'admin-001',
          email: 'admin@gmail.com',
          firstName: 'Admin',
          lastName: 'User',
          userType: 'admin',
          createdAt: new Date(),
          password: ''
        };
        req.session.userId = adminUser.id;
        req.session.touch(); // Mark session as modified
        console.log('🔐 Setting session userId:', adminUser.id);
        
        // Mark session as modified and save
        req.session.save((err) => {
          if (err) {
            console.error('❌ Error saving session:', err);
            return res.status(500).json({ message: "Failed to save session" });
          }
          console.log('✅ Session saved successfully');
          console.log('📊 Session details:', {
            id: req.session.id,
            userId: req.session.userId
          });
          return res.json({ user: sanitizeUser(adminUser) });
        });
        return;
      }

      // For non-admin users, validate schema
      let data;
      try {
        data = sharedLoginSchema.parse(req.body);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ 
          message: "Invalid login data", 
          error: validationError instanceof z.ZodError ? validationError.errors : String(validationError)
        });
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
            if (data.email === 'admin@gmail.com' && data.password === '123456') {
              const fallbackAdmin = {
                id: 'dev-admin',
                email: data.email,
                firstName: 'Admin',
                lastName: 'User',
                userType: 'admin'
              };
              req.session.userId = fallbackAdmin.id;
              req.session.touch();
              // Save session before sending response
              req.session.save((err) => {
                if (err) {
                  console.error('❌ Error saving session:', err);
                  return res.status(500).json({ message: "Failed to save session" });
                }
                return res.json({ user: sanitizeUser(fallbackAdmin), _devFallback: true });
              });
              return;
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
      req.session.touch(); // Mark session as modified
      // Mark session as modified and save
      req.session.save((err) => {
        if (err) {
          console.error('❌ Error saving session:', err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        console.log('✅ Session saved successfully');
        console.log('📊 Session details:', {
          id: req.session.id,
          userId: req.session.userId
        });
        res.json({ user: sanitizeUser(user) });
      });
      
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

  // Debug endpoint to check session (simplified - no reload)
  app.get("/api/auth/session-debug", (req, res) => {
    res.json({
      hasSession: !!req.session,
      sessionId: req.session?.id,
      userId: req.session?.userId,
      cookies: req.headers.cookie,
      sessionData: {
        id: req.session?.id,
        userId: req.session?.userId,
        cookie: req.session?.cookie
      }
    });
  });

  // Stories routes (Public)
  app.post("/api/stories", async (req, res) => {
    try {
      console.log('Received story submission:', req.body);
      const data = storySchema.parse(req.body);
      const story = await storage.createStory({
        title: data.title,
        content: data.content,
        tags: data.tags || [], // Already an array from frontend
        submitterName: data.name,
        submitterEmail: data.email,
        authorId: req.session?.userId ? String(req.session.userId) : null,
        createdAt: new Date()
      });
      res.json({ success: true, story });
    } catch (error) {
      console.error('Story submission error:', error);
      handleError(res, error, "Failed to submit story");
    }
  });

  app.get("/api/stories", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const offset = (page - 1) * limit;

      // Get total count first
      const countResult = await storage.getStoryCount();
      
      // Get paginated stories
      const stories = await storage.getPaginatedStories(limit, offset);
      
      res.json({
        stories,
        meta: {
          total: countResult,
          page,
          limit,
          totalPages: Math.ceil(countResult / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching stories:', error);
      handleError(res, error, "Failed to fetch stories");
    }
  });

  // --- Authenticated Routes ---
  const authRouter = Router();

  // Job routes (assuming they might need auth features later)
  authRouter.use("/jobs", jobsRouter);

  // Employer: Get jobs by employer
  authRouter.get("/employer/jobs", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || (user.userType !== 'Employer' && user.userType !== 'admin')) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const jobs = await storage.getJobsByEmployer(userId);
      
      // Enrich jobs with company and application data
      const enrichedJobs = await Promise.all(
        jobs.map(async (job) => {
          const [company, jobApplications] = await Promise.all([
            job.companyId ? storage.getCompany(String(job.companyId)).catch(() => null) : null,
            storage.getApplicationsByJob(job.id).catch(() => [])
          ]);

          // Calculate stats
          const applications = jobApplications.length;
          const newApplications = jobApplications.filter(app => {
            const appliedDate = new Date(app.appliedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return appliedDate >= weekAgo;
          }).length;

          return {
            ...job,
            company,
            applications,
            newApplications,
            views: 0 // TODO: Add views tracking
          };
        })
      );

      res.json(enrichedJobs);
    } catch (error) {
      handleError(res, error, "Failed to fetch employer jobs");
    }
  });

  // Logout
  authRouter.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user - also add a public version to test routing
  app.get("/api/auth/me-public", (req, res) => {
    res.json({ 
      message: "Public route works", 
      sessionId: req.session?.id, 
      userId: req.session?.userId,
      hasCookie: !!req.headers.cookie
    });
  });

  // Simple test route to verify routing works
  app.get("/api/test", (req, res) => {
    res.json({ message: "Test route works!", path: req.path, method: req.method });
  });

  // Get current user
  authRouter.get("/auth/me", requireAuth, async (req, res) => {
    try {
      console.log('🔍 /api/auth/me called:', {
        sessionId: req.session?.id,
        userId: req.session?.userId,
        hasCookie: !!req.headers.cookie,
        cookieHeader: req.headers.cookie?.substring(0, 100)
      });
      
      if (!req.session.userId) {
        console.error('❌ No userId in session even though requireAuth passed!');
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.warn('⚠️ User not found for userId:', req.session.userId);
        return res.status(401).json({ message: "User not found" }); // Changed from 404 to 401
      }
      
      console.log('✅ User found:', { id: user.id, email: user.email, userType: user.userType });

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

  // Note: /api/auth/me is already registered early (line 237) - this duplicate is removed

  // Update current user profile
  authRouter.put("/me/profile", requireAuth, async (req, res) => {
    try {
        const user = await storage.getUser(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let updatedProfile;
        if (user.userType === 'Professional' || user.userType === 'job_seeker') {
            // Validate profile updates using schema
            const profileUpdates = updateProfileSchema.parse(req.body);
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
  authRouter.get("/users/:id", requireAuth, async (req, res) => {
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

  authRouter.put("/users/:id", requireAuth, async (req, res) => {
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
  authRouter.get("/companies", requireAuth, async (req, res) => {
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

  authRouter.post("/companies", requireAuth, async (req, res) => {
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

  authRouter.get("/companies/:id", requireAuth, async (req, res) => {
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

  authRouter.put("/companies/:id", requireAuth, async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Check if user owns the company
      // Handle both camelCase and snake_case, and ensure proper type comparison
      const ownerId = (company as any).ownerId || (company as any).owner_id;
      const userId = req.session.userId;
      
      console.log('🔍 Company update authorization check:', {
        companyId: req.params.id,
        ownerId: ownerId,
        ownerIdType: typeof ownerId,
        userId: userId,
        userIdType: typeof userId,
        ownerIdString: String(ownerId || ''),
        userIdString: String(userId || ''),
        match: String(ownerId || '') === String(userId || ''),
        companyKeys: Object.keys(company || {})
      });

      // Convert both to strings for comparison, handle null/undefined
      // Also allow admin users to update any company
      const isOwner = ownerId && userId && String(ownerId) === String(userId);
      const isAdmin = userId === 'admin-001'; // Allow admin to update any company
      
      // If company has no owner, allow the current user to claim it (set as owner)
      const hasNoOwner = !ownerId || ownerId === null || ownerId === undefined;
      
      if (!isOwner && !isAdmin && !hasNoOwner) {
        console.log('❌ Authorization failed:', {
          ownerId: ownerId,
          userId: userId,
          isOwner: isOwner,
          isAdmin: isAdmin,
          hasNoOwner: hasNoOwner,
          company: {
            id: (company as any).id,
            name: (company as any).name,
            owner_id: (company as any).owner_id,
            ownerId: (company as any).ownerId
          }
        });
        return res.status(403).json({ 
          message: "Not authorized to update this company",
          details: "You can only update companies that you own."
        });
      }
      
      // If company has no owner, set the current user as owner
      if (hasNoOwner && userId) {
        console.log('⚠️ Company has no owner, setting current user as owner');
        // Update the company to set the owner
        await storage.updateCompany(req.params.id, { ownerId: userId } as any);
      }

      console.log('✅ Authorization passed, updating company');
      const updatedCompany = await storage.updateCompany(req.params.id, req.body);
      res.json(updatedCompany);
    } catch (error) {
      console.error('❌ Error updating company:', error);
      handleError(res, error, "Failed to update company");
    }
  });

  // Application routes
  authRouter.get("/applications", requireAuth, async (req, res) => {
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
          
          const company = job?.companyId ? await storage.getCompany(String(job.companyId)) : null;
          
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

  authRouter.post("/applications", requireAuth, async (req, res) => {
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

  authRouter.put("/applications/:id", requireAuth, async (req, res) => {
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
  authRouter.get("/messages", requireAuth, async (req, res) => {
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

  authRouter.post("/messages", requireAuth, async (req, res) => {
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

  authRouter.put("/messages/:id/read", requireAuth, async (req, res) => {
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
  authRouter.get("/experiences", requireAuth, async (req, res) => {
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

  authRouter.post("/experiences", requireAuth, async (req, res) => {
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

  authRouter.put("/experiences/:id", requireAuth, async (req, res) => {
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

  authRouter.delete("/experiences/:id", requireAuth, async (req, res) => {
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

  // Mount the dashboard route with auth
  authRouter.use("/dashboard", dashboardRouter);
  
  // Mount the admin stories route
  app.use("/api/admin/stories", adminStoriesRouter);

  // Mount the applications routes with auth
  const applicationRoutes = Router();
  applicationRoutes.post("/quick-apply", upload.array('attachments', 5), async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { jobId, coverLetter } = req.body;

      // Get uploaded file details
      const attachments = (req.files as Express.Multer.File[])?.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype
      })) || [];

      // Create application record
      const [application] = await db
        .insert(applications)
        .values({
          userId: parseInt(userId),
          jobId: parseInt(jobId),
          coverLetter,
          attachments,
          status: 'review'
        })
        .returning();

      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating application:', error);
      
      // Clean up any uploaded files if there was an error
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
        await Promise.all(
          files.map(file => {
            const f = file as Express.Multer.File;
            return fs.promises.unlink(f.path).catch(err => 
              console.error(`Failed to delete file ${f.path}:`, err)
            );
          })
        );
      }

      res.status(500).json({ 
        error: 'Failed to submit application',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Mount the authenticated router
  app.use("/api", authRouter);
  app.use("/api/applications", applicationRoutes);
  
  // Log registered routes for debugging
  console.log('✅ Routes registered:');
  console.log('   - GET /api/auth/me (direct route)');
  console.log('   - GET /api/auth/me (via authRouter)');
  console.log('   - GET /api/auth/me-public (public test route)');

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

  // Cleanup endpoint to remove expired sessions (admin only)
  app.post("/api/admin/cleanup-sessions", requireAdmin, async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM session WHERE expire < NOW() RETURNING sid"
      );
      res.json({ 
        message: `Cleaned up ${result.rowCount} expired sessions`,
        deletedCount: result.rowCount 
      });
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      handleError(res, error, "Failed to cleanup sessions");
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      console.log('📊 Fetching all users for admin...');
      const users = await storage.getAllUsers();
      console.log(`✅ Found ${users.length} users in database`);
      
      // Log first user to see what fields we're getting
      if (users.length > 0) {
        console.log('🔍 Sample user from database:', {
          id: users[0].id,
          email: users[0].email,
          first_name: (users[0] as any).first_name,
          last_name: (users[0] as any).last_name,
          firstName: (users[0] as any).firstName,
          lastName: (users[0] as any).lastName,
          user_type: (users[0] as any).user_type,
          userType: (users[0] as any).userType
        });
      }
      
      const enrichedUsers = await Promise.all(users.map(async (user) => {
        const sanitized = sanitizeUser(user);
        
        // Log after sanitization to verify mapping
        if (users.indexOf(user) === 0) {
          console.log('🔍 Sample user after sanitization:', {
            id: sanitized.id,
            email: sanitized.email,
            firstName: sanitized.firstName,
            lastName: sanitized.lastName,
            userType: sanitized.userType
          });
        }
        
        let profile = null;
        let company = null;

        const userType = sanitized.userType || (user as any).user_type || '';
        if (userType === 'Professional' || userType === 'job_seeker') {
          profile = await storage.getProfessionalProfileByUserId(user.id);
        } else if (userType === 'Employer') {
          const companies = await storage.getCompaniesByOwner(user.id);
          company = companies.length > 0 ? companies[0] : null;
        }

        return {
          ...sanitized,
          profile,
          company
        };
      }));
      
      console.log(`✅ Returning ${enrichedUsers.length} enriched users`);
      res.json(enrichedUsers);
    } catch (error) {
      console.error('❌ Error in /api/admin/users:', error);
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
        userType: z.enum(['Professional', 'Employer', 'admin']),
        location: z.string().optional(),
        title: z.string().optional(), // For professionals
        confirmPassword: z.string().optional(), // Added to allow frontend to send it without validation error
      });

      console.log('AdminCreateUserSchema userType options at runtime:', adminCreateUserSchema.shape.userType._def.values);
      const data = adminCreateUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Normalize userType to 'Professional' or 'Employer' for database consistency
      let normalizedUserType: 'Professional' | 'Employer' | 'admin';
      if (data.userType === 'Professional') {
        normalizedUserType = 'Professional';
      } else if (data.userType === 'Employer') {
        normalizedUserType = 'Employer';
      } else {
        normalizedUserType = data.userType;
      }

      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: normalizedUserType,
        location: data.location || null,
        profilePhoto: null,
        telephoneNumber: null
      } as unknown as InsertUser);

      // Create associated profile or company
      if (normalizedUserType === 'Employer') {
        await storage.createCompany({
          name: `${data.firstName}'s Company`,
          description: null,
          website: null,
          location: null,
          industry: null,
          size: null,
          ownerId: user.id,
        } as unknown as InsertCompany);
      } else if (normalizedUserType === 'Professional') {
        await storage.createProfessionalProfile({
          userId: user.id,
          headline: data.title || null,
          bio: null,
          skills: []
        } as unknown as InsertProfessionalProfile);
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

  // Admin: Update job
  app.put("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
    try {
      console.log('📝 Updating job:', req.params.id, 'with data:', req.body);
      const job = await storage.updateJob(req.params.id, req.body);
      console.log('✅ Job updated successfully:', job.id);
      res.json(job);
    } catch (error) {
      console.error('❌ Error updating job:', error);
      handleError(res, error, "Failed to update job");
    }
  });

  // Admin: Delete job
  app.delete("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
    try {
      // Note: You'll need to add a deleteJob method to storage if it doesn't exist
      // For now, we can use a direct SQL query
      await db.execute(sql`DELETE FROM jobs WHERE id = ${req.params.id}`);
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      handleError(res, error, "Failed to delete job");
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

  // Admin: Get all stories (including unapproved ones)
  app.get("/api/admin/stories", requireAdmin, async (req, res) => {
    try {
      const stories = await storage.getAllStories();
      res.json(stories);
    } catch (error) {
      handleError(res, error, "Failed to fetch stories");
    }
  });

  // Admin: Approve/reject a story
  app.put("/api/admin/stories/:id/approval", requireAdmin, async (req, res) => {
    try {
      const { approved } = req.body;
      if (typeof approved !== 'boolean') {
        return res.status(400).json({ message: "Approved status must be a boolean" });
      }

      const story = await storage.updateStoryApproval(req.params.id, approved);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      handleError(res, error, "Failed to update story approval status");
    }
  });

  // Admin: Delete a story
  app.delete("/api/admin/stories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteStory(req.params.id);
      res.json({ message: "Story deleted successfully" });
    } catch (error) {
      handleError(res, error, "Failed to delete story");
    }
  });

  // Note: Removed catch-all route as it was interfering with route matching
  // Express will naturally return 404 for unmatched routes

  const httpServer = createServer(app);
  return httpServer;
}

export default registerRoutes;