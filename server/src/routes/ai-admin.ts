import { Router } from "express";
import { generateModerationScan } from "../ai/moderation-generator";
import { storage } from "../storage";

const router = Router();

// Cache maps for TTL caching
const cache = {
  riskQueue: { data: null as any, expiresAt: 0 },
  auditSummary: { data: null as any, expiresAt: 0 },
};

// Middleware to ensure user is admin (checks DB role, not just session)
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Hardcoded initial admin
    if (req.session.userId === 'admin-001') {
      return next();
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Internal server error during authorization" });
  }
};

// Existing on-demand moderation scan
router.post("/moderate", requireAdmin, async (req, res) => {
  try {
    const { type, details } = req.body;

    if (!type || !details) {
      return res.status(400).json({ message: "Type and details are required" });
    }

    const validTypes = ["employer", "job", "story", "application"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid moderation type" });
    }

    const result = await generateModerationScan({
      type: type as any,
      details,
    });

    return res.json(result);
  } catch (error) {
    console.error("Error generating moderation scan:", error);
    return res.status(500).json({
      message: "Failed to generate moderation scan",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Phase 6: GET Risk Queue
router.get("/risk-queue", requireAdmin, async (req, res) => {
  try {
    const now = Date.now();
    if (cache.riskQueue.data && cache.riskQueue.expiresAt > now) {
      return res.json({ success: true, items: cache.riskQueue.data });
    }

    const items = await storage.getRiskQueue();
    cache.riskQueue = { data: items, expiresAt: now + 5 * 60 * 1000 }; // 5 min TTL
    
    return res.json({ success: true, items });
  } catch (error) {
    console.error("Error fetching risk queue:", error);
    return res.status(500).json({ message: "Failed to fetch risk queue" });
  }
});

// Phase 6: GET Audit Summary
router.get("/audit-summary", requireAdmin, async (req, res) => {
  try {
    const now = Date.now();
    if (cache.auditSummary.data && cache.auditSummary.expiresAt > now) {
      return res.json({ success: true, ...cache.auditSummary.data });
    }

    const stats = await storage.getAuditSummary();
    const recentLogs = await storage.getRecentAuditLogs(20);
    const data = { stats, recentLogs };
    
    cache.auditSummary = { data, expiresAt: now + 10 * 60 * 1000 }; // 10 min TTL
    
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error("Error fetching audit summary:", error);
    return res.status(500).json({ message: "Failed to fetch audit summary" });
  }
});

// Helper to invalidate cache from other routes
export function invalidateAiAdminCache(type: 'riskQueue' | 'auditSummary' | 'all') {
  if (type === 'riskQueue' || type === 'all') cache.riskQueue.expiresAt = 0;
  if (type === 'auditSummary' || type === 'all') cache.auditSummary.expiresAt = 0;
}

export default router;
