import { apiFetch } from "./api";
import type { ModerationResult } from "../../../shared/schema";

export const aiAdminService = {
  scanModerationRisk: async (
    type: "employer" | "job" | "story" | "application",
    details: Record<string, any>
  ): Promise<ModerationResult> => {
    const response = await apiFetch("/api/ai/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, details }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch moderation scan");
    }

    return response.json();
  },

  getRiskQueue: async (): Promise<any[]> => {
    const response = await apiFetch("/api/ai/admin/risk-queue");
    if (!response.ok) {
      throw new Error("Failed to fetch risk queue");
    }
    const data = await response.json();
    return data.items || [];
  },

  getAuditSummary: async (): Promise<{
    stats: {
      totalActions: number;
      aiFollowedCount: number;
      aiDisagreedCount: number;
      agreementRate: number;
    };
    recentLogs: any[];
  }> => {
    const response = await apiFetch("/api/ai/admin/audit-summary");
    if (!response.ok) {
      throw new Error("Failed to fetch audit summary");
    }
    const data = await response.json();
    return {
      stats: data.stats || {
        totalActions: 0,
        aiFollowedCount: 0,
        aiDisagreedCount: 0,
        agreementRate: 0,
      },
      recentLogs: data.recentLogs || [],
    };
  },
};
