import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteCacheDir = path.join(clientDir, "node_modules", ".vite");

if (!fs.existsSync(viteCacheDir)) {
  process.exit(0);
}

for (const entry of fs.readdirSync(viteCacheDir)) {
  if (entry === "deps" || entry.startsWith("deps_temp_")) {
    fs.rmSync(path.join(viteCacheDir, entry), { recursive: true, force: true });
  }
}

console.log("Cleared Vite dependency cache (.vite/deps)");
