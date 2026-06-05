import { Router, Request, Response } from "express";
import { Session } from "express-session";
import { storage } from "../storage";
import { handleError } from "../utils";
import { TEST_JOBS } from "../constants";
import { insertJobSchema, InsertJob, Job } from "../../../shared/schema";

interface JobFilters {
  location: string;
  skills: string[];
  jobType: string;
  search: string;
  page: number;
  itemsPerPage: number;
}

declare module 'express-session' {
  interface Session {
    userId?: string;
  }
}

interface CustomRequest extends Request {
  query: {
    page?: string;
    itemsPerPage?: string;
    location?: string;
    skills?: string | string[];
    jobType?: string;
    search?: string;
  };
}

const router = Router();

router.get("/", async (req: CustomRequest, res: Response) => {
  // Get pagination parameters 
  console.log('Received jobs request with query:', req.query);
  const page = parseInt(req.query.page as string) || 1;
  const itemsPerPage = parseInt(req.query.itemsPerPage as string) || 10;

  // Parse and normalize query parameters
  const filters: JobFilters = {
    location: req.query.location || '',
    skills: Array.isArray(req.query.skills) 
      ? req.query.skills
      : typeof req.query.skills === 'string'
        ? [req.query.skills]
        : [],
    jobType: req.query.jobType || '',
    search: req.query.search || '',
    page,
    itemsPerPage
  };

  try {
    // Check database connection first
    const isConnected = await storage.checkConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Attempt to get jobs from database
    console.log('Fetching jobs with filters:', filters);
    const result = await storage.getJobs(filters);
    
    if (!result || !result.jobs) {
      throw new Error('Invalid response from database');
    }

    console.log('Got jobs from database:', { count: result.jobs.length });
    
    // Enrich job data
    const enrichedJobs = await Promise.all(result.jobs.map(async (job) => {
      try {
        const [company, employer, jobApplications] = await Promise.all([
          job.companyId ? storage.getCompany(job.companyId).catch(() => null) : null,
          job.employerId ? storage.getUser(job.employerId).catch(() => null) : null,
          storage.getApplicationsByJob(String(job.id)).catch(() => []),
        ]);

        return {
          ...job,
          isActive: job.isActive ?? true,
          applicationCount: Array.isArray(jobApplications) ? jobApplications.length : 0,
          company,
          employer: employer ? { ...employer, password: undefined } : null
        };
      } catch (error) {
        console.error('Error enriching job data:', error);
        return {
          ...job,
          isActive: job.isActive ?? true,
          applicationCount: 0,
          company: null,
          employer: null
        };
      }
    }));
    
    console.log('Sending response with enriched jobs:', { count: enrichedJobs.length });
    return res.json({
      jobs: enrichedJobs,
      totalCount: result.totalCount,
      currentPage: filters.page,
      totalPages: Math.ceil(result.totalCount / filters.itemsPerPage)
    });
  } catch (error) {
    console.error('Error in jobs route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return an appropriate error response
    // Log detailed error information
    console.error('Detailed error in jobs route:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      filters
    });

    // Send a clear error response
    return res.status(500).json({
      error: 'Failed to fetch jobs',
      message: error instanceof Error 
        ? error.message.includes('JSON') 
          ? 'Invalid data format in database'
          : error.message 
        : 'Unknown error',
      details: {
        location: filters.location || undefined,
        jobType: filters.jobType || undefined,
        skills: filters.skills?.length > 0 ? filters.skills : undefined,
        search: filters.search || undefined
      }
    });
  }
});

// Get single job
router.get("/:id", async (req: CustomRequest, res: Response) => {
  try {
    const job = await storage.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    const [company, employer] = await Promise.all([
      job.companyId ? storage.getCompany(job.companyId) : null,
      job.employerId ? storage.getUser(job.employerId) : null,
    ]);
    
    res.json({
      ...job,
      company,
      employer: employer ? {
        ...employer,
        password: undefined
      } : null,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch job");
  }
});

// Create job
router.post("/", async (req: CustomRequest, res: Response) => {
  try {
    // Parse and validate the request body
    const data = await insertJobSchema.parseAsync(req.body);

    // Check authorization
    if (data.employerId.toString() !== req.session?.userId) {
      return res.status(403).json({ message: "Not authorized to create job for this employer" });
    }

    // Create the job
    // Create the job directly from parsed data
    const job = await storage.createJob(data);
    res.json(job);
  } catch (error) {
    handleError(res, error, "Failed to create job");
  }
});

export default router;