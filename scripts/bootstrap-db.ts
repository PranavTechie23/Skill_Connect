import postgres from "postgres";
import { config } from "dotenv";
import { execSync } from "node:child_process";

config({ path: "./server/.env" });

const host = process.env.POSTGRES_HOST || "localhost";
const port = Number(process.env.POSTGRES_PORT || 5432);
const user = process.env.POSTGRES_USER || "postgres";
const password = process.env.POSTGRES_PASSWORD || "";
const database = process.env.POSTGRES_DB || "graphicgenie";

if (!password) {
  console.error("POSTGRES_PASSWORD is empty in server/.env");
  console.error("Set it first, then run: npm run db:bootstrap");
  process.exit(1);
}

async function ensureDatabaseExists() {
  // Connect to default postgres DB first to create app DB if needed.
  const admin = postgres({
    host,
    port,
    username: user,
    password,
    database: "postgres",
    ssl: false,
    max: 1,
  });

  try {
    const rows = await admin`
      SELECT 1
      FROM pg_database
      WHERE datname = ${database}
    `;

    if (rows.length === 0) {
      console.log(`Creating database "${database}"...`);
      await admin.unsafe(`CREATE DATABASE "${database}"`);
      console.log(`Database "${database}" created.`);
    } else {
      console.log(`Database "${database}" already exists.`);
    }
  } finally {
    await admin.end();
  }
}

async function bootstrap() {
  await ensureDatabaseExists();

  console.log("Pushing Drizzle schema...");
  try {
    execSync("npm run db:push", { stdio: "inherit" });
  } catch (e) {
    console.warn("⚠️ db:push returned an error, continuing with seed in case schema is already present.");
  }

  console.log("Seeding demo users/companies/jobs...");
  execSync("tsx scripts/seed-demo.ts", { stdio: "inherit" });

  console.log("DB bootstrap complete.");
}

bootstrap().catch((err) => {
  console.error("DB bootstrap failed:", err);
  process.exit(1);
});

