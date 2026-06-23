import { generateModerationScan } from "./moderation-generator";
import { db } from "../db";
import { moderationRecords } from "../../../shared/schema";
import { sql } from "drizzle-orm";
import type { ModerationResult } from "../../../shared/schema";

// ── Constants ────────────────────────────────────────────────────────
export const MAX_DAILY_MODERATION_SCANS = 200;
const INPUT_TRUNCATION_BUDGET = 600;

// ── Types ────────────────────────────────────────────────────────────
export interface ScanResult {
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  reasoning: string;
  suggestedAction: string;
  scanStatus: "scanned" | "scan_failed";
  skipped: boolean;
}

// ── Rate-limit check (platform-wide daily cap) ──────────────────────
async function isDailyLimitExhausted(): Promise<boolean> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(moderationRecords)
      .where(sql`${moderationRecords.createdAt} >= ${todayStart}`);
    return Number(result?.count ?? 0) >= MAX_DAILY_MODERATION_SCANS;
  } catch (error) {
    console.error("[ModerationScanner] Rate limit check failed:", error);
    return false; // fallback: allow scan rather than blocking
  }
}

// ── Input truncation ────────────────────────────────────────────────
function truncateDetails(
  entityType: string,
  details: Record<string, any>
): Record<string, any> {
  const truncated = { ...details };

  switch (entityType) {
    case "job": {
      const title = String(truncated.title || "").substring(0, 200);
      const remaining = INPUT_TRUNCATION_BUDGET - title.length;
      if (remaining > 0) {
        const perField = Math.floor(remaining / 2);
        truncated.title = title;
        truncated.description = String(truncated.description || "").substring(0, perField);
        truncated.requirements = String(truncated.requirements || "").substring(0, perField);
      } else {
        truncated.title = title.substring(0, INPUT_TRUNCATION_BUDGET);
        truncated.description = "";
        truncated.requirements = "";
      }
      break;
    }
    case "company": {
      const name = String(truncated.name || "").substring(0, 200);
      const remaining = INPUT_TRUNCATION_BUDGET - name.length;
      truncated.name = name;
      truncated.description = String(truncated.description || "").substring(0, Math.max(0, remaining));
      break;
    }
    case "story": {
      const title = String(truncated.title || "").substring(0, 200);
      const remaining = INPUT_TRUNCATION_BUDGET - title.length;
      truncated.title = title;
      truncated.content = String(truncated.content || "").substring(0, Math.max(0, remaining));
      break;
    }
    case "application": {
      truncated.coverLetter = String(truncated.coverLetter || "").substring(0, INPUT_TRUNCATION_BUDGET);
      break;
    }
  }

  return truncated;
}

// ── Fallback result for parse/network failures ──────────────────────
const SCAN_FAILURE_FALLBACK: ModerationResult = {
  riskLevel: "low",
  flags: ["scan_parse_failure"],
  reasoning: "Automated scan could not produce a valid assessment. Allowed by default.",
  suggestedAction: "none",
};

// ── Core scanning function ──────────────────────────────────────────
export async function runModerationScan(params: {
  entityType: "job" | "company" | "story" | "application";
  entityId: string;
  details: Record<string, any>;
}): Promise<ScanResult> {
  // 1. Check daily rate limit
  const exhausted = await isDailyLimitExhausted();
  if (exhausted) {
    console.warn(`[ModerationScanner] Daily limit (${MAX_DAILY_MODERATION_SCANS}) exhausted. Skipping scan for ${params.entityType} ${params.entityId}`);
    return {
      riskLevel: "low",
      flags: ["scan_skipped_rate_limit"],
      reasoning: "Daily moderation scan limit reached. Allowed by default.",
      suggestedAction: "none",
      scanStatus: "scan_failed",
      skipped: true,
    };
  }

  // 2. Truncate input fields
  const truncatedDetails = truncateDetails(params.entityType, params.details);

  // 3. Attempt scan with 2 retries
  let scanResult: ModerationResult | null = null;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      scanResult = await generateModerationScan({
        type: params.entityType === "company" ? "employer" : params.entityType as any,
        details: truncatedDetails,
      });
      break; // success
    } catch (error) {
      lastError = error as Error;
      console.warn(`[ModerationScanner] Attempt ${attempt} failed for ${params.entityType} ${params.entityId}:`, error);
    }
  }

  // 4. Determine result (success or fallback)
  const finalResult = scanResult || SCAN_FAILURE_FALLBACK;
  const scanStatus = scanResult ? "scanned" : "scan_failed";

  // 5. Save moderation record
  try {
    await db.insert(moderationRecords).values({
      entityType: params.entityType,
      entityId: params.entityId,
      riskLevel: finalResult.riskLevel,
      flags: finalResult.flags,
      reasoning: finalResult.reasoning,
      suggestedAction: finalResult.suggestedAction,
      scanStatus,
    });
  } catch (dbError) {
    console.error(`[ModerationScanner] Failed to save moderation record for ${params.entityType} ${params.entityId}:`, dbError);
  }

  return {
    riskLevel: finalResult.riskLevel as "low" | "medium" | "high",
    flags: finalResult.flags,
    reasoning: finalResult.reasoning,
    suggestedAction: finalResult.suggestedAction,
    scanStatus: scanStatus as "scanned" | "scan_failed",
    skipped: false,
  };
}
