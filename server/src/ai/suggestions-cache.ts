// In-memory cache for profile suggestions.
// Assumes single-instance deployment.
const suggestionsCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedSuggestions(userId: string) {
  const entry = suggestionsCache.get(userId);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

export function setCachedSuggestions(userId: string, data: any) {
  suggestionsCache.set(userId, { timestamp: Date.now(), data });
}

export function invalidateSuggestionsCache(userId: string) {
  suggestionsCache.delete(userId);
}

// In-memory cache for recruiter weekly reports.
const weeklyReportsCache = new Map<string, { timestamp: number; data: any }>();
const REPORT_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

export function getCachedWeeklyReport(userId: string) {
  const entry = weeklyReportsCache.get(userId);
  if (entry && Date.now() - entry.timestamp < REPORT_CACHE_TTL) {
    return entry.data;
  }
  return null;
}

export function setCachedWeeklyReport(userId: string, data: any) {
  weeklyReportsCache.set(userId, { timestamp: Date.now(), data });
}

export function invalidateWeeklyReportCache(userId: string) {
  weeklyReportsCache.delete(userId);
}

