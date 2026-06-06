import express, { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { stories } from "../../../../shared/schema";
import { desc, eq } from "drizzle-orm";
import { storage } from "../../storage";

// Extend the session type to include our custom fields
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const router = express.Router();

/**
 * Middleware to ensure user is an admin
 */
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Keep parity with the main admin middleware in `server/src/routes.ts`.
  // - Allow the hardcoded admin user
  // - Otherwise, check the user's `userType` in DB
  if (req.session.userId === "admin-001" || req.session.userId === "dev-admin") return next();

  const user = await storage.getUser(String(req.session.userId)).catch(() => null);
  const rawUserType =
    ((user as any)?.userType || (user as any)?.user_type || "")?.toString?.() ?? "";
  const normalizedUserType = rawUserType.toLowerCase().trim();

  if (req.path === "/" || String(req.originalUrl || "").includes("/api/admin/stories")) {
    console.log("🔐 requireAdmin(router admin/stories):", {
      sessionUserId: req.session.userId,
      resolvedUserTypeRaw: (user as any)?.userType || (user as any)?.user_type,
      resolvedUserTypeNormalized: normalizedUserType,
      userFound: !!user,
    });
  }

  if (normalizedUserType === "admin") return next();

  const payload: any = { message: "Forbidden: Admin access required" };
  // Provide extra diagnostics in dev to help debug session/userType mismatches.
  if (process.env.NODE_ENV !== "production") {
    payload.debug = {
      sessionUserId: req.session.userId,
      userFound: !!user,
      resolvedUserTypeRaw: rawUserType,
      resolvedUserTypeNormalized: normalizedUserType,
    };
  }

  return res.status(403).json(payload);
};

/**
 * Route to fetch all stories for admin
 */
router.get("/", (_req: Request, _res: Response, next: NextFunction) => {
  // Important: this route is mounted from `server/src/routes.ts` under `/api/admin/stories`.
  // `server/src/routes.ts` also defines its own `app.get("/api/admin/stories", requireAdmin, ...)`.
  // By intentionally skipping here (`next()`), we ensure the centralized handler runs.
  next();
});

/**
 * Route to approve a story
 */
router.post("/:id/approve", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await db
      .update(stories)
      .set({ approved: true })
      .where(eq(stories.id, Number(id)))
      .execute();

    if (!result) {
      return res.status(404).json({ error: "Story not found" });
    }

    res.status(200).json({ message: "Story approved successfully" });
  } catch (error: any) {
    console.error("❌ Error approving story:", error);
    res.status(500).json({ error: "Failed to approve story" });
  }
});

/**
 * Route to reject a story
 */
router.post("/:id/reject", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await db
      .update(stories)
      .set({ approved: false })
      .where(eq(stories.id, Number(id)))
      .execute();

    if (!result) {
      return res.status(404).json({ error: "Story not found" });
    }

    res.status(200).json({ message: "Story rejected successfully" });
  } catch (error: any) {
    console.error("❌ Error rejecting story:", error);
    res.status(500).json({ error: "Failed to reject story" });
  }
});

/**
 * Route to delete a story
 */
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await db
      .delete(stories)
      .where(eq(stories.id, Number(id)))
      .execute();

    if (!result) {
      return res.status(404).json({ error: "Story not found" });
    }

    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting story:", error);
    res.status(500).json({ error: "Failed to delete story" });
  }
});

export default router;