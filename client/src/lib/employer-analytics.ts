import { apiFetch } from "@/lib/api";
import { jsPDF } from "jspdf";

export type EmployerAnalyticsRange = "7d" | "30d" | "90d" | "1y";

export interface MonthTrend {
  changePercent: number;
  trend: "up" | "down" | "flat";
}

export interface EmployerAnalyticsData {
  companyName: string | null;
  range: EmployerAnalyticsRange;
  rangeLabel: string;
  generatedAt: string;
  overview: {
    totalApplications: number;
    periodApplications: number;
    hires: number;
    hiresInPeriod: number;
    hireRate: number;
    avgTimeToFill: number;
    totalJobs: number;
    activeJobs: number;
    jobsPostedInPeriod: number;
    applicationsThisWeek: number;
    interviewCount: number;
    rejectedCount: number;
  };
  trends: {
    applications: MonthTrend | null;
    hires: MonthTrend | null;
    activeJobs: MonthTrend | null;
    hireRate: MonthTrend | null;
    jobsPosted: MonthTrend | null;
  };
  activityTrend: {
    label: string;
    applications: number;
    hires: number;
    interviews: number;
  }[];
  pipeline: { stage: string; count: number; percentage: number; color: string }[];
  topJobs: {
    id: string;
    title: string;
    applicants: number;
    department: string;
    status: "active" | "paused";
    location: string;
  }[];
  topLocations: { location: string; count: number }[];
  jobTypes: { type: string; count: number }[];
  period: { start: string; end: string };
}

export async function fetchEmployerAnalytics(
  range: EmployerAnalyticsRange,
): Promise<EmployerAnalyticsData> {
  const res = await apiFetch(`/api/employer/analytics?timeRange=${range}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const body = err as { message?: string };
    throw new Error(body.message || "Failed to load analytics");
  }
  return res.json();
}

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const rangeSlug = (range: string) => range;

export function exportEmployerAnalyticsCsv(data: EmployerAnalyticsData) {
  const lines: string[] = [];
  const o = data.overview;

  lines.push("CEP Recruiting Analytics Report");
  lines.push(`Company,${escapeCsv(data.companyName || "Your Company")}`);
  lines.push(`Period,${escapeCsv(data.rangeLabel)}`);
  lines.push(`Generated,${escapeCsv(new Date(data.generatedAt).toLocaleString())}`);
  lines.push("");

  lines.push("Executive Summary,Metric,Value");
  lines.push(`Applications (all time),,${o.totalApplications}`);
  lines.push(`Applications (${data.rangeLabel}),,${o.periodApplications}`);
  lines.push(`Hires (all time),,${o.hires}`);
  lines.push(`Hires (${data.rangeLabel}),,${o.hiresInPeriod}`);
  lines.push(`Hire rate %,,${o.hireRate}`);
  lines.push(`Avg time to fill (days),,${o.avgTimeToFill}`);
  lines.push(`Active job postings,,${o.activeJobs}`);
  lines.push(`Total job postings,,${o.totalJobs}`);
  lines.push(`New jobs (${data.rangeLabel}),,${o.jobsPostedInPeriod}`);
  lines.push(`Applications this week,,${o.applicationsThisWeek}`);
  lines.push(`In interview stage,,${o.interviewCount}`);
  lines.push(`Rejected,,${o.rejectedCount}`);
  lines.push("");

  lines.push("Pipeline Stage,Count,Share %");
  for (const p of data.pipeline) {
    lines.push(`${escapeCsv(p.stage)},${p.count},${p.percentage}`);
  }
  lines.push("");

  lines.push("Activity Trend,Applications,Hires,Interviews");
  for (const row of data.activityTrend) {
    lines.push(`${escapeCsv(row.label)},${row.applications},${row.hires},${row.interviews}`);
  }
  lines.push("");

  lines.push("Top Jobs,Title,Applicants,Status,Location");
  for (const job of data.topJobs) {
    lines.push(
      `Job,${escapeCsv(job.title)},${job.applicants},${job.status},${escapeCsv(job.location)}`,
    );
  }
  lines.push("");

  lines.push("Top Applicant Locations,Location,Count");
  for (const loc of data.topLocations) {
    lines.push(`Location,${escapeCsv(loc.location)},${loc.count}`);
  }
  lines.push("");

  lines.push("Roles by Type,Type,Count");
  for (const jt of data.jobTypes) {
    lines.push(`Job Type,${escapeCsv(jt.type)},${jt.count}`);
  }

  downloadBlob(
    new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }),
    `recruiting-report-${rangeSlug(data.range)}-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

export function exportEmployerAnalyticsPdf(data: EmployerAnalyticsData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;
  const lineHeight = 16;
  const o = data.overview;

  const addLine = (text: string, size = 11, bold = false) => {
    if (y > 760) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const wrapped = doc.splitTextToSize(text, 520);
    doc.text(wrapped, margin, y);
    y += lineHeight * wrapped.length;
  };

  addLine("CEP Recruiting Analytics Report", 18, true);
  addLine(`${data.companyName || "Company"} · ${data.rangeLabel}`, 12);
  addLine(`Generated ${new Date(data.generatedAt).toLocaleString()}`, 10);
  y += 8;

  addLine("Executive summary", 14, true);
  addLine(`Total applications: ${o.totalApplications} (${o.periodApplications} in period)`);
  addLine(`Hires: ${o.hires} total · ${o.hiresInPeriod} in period · Hire rate ${o.hireRate}%`);
  addLine(`Avg time to fill: ${o.avgTimeToFill} days`);
  addLine(`Active roles: ${o.activeJobs} of ${o.totalJobs} postings`);
  addLine(`Pipeline: ${o.interviewCount} in interview · ${o.rejectedCount} rejected`);
  y += 8;

  addLine("Recruitment pipeline", 14, true);
  for (const p of data.pipeline) {
    addLine(`${p.stage}: ${p.count} (${p.percentage}%)`);
  }
  y += 8;

  addLine("Top performing roles", 14, true);
  for (const job of data.topJobs.slice(0, 5)) {
    addLine(`• ${job.title} — ${job.applicants} applicants (${job.status})`);
  }
  y += 8;

  addLine("Top applicant locations", 14, true);
  for (const loc of data.topLocations.slice(0, 5)) {
    addLine(`• ${loc.location}: ${loc.count}`);
  }

  doc.save(`recruiting-report-${rangeSlug(data.range)}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
