import { z } from "zod";

export const insertJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  location: z.string().min(1),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'remote']),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  skills: z.array(z.string()).optional(),
  companyId: z.string().optional(),
  employerId: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.date().optional(),
}).transform(data => ({
  ...data,
  skills: data.skills || [],
  isActive: data.isActive ?? true,
  createdAt: data.createdAt || new Date()
}));