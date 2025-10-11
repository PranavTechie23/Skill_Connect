import express from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "../vite";

// Load environment variables from .env file
dotenv.config();
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;

const server = http.createServer(app);

(async function start() {
  try {
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());

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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();