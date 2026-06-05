import { apiFetch, withSkipGlobalLoader } from "./api";

export interface AppNotification {
  id: number;
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  linkTab?: string | null;
  createdAt: string;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await apiFetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to load notifications");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch("/api/notifications/unread-count");
  if (!res.ok) return 0;
  const data = await res.json();
  return Number(data?.count ?? 0);
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiFetch(`/api/notifications/${id}/read`, withSkipGlobalLoader({ method: "PATCH" }));
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/notifications/mark-all-read", withSkipGlobalLoader({ method: "POST" }));
}

export interface ActivityInsights {
  summary: string;
  nextStep: string;
  tips: string[];
  aiPowered?: boolean;
  profileCompletion: number;
  pipeline: {
    applied: number;
    inReview: number;
    interview: number;
    offer: number;
    rejected: number;
    total: number;
  };
  statusExplanations: Record<string, string>;
}

export async function fetchActivityInsights(): Promise<ActivityInsights> {
  const res = await apiFetch("/api/activity/insights");
  if (!res.ok) throw new Error("Failed to load insights");
  return res.json();
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
