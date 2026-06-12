/**
 * Admin platform analytics — computed from live DB aggregates.
 */

export type AdminAnalyticsRange = "7d" | "30d" | "90d" | "1y";

export interface AdminAnalyticsUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userType: string;
  createdAt: Date | null;
}

export interface AdminAnalyticsJob {
  id: string;
  title: string;
  jobType: string;
  isActive: boolean;
  createdAt: Date | null;
  companyIndustry: string | null;
  companyName: string | null;
}

export interface AdminAnalyticsApplication {
  id: string;
  jobId: string | null;
  applicantId: string | null;
  status: string;
  appliedAt: Date | null;
  updatedAt: Date | null;
  applicantName: string | null;
  jobTitle: string | null;
}

export interface AdminAnalyticsCompany {
  id: string;
  name: string;
  industry: string | null;
  createdAt: Date | null;
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function rangeToDays(range: AdminAnalyticsRange): number {
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
      return 365;
  }
}

function normalizeUserType(userType: string): "professional" | "employer" | "admin" | "other" {
  const t = String(userType || "").toLowerCase().trim();
  if (t === "admin") return "admin";
  if (t === "employer") return "employer";
  if (["professional", "job_seeker", "employee", "candidate"].includes(t)) return "professional";
  return "other";
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

function inWindow(date: Date | null, start: Date, end: Date): boolean {
  if (!date) return false;
  return date >= start && date <= end;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function bucketLabel(date: Date, range: AdminAnalyticsRange): string {
  if (range === "7d") {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (range === "1y") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function displayName(user: AdminAnalyticsUser): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "User";
}

export function mapUsersForAdminAnalytics(rows: Array<Record<string, unknown>>): AdminAnalyticsUser[] {
  return rows.map((row) => ({
    id: String(row.id),
    email: String(row.email ?? ""),
    firstName: row.firstName != null ? String(row.firstName) : row.first_name != null ? String(row.first_name) : null,
    lastName: row.lastName != null ? String(row.lastName) : row.last_name != null ? String(row.last_name) : null,
    userType: String(row.userType ?? row.user_type ?? ""),
    createdAt: parseDate(row.createdAt ?? row.created_at),
  }));
}

export function mapJobsForAdminAnalytics(rows: Array<Record<string, unknown>>): AdminAnalyticsJob[] {
  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ""),
    jobType: String(row.jobType ?? row.job_type ?? "full-time"),
    isActive: Boolean(row.isActive ?? row.is_active ?? true),
    createdAt: parseDate(row.createdAt ?? row.created_at),
    companyIndustry:
      (row.company as { industry?: string } | undefined)?.industry ??
      (row.company_industry != null ? String(row.company_industry) : null) ??
      (row.companyIndustry != null ? String(row.companyIndustry) : null),
    companyName:
      (row.company as { name?: string } | undefined)?.name ??
      (row.company_name != null ? String(row.company_name) : null) ??
      null,
  }));
}

export function mapApplicationsForAdminAnalytics(rows: Array<Record<string, unknown>>): AdminAnalyticsApplication[] {
  return rows.map((row) => ({
    id: String(row.id),
    jobId: row.jobId != null ? String(row.jobId) : row.job_id != null ? String(row.job_id) : null,
    applicantId:
      row.applicantId != null ? String(row.applicantId) : row.applicant_id != null ? String(row.applicant_id) : null,
    status: String(row.status ?? "applied"),
    appliedAt: parseDate(row.appliedAt ?? row.applied_at),
    updatedAt: parseDate(row.updatedAt ?? row.updated_at),
    applicantName:
      row.applicant_name != null
        ? String(row.applicant_name)
        : row.applicantName != null
          ? String(row.applicantName)
          : null,
    jobTitle:
      row.job_title != null ? String(row.job_title) : row.jobTitle != null ? String(row.jobTitle) : null,
  }));
}

