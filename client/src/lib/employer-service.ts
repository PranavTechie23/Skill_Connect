import { apiFetch } from "@/lib/api";
import { normalizeApplicationStatus } from "@/lib/application-status";

export type EmployerTabStatus = "new" | "reviewing" | "shortlisted" | "interview" | "hired" | "rejected";

export interface EmployerApplicant {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  location?: string | null;
  profilePhoto?: string | null;
  telephoneNumber?: string | null;
}

export interface EmployerJobRef {
  id: string;
  title?: string | null;
  location?: string | null;
  jobType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  skills?: string[];
}

export interface EmployerApplication {
  id: string;
  jobId: string | null;
  applicantId: string | null;
  status: string;
  coverLetter?: string | null;
  resume?: string | null;
  appliedAt: string;
  updatedAt?: string | null;
  job?: EmployerJobRef | null;
  applicant?: EmployerApplicant | null;
  profile?: {
    skills?: string[];
    headline?: string | null;
    bio?: string | null;
    education?: string | null;
    experience?: string | null;
  } | null;
  matchScore?: number;
}

export interface EmployerJob {
  id: string;
  title: string;
  location: string;
  description?: string;
  requirements?: string;
  skills?: string[];
  jobType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  createdAt?: string;
  isActive?: boolean;
  applications?: number;
  newApplications?: number;
  views?: number;
  company?: { industry?: string; name?: string };
}

export interface MonthTrend {
  changePercent: number;
  trend: "up" | "down" | "flat";
}

export interface EmployerJobPageStats {
  total: number;
  active: number;
  paused: number;
  totalApplicants: number;
  avgConversionPercent: number | null;
  trends: {
    totalJobs: MonthTrend | null;
    activeJobs: MonthTrend | null;
    totalApplicants: MonthTrend | null;
    avgConversion: MonthTrend | null;
  };
}

export interface EmployerApplicationStats {
  total: number;
  underReview: number;
  shortlisted: number;
  hired: number;
  newCount: number;
  interview: number;
  rejected: number;
  pipeline: { stage: string; count: number }[];
  thisWeek: number;
}

function str(v: unknown): string {
  return v != null ? String(v) : "";
}

