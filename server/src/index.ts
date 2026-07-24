import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "../vite";

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

// Production validation for SESSION_SECRET
if (process.env.NODE_ENV === "production") {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret === "your-secret-key" || secret.trim() === "") {
    console.error("❌ CRITICAL SECURITY ERROR: SESSION_SECRET is not set or uses the default insecure key in production environment.");
    console.error("Please set a secure SESSION_SECRET environment variable before starting the application.");
    process.exit(1);
  }
}

// Set default port to 5002 explicitly
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5002;
process.env.PORT = String(PORT);

// Import the database health check
import { checkDatabaseHealth, ensureNotificationsTable } from './db';

// Log environment variables (excluding sensitive data)
console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: PORT,
  DATABASE_URL: process.env.DATABASE_URL ? "[SET]" : "[NOT SET]"
});

const app = express();

// Security middleware
app.use(helmet());
// HTTP request logging
app.use(morgan('dev'));

const server = http.createServer(app);

// Graceful process shutdown handler for uncaught errors
function handleFatalError(type: string, error: any) {
  console.error(`💥 FATAL ERROR [${type}]:`, error);
  
  const timeoutTimer = setTimeout(() => {
    console.error('⚠️ Graceful drain timed out after 3000ms. Forcefully terminating process.');
    process.exit(1);
  }, 3000);

  server.close(() => {
    clearTimeout(timeoutTimer);
    console.log('✅ HTTP server closed gracefully after fatal error. Exiting process.');
    process.exit(1);
  });
}

process.on('uncaughtException', (err) => handleFatalError('uncaughtException', err));
process.on('unhandledRejection', (reason) => handleFatalError('unhandledRejection', reason));

(async function start() {
  try {
    // Check database health before starting the server
    console.log('Checking database connection...');
    const isDatabaseHealthy = await checkDatabaseHealth();
    if (!isDatabaseHealthy) {
      if (process.env.NODE_ENV === "production") {
        console.error('Database is not healthy. Please check your database connection.');
        process.exit(1);
      }
      console.warn('⚠️ Database is not healthy. Starting server in degraded dev mode.');
      console.warn('⚠️ API routes that depend on PostgreSQL may fail until DB is available.');
    }
    if (isDatabaseHealthy) {
      console.log('Database connection is healthy.');
      await ensureNotificationsTable();
    }

    const allowedOrigins = [
      'http://localhost:5173',  // Vite dev server
      'http://127.0.0.1:5173',  // Vite dev server alternative
      'http://localhost:5002',  // API server
      'http://localhost:5003',  // API server
      'http://localhost:3000',  // Common React port
      'https://skill-connect-alpha.vercel.app', // Vercel production frontend
      process.env.FRONTEND_URL, // Dynamic frontend URL from env
    ].filter(Boolean) as string[];

    // Trust proxy (required for secure cookies when behind Railway/Vercel proxies)
    app.set('trust proxy', 1);

    // Configure CORS before any route handlers
    app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or backend server requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn('CORS blocked request from origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-skip-global-loader']
    }));

    // Basic health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Test crash route for manual verification of process failure handler (dev/test only)
    if (process.env.NODE_ENV !== "production") {
      app.get('/api/test/crash', (req, res) => {
        console.warn('Triggering deliberate uncaught exception for testing...');
        setTimeout(() => {
          throw new Error('Test deliberate uncaught exception');
        }, 10);
        res.json({ message: 'Triggering crash...' });
      });
    }
    
    app.use(express.json());

    // Serve uploaded assets (e.g. profile photos)
    const uploadsPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    app.use("/uploads", express.static(uploadsPath));

    // Register all API routes before the Vite/static middleware
    await registerRoutes(app, server);

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
    if (process.env.NODE_ENV === "production") {
      app.get('/', (req, res) => res.send('SkillConnect API is running'));
    } else if (process.env.USE_INTEGRATED_VITE === "true") {
      await setupVite(app, server);
    } else {
      console.log("API-only dev mode — UI at http://localhost:5173 (run dev:client if needed)");
    }

    console.log('Attempting to start server on port:', PORT);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      if (process.env.NODE_ENV !== "production" && process.env.USE_INTEGRATED_VITE !== "true") {
        console.log("🌐 Client dev server: http://localhost:5173");
      }
    });

    // Handle server startup errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();