import express from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "../vite";

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

// Set default port to 5003 explicitly
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5003;
process.env.PORT = String(PORT);

// Log environment variables (excluding sensitive data)
console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: PORT,
  DATABASE_URL: process.env.DATABASE_URL ? "[SET]" : "[NOT SET]"
});

const app = express();

const server = http.createServer(app);

(async function start() {
  try {
    // Configure CORS before any route handlers
    app.use(cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:5174',
          'http://localhost:5002'
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Basic health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    app.use(express.json());

    // Register all API routes before the Vite/static middleware
    await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    console.log('Attempting to start server on port:', PORT);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      if (process.env.NODE_ENV !== "production") {
        console.log("📦 Vite is enabled for HMR and client-side development");
        console.log("🌐 Client available at http://localhost:5173");
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