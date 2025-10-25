import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
    proxy: {
      "/api": {
        target: "http://localhost:5003",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, options) => {
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
      'Accept-Ranges': 'bytes'
    },
    cors: false
  },
  assetsInclude: ['.mp4'],
  optimizeDeps: {
    exclude: ['*.mp4']
  }
});