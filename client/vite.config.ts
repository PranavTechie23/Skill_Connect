import fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const viteCacheDir = path.join(clientDir, "node_modules", ".vite");

/** Remove half-finished dep bundles left by crashed/restarted dev servers. */
function cleanStaleViteCache(): Plugin {
  return {
    name: "clean-stale-vite-cache",
    apply: "serve",
    config() {
      if (!fs.existsSync(viteCacheDir)) return;

      for (const entry of fs.readdirSync(viteCacheDir)) {
        if (entry.startsWith("deps_temp_")) {
          fs.rmSync(path.join(viteCacheDir, entry), { recursive: true, force: true });
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [cleanStaleViteCache(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      external: ['*.mp4']
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/uploads": {
        target: "http://localhost:5002",
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "http://localhost:5002",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward cookies from the original request
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Forward Set-Cookie headers as-is, don't modify them
            // The proxy should handle cookies automatically
            // Add CORS headers
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || 'http://localhost:5173';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
          });
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ message: 'Backend server is not running. Please start the server.' }));
          });
        }
      }
    },
    headers: {
      "Accept-Ranges": "bytes",
    },
  },
  assetsInclude: [".mp4"],
  optimizeDeps: {
    exclude: ["*.mp4"],
    // Pre-bundle deps for all routes so navigation does not trigger mid-session re-optimization.
    entries: [
      path.resolve(clientDir, "index.html"),
      path.resolve(clientDir, "src/**/*.{ts,tsx}"),
    ],
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "@tanstack/react-query",
      "gsap",
      "date-fns",
      "sonner",
      "framer-motion",
      "lucide-react",
      "zod",
      "@radix-ui/react-dialog",
      "@radix-ui/react-label",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-alert-dialog",
    ],
    holdUntilCrawlEnd: true,
  },
});