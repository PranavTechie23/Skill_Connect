import { apiFetch } from "./api";

export interface AgentRun {
  id: string;
  userId: string;
  agentType: string;
  source: "user" | "cron";
  goal: string;
  status: "running" | "completed" | "failed" | "requires_approval" | "cancelled";
  resultJson: Record<string, any>;
  createdAt: string;
  completedAt: string | null;
  steps?: AgentStep[];
}

export interface AgentStep {
  id: number;
  runId: number;
  stepOrder: number;
  toolName: string;
  inputJson: Record<string, any>;
  outputJson: Record<string, any>;
  status: "pending" | "success" | "failed";
  createdAt: string;
}

export const agentService = {
  startRun: async (agentType: string, goal: string): Promise<{ runId: number; status: string }> => {
    const response = await apiFetch("/api/agents/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentType, goal }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to start agent run");
    }

    return response.json();
  },

  getRuns: async (limit = 10, offset = 0): Promise<AgentRun[]> => {
    const response = await apiFetch(`/api/agents/runs?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error("Failed to fetch agent runs");
    }
    return response.json();
  },

  getRunDetails: async (runId: string): Promise<AgentRun> => {
    const response = await apiFetch(`/api/agents/runs/${runId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch run details for run ${runId}`);
    }
    return response.json();
  },

  approveRun: async (runId: string): Promise<{ message: string; status: string }> => {
    const response = await apiFetch(`/api/agents/runs/${runId}/approve`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to approve agent run");
    }

    return response.json();
  },

  cancelRun: async (runId: string): Promise<{ message: string; status: string }> => {
    const response = await apiFetch(`/api/agents/runs/${runId}/cancel`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to cancel agent run");
    }

    return response.json();
  },
};