export function applicantDisplayName(applicant?: EmployerApplicant | null): string {
  if (!applicant) return "Unknown Candidate";
  const full = [applicant.firstName, applicant.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (applicant.email) return applicant.email;
  return "Unknown Candidate";
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

/** Canonical status values accepted by PUT /api/applications/:id */
const API_APPLICATION_STATUS_ALIASES: Record<string, string> = {
  new: "applied",
  pending: "applied",
  review: "under_review",
  reviewing: "under_review",
  reviewed: "under_review",
  screening: "under_review",
  interview: "interview",
  interviewing: "interview",
  shortlisted: "shortlisted",
  accepted: "hired",
  approved: "hired",
  offer: "hired",
  hired: "hired",
  rejected: "rejected",
  declined: "rejected",
  applied: "applied",
  under_review: "under_review",
};

/** Normalize UI / tab labels to API status before PATCH/PUT */
export function toApiApplicationStatus(status: string): string {
  const key = String(status || "applied").toLowerCase().trim();
  return API_APPLICATION_STATUS_ALIASES[key] ?? key;
}

/** Map backend status to employer applications tab filter */
export function mapToEmployerTabStatus(status?: string | null): EmployerTabStatus {
  const s = String(status || "applied").toLowerCase();
  if (["applied", "pending"].includes(s)) return "new";
  if (["review", "reviewing", "reviewed", "under_review"].includes(s)) return "reviewing";
  if (s === "shortlisted") return "shortlisted";
  if (["interview", "interviewing"].includes(s)) return "interview";
  if (["hired", "accepted", "approved", "offer"].includes(s)) return "hired";
  if (["rejected", "declined"].includes(s)) return "rejected";
  return "new";
}

export function employerStatusLabel(tab: EmployerTabStatus): string {
  const labels: Record<EmployerTabStatus, string> = {
    new: "New Application",
    reviewing: "Under Review",
    shortlisted: "Shortlisted",
    interview: "Interview",
    hired: "Hired",
    rejected: "Rejected",
  };
  return labels[tab];
}

export function formatSalaryRange(job?: EmployerJobRef | null): string {
  if (!job?.salaryMin && !job?.salaryMax) return "Not specified";
  const min = job.salaryMin ? `$${Math.round(job.salaryMin / 1000)}k` : null;
  const max = job.salaryMax ? `$${Math.round(job.salaryMax / 1000)}k` : null;
  if (min && max) return `${min} - ${max}`;
  return min || max || "Not specified";
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeApplicationStats(apps: EmployerApplication[]): EmployerApplicationStats {
  const pipeline = [
    { stage: "New Applications", count: 0 },
    { stage: "Under Review", count: 0 },
    { stage: "Shortlisted", count: 0 },
    { stage: "Interview", count: 0 },
    { stage: "Hired", count: 0 },
  ];

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let thisWeek = 0;

  for (const app of apps) {
    const tab = mapToEmployerTabStatus(app.status);
    if (tab === "new") pipeline[0].count += 1;
    else if (tab === "reviewing") pipeline[1].count += 1;
    else if (tab === "shortlisted") pipeline[2].count += 1;
    else if (tab === "interview") pipeline[3].count += 1;
    else if (tab === "hired") pipeline[4].count += 1;

    const applied = parseDate(app.appliedAt);
    if (applied && applied.getTime() >= oneWeekAgo) thisWeek += 1;
  }

  return {
    total: apps.length,
    underReview: apps.filter((a) => mapToEmployerTabStatus(a.status) === "reviewing").length,
    shortlisted: apps.filter((a) => mapToEmployerTabStatus(a.status) === "shortlisted").length,
    hired: apps.filter((a) => mapToEmployerTabStatus(a.status) === "hired").length,
    newCount: apps.filter((a) => mapToEmployerTabStatus(a.status) === "new").length,
    interview: apps.filter((a) => mapToEmployerTabStatus(a.status) === "interview").length,
    rejected: apps.filter((a) => mapToEmployerTabStatus(a.status) === "rejected").length,
    pipeline,
    thisWeek,
  };
}

function normalizeApplication(raw: Record<string, unknown>): EmployerApplication {
  const applicantRaw = raw.applicant as Record<string, unknown> | null | undefined;
  const jobRaw = raw.job as Record<string, unknown> | null | undefined;
  const profileRaw = raw.profile as Record<string, unknown> | null | undefined;
  const matchRaw = raw.matchScore as number | { total?: number } | undefined;

  let matchScore: number | undefined;
  if (typeof matchRaw === "number") matchScore = matchRaw;
  else if (matchRaw && typeof matchRaw === "object" && typeof matchRaw.total === "number") {
    matchScore = matchRaw.total;
  }

  return {
    id: str(raw.id),
    jobId: raw.jobId != null ? str(raw.jobId) : null,
    applicantId: raw.applicantId != null ? str(raw.applicantId) : null,
    status: str(raw.status || "applied"),
    coverLetter: raw.coverLetter != null ? str(raw.coverLetter) : null,
    resume: raw.resume != null ? str(raw.resume) : null,
    appliedAt: str(raw.appliedAt || raw.applied_at || new Date().toISOString()),
    updatedAt: raw.updatedAt != null ? str(raw.updatedAt) : null,
    matchScore,
    applicant: applicantRaw
      ? {
          id: str(applicantRaw.id),
          email: applicantRaw.email != null ? str(applicantRaw.email) : null,
          firstName: applicantRaw.firstName != null ? str(applicantRaw.firstName) : null,
          lastName: applicantRaw.lastName != null ? str(applicantRaw.lastName) : null,
          location: applicantRaw.location != null ? str(applicantRaw.location) : null,
          profilePhoto: applicantRaw.profilePhoto != null ? str(applicantRaw.profilePhoto) : null,
          telephoneNumber:
            applicantRaw.telephoneNumber != null ? str(applicantRaw.telephoneNumber) : null,
        }
      : null,
    job: jobRaw
      ? {
          id: str(jobRaw.id),
          title: jobRaw.title != null ? str(jobRaw.title) : null,
          location: jobRaw.location != null ? str(jobRaw.location) : null,
          jobType: jobRaw.jobType != null ? str(jobRaw.jobType) : null,
          salaryMin: jobRaw.salaryMin != null ? Number(jobRaw.salaryMin) : null,
          salaryMax: jobRaw.salaryMax != null ? Number(jobRaw.salaryMax) : null,
          skills: Array.isArray(jobRaw.skills) ? jobRaw.skills.map(String) : [],
        }
      : null,
    profile: profileRaw
      ? {
          skills: Array.isArray(profileRaw.skills) ? profileRaw.skills.map(String) : [],
          headline: profileRaw.headline != null ? str(profileRaw.headline) : null,
          bio: profileRaw.bio != null ? str(profileRaw.bio) : null,
          education: profileRaw.education != null ? str(profileRaw.education) : null,
          experience: profileRaw.experience != null ? str(profileRaw.experience) : null,
        }
      : null,
  };
}

export async function fetchEmployerApplications(employerId: string): Promise<EmployerApplication[]> {
  const res = await apiFetch(`/api/applications?employerId=${employerId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch applications");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((row) =>
    normalizeApplication(row as Record<string, unknown>),
  );
}

function monthRange(monthOffset: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function isDateInMonth(dateStr: string | undefined, monthOffset: number): boolean {
  const d = parseDate(dateStr);
  if (!d) return false;
  const { start, end } = monthRange(monthOffset);
  return d >= start && d <= end;
}

/** Signed percent change; null when both periods are zero (no meaningful trend). */
export function computeMonthTrend(current: number, previous: number): MonthTrend | null {
  if (current === 0 && previous === 0) return null;
  if (previous === 0) {
    return current > 0 ? { changePercent: 100, trend: "up" } : null;
  }
  const raw = ((current - previous) / previous) * 100;
  const changePercent = Math.round(raw * 10) / 10;
  if (changePercent === 0) return { changePercent: 0, trend: "flat" };
  return { changePercent, trend: changePercent > 0 ? "up" : "down" };
}

function jobFillRateInMonth(jobs: EmployerJob[], monthOffset: number): number {
  const inMonth = jobs.filter((j) => isDateInMonth(j.createdAt, monthOffset));
  if (inMonth.length === 0) return 0;
  const withApps = inMonth.filter((j) => (j.applications ?? 0) > 0).length;
  return (withApps / inMonth.length) * 100;
}

export function computeEmployerJobPageStats(
  jobs: EmployerJob[],
  applications: EmployerApplication[],
): EmployerJobPageStats {
  const active = jobs.filter((j) => j.isActive).length;
  const paused = jobs.length - active;
  const totalApplicants = applications.length;

  const jobsWithApplicants = jobs.filter((j) => (j.applications ?? 0) > 0).length;
  const avgConversionPercent =
    jobs.length > 0 ? Math.round((jobsWithApplicants / jobs.length) * 1000) / 10 : null;

  const jobsThisMonth = jobs.filter((j) => isDateInMonth(j.createdAt, 0)).length;
  const jobsLastMonth = jobs.filter((j) => isDateInMonth(j.createdAt, -1)).length;

  const activeThisMonth = jobs.filter((j) => j.isActive && isDateInMonth(j.createdAt, 0)).length;
  const activeLastMonth = jobs.filter((j) => j.isActive && isDateInMonth(j.createdAt, -1)).length;

  const appsThisMonth = applications.filter((a) => isDateInMonth(a.appliedAt, 0)).length;
  const appsLastMonth = applications.filter((a) => isDateInMonth(a.appliedAt, -1)).length;

  const convThisMonth = jobFillRateInMonth(jobs, 0);
  const convLastMonth = jobFillRateInMonth(jobs, -1);

  return {
    total: jobs.length,
    active,
    paused,
    totalApplicants,
    avgConversionPercent,
    trends: {
      totalJobs: computeMonthTrend(jobsThisMonth, jobsLastMonth),
      activeJobs: computeMonthTrend(activeThisMonth, activeLastMonth),
      totalApplicants: computeMonthTrend(appsThisMonth, appsLastMonth),
      avgConversion: computeMonthTrend(convThisMonth, convLastMonth),
    },
  };
}

export async function fetchEmployerJobs(): Promise<EmployerJob[]> {
  const res = await apiFetch("/api/employer/jobs", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((job: Record<string, unknown>) => ({
    id: str(job.id),
    title: str(job.title),
    location: str(job.location || "—"),
    description: job.description != null ? str(job.description) : undefined,
    requirements: job.requirements != null ? str(job.requirements) : undefined,
    skills: Array.isArray(job.skills) ? job.skills.map(String) : undefined,
    jobType: job.jobType != null ? str(job.jobType) : undefined,
    salaryMin: job.salaryMin != null ? Number(job.salaryMin) : null,
    salaryMax: job.salaryMax != null ? Number(job.salaryMax) : null,
    createdAt: job.createdAt != null ? str(job.createdAt) : undefined,
    isActive: Boolean(job.isActive),
    applications: Number(job.applications ?? 0),
    newApplications: Number(job.newApplications ?? 0),
    views: Number(job.views ?? 0),
    company: job.company as EmployerJob["company"],
  }));
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
): Promise<void> {
  const apiStatus = toApiApplicationStatus(status);
  const res = await apiFetch(`/api/applications/${applicationId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: apiStatus }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const body = err as { message?: string; error?: string };
    throw new Error(
      body.message || body.error || `Failed to update application (${res.status})`,
    );
  }
}

/** Human-readable label after a status change */
export function employerStatusActionMessage(status: string): string {
  const tab = mapToEmployerTabStatus(status);
  return `Application marked as ${employerStatusLabel(tab).toLowerCase()}.`;
}

/** Whether employer can shortlist / move to review */
export function canShortlistApplication(status?: string | null): boolean {
  const tab = mapToEmployerTabStatus(status);
  return !["shortlisted", "interview", "hired", "rejected"].includes(tab);
}

/** Whether employer can reject */
export function canRejectApplication(status?: string | null): boolean {
  const tab = mapToEmployerTabStatus(status);
  return tab !== "rejected" && tab !== "hired";
}

export { resolveResumeUrl } from './utils';

export async function fetchApplicantProfile(userId: string): Promise<{
  user: EmployerApplicant & { bio?: string | null };
  profile: EmployerApplication["profile"];
}> {
  const res = await apiFetch(`/api/users/${userId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load candidate profile");
  const user = (await res.json()) as Record<string, unknown>;
  return {
    user: {
      id: String(user.id ?? userId),
      email: user.email != null ? String(user.email) : null,
      firstName: user.firstName != null ? String(user.firstName) : null,
      lastName: user.lastName != null ? String(user.lastName) : null,
      location: user.location != null ? String(user.location) : null,
      profilePhoto: user.profilePhoto != null ? String(user.profilePhoto) : null,
      telephoneNumber: user.telephoneNumber != null ? String(user.telephoneNumber) : null,
      bio: user.bio != null ? String(user.bio) : null,
    },
    profile: null,
  };
}

/** Skills shown on cards: profile skills, else job skills */
export function resolveApplicantSkills(app: EmployerApplication): string[] {
  const fromProfile = app.profile?.skills;
  if (Array.isArray(fromProfile) && fromProfile.length > 0) return fromProfile;
  const fromJob = app.job?.skills;
  if (Array.isArray(fromJob) && fromJob.length > 0) return fromJob;
  return [];
}

export function formatAppliedDate(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return "—";
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Employee-facing normalized status (for cross-reference) */
export function employeeNormalizedStatus(status?: string | null): string {
  return normalizeApplicationStatus(status);
}
