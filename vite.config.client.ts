/**
 * Root-level alias for the client Vite config.
 *
 * Canonical config: client/vite.config.ts
 * Dev/build:       cd client && npm run dev | npm run build
 *
 * This file exists so editors and monorepo tooling can resolve the client
 * setup from the repo root without duplicating config or Replit-only plugins.
 */
export { default } from "./client/vite.config.ts";
