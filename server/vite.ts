import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

// Note: avoid top-level imports of ESM-only packages like 'vite' or 'nanoid'
// because this module may be loaded in a CommonJS runtime (package.json type="commonjs").
// We'll dynamically import them inside the setup function which uses the ESM loader
// and prevents require-time MODULE_NOT_FOUND errors.

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  // Dynamically import Vite and nanoid so this file can be loaded under
  // CommonJS runtime without throwing on top-level ESM imports.
  const viteModule = await import("vite");
  const { createServer: createViteServer, createLogger } = viteModule as any;
  const { nanoid } = await import("nanoid");

  const viteLogger = createLogger();

  // Create Vite server in middleware mode. We avoid importing the project's
  // vite.config.ts to prevent runtime resolution issues when this module is
  // loaded via tsx/nodemon. Instead, pass minimal options and set `root` to
  // the client folder so Vite serves the client files correctly.
  const clientRoot = path.resolve(__dirname, "..", "client");

  const vite = await createViteServer({
    root: clientRoot,
    configFile: false,
    resolve: {
      alias: {
        "@": path.resolve(clientRoot, "src"),
      },
    },
    // Use Vite's default logger behavior; do not exit the process on errors
    // so that dev middleware doesn't crash the server for transform-time
    // issues (e.g. Tailwind warnings). We still forward logs to the created
    // logger for consistency.
    customLogger: {
      ...viteLogger,
      error: (msg: any, options: any) => {
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");

      // always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      // attempt to fix stack traces and pass along
      try {
        vite.ssrFixStacktrace(e as Error);
      } catch (_) {
        /* ignore */
      }
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
