/**
 * Employer recruiting analytics — computed from jobs + applications in DB.
 */

export type EmployerAnalyticsRange = "7d" | "30d" | "90d" | "1y";

export interface EmployerAnalyticsJob {
  id: string;
  title: string;
  location: string;
  jobType: string;
  isActive: boolean;
  createdAt: Date | null;
  applications: number;
  companyIndustry?: string | null;
  companyName?: string | null;
}

export interface EmployerAnalyticsApplication {
  id: string;
  jobId: string | null;
  status: string;
  appliedAt: Date | null;
  updatedAt: Date | null;
  applicantLocation?: string | null;
  jobLocation?: string | null;
  jobTitle?: string | null;
  jobCreatedAt?: Date | null;
}

export interface MonthTrend {
  changePercent: number;
  trend: "up" | "down" | "flat";
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function rangeToDays(range: EmployerAnalyticsRange): number {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 30;
  }
}

function normalizeStatus(status: string): string {
  const s = String(status || "applied").toLowerCase();
  if (["applied", "pending", "new"].includes(s)) return "new";
  if (["review", "reviewing", "reviewed", "under_review"].includes(s)) return "reviewing";
  if (s === "shortlisted") return "shortlisted";
  if (["interview", "interviewing"].includes(s)) return "interview";
  if (["hired", "accepted", "approved", "offer"].includes(s)) return "hired";
  if (["rejected", "declined"].includes(s)) return "rejected";
  return s;
}

function computeTrend(current: number, previous: number): MonthTrend | null {
  if (current === 0 && previous === 0) return null;
  if (previous === 0) {
    return current > 0 ? { changePercent: 100, trend: "up" } : null;
  }
  const raw = ((current - previous) / previous) * 100;
  const changePercent = Math.round(raw * 10) / 10;
  if (changePercent === 0) return { changePercent: 0, trend: "flat" };
  return { changePercent, trend: changePercent > 0 ? "up" : "down" };
}

