import dashboardRouter from "./routes/dashboard";
import platformDashboardRouter from "./routes/platform-dashboard";
import jobsRouter from "./routes/jobs";
import resumesRouter from "./routes/resumes";
import recommendationsRouter from "./routes/recommendations";
import aiReviewRouter from "./routes/ai-review";
import aiAdminRouter from "./routes/ai-admin";
import {
  buildEmployerAnalytics,
  mapApplicationsForAnalytics,
  mapJobsForAnalytics,
  type EmployerAnalyticsRange,
} from "./lib/employer-analytics";
import {
  buildAdminAnalytics,
  mapApplicationsForAdminAnalytics,
  mapCompaniesForAdminAnalytics,
  mapJobsForAdminAnalytics,
  mapUsersForAdminAnalytics,
  type AdminAnalyticsRange,
} from "./lib/admin-analytics";
import adminStoriesRouter from "./routes/admin/stories";
import authOauthRouter, { passport as oauthPassport } from "./routes/auth-oauth";
import { type Express, Router } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcrypt";
import { z } from "zod";
import { sql } from "drizzle-orm";
import fs from 'fs';
import path from 'path';
import multer from 'multer';
// Remove import { applications } from './schema'; removed as we use shared schema

import { db, pool } from './db';
import { storage, Storage } from "./storage";
import connectPgSimple from 'connect-pg-simple';
import type { Session } from 'express-session';
import { 
  loginSchema as sharedLoginSchema, 
  registerSchema,
  updateProfileSchema,
  updateMeProfileSchema,
  type User,
  type InsertUser,
  type InsertCompany, 
  type InsertProfessionalProfile,
  type UpdateProfile,
  professionalProfiles,
  companies,
  applications
} from "../../shared/schema";


import { handleError } from "./utils";
import { resumeSummaryFromRaw } from "./lib/resume-attachments";
import {
  notifyApplicationStatusChange,
  notifyApplicationSubmitted,
  notifyNewMessage,
} from "./lib/activity-notifications";
import {
  buildRuleBasedInsight,
  countPipeline,
  enrichInsightWithGemini,
} from "./lib/activity-insights";
import {
  isHrUser,
  isHrUserType,
  isProfessionalUser,
  isEmployerUser,
  resolveEmployeeMessagingAccess,
  employeeMessagingHint,
  normalizeApplicationStatus,
} from "./lib/messaging-policy";
import { createApplication } from "./routes/applications";
import applicationsRouter from "./routes/applications-router";
import {
  normalizeAccountStatus,
  readAccountStatusFromRow,
  accountStatusBlocksLogin,
  accountStatusLoginMessage,
  USER_ACCOUNT_STATUSES,
} from "./lib/account-status";
import { createAssistantReply } from "./ai/assistant-service";

function jobEmployerId(job: { employerId?: string | null; employer_id?: string | null } | null): string {
  if (!job) return "";
  const id = job.employerId ?? job.employer_id;
  return id != null ? String(id) : "";
}

const APPLICATION_STATUS_ALIASES: Record<string, string> = {
  new: "applied",
  pending: "applied",
  review: "under_review",
  reviewing: "under_review",
  reviewed: "under_review",
  screening: "under_review",
  interview: "interview",
  interviewing: "interview",
  shortlisted: "shortlisted",
  accepted: "hired",
  approved: "hired",
  offer: "hired",
  hired: "hired",
  rejected: "rejected",
  declined: "rejected",
  applied: "applied",
  under_review: "under_review",
};

function normalizeApplicationStatusInput(status: unknown): string | null {
  if (status == null || status === "") return null;
  const key = String(status).toLowerCase().trim();
  return APPLICATION_STATUS_ALIASES[key] ?? key;
}

async function emitApplicationStatusNotification(
  application: { id: number | string; applicantId: string; jobId: string | null; status?: string | null },
  oldStatus: string | null | undefined,
  newStatus: string
) {
  if (!application.applicantId || !newStatus) return;
  const job = application.jobId ? await storage.getJob(String(application.jobId)).catch(() => null) : null;
  const jobTitle = (job as { title?: string } | null)?.title ?? "your role";
  await notifyApplicationStatusChange(storage, {
    applicantId: String(application.applicantId),
    applicationId: application.id,
    oldStatus,
    newStatus,
    jobTitle,
  }).catch((err) => console.error("Notification emit failed:", err));
}

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
const normalizeUserType = (value: unknown): "Professional" | "Employer" | "admin" | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "employer") return "Employer";
  if (normalized === "admin") return "admin";
  if (normalized === "professional" || normalized === "job_seeker") return "Professional";
  if (value === "Professional" || value === "Employer" || value === "admin") return value;
  return undefined;
};

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  userType: z.preprocess(normalizeUserType, z.enum(["Professional", "Employer", "admin"]).optional()),
  location: z.string().optional(),
  telephoneNumber: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  profilePhoto: z.string().optional(),
  accountStatus: z.enum(USER_ACCOUNT_STATUSES).optional(),
  status: z.enum(USER_ACCOUNT_STATUSES).optional(),
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

const normalizeOptionalText = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

function assistantEventMetadata(body: unknown): Record<string, unknown> {
  const messages = (body as { messages?: unknown })?.messages;
  return {
    messageCount: Array.isArray(messages) ? messages.length : 0,
  };
}

function logAssistantAiEvent(event: {
  userId?: string | null;
  status: "success" | "error";
  latencyMs: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}) {
  void storage.createAiEvent({
    userId: event.userId ?? null,
    feature: "assistant_chat",
    provider: "gemini",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    status: event.status,
    latencyMs: event.latencyMs,
    errorCode: event.errorCode ?? null,
    errorMessage: event.errorMessage ?? null,
    metadata: event.metadata ?? {},
  });
}

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
  const normalizedUserType = ((user as any)?.userType || (user as any)?.user_type || "")
    .toString()
    .toLowerCase()
    .trim();

  if (String(req.path || "").includes("/api/admin/stories")) {
    console.log("🔐 requireAdmin(admin/stories):", {
      sessionUserId: req.session.userId,
      resolvedUserTypeRaw: (user as any)?.userType || (user as any)?.user_type,
      resolvedUserTypeNormalized: normalizedUserType,
      userFound: !!user,
    });
  }

  if (normalizedUserType === 'admin') {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: Admin access required" });
};

