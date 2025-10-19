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

// Log environment variables (excluding sensitive data)
console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 5001,
  DATABASE_URL: process.env.DATABASE_URL ? "[SET]" : "[NOT SET]"
});
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;

const server = http.createServer(app);

(async function start() {
  try {
    // Basic health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use(cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175'],
      credentials: true
    }));
    app.use(express.json());

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    await registerRoutes(app);

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    server.listen(PORT, () => {
      log(`Server listening on http://localhost:${PORT}`);
      if (process.env.NODE_ENV !== "production") {
        log("Vite is enabled for HMR and client-side development.");
        log("Client available at http://localhost:5173");
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