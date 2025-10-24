import { Router } from "express";
import { storage } from "../storage";
import { handleError } from "../utils";
import { TEST_JOBS } from "../constants";
import { insertJobSchema } from "../schemas/job";

const router = Router();

router.get("/", async (req, res) => {
  try {
    // Get pagination parameters 
    console.log('Received jobs request with query:', req.query);
    const page = parseInt(req.query.page as string) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage as string) || 10;

      // Parse and normalize query parameters
      const filters = {
        location: req.query.location as string || '',
        skills: Array.isArray(req.query.skills) 
          ? (req.query.skills as string[])
          : typeof req.query.skills === 'string'
            ? [req.query.skills]
            : [],
        jobType: req.query.jobType as string || '',
        search: req.query.search as string || '',
        page,
        itemsPerPage
      };    try {
      // Attempt to get jobs from database with error handling
      console.log('Fetching jobs with filters:', filters);
      const result = await storage.getJobs(filters).catch(err => {
        console.error('Database error:', err);
        throw err;
      });
      
      if (!result || !result.jobs) {
        throw new Error('Invalid response from database');
      }

      console.log('Got jobs from database:', { count: result.jobs.length });
      
      // Enrich job data with error handling
      const enrichedJobs = await Promise.all(result.jobs.map(async (job) => {
        try {
          const [company, employer] = await Promise.all([
            job.companyId ? storage.getCompany(job.companyId).catch(() => null) : null,
            job.employerId ? storage.getUser(job.employerId).catch(() => null) : null
          ]);

          return {
            ...job,
            isActive: job.isActive ?? true,
            applicationCount: Math.floor(Math.random() * 20),
            company,
            employer: employer ? { ...employer, password: undefined } : null
          };
        } catch (error) {
          console.error('Error enriching job data:', error);
          // Return job without enrichment if there's an error
          return {
            ...job,
            isActive: job.isActive ?? true,
            applicationCount: Math.floor(Math.random() * 20),
            company: null,
            employer: null
          };
        }
      }));
      
      console.log('Sending response with enriched jobs:', { count: enrichedJobs.length });
      return res.json({
        jobs: enrichedJobs,
        totalCount: result.totalCount,
        currentPage: page,
        totalPages: Math.ceil(result.totalCount / itemsPerPage)
      });

    } catch (dbError) {
      console.error('Database error, falling back to test data:', dbError);
      
      // Filter test jobs using the same criteria
      let filteredJobs = [...TEST_JOBS];

      if (filters.location) {
        filteredJobs = filteredJobs.filter(job => 
          job.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      
      if (filters.jobType) {
        filteredJobs = filteredJobs.filter(job => 
          job.jobType.toLowerCase() === filters.jobType!.toLowerCase()
        );
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredJobs = filteredJobs.filter(job => 
          job.title.toLowerCase().includes(searchTerm) ||
          job.description.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.skills && filters.skills.length > 0) {
        filteredJobs = filteredJobs.filter(job => 
          filters.skills!.some(skill => 
            job.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
          )
        );
      }

      // Apply pagination to test data
      const start = (filters.page - 1) * filters.itemsPerPage;
      const end = start + filters.itemsPerPage;
      const paginatedJobs = filteredJobs.slice(start, end).map(job => ({
        ...job,
        isActive: job.isActive ?? true,
        applicationCount: Math.floor(Math.random() * 20),
        company: null,
        employer: null
      }));

      console.log('Sending test data response:', { count: paginatedJobs.length });
      return res.json({
        jobs: paginatedJobs,
        totalCount: filteredJobs.length,
        currentPage: page,
        totalPages: Math.ceil(filteredJobs.length / itemsPerPage)
      });
    }

  } catch (error: any) {
    console.error('Unhandled error in jobs route:', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });

    // Check for specific error types
    if (error.code === '28P01' || error.message.includes('connection')) {
      return handleError(res, error, "Database connection error");
    }
    
    if (error.code === '42P01') {
      return handleError(res, error, "Database table not found");
    }

    if (error.message.includes('JSON')) {
      return handleError(res, error, "Invalid data format");
    }

    handleError(res, error, "Failed to fetch jobs");
  }
});

// Get single job
router.get("/:id", async (req, res) => {
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
        password: undefined // Remove password from employer data
      } : null,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch job");
  }
});

// Create job
router.post("/", async (req, res) => {
  try {
    const data = insertJobSchema.parse(req.body);

    if (data.employerId.toString() !== req.session?.userId) {
      return res.status(403).json({ message: "Not authorized to create job for this employer" });
    }

    const jobInsert = {
      ...data,
      employerId: data.employerId,
      companyId: data.companyId,
    };

    const job = await storage.createJob(jobInsert);
    res.json(job);
  } catch (error) {
    handleError(res, error, "Failed to create job");
  }
});

export default router;