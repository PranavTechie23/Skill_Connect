import { type Job } from "../../../shared/schema";

export function mapDbResultToJob(row: any): Job {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    requirements: row.requirements,
    location: row.location,
    jobType: row.jobType,
    salaryMin: Number(row.salaryMin) || 0,
    salaryMax: Number(row.salaryMax) || 0,
    skills: Array.isArray(row.skills) ? row.skills : [],
    companyId: row.companyId ? String(row.companyId) : undefined,
    employerId: row.employerId ? String(row.employerId) : undefined,
    isActive: Boolean(row.isActive),
    createdAt: new Date(row.createdAt)
  };
}