function inWindow(date: Date | null, start: Date, end: Date): boolean {
  if (!date) return false;
  return date >= start && date <= end;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function bucketLabel(date: Date, range: EmployerAnalyticsRange): string {
  if (range === "7d") {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (range === "1y") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function buildEmployerAnalytics(
  jobs: EmployerAnalyticsJob[],
  applications: EmployerAnalyticsApplication[],
  range: EmployerAnalyticsRange,
  companyName?: string | null,
) {
  const days = rangeToDays(range);
  const now = new Date();
  const periodEnd = new Date(now);
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days + 1);
  periodStart.setHours(0, 0, 0, 0);

  const prevEnd = new Date(periodStart);
  prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days + 1);
  prevStart.setHours(0, 0, 0, 0);

  const appsInPeriod = applications.filter((a) =>
    inWindow(a.appliedAt, periodStart, periodEnd),
  );
  const appsPrevPeriod = applications.filter((a) =>
    inWindow(a.appliedAt, prevStart, prevEnd),
  );

  const allApps = applications;
  const hiredApps = allApps.filter((a) => normalizeStatus(a.status) === "hired");
  const hiredInPeriod = appsInPeriod.filter((a) => normalizeStatus(a.status) === "hired");

  const timeToFillDays: number[] = [];
  for (const app of hiredApps) {
    const hiredAt = app.updatedAt || app.appliedAt;
    const start = app.jobCreatedAt || app.appliedAt;
    if (hiredAt && start) {
      timeToFillDays.push(daysBetween(start, hiredAt));
    } else if (app.appliedAt && app.updatedAt) {
      timeToFillDays.push(daysBetween(app.appliedAt, app.updatedAt));
    }
  }
  const avgTimeToFill =
    timeToFillDays.length > 0
      ? Math.round(timeToFillDays.reduce((s, d) => s + d, 0) / timeToFillDays.length)
      : 0;

  const totalApplications = allApps.length;
  const periodApplications = appsInPeriod.length;
  const hireRate =
    totalApplications > 0
      ? Math.round((hiredApps.length / totalApplications) * 1000) / 10
      : 0;

  const prevHired = appsPrevPeriod.filter((a) => normalizeStatus(a.status) === "hired").length;
  const prevHireRate =
    appsPrevPeriod.length > 0
      ? Math.round((prevHired / appsPrevPeriod.length) * 1000) / 10
      : 0;

  const activeJobs = jobs.filter((j) => j.isActive).length;
  const jobsPostedInPeriod = jobs.filter((j) =>
    inWindow(j.createdAt, periodStart, periodEnd),
  ).length;
  const jobsPostedPrev = jobs.filter((j) =>
    inWindow(j.createdAt, prevStart, prevEnd),
  ).length;

  const pipelineStages = [
    { stage: "New", key: "new", color: "#3b82f6" },
    { stage: "Under Review", key: "reviewing", color: "#8b5cf6" },
    { stage: "Shortlisted", key: "shortlisted", color: "#06b6d4" },
    { stage: "Interview", key: "interview", color: "#f59e0b" },
    { stage: "Hired", key: "hired", color: "#10b981" },
    { stage: "Rejected", key: "rejected", color: "#ef4444" },
  ];

  const pipelineCounts = pipelineStages.map(({ stage, key, color }) => {
    const count = allApps.filter((a) => normalizeStatus(a.status) === key).length;
    return { stage, count, color };
  });
  const pipelineTotal = pipelineCounts.reduce((s, p) => s + p.count, 0) || 1;
  const pipeline = pipelineCounts.map((p) => ({
    ...p,
    percentage: Math.round((p.count / pipelineTotal) * 1000) / 10,
  }));

  const bucketCount =
    range === "7d" ? 7 : range === "30d" ? 14 : range === "90d" ? 12 : 12;
  const bucketMs =
    range === "7d"
      ? 24 * 60 * 60 * 1000
      : range === "30d"
        ? 2 * 24 * 60 * 60 * 1000
        : range === "90d"
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

  const trendBuckets: {
    label: string;
    applications: number;
    hires: number;
    interviews: number;
  }[] = [];

  for (let i = bucketCount - 1; i >= 0; i--) {
    const bucketEnd = new Date(periodEnd.getTime() - i * bucketMs);
    const bucketStart = new Date(bucketEnd.getTime() - bucketMs + 1);
    bucketStart.setHours(0, 0, 0, 0);

    const inBucket = appsInPeriod.filter(
      (a) => a.appliedAt && a.appliedAt >= bucketStart && a.appliedAt <= bucketEnd,
    );
    trendBuckets.push({
      label: bucketLabel(bucketStart, range),
      applications: inBucket.length,
      hires: inBucket.filter((a) => normalizeStatus(a.status) === "hired").length,
      interviews: inBucket.filter((a) => normalizeStatus(a.status) === "interview").length,
    });
  }

  const jobApplicantMap = new Map<string, number>();
  for (const app of allApps) {
    if (!app.jobId) continue;
    jobApplicantMap.set(app.jobId, (jobApplicantMap.get(app.jobId) ?? 0) + 1);
  }

  const topJobs = jobs
    .map((job) => {
      const applicants = jobApplicantMap.get(job.id) ?? job.applications ?? 0;
      return {
        id: job.id,
        title: job.title,
        applicants,
        department: job.companyIndustry || job.companyName || "General",
        status: job.isActive ? ("active" as const) : ("paused" as const),
        location: job.location,
      };
    })
    .sort((a, b) => b.applicants - a.applicants)
    .slice(0, 8);

  const locationMap = new Map<string, number>();
  for (const app of allApps) {
    const loc =
      (app.applicantLocation && app.applicantLocation.trim()) ||
      (app.jobLocation && app.jobLocation.trim()) ||
      "Unknown";
    locationMap.set(loc, (locationMap.get(loc) ?? 0) + 1);
  }
  const topLocations = Array.from(locationMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([location, count]) => ({ location, count }));

  const jobTypeMap = new Map<string, number>();
  for (const job of jobs) {
    const key = job.jobType || "other";
    jobTypeMap.set(key, (jobTypeMap.get(key) ?? 0) + 1);
  }
  const jobTypes = Array.from(jobTypeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type: type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
    }));

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);

  return {
    companyName: companyName ?? null,
    range,
    rangeLabel:
      range === "7d"
        ? "Last 7 days"
        : range === "30d"
          ? "Last 30 days"
          : range === "90d"
            ? "Last 90 days"
            : "Last year",
    generatedAt: now.toISOString(),
    overview: {
      totalApplications,
      periodApplications,
      hires: hiredApps.length,
      hiresInPeriod: hiredInPeriod.length,
      hireRate,
      avgTimeToFill,
      totalJobs: jobs.length,
      activeJobs,
      jobsPostedInPeriod,
      applicationsThisWeek: allApps.filter(
        (a) => a.appliedAt && a.appliedAt >= thisWeekStart,
      ).length,
      interviewCount: allApps.filter((a) => normalizeStatus(a.status) === "interview")
        .length,
      rejectedCount: allApps.filter((a) => normalizeStatus(a.status) === "rejected")
        .length,
    },
    trends: {
      applications: computeTrend(periodApplications, appsPrevPeriod.length),
      hires: computeTrend(
        hiredInPeriod.length,
        appsPrevPeriod.filter((a) => normalizeStatus(a.status) === "hired").length,
      ),
      activeJobs: null,
      hireRate: computeTrend(hireRate, prevHireRate),
      jobsPosted: computeTrend(jobsPostedInPeriod, jobsPostedPrev),
    },
    activityTrend: trendBuckets,
    pipeline,
    topJobs,
    topLocations,
    jobTypes,
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
  };
}

