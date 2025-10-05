import express from "express";
import cors from "cors";
import http from "http";
import db from "./db";
import { users } from "./schema";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

type Story = {
  id: number;
  title: string;
  content: string;
  authorEmail?: string;
  createdAt: number;
};

let stories: Story[] = [];
let nextId = 1;

app.get("/api/ping", (_req, res) => res.json({ ok: true, now: Date.now() }));

app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: "Missing email" });
  const token = Buffer.from(email).toString("base64");
  return res.json({ ok: true, token, user: { email } });
});

app.get("/api/users", async (_req, res) => {
  try {
    const all = await db.select().from(users).limit(10);
    return res.json({ ok: true, users: all });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});
app.get("/api/auth/me", (req, res) => {
  const auth = req.headers.authorization as string | undefined;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ ok: false });
  const token = auth.slice(7);
  try {
    const email = Buffer.from(token, "base64").toString("utf8");
    return res.json({ ok: true, user: { email } });
  } catch (err) {
    return res.status(401).json({ ok: false });
  }
});

app.get("/api/stories", (_req, res) => {
  return res.json({ ok: true, stories: stories.slice().reverse() });
});

app.post("/api/stories", (req, res) => {
  const auth = req.headers.authorization as string | undefined;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  const token = auth.slice(7);
  let email = "Anonymous";
  try {
    email = Buffer.from(token, "base64").toString("utf8");
  } catch (e) {
    // ignore, keep Anonymous
  }

  const { title, content } = req.body as { title?: string; content?: string };
  if (!title || !content) return res.status(400).json({ ok: false, error: "Missing title or content" });

  const story: Story = { id: nextId++, title, content, authorEmail: email, createdAt: Date.now() };
  stories.push(story);
  return res.status(201).json({ ok: true, story });
});

const server = http.createServer(app);

(async function start() {
  try {
    if (process.env.NODE_ENV !== "production") {
      // In dev, attach Vite middleware so the server serves the client too.
      const { setupVite } = await import("../vite");
      await setupVite(app, server as any);
    } else {
      // In production serve prebuilt static files from server/public
      const { serveStatic } = await import("../vite");
      serveStatic(app);
    }

    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();