import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { jobs, companies } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { generateTextEmbedding, calculateCosineSimilarity } from "../ai/embeddings";
import { handleError } from "../utils";

const router = Router();

const semanticSearchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  minSimilarity: z.coerce.number().min(0).max(1).default(0.1),
});

type SemanticSearchQuery = z.infer<typeof semanticSearchQuerySchema>;

router.get("/", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req.user as any)?.id || (req.session as any)?.userId;

  try {
    if (!userId) {
      res.status(401).json({
        success: false,
        error: "User must be authenticated",
      });
      return;
    }

    const { q, limit, minSimilarity } = semanticSearchQuerySchema.parse(req.query) as SemanticSearchQuery;

    // 1. Generate embedding for query
    const queryEmbedding = await generateTextEmbedding(q);
    if (!queryEmbedding || queryEmbedding.length === 0) {
      res.status(400).json({
        success: false,
        error: "Failed to generate query embedding",
      });
      return;
    }

    // 2. Fetch all active jobs with non-null embeddings
    const allJobs = await db.select().from(jobs).where(eq(jobs.isActive, true));
    const jobsWithEmbeddings = allJobs.filter((job) => Array.isArray(job.embedding) && job.embedding.length > 0);

    // 3. Compute cosine similarity JS-side in memory
    const matches = jobsWithEmbeddings
      .map((job) => {
        const similarity = calculateCosineSimilarity(queryEmbedding, job.embedding as number[]);
        return {
          job,
          similarity,
        };
      })
      // Filter by minimum similarity score
      .filter((m) => m.similarity >= minSimilarity)
      // Sort descending by similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // 4. Enrich jobs with company info if needed
    const enrichedResults = await Promise.all(
      matches.map(async (m) => {
        let company = null;
        if (m.job.companyId) {
          const [comp] = await db
            .select()
            .from(companies)
            .where(eq(companies.id, m.job.companyId))
            .catch(() => [null]);
          company = comp;
        }
        return {
          id: m.job.id,
          title: m.job.title,
          description: m.job.description,
          requirements: m.job.requirements,
          location: m.job.location,
          jobType: m.job.jobType,
          salaryMin: m.job.salaryMin,
          salaryMax: m.job.salaryMax,
          skills: m.job.skills,
          createdAt: m.job.createdAt,
          similarityScore: m.similarity,
          company: company ? {
            name: company.name,
            location: company.location,
            industry: company.industry,
            size: company.size,
            logo: company.logo,
          } : null,
        };
      })
    );

    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      data: {
        results: enrichedResults,
        latencyMs,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: error.errors,
      });
    } else {
      handleError(res, error, "Failed to perform semantic search");
    }
  }
});

export default router;