export type EmployerAnalyticsPayload = ReturnType<typeof buildEmployerAnalytics>;

/** Map raw storage rows into analytics inputs */
export function mapJobsForAnalytics(
  jobs: Array<Record<string, unknown>>,
  applicationCounts: Map<string, number>,
): EmployerAnalyticsJob[] {
  return jobs.map((job) => ({
    id: String(job.id),
    title: String(job.title ?? ""),
    location: String(job.location ?? ""),
    jobType: String(job.jobType ?? job.job_type ?? "full-time"),
    isActive: Boolean(job.isActive ?? job.is_active ?? true),
    createdAt: parseDate(job.createdAt ?? job.created_at),
    applications: applicationCounts.get(String(job.id)) ?? 0,
    companyIndustry:
      (job.company as { industry?: string } | undefined)?.industry ??
      (job.companyIndustry as string | undefined) ??
      null,
    companyName:
      (job.company as { name?: string } | undefined)?.name ??
      (job.companyName as string | undefined) ??
      null,
  }));
}

export function mapApplicationsForAnalytics(apps: Array<Record<string, unknown>>): EmployerAnalyticsApplication[] {
  return apps.map((row) => {
    const job = (row.job ?? {}) as Record<string, unknown>;
    const applicant = (row.applicant ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id),
      jobId: row.jobId != null ? String(row.jobId) : row.job_id != null ? String(row.job_id) : null,
      status: String(row.status ?? "applied"),
      appliedAt: parseDate(row.appliedAt ?? row.applied_at),
      updatedAt: parseDate(row.updatedAt ?? row.updated_at),
      applicantLocation:
        applicant.location != null
          ? String(applicant.location)
          : row.applicantLocation != null
            ? String(row.applicantLocation)
            : null,
      jobLocation: job.location != null ? String(job.location) : null,
      jobTitle: job.title != null ? String(job.title) : null,
      jobCreatedAt: parseDate(job.createdAt ?? job.created_at ?? row.job_created_at),
    };
  });
}