const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  const accountStatus = readAccountStatusFromRow(sanitizedUser as Record<string, unknown>);
  // Map snake_case database fields to camelCase for frontend
  return {
    ...sanitizedUser,
    firstName: sanitizedUser.firstName || sanitizedUser.first_name || '',
    lastName: sanitizedUser.lastName || sanitizedUser.last_name || '',
    userType: sanitizedUser.userType || sanitizedUser.user_type || '',
    createdAt: sanitizedUser.createdAt || sanitizedUser.created_at,
    profilePhoto: sanitizedUser.profilePhoto || sanitizedUser.profile_photo,
    telephoneNumber: sanitizedUser.telephoneNumber || sanitizedUser.telephone_number,
    accountStatus,
    status: accountStatus,
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

    // Passport initialization for OAuth routes
    app.use(oauthPassport.initialize());

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
        const rawUserType = ((user as any).userType || (user as any).user_type || "").toString().toLowerCase();

        // Keep this early route aligned with the main auth route to avoid profile-loss UI mismatches.
        if (!rawUserType || rawUserType === 'professional' || rawUserType === 'job_seeker' || rawUserType === 'job-seeker') {
          profile = await storage.getProfessionalProfileByUserId(user.id);
        } else if (rawUserType === 'employer' || rawUserType === 'company_owner') {
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
      const ext = path.extname(file.originalname || "").toLowerCase();
      const allowedExts = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"];
      const allowedMimes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/octet-stream'
      ];
      const mimeAllowed = allowedMimes.includes(file.mimetype);
      const extAllowed = allowedExts.includes(ext);
      if (mimeAllowed && (file.mimetype !== 'application/octet-stream' || extAllowed)) {
        cb(null, true);
      } else if (file.mimetype === 'application/octet-stream' && extAllowed) {
        // Some browsers/uploaders send generic MIME; trust safe extensions.
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, Word documents, and images (JPG, PNG, WEBP) are allowed.'));
      }
    },

    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });  // Check if email exists route

  const uploadImage = multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid image type. Only JPG, PNG and WEBP are allowed."));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB image limit
    },
  });

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
          error: validationError instanceof z.ZodError ? validationError.issues : String(validationError)
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

      const accountStatus = readAccountStatusFromRow(user as Record<string, unknown>);
      if (accountStatusBlocksLogin(accountStatus)) {
        return res.status(403).json({ message: accountStatusLoginMessage(accountStatus) });
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

      const [countResult, stories] = await Promise.all([
        storage.getStoryCount(),
        storage.getPaginatedStories(limit, offset),
      ]);
      
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
      const jobsUserType = String(
        (user as { userType?: string; user_type?: string })?.userType ??
          (user as { user_type?: string })?.user_type ??
          "",
      )
        .toLowerCase()
        .trim();
      if (!user || (!isEmployerUser(user) && jobsUserType !== "admin")) {
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

  // Employer: recruiting analytics (DB-backed, for HR reporting)
  authRouter.get("/employer/analytics", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      const rawType = String(
        (user as { userType?: string; user_type?: string })?.userType ??
          (user as { user_type?: string })?.user_type ??
          "",
      )
        .toLowerCase()
        .trim();
      if (!user || (!isEmployerUser(user) && rawType !== "admin")) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const rawRange = String(req.query.timeRange || "30d");
      const allowed: EmployerAnalyticsRange[] = ["7d", "30d", "90d", "1y"];
      const timeRange = allowed.includes(rawRange as EmployerAnalyticsRange)
        ? (rawRange as EmployerAnalyticsRange)
        : "30d";

      const [jobs, applications, ownedCompanies] = await Promise.all([
        storage.getJobsByEmployer(userId),
        storage.getApplicationsWithDetailsByEmployer(userId),
        storage.getCompaniesByOwner(userId).catch(() => []),
      ]);

      const companyById = new Map<string, any>(
        ownedCompanies.map((c: any) => [String(c.id), c] as [string, any]),
      );

      const applicationCounts = new Map<string, number>();
      for (const app of applications) {
        const jobId = app.jobId ?? app.job_id;
        if (jobId) {
          const key = String(jobId);
          applicationCounts.set(key, (applicationCounts.get(key) ?? 0) + 1);
        }
      }

      const enrichedJobs = jobs.map((job) => ({
        ...job,
        company: job.companyId
          ? companyById.get(String(job.companyId)) ?? null
          : null,
        applications: applicationCounts.get(job.id) ?? 0,
      }));

      const company =
        enrichedJobs.find((j) => j.company)?.company ?? ownedCompanies[0] ?? null;

      const payload = buildEmployerAnalytics(
        mapJobsForAnalytics(enrichedJobs as Array<Record<string, unknown>>, applicationCounts),
        mapApplicationsForAnalytics(applications as Array<Record<string, unknown>>),
        timeRange,
        (company as { name?: string } | null)?.name ?? null,
      );

      res.json(payload);
    } catch (error) {
      handleError(res, error, "Failed to fetch employer analytics");
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

  // OAuth routes (Google)
  app.use("/api/auth", authOauthRouter);
  app.use("/api/admin/platform-dashboard", platformDashboardRouter);

  // AI assistant (Gemini) endpoint for the in-app SupportChatbot
  // Expected request:
  //  { messages: [{ role: "user" | "assistant", text: string }, ...] }
  // Expected response:
  //  { reply: string }
  app.post("/api/assistant/chat", async (req, res) => {
    const startedAt = Date.now();
    const userId = req.session?.userId ? String(req.session.userId) : null;
    const metadata = assistantEventMetadata(req.body);

    try {
      const reply = await createAssistantReply(req.body);
      logAssistantAiEvent({
        userId,
        status: "success",
        latencyMs: Date.now() - startedAt,
        metadata,
      });
      return res.json({ reply });
    } catch (error: any) {
      if (error?.statusCode && error?.responseBody) {
        logAssistantAiEvent({
          userId,
          status: "error",
          latencyMs: Date.now() - startedAt,
          errorCode: String(error.responseBody.error || error.statusCode),
          errorMessage: String(error.responseBody.message || error.message || "Assistant failed"),
          metadata: {
            ...metadata,
            statusCode: error.statusCode,
          },
        });
        return res.status(error.statusCode).json(error.responseBody);
      }

      console.error("Assistant error:", error);
      logAssistantAiEvent({
        userId,
        status: "error",
        latencyMs: Date.now() - startedAt,
        errorCode: "Assistant failed",
        errorMessage: error?.message || "Unknown error",
        metadata,
      });
      return res.status(500).json({
        error: "Assistant failed",
        message: error?.message || "Unknown error",
      });
    }
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
      
      const userId = req.session.userId;
      if (!userId) {
        console.error('❌ No userId in session even though requireAuth passed!');
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        console.warn('⚠️ User not found for userId:', userId);
        return res.status(401).json({ message: "User not found" });
      }
      
      // Normalize userType for comparison
      const userTypeRaw = (user as any).userType || (user as any).user_type || "";
      const normalizedType = userTypeRaw.toString().toLowerCase();
      
      console.log('✅ User found:', { id: user.id, email: user.email, userType: userTypeRaw, normalizedType });

      let profile = null;
      let company = null;
      
      // Professional or job seeker check
      if (!normalizedType || normalizedType === 'professional' || normalizedType === 'job_seeker' || normalizedType === 'job-seeker') {
        profile = await storage.getProfessionalProfileByUserId(user.id);
      } else if (normalizedType === 'employer' || normalizedType === 'company_owner') {
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

  // Update current user profile (account fields + professional profile)
  authRouter.put("/me/profile", requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        let user = await storage.getUser(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const body = updateMeProfileSchema.parse(req.body);

        const userUpdates: Partial<User> = {};
        if (body.firstName !== undefined) userUpdates.firstName = body.firstName;
        if (body.lastName !== undefined) userUpdates.lastName = body.lastName;
        if (body.email !== undefined) userUpdates.email = body.email;
        if (body.location !== undefined) userUpdates.location = body.location;
        if (body.telephoneNumber !== undefined) userUpdates.telephoneNumber = body.telephoneNumber;

        if (Object.keys(userUpdates).length > 0) {
          user = await storage.updateUser(user.id, userUpdates);
        }

        // Handle both snake_case and camelCase, and normalize for comparison
        const userTypeRaw = (user as any).userType || (user as any).user_type || "";
        const normalizedType = userTypeRaw.toString().toLowerCase();

        const profileUpdates: { headline?: string; bio?: string; skills?: string[]; experience?: any[]; education?: any[] } = {};
        if (body.headline !== undefined) profileUpdates.headline = body.headline;
        if (body.bio !== undefined) profileUpdates.bio = body.bio;
        if (body.skills !== undefined) profileUpdates.skills = body.skills;
        if (body.experience !== undefined) profileUpdates.experience = body.experience;
        if (body.education !== undefined) profileUpdates.education = body.education;

        let updatedProfile = null;
        const hasProfileUpdates = Object.keys(profileUpdates).length > 0;
        const isProfessionalUser =
          !normalizedType ||
          normalizedType === "professional" ||
          normalizedType === "job_seeker" ||
          normalizedType === "job-seeker";

        if (hasProfileUpdates) {
          if (!isProfessionalUser) {
            return res.status(400).json({
              message: "User does not have an updatable professional profile",
              userType: userTypeRaw,
            });
          }
          updatedProfile = await storage.updateProfessionalProfile(user.id, profileUpdates);
        } else if (isProfessionalUser) {
          updatedProfile = await storage.getProfessionalProfileByUserId(user.id);
        }

        res.json({
          user: sanitizeUser(user),
          profile: updatedProfile,
        });

    } catch (error) {
        console.error('❌ Profile Update Error:', error);
        handleError(res, error, "Failed to update profile");
    }
  });

  // Export Data
  authRouter.get("/me/export", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const profile = await storage.getProfessionalProfileByUserId(userId);
      const applications = await storage.getApplicationsWithDetailsByApplicant(userId).catch(() => []);
      const companies = await storage.getCompaniesByOwner(userId).catch(() => []);
      
      res.json({
        user: sanitizeUser(user),
        profile,
        applications,
        companies
      });
    } catch (error) {
      handleError(res, error, "Failed to export data");
    }
  });

  // Soft Delete Account
  authRouter.delete("/me/account", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password is required to confirm account deletion" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }
      
      await storage.softDeleteUser(userId);
      
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error after account deletion:", err);
        }
        res.json({ message: "Account deleted and data anonymized successfully" });
      });
    } catch (error) {
      handleError(res, error, "Failed to delete account");
    }
  });

  // Upload current user's profile photo
  authRouter.post("/me/profile-photo", requireAuth, (req, res) => {
    uploadImage.single("photo")(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ message: err.message || "Invalid upload" });
      }
      try {
        const userId = req.session.userId;
        if (!userId) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        if (!req.file) {
          return res.status(400).json({ message: "No image file uploaded" });
        }

        const photoUrl = `/uploads/${req.file.filename}`;
        const updatedUser = await storage.updateUserProfilePhoto(userId, photoUrl);
        return res.json({ user: sanitizeUser(updatedUser), profilePhoto: photoUrl });
      } catch (error) {
        handleError(res, error, "Failed to upload profile photo");
      }
    });
  });

  const uploadResume = multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const allowedExts = [".pdf", ".doc", ".docx"];
      const allowedMimes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only PDF and Word documents are allowed."));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  // Upload current user's profile resume (professional)
  authRouter.post("/me/resume", requireAuth, (req, res) => {
    uploadResume.single("resume")(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ message: err.message || "Invalid upload" });
      }
      try {
        const userId = req.session.userId;
        if (!userId) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        if (!req.file) {
          return res.status(400).json({ message: "No resume file uploaded" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const existingProfile = await storage.getProfessionalProfileByUserId(userId);
        if (existingProfile?.resumeUrl?.startsWith("/uploads/")) {
          const oldName = path.basename(existingProfile.resumeUrl);
          const oldPath = path.join(process.cwd(), "uploads", oldName);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const resumeUrl = `/uploads/${req.file.filename}`;
        const resumeName = req.file.originalname || req.file.filename;
        const profile = await storage.updateProfessionalProfileResume(userId, resumeUrl, resumeName);
        return res.json({ profile, resumeUrl, resumeName });
      } catch (error) {
        handleError(res, error, "Failed to upload resume");
      }
    });
  });

  // Remove current user's profile resume
  authRouter.delete("/me/resume", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const existingProfile = await storage.getProfessionalProfileByUserId(userId);
      if (existingProfile?.resumeUrl?.startsWith("/uploads/")) {
        const fileName = path.basename(existingProfile.resumeUrl);
        const filePath = path.join(process.cwd(), "uploads", fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      const profile = await storage.clearProfessionalProfileResume(userId);
      return res.json({ profile, resumeUrl: null, resumeName: null });
    } catch (error) {
      handleError(res, error, "Failed to remove resume");
    }
  });

  // Latest resume used on a past application (for quick-apply pre-fill)
  authRouter.get("/me/application-resume/latest", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const apps = await storage.getApplicationsWithDetailsByApplicant(userId);
      for (const app of apps) {
        const summary = resumeSummaryFromRaw(app.resume);
        if (!summary) continue;

        return res.json({
          resumeUrl: summary.resumeUrl,
          resumeName: summary.originalName,
          appliedAt: app.appliedAt ?? null,
          jobTitle: app.job?.title ?? null,
          applicationId: app.id,
        });
      }

      return res.json({
        resumeUrl: null,
        resumeName: null,
        appliedAt: null,
        jobTitle: null,
        applicationId: null,
      });
    } catch (error) {
      handleError(res, error, "Failed to load last application resume");
    }
  });

  // Remove current user's profile photo
  authRouter.delete("/me/profile-photo", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Best effort cleanup for locally uploaded files.
      if (user.profilePhoto?.startsWith("/uploads/")) {
        const fileName = path.basename(user.profilePhoto);
        const filePath = path.join(process.cwd(), "uploads", fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      const updatedUser = await storage.updateUserProfilePhoto(userId, null);
      return res.json({ user: sanitizeUser(updatedUser), profilePhoto: null });
    } catch (error) {
      handleError(res, error, "Failed to remove profile photo");
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
      const body = { ...req.body } as Record<string, unknown>;
      if (body.coverUrl !== undefined && body.coverImage === undefined) {
        body.coverImage = body.coverUrl;
      }
      const updatedCompany = await storage.updateCompany(req.params.id, body);
      res.json(updatedCompany);
    } catch (error) {
      console.error('❌ Error updating company:', error);
      handleError(res, error, "Failed to update company");
    }
  });

  const assertCompanyOwner = async (
    req: { session: Session & { userId?: string }; params: { id: string } },
    res: { status: (code: number) => { json: (body: unknown) => void } }
  ) => {
    const company = await storage.getCompany(req.params.id);
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return null;
    }
    const ownerId = (company as { ownerId?: string; owner_id?: string }).ownerId
      ?? (company as { owner_id?: string }).owner_id;
    const userId = req.session.userId;
    const isOwner = ownerId && userId && String(ownerId) === String(userId);
    const isAdmin = userId === "admin-001";
    const hasNoOwner = !ownerId;
    if (!isOwner && !isAdmin && !hasNoOwner) {
      res.status(403).json({ message: "Not authorized to update this company" });
      return null;
    }
    if (hasNoOwner && userId) {
      await storage.updateCompany(req.params.id, { ownerId: userId } as unknown as InsertCompany);
    }
    return company;
  };

  authRouter.post("/companies/:id/cover", requireAuth, (req, res) => {
    uploadImage.single("cover")(req, res, async (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : "Invalid upload";
        return res.status(400).json({ message });
      }
      try {
        const company = await assertCompanyOwner(req, res);
        if (!company) return;
        if (!req.file) {
          return res.status(400).json({ message: "No image file uploaded" });
        }

        const existingCover =
          (company as { coverImage?: string; cover_image?: string }).coverImage
          ?? (company as { cover_image?: string }).cover_image;
        if (existingCover?.startsWith("/uploads/")) {
          const oldPath = path.join(process.cwd(), "uploads", path.basename(existingCover));
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const coverImage = `/uploads/${req.file.filename}`;
        const updatedCompany = await storage.updateCompany(req.params.id, { coverImage });
        return res.json({
          coverImage,
          company: updatedCompany,
        });
      } catch (error) {
        handleError(res, error, "Failed to upload company cover");
      }
    });
  });

  authRouter.delete("/companies/:id/cover", requireAuth, async (req, res) => {
    try {
      const company = await assertCompanyOwner(req, res);
      if (!company) return;

      const existingCover =
        (company as { coverImage?: string; cover_image?: string }).coverImage
        ?? (company as { cover_image?: string }).cover_image;
      if (existingCover?.startsWith("/uploads/")) {
        const filePath = path.join(process.cwd(), "uploads", path.basename(existingCover));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      const updatedCompany = await storage.updateCompany(req.params.id, { coverImage: null });
      return res.json({ coverImage: null, company: updatedCompany });
    } catch (error) {
      handleError(res, error, "Failed to remove company cover");
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
        applications = await storage.getApplicationsWithDetailsByApplicant(applicantId).catch(() => []);
      } else if (jobId) {
        const job = await storage.getJob(jobId);
        if (jobEmployerId(job) !== String(req.session.userId ?? "")) {
          return res.status(403).json({ message: "Not authorized to view applications for this job" });
        }
        applications = await storage.getApplicationsWithDetailsByJob(jobId).catch(() => []);
      } else if (employerId) {
        if (employerId !== req.session.userId) {
          return res.status(403).json({ message: "Not authorized to view these applications" });
        }
        applications = await storage.getApplicationsWithDetailsByEmployer(employerId).catch(() => []);

        const enriched = await Promise.all(
          applications.map(async (application) => {
            let profile: Awaited<ReturnType<typeof storage.getProfessionalProfileByUserId>> = null;
            if (application.applicantId) {
              profile = await storage
                .getProfessionalProfileByUserId(String(application.applicantId))
                .catch(() => null);
            }
            const match = Storage.computeMatchScore({
              candidateSkills: Array.isArray(profile?.skills) ? profile.skills : [],
              jobSkills: Array.isArray(application.job?.skills) ? application.job.skills : [],
              candidateLocation: application.applicant?.location || null,
              jobLocation: application.job?.location || null,
              candidateHeadline: profile?.headline || null,
              jobTitle: application.job?.title || null,
              salaryMin: application.job?.salaryMin ?? null,
              salaryMax: application.job?.salaryMax ?? null,
            });
            return {
              ...application,
              applicant: application.applicant ? sanitizeUser(application.applicant) : null,
              profile,
              matchScore: match.total,
            };
          }),
        );

        return res.json(enriched);
      } else {
        return res.status(400).json({ message: "applicantId, jobId, or employerId is required" });
      }
      
      const sanitizedApplications = applications.map((application) => ({
        ...application,
        applicant: application.applicant ? sanitizeUser(application.applicant) : null,
      }));

      res.json(sanitizedApplications);
    } catch (error) {
      handleError(res, error, "Failed to fetch applications");
    }
  });

  authRouter.post("/applications", requireAuth, async (req, res) => {
    try {
      const data = {
        ...req.body,
        applicantId: req.session.userId,
        status: req.body.status ?? "applied",
      };

      const existingApplications = await storage.getApplicationsByJob(data.jobId).catch(() => []);
      const alreadyApplied = existingApplications.some(
        (app) => String(app.applicantId) === String(data.applicantId)
      );

      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }

      const application = await storage.createApplication(data);
      const job = data.jobId ? await storage.getJob(String(data.jobId)).catch(() => null) : null;
      await notifyApplicationSubmitted(storage, {
        applicantId: String(data.applicantId),
        applicationId: application.id,
        jobTitle: (job as { title?: string } | null)?.title,
      }).catch((err) => console.error("Submit notification failed:", err));

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

      const sessionUserId = String(req.session.userId ?? "");
      const applicantId = application.applicantId != null ? String(application.applicantId) : "";
      const job = application.jobId ? await storage.getJob(String(application.jobId)) : null;
      const employerId = jobEmployerId(job);

      if (applicantId !== sessionUserId && employerId !== sessionUserId) {
        return res.status(403).json({ message: "Not authorized to update this application" });
      }

      const normalizedStatus = normalizeApplicationStatusInput(req.body?.status);
      const updates: { status?: string } = {};
      if (normalizedStatus != null) {
        updates.status = normalizedStatus;
      }

      const oldStatus = application.status;
      const updatedApplication = await storage.updateApplication(req.params.id, updates);

      if (normalizedStatus && String(normalizedStatus) !== String(oldStatus ?? "")) {
        await emitApplicationStatusNotification(
          {
            id: updatedApplication.id,
            applicantId: String(updatedApplication.applicantId ?? applicantId),
            jobId: updatedApplication.jobId ? String(updatedApplication.jobId) : null,
            status: updatedApplication.status,
          },
          oldStatus,
          normalizedStatus
        );
      }

      res.json(updatedApplication);
    } catch (error) {
      handleError(res, error, "Failed to update application");
    }
  });

  // Message routes — pipeline-gated recruiter threads + optional platform support
  authRouter.get("/messages/recruiter-threads", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      if (!isProfessionalUser(currentUser)) {
        return res.status(403).json({ message: "Recruiter threads are for job seekers only" });
      }
      const threads = await storage.getRecruiterThreadsForApplicant(userId);
      res.json(
        threads.map((t) => ({
          ...t,
          messagingHint: employeeMessagingHint(t.status, t.employerHasMessaged),
          statusLabel: normalizeApplicationStatus(t.status),
        }))
      );
    } catch (error) {
      handleError(res, error, "Failed to fetch recruiter threads");
    }
  });

  authRouter.get("/messages/employer-threads", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      if (!isEmployerUser(currentUser)) {
        return res.status(403).json({ message: "Employer threads are for company accounts only" });
      }
      const threads = await storage.getApplicantThreadsForEmployer(userId);
      res.json(
        threads.map((t) => ({
          ...t,
          statusLabel: normalizeApplicationStatus(t.status),
        }))
      );
    } catch (error) {
      handleError(res, error, "Failed to fetch employer threads");
    }
  });

  authRouter.get("/messages/hr-contacts", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!isProfessionalUser(currentUser)) {
        return res.status(403).json({ message: "HR contacts are only available for job seekers" });
      }
      const contacts = await storage.getHrContactUsers();
      res.json(contacts.map((u) => sanitizeUser(u)));
    } catch (error) {
      handleError(res, error, "Failed to fetch HR contacts");
    }
  });

  authRouter.get("/messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const otherUserId = req.query.otherUserId as string;
      const applicationIdRaw = req.query.applicationId as string | undefined;
      const applicationId = applicationIdRaw ? Number(applicationIdRaw) : null;
      const currentUser = await storage.getUser(userId);
      const employeeMessaging = isProfessionalUser(currentUser);

      if (applicationId != null && !Number.isNaN(applicationId)) {
        const ctx = await storage.getApplicationMessagingContext(applicationId);
        if (!ctx) {
          return res.status(404).json({ message: "Application not found" });
        }
        const isApplicant = ctx.applicantId === String(userId);
        const isRecruiter = ctx.employerId === String(userId);
        if (!isApplicant && !isRecruiter) {
          return res.status(403).json({ message: "Not authorized for this conversation" });
        }
        if (isApplicant && employeeMessaging) {
          const access = resolveEmployeeMessagingAccess(ctx.status, ctx.employerHasMessaged);
          const hasThread = await storage.getConversationByApplication(userId, applicationId);
          if (!access.canSend && hasThread.length === 0) {
            return res.status(403).json({
              message: employeeMessagingHint(ctx.status, ctx.employerHasMessaged),
            });
          }
        }
        const messages = await storage.getConversationByApplication(userId, applicationId);
        return res.json(messages);
      }

      if (otherUserId) {
        if (employeeMessaging) {
          const peer = await storage.getUser(otherUserId);
          if (!isHrUser(peer)) {
            return res.status(403).json({
              message: "Use recruiter threads for company conversations. Platform support is under HR contacts.",
            });
          }
        }
        const messages = await storage.getConversation(userId, otherUserId);
        res.json(messages);
      } else {
        let messages = await storage.getMessagesByUser(userId);
        if (employeeMessaging) {
          messages = messages.filter((msg) => {
            const isOutbound = String(msg.senderId) === String(userId);
            const peerType = isOutbound
              ? (msg as { receiverUserType?: unknown }).receiverUserType
              : (msg as { senderUserType?: unknown }).senderUserType;
            return isHrUserType(peerType);
          });
        }
        res.json(messages);
      }
    } catch (error) {
      handleError(res, error, "Failed to fetch messages");
    }
  });

  authRouter.post("/messages", requireAuth, async (req, res) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      const applicationIdRaw = req.body?.applicationId;
      const applicationId =
        applicationIdRaw != null && !Number.isNaN(Number(applicationIdRaw))
          ? Number(applicationIdRaw)
          : null;

      if (data.senderId.toString() !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to send message as this user" });
      }

      const sender = await storage.getUser(req.session.userId);
      const receiver = await storage.getUser(String(data.receiverId));

      if (!receiver) {
        return res.status(404).json({ message: "Recipient not found" });
      }

      let resolvedApplicationId = applicationId;

      if (isProfessionalUser(sender)) {
        if (isHrUser(receiver)) {
          // Platform support — no application context required
        } else if (isEmployerUser(receiver)) {
          const ctx = await storage.findApplicationForMessagingPair(
            String(req.session.userId),
            String(data.receiverId),
            applicationId
          );
          if (!ctx) {
            return res.status(403).json({
              message: "You can only message recruiters for jobs you've applied to.",
            });
          }
          const access = resolveEmployeeMessagingAccess(ctx.status, ctx.employerHasMessaged);
          if (!access.canSend) {
            return res.status(403).json({
              message: employeeMessagingHint(ctx.status, ctx.employerHasMessaged),
            });
          }
          resolvedApplicationId = ctx.applicationId;
        } else {
          return res.status(403).json({ message: "Invalid message recipient" });
        }
      } else if (isEmployerUser(sender)) {
        if (!isProfessionalUser(receiver)) {
          return res.status(403).json({ message: "Employers can message applicants on their job postings" });
        }
        const ctx = await storage.findApplicationForMessagingPair(
          String(data.receiverId),
          String(req.session.userId),
          applicationId
        );
        if (!ctx) {
          return res.status(403).json({
            message: "You can only message candidates who applied to your jobs.",
          });
        }
        resolvedApplicationId = ctx.applicationId;
      }

      const messageInsert = {
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        applicationId: resolvedApplicationId,
      };

      const message = await storage.createMessage(messageInsert);

      if (String(data.receiverId) !== String(req.session.userId)) {
        const senderUser = await storage.getUser(String(data.senderId)).catch(() => null);
        const senderName = senderUser
          ? `${senderUser.firstName} ${senderUser.lastName}`.trim()
          : "Someone";
        await notifyNewMessage(storage, {
          receiverId: String(data.receiverId),
          senderName,
          preview: data.content,
          applicationId: resolvedApplicationId,
        }).catch((err) => console.error("Message notification failed:", err));
      }

      res.json(message);
    } catch ( error) {
      handleError(res, error, "Failed to send message");
    }
  });

  // Activity & notifications
  authRouter.get("/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const list = await storage.getNotificationsByUser(userId);
      res.json(list);
    } catch (error) {
      handleError(res, error, "Failed to fetch notifications");
    }
  });

  authRouter.get("/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.session.userId);
      res.json({ count });
    } catch (error) {
      handleError(res, error, "Failed to fetch unread count");
    }
  });

  authRouter.patch("/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const updated = await storage.markNotificationRead(req.params.id, req.session.userId);
      if (!updated) return res.status(404).json({ message: "Notification not found" });
      res.json(updated);
    } catch (error) {
      handleError(res, error, "Failed to mark notification as read");
    }
  });

  authRouter.post("/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.session.userId);
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, "Failed to mark all notifications as read");
    }
  });

  authRouter.get("/activity/insights", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const applications = await storage
        .getApplicationsWithDetailsByApplicant(userId)
        .catch(() => []);

      let profileCompletion = 50;
      const profile = await storage.getProfessionalProfileByUserId(userId).catch(() => null);
      const user = await storage.getUser(userId).catch(() => null);
      if (profile) {
        let score = 20;
        if (profile.headline) score += 20;
        if (profile.bio) score += 20;
        const skills = Array.isArray(profile.skills) ? profile.skills : [];
        if (skills.length > 0) score += 20;
        if (profile.resumeUrl) score += 20;
        profileCompletion = Math.min(100, score);
      }
      if (user?.profilePhoto) profileCompletion = Math.min(100, profileCompletion + 10);

      const base = buildRuleBasedInsight(applications, profileCompletion);
      const enriched = await enrichInsightWithGemini(base, applications as any);
      const pipeline = countPipeline(applications);

      res.json({
        ...enriched,
        pipeline,
        profileCompletion,
        statusExplanations: {
          applied: "In employer queue",
          pending: "Under recruiter review",
          reviewed: "Reviewed — awaiting next step",
          interview: "Interview stage — check Messages",
          accepted: "Offer received 🎉",
          rejected: "Not selected this time",
        },
      });
    } catch (error) {
      handleError(res, error, "Failed to generate activity insights");
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

  // Mount the resumes route with auth
  authRouter.use("/resumes", resumesRouter);

  // Mount the recommendations route with auth
  authRouter.use("/recommendations", recommendationsRouter);
  
  // Mount the admin stories route
  app.use("/api/admin/stories", adminStoriesRouter);

  const parseCompanyCulture = (raw: unknown): { tags: string[]; benefits: string[] } => {
    if (!raw) return { tags: [], benefits: [] };
    let parsed: unknown = raw;
    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { tags: [], benefits: [] };
      }
    }
    if (typeof parsed !== "object" || parsed === null) return { tags: [], benefits: [] };
    const o = parsed as { tags?: unknown; benefits?: unknown };
    return {
      tags: Array.isArray(o.tags) ? o.tags.map(String) : [],
      benefits: Array.isArray(o.benefits) ? o.benefits.map(String) : [],
    };
  };

  const toPublicCompanyPayload = (company: Record<string, unknown>, openRoles: number) => {
    const culture = parseCompanyCulture(company.culture);
    const cover =
      (company.coverImage as string | undefined)
      ?? (company.cover_image as string | undefined)
      ?? "";
    return {
      id: String(company.id ?? ""),
      name: String(company.name ?? ""),
      industry: String(company.industry ?? ""),
      size: String(company.size ?? ""),
      website: String(company.website ?? ""),
      description: String(company.description ?? ""),
      location: String(company.location ?? ""),
      logo: company.logo ? String(company.logo) : undefined,
      coverImage: cover || undefined,
      openRoles,
      tags: culture.tags,
      benefits: culture.benefits,
    };
  };

  app.get("/api/companies/:id/public", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const openRoles = await storage.countActiveJobsByCompany(req.params.id);
      res.json(toPublicCompanyPayload(company as Record<string, unknown>, openRoles));
    } catch (error) {
      handleError(res, error, "Failed to fetch company profile");
    }
  });

  // Mount the authenticated router
  app.use("/api", authRouter);
  app.use("/api/applications", applicationsRouter);
  app.use("/api/ai/applications", aiReviewRouter);
  app.use("/api/ai/admin", aiAdminRouter);
  
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

  app.get("/api/debug/admin-jobs", async (req, res) => {
    try {
      console.log('DEBUG API: fetching jobs');
      const { jobs } = await storage.getJobs({ includeInactive: true });
      console.log('DEBUG API: fetching applications');
      const allApplications = await storage.getApplicationsByJob("all");
      console.log('DEBUG API: grouping applications');
      const countsMap = new Map<string, number>();
      for (const app of allApplications) {
        const jobId = app.jobId || (app as any).job_id;
        if (jobId) {
          const idStr = String(jobId);
          countsMap.set(idStr, (countsMap.get(idStr) || 0) + 1);
        }
      }
      console.log('DEBUG API: sending response');
      const enrichedJobs = jobs.slice(0, 5).map((job) => ({
        id: job.id,
        title: job.title,
        applicationsCount: countsMap.get(String(job.id)) || 0,
      }));
      res.json({
        totalJobs: jobs.length,
        totalApplications: allApplications.length,
        countsMapSize: countsMap.size,
        sample: enrichedJobs
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
        
        let profile = await storage.getProfessionalProfileByUserId(user.id);
        let company = null;

        const userType = sanitized.userType || (user as any).user_type || '';
        if (userType === 'Employer') {
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
      const parsed = updateUserSchema.parse(req.body);
      const { title, status, accountStatus, ...userFields } = parsed;
      const nextStatus = accountStatus ?? status;

      const updates: Record<string, unknown> = { ...userFields };
      if (nextStatus !== undefined) {
        updates.accountStatus = normalizeAccountStatus(nextStatus);
      }
      
      // If updating password, hash it
      if (updates.password && typeof updates.password === 'string') {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const user = await storage.updateUser(req.params.id, updates as any);
      
      // Save designation/title into the professional profile for ALL users, including Employers!
      if (title !== undefined) {
        await storage.updateProfessionalProfile(req.params.id, { headline: title });
      }
      
      // Fetch the updated profile to return it to the client immediately
      const profile = await storage.getProfessionalProfileByUserId(req.params.id);

      res.json({
        ...sanitizeUser(user),
        profile
      });
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

      const existing = await storage.getUser(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete user";
      if (message === "User not found") {
        return res.status(404).json({ message });
      }
      if (message.startsWith("Cannot delete user:")) {
        return res.status(409).json({ message });
      }
      handleError(res, error, "Failed to delete user");
    }
  });

  // Admin: Get all jobs
  app.get("/api/admin/jobs", requireAdmin, async (req, res) => {
    try {
      console.log('API /api/admin/jobs: fetching jobs');
      const { jobs } = await storage.getJobs({ includeInactive: true });
      console.log('API /api/admin/jobs: fetching applications');
      const allApplications = await storage.getApplicationsByJob("all");
      console.log('API /api/admin/jobs: grouping applications');
      const countsMap = new Map<string, number>();
      for (const app of allApplications) {
        const jobId = app.jobId || (app as any).job_id;
        if (jobId) {
          const idStr = String(jobId);
          countsMap.set(idStr, (countsMap.get(idStr) || 0) + 1);
        }
      }
      
      const enrichedJobs = jobs.map((job) => ({
        ...job,
        applicationsCount: countsMap.get(String(job.id)) || 0,
      }));
      console.log('API /api/admin/jobs: sending response');
      res.json(enrichedJobs);
      console.log('API /api/admin/jobs: response sent');
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
      const companies = await storage.getAllCompaniesWithDetails();
      console.log('✅ Admin API: Successfully fetched companies from storage.');
      res.json(companies);
    } catch (error) {
      console.error('❌ Admin API: Error in /api/admin/companies route handler:', error);
      handleError(res, error, "Failed to fetch companies");
    }
  });

  // Admin: Create company
  app.post("/api/admin/companies", requireAdmin, async (req, res) => {
    try {
      const name = normalizeOptionalText(req.body?.name);
      if (!name) {
        return res.status(400).json({ message: "Company name is required" });
      }

      const company = await storage.createCompany({
        name,
        description: normalizeOptionalText(req.body?.description),
        website: normalizeOptionalText(req.body?.website),
        location: normalizeOptionalText(req.body?.location),
        industry: normalizeOptionalText(req.body?.industry),
        size: normalizeOptionalText(req.body?.size),
        ownerId: normalizeOptionalText(req.body?.ownerId),
      } as unknown as InsertCompany);

      res.status(201).json(company);
    } catch (error) {
      handleError(res, error, "Failed to create company");
    }
  });

  // Admin: Update company
  app.put("/api/admin/companies/:id", requireAdmin, async (req, res) => {
    try {
      const existingCompany = await storage.getCompany(req.params.id);
      if (!existingCompany) {
        return res.status(404).json({ message: "Company not found" });
      }

      const updates: Record<string, string | null> = {};

      if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
        const name = normalizeOptionalText(req.body?.name);
        if (!name) {
          return res.status(400).json({ message: "Company name is required" });
        }
        updates.name = name;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
        updates.description = normalizeOptionalText(req.body?.description);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "website")) {
        updates.website = normalizeOptionalText(req.body?.website);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "location")) {
        updates.location = normalizeOptionalText(req.body?.location);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "industry")) {
        updates.industry = normalizeOptionalText(req.body?.industry);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "size")) {
        updates.size = normalizeOptionalText(req.body?.size);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "ownerId")) {
        updates.ownerId = normalizeOptionalText(req.body?.ownerId);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
        const allowed = new Set(["approved", "pending", "rejected", "suspended", "blocked"]);
        const status = String(req.body.status || "").toLowerCase().trim();
        if (!allowed.has(status)) {
          return res.status(400).json({ message: "Invalid company status" });
        }
        updates.status = status;
      }

      if (Object.keys(updates).length === 0 && !req.body.reason) {
        return res.status(400).json({ message: "No valid fields provided for update" });
      }

      const updatedCompany = await storage.updateCompany(req.params.id, updates as any);
      
      const reason = req.body.reason;
      if (existingCompany.ownerId && reason) {
        await storage.createNotification({
          userId: existingCompany.ownerId as string,
          type: "system_alert",
          title: "Company Profile Updated",
          body: `An administrator has updated your company profile ("${existingCompany.name}"). Reason: ${reason}`,
          metadata: { companyId: existingCompany.id },
          linkTab: "activity"
        });
      }

      res.json(updatedCompany);
    } catch (error) {
      handleError(res, error, "Failed to update company");
    }
  });

  // Admin: Delete company
  app.delete("/api/admin/companies/:id", requireAdmin, async (req, res) => {
    try {
      const existingCompany = await storage.getCompany(req.params.id);
      if (!existingCompany) {
        return res.status(404).json({ message: "Company not found" });
      }

      const reason = req.query.reason as string;

      await storage.deleteCompany(req.params.id);
      
      if (existingCompany.ownerId && reason) {
        await storage.createNotification({
          userId: existingCompany.ownerId as string,
          type: "system_alert",
          title: "Company Profile Deleted",
          body: `An administrator has deleted your company profile ("${existingCompany.name}"). Reason: ${reason}`,
          metadata: { companyId: existingCompany.id },
          linkTab: "activity"
        });
      }

      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      handleError(res, error, "Failed to delete company");
    }
  });

  // Helper to normalize application data (convert snake_case to camelCase)
  const normalizeApplication = (app: any) => {
    return {
      id: app.id,
      jobId: app.jobId || app.job_id,
      applicantId: app.applicantId || app.applicant_id || app.userId || app.user_id,
      status: app.status,
      coverLetter: app.coverLetter || app.cover_letter,
      resume: app.resume,
      notes: app.notes,
      appliedAt: app.appliedAt || app.applied_at,
      submittedAt: app.submittedAt || app.submitted_at || app.appliedAt || app.applied_at,
      updatedAt: app.updatedAt || app.updated_at,
      attachments: app.attachments || [],
    };
  };

  // Admin: Get all applications
  app.get("/api/admin/applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getApplicationsByJob("all");
      console.log('📋 Admin: Fetched applications from DB:', applications.length);
      
      // Enrich applications with user and job data
      const enrichedApplications = await Promise.all(
        applications.map(async (app: any) => {
          // Normalize application data first
          const normalizedApp = normalizeApplication(app);
          
          // Handle both snake_case (from DB) and camelCase (from schema)
          const jobId = normalizedApp.jobId;
          const userId = normalizedApp.applicantId;
          
          if (!jobId || !userId) {
            console.warn('⚠️ Application missing IDs:', { app, jobId, userId });
          }
          
          const [job, applicant] = await Promise.all([
            jobId ? storage.getJob(String(jobId)).catch((err) => {
              console.error('Error fetching job:', jobId, err);
              return null;
            }) : null,
            userId ? storage.getUser(String(userId)).catch((err) => {
              console.error('Error fetching user:', userId, err);
              return null;
            }) : null,
          ]);
          
          // Handle both snake_case and camelCase for companyId
          const companyId = job?.companyId || (job as any)?.company_id;
          const company = companyId ? await storage.getCompany(String(companyId)).catch((err) => {
            console.error('Error fetching company:', companyId, err);
            return null;
          }) : null;
          
          // Get user profile for additional info
          let profile = null;
          if (applicant) {
            const userType = applicant.userType || (applicant as any).user_type || '';
            if (userType === 'Professional' || userType === 'job_seeker') {
              profile = await storage.getProfessionalProfileByUserId(String(applicant.id)).catch(() => null);
            }
          }
          
          return {
            ...normalizedApp,
            job: job ? job : null,
            applicant: applicant ? sanitizeUser(applicant) : null,
            company: company ? company : null,
            profile: profile,
            // ── Smart multi-factor match score ──────────────────────────────────
            matchScore: (() => {
              const match = Storage.computeMatchScore({
                candidateSkills: Array.isArray(profile?.skills) ? profile.skills : [],
                jobSkills:       Array.isArray(job?.skills)     ? job.skills     : [],
                candidateLocation: applicant?.location || null,
                jobLocation:       (job as any)?.location || null,
                candidateHeadline: profile?.headline || null,
                jobTitle:          (job as any)?.title || null,
                salaryMin:         (job as any)?.salaryMin || null,
                salaryMax:         (job as any)?.salaryMax || null,
              });
              return match;
            })(),
          };
        })
      );
      
      console.log('✅ Admin: Enriched applications:', enrichedApplications.length);
      res.json(enrichedApplications);
    } catch (error) {
      console.error('❌ Admin: Error fetching applications:', error);
      handleError(res, error, "Failed to fetch applications");
    }
  });

  // Admin: Update application status
  app.put("/api/admin/applications/:id", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const existing = await storage.getApplication(req.params.id);
      const updatedApplication = await storage.updateApplication(req.params.id, { status });

      if (existing && String(status) !== String(existing.status)) {
        await emitApplicationStatusNotification(
          {
            id: updatedApplication.id,
            applicantId: String(updatedApplication.applicantId),
            jobId: updatedApplication.jobId ? String(updatedApplication.jobId) : null,
            status: updatedApplication.status,
          },
          existing.status,
          String(status)
        );
      }

      res.json(updatedApplication);
    } catch (error) {
      handleError(res, error, "Failed to update application");
    }
  });

  // Admin: Get pending approvals (live DB-backed)
  app.get("/api/admin/approvals", requireAdmin, async (req, res) => {
    try {
      const [applications, stories] = await Promise.all([
        storage.getApplicationsByJob("all"),
        storage.getAllStories(),
      ]);

      const pendingApplicationStatuses = new Set(["applied", "review", "reviewing", "pending"]);
      const pendingApplications = await Promise.all(
        applications
          .filter((app: any) => pendingApplicationStatuses.has(String(app.status || "").toLowerCase()))
          .slice(0, 50)
          .map(async (app: any) => {
            const normalizedApp = normalizeApplication(app);
            const jobId = normalizedApp.jobId ? String(normalizedApp.jobId) : "";
            const applicantId = normalizedApp.applicantId ? String(normalizedApp.applicantId) : "";

            const [job, applicant] = await Promise.all([
              jobId ? storage.getJob(jobId).catch(() => null) : null,
              applicantId ? storage.getUser(applicantId).catch(() => null) : null,
            ]);

            const jobTitle =
              (job as any)?.title ||
              (job as any)?.job_title ||
              (jobId ? `Job ${jobId}` : "Job application");

            const applicantName = applicant
              ? `${(applicant as any)?.firstName || (applicant as any)?.first_name || ""} ${(applicant as any)?.lastName || (applicant as any)?.last_name || ""}`.trim()
              : "";

            return {
              id: `application-${app.id}`,
              type: "application",
              status: normalizedApp.status,
              createdAt: normalizedApp.appliedAt || null,
              title: jobTitle,
              subtitle: applicantName || "Unknown applicant",
              submittedBy: applicantName || applicantId || "Unknown applicant",
              submittedDate: normalizedApp.appliedAt || normalizedApp.submittedAt || null,
              priority: "low",
              details: {
                status: normalizedApp.status,
                jobId,
                applicantId,
                jobTitle,
                applicantName: applicantName || applicantId || "Unknown applicant",
                appliedAt: normalizedApp.appliedAt,
                submittedAt: normalizedApp.submittedAt,
                resume: normalizedApp.resume,
                coverLetter: normalizedApp.coverLetter,
                notes: normalizedApp.notes,
              },
              data: normalizedApp,
            };
          })
      );

      const pendingStories = stories
        .filter((story: any) => story.approved !== true)
        .slice(0, 50)
        .map((story: any) => ({
          id: `story-${story.id}`,
          type: "story",
          status: "pending",
          createdAt: story.createdAt || (story as any).created_at || null,
          data: story,
        }));

      const pendingItems = [...pendingApplications, ...pendingStories]
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

      res.json(pendingItems);
    } catch (error) {
      handleError(res, error, "Failed to fetch approvals");
    }
  });

  // Admin: Update approval status (application or story)
  app.put("/api/admin/approvals/:id", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body as { status?: string };
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const approvalId = String(req.params.id || "");
      const isApproved = status === "approved";
      const normalizedStatus = isApproved ? "approved" : "rejected";

      if (approvalId.startsWith("application-")) {
        const applicationId = approvalId.replace("application-", "");
        const existing = await storage.getApplication(applicationId);
        const updatedApplication = await storage.updateApplication(applicationId, {
          status: normalizedStatus,
        });
        if (existing && String(normalizedStatus) !== String(existing.status)) {
          await emitApplicationStatusNotification(
            {
              id: updatedApplication.id,
              applicantId: String(updatedApplication.applicantId),
              jobId: updatedApplication.jobId ? String(updatedApplication.jobId) : null,
              status: updatedApplication.status,
            },
            existing.status,
            normalizedStatus
          );
        }
        return res.json(updatedApplication);
      }

      if (approvalId.startsWith("story-")) {
        const storyId = approvalId.replace("story-", "");
        const updatedStory = await storage.updateStoryApproval(storyId, isApproved);
        if (!updatedStory) return res.status(404).json({ message: "Story not found" });
        return res.json(updatedStory);
      }

      return res.status(400).json({ message: "Invalid approval id" });
    } catch (error) {
      handleError(res, error, "Failed to update approval");
    }
  });

  // Admin: Get analytics data (live DB-backed)
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const rawRange = String(req.query.timeRange || "1y");
      const timeRange: AdminAnalyticsRange =
        rawRange === "7d" || rawRange === "30d" || rawRange === "90d" || rawRange === "1y"
          ? rawRange
          : "1y";

      const [users, jobsResult, companies, applications] = await Promise.all([
        storage.getAllUsers(),
        storage.getJobs({ includeInactive: true }),
        storage.getAllCompanies(),
        storage.getAllApplicationsWithDetailsForAdmin(),
      ]);

      const payload = buildAdminAnalytics(
        mapUsersForAdminAnalytics(users as Array<Record<string, unknown>>),
        mapJobsForAdminAnalytics(jobsResult.jobs as unknown as Array<Record<string, unknown>>),
        mapCompaniesForAdminAnalytics(companies as Array<Record<string, unknown>>),
        mapApplicationsForAdminAnalytics(applications as Array<Record<string, unknown>>),
        timeRange,
      );

      return res.json(payload);
    } catch (error) {
      handleError(res, error, "Failed to fetch analytics");
    }
  });

  // Admin: AI observability summary for assistant and future AI features
  app.get("/api/admin/ai-events", requireAdmin, async (req, res) => {
    try {
      const rawRange = String(req.query.timeRange || "30d");
      const timeRange =
        rawRange === "7d" || rawRange === "30d" || rawRange === "90d" || rawRange === "1y"
          ? rawRange
          : "30d";

      const payload = await storage.getAiEventAnalytics(timeRange);
      return res.json(payload);
    } catch (error) {
      handleError(res, error, "Failed to fetch AI event analytics");
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

      const parseCreatedAt = (row: Record<string, unknown>) =>
        new Date(String(row.createdAt ?? row.created_at ?? 0));
      const parseAppliedAt = (row: Record<string, unknown>) =>
        new Date(String(row.appliedAt ?? row.applied_at ?? 0));

      const stats = {
        totalUsers: users.length,
        activeJobs: jobsResult.jobs.filter((job) => job.isActive).length,
        totalCompanies: companies.length,
        totalApplications: applications.length,
        newUsersThisWeek: users.filter((user) => parseCreatedAt(user as Record<string, unknown>) >= oneWeekAgo).length,
        newJobsThisWeek: jobsResult.jobs.filter((job) => parseCreatedAt(job as unknown as Record<string, unknown>) >= oneWeekAgo).length,
        newCompaniesThisWeek: companies.filter((company) => parseCreatedAt(company as Record<string, unknown>) >= oneWeekAgo).length,
        newApplicationsThisWeek: applications.filter((app) => parseAppliedAt(app as Record<string, unknown>) >= oneWeekAgo).length,
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