export function mapCompaniesForAdminAnalytics(rows: Array<Record<string, unknown>>): AdminAnalyticsCompany[] {
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    industry: row.industry != null ? String(row.industry) : null,
    createdAt: parseDate(row.createdAt ?? row.created_at),
  }));
}

export function buildAdminAnalytics(
  users: AdminAnalyticsUser[],
  jobs: AdminAnalyticsJob[],
  companies: AdminAnalyticsCompany[],
  applications: AdminAnalyticsApplication[],
  range: AdminAnalyticsRange,
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

  const usersInPeriod = users.filter((u) => inWindow(u.createdAt, periodStart, periodEnd));
  const jobsInPeriod = jobs.filter((j) => inWindow(j.createdAt, periodStart, periodEnd));
  const jobsPrevPeriod = jobs.filter((j) => inWindow(j.createdAt, prevStart, prevEnd));
  const appsInPeriod = applications.filter((a) => inWindow(a.appliedAt, periodStart, periodEnd));
  const appsPrevPeriod = applications.filter((a) => inWindow(a.appliedAt, prevStart, prevEnd));
  const companiesInPeriod = companies.filter((c) => inWindow(c.createdAt, periodStart, periodEnd));

  const bucketCount = range === "7d" ? 7 : range === "30d" ? 6 : range === "90d" ? 6 : 12;
  const bucketMs =
    range === "7d"
      ? 24 * 60 * 60 * 1000
      : range === "30d"
        ? 5 * 24 * 60 * 60 * 1000
        : range === "90d"
          ? 15 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

  const userGrowth: { month: string; users: number; employees: number; employers: number }[] = [];
  for (let i = bucketCount - 1; i >= 0; i--) {
    const bucketEnd = new Date(periodEnd.getTime() - i * bucketMs);
    const bucketStart = new Date(bucketEnd.getTime() - bucketMs + 1);
    bucketStart.setHours(0, 0, 0, 0);

    const inBucket = users.filter((u) => u.createdAt && u.createdAt >= bucketStart && u.createdAt <= bucketEnd);
    let employees = 0;
    let employers = 0;
    for (const u of inBucket) {
      const t = normalizeUserType(u.userType);
      if (t === "professional") employees++;
      if (t === "employer") employers++;
    }
    userGrowth.push({
      month: bucketLabel(bucketStart, range),
      users: inBucket.length,
      employees,
      employers,
    });
  }

  const industryMap = new Map<string, number>();
  for (const job of jobsInPeriod.length > 0 ? jobsInPeriod : jobs) {
    const industry = (job.companyIndustry && job.companyIndustry.trim()) || "Other";
    industryMap.set(industry, (industryMap.get(industry) ?? 0) + 1);
  }
  const jobCategories = Array.from(industryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const hiredApps = applications.filter((a) => normalizeStatus(a.status) === "hired");
  const hiredInPeriod = appsInPeriod.filter((a) => normalizeStatus(a.status) === "hired");
  const hiredPrevPeriod = appsPrevPeriod.filter((a) => normalizeStatus(a.status) === "hired");

  const successRate =
    applications.length > 0 ? Math.round((hiredApps.length / applications.length) * 100) : 0;
  const periodSuccessRate =
    appsInPeriod.length > 0 ? Math.round((hiredInPeriod.length / appsInPeriod.length) * 100) : 0;
  const prevSuccessRate =
    appsPrevPeriod.length > 0 ? Math.round((hiredPrevPeriod.length / appsPrevPeriod.length) * 100) : 0;
  const successRateChange = periodSuccessRate - prevSuccessRate;

  const timeToFillDays: number[] = [];
  for (const app of hiredApps) {
    const end = app.updatedAt || app.appliedAt;
    if (app.appliedAt && end) {
      timeToFillDays.push(daysBetween(app.appliedAt, end));
    }
  }
  const avgTimeToHire =
    timeToFillDays.length > 0
      ? Math.round(timeToFillDays.reduce((s, d) => s + d, 0) / timeToFillDays.length)
      : 0;

  const prevTimeToFill: number[] = [];
  for (const app of appsPrevPeriod.filter((a) => normalizeStatus(a.status) === "hired")) {
    const end = app.updatedAt || app.appliedAt;
    if (app.appliedAt && end) prevTimeToFill.push(daysBetween(app.appliedAt, end));
  }
  const prevAvgTimeToHire =
    prevTimeToFill.length > 0
      ? Math.round(prevTimeToFill.reduce((s, d) => s + d, 0) / prevTimeToFill.length)
      : avgTimeToHire;
  const timeToHireChange = prevAvgTimeToHire - avgTimeToHire;

  const interviewRate =
    applications.length > 0
      ? Math.round(
          (applications.filter((a) => ["interview", "shortlisted", "hired"].includes(normalizeStatus(a.status)))
            .length /
            applications.length) *
            100,
        )
      : 0;
  const responseRate =
    applications.length > 0
      ? Math.round(
          (applications.filter((a) => normalizeStatus(a.status) !== "new").length / applications.length) * 100,
        )
      : 0;

  const activeJobs = jobs.filter((j) => j.isActive).length;
  const avgAppsPerJob = activeJobs > 0 ? Math.round((applications.length / activeJobs) * 10) / 10 : 0;
  const fillRate = activeJobs > 0 ? Math.min(100, Math.round((hiredApps.length / activeJobs) * 100)) : 0;

  const recentActivities = [
    ...users.map((user) => ({
      type: "user" as const,
      action: "User registered",
      user: displayName(user),
      createdAt: user.createdAt,
    })),
    ...jobs.map((job) => ({
      type: "job" as const,
      action: "Job posted",
      user: job.title,
      createdAt: job.createdAt,
    })),
    ...applications.map((app) => ({
      type: "application" as const,
      action: `Application ${normalizeStatus(app.status)}`,
      user: app.applicantName || app.jobTitle || "Applicant",
      createdAt: app.appliedAt,
    })),
    ...companies.map((company) => ({
      type: "company" as const,
      action: "Company joined",
      user: company.name,
      createdAt: company.createdAt,
    })),
  ]
    .filter((a) => a.createdAt)
    .sort((a, b) => (b.createdAt!.getTime() - a.createdAt!.getTime()))
    .slice(0, 8);

  return {
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
    userGrowth,
    jobCategories,
    recentActivities,
    stats: {
      totalUsers: users.length,
      activeJobs,
      totalCompanies: companies.length,
      applications: applications.length,
      newUsers: usersInPeriod.length,
      newJobs: jobsInPeriod.length,
      newApplications: appsInPeriod.length,
      newCompanies: companiesInPeriod.length,
      successRate,
      successRateChange,
      periodApplications: appsInPeriod.length,
      periodUsers: usersInPeriod.length,
    },
    performanceMetrics: {
      employeeSatisfaction: Math.min(100, Math.round(55 + interviewRate * 0.45)),
      employerSatisfaction: Math.min(100, Math.round(50 + fillRate * 0.35 + Math.min(avgAppsPerJob, 10) * 2)),
      placementRate: successRate,
      avgTimeToHire,
      timeToHireChange,
      interviewRate,
      responseRate,
      hiredCount: hiredApps.length,
      pipeline: {
        new: applications.filter((a) => normalizeStatus(a.status) === "new").length,
        reviewing: applications.filter((a) => normalizeStatus(a.status) === "reviewing").length,
        shortlisted: applications.filter((a) => normalizeStatus(a.status) === "shortlisted").length,
        interview: applications.filter((a) => normalizeStatus(a.status) === "interview").length,
        hired: hiredApps.length,
        rejected: applications.filter((a) => normalizeStatus(a.status) === "rejected").length,
      },
    },
  };
}

export type AdminAnalyticsPayload = ReturnType<typeof buildAdminAnalytics>;
