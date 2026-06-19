/**
 * GET /api/recommendations
 * Returns personalized job recommendations for authenticated user
 * Matches based on: skills (40%), location (20%), salary (20%), experience (20%)
 * Scores computed on-the-fly, not persisted (Phase 3a MVP)
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { users, professionalProfiles, jobs, aiEvents, matchExplanations } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import { matchJobToProfile, type UserProfile } from "../ai/job-matcher";
import {
  generateMatchExplanation,
  generateSuggestedAction,
  calculateSummaryStats,
  type RecommendationsSummary,
} from "../ai/recommendation-explainer";
import { calculateCosineSimilarity } from "../ai/embeddings";

const router = Router();

// Query parameter validation
const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  minScore: z.coerce.number().int().min(0).max(100).default(50),
  jobType: z.enum(["full-time", "part-time", "contract", "remote"]).optional(),
  semanticWeight: z.coerce.number().min(0).max(1).default(0.6),
});

type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;

/**
 * GET /api/recommendations
 * Returns top job recommendations for authenticated user
 */
router.get("/", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = (req.user as any)?.id;

  try {
    // Validate authentication
    if (!userId) {
      res.status(401).json({
        success: false,
        error: "User must be authenticated",
      });
      return;
    }

    // Validate query parameters
    const query = recommendationsQuerySchema.parse(req.query);
    const { limit, minScore, jobType, semanticWeight } = query as RecommendationsQuery;

    // Fetch user data
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Fetch professional profile
    const [profile] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId));

    if (!profile) {
      res.status(404).json({
        success: false,
        error: "Professional profile not found. Create one first.",
      });
      return;
    }

    // Build user profile for matching
    const userProfile: UserProfile = {
      location: user.location,
      skills: (Array.isArray(profile.skills) ? profile.skills : []) as string[],
      experience: (Array.isArray(profile.experience) ? profile.experience : []) as any[],
    };

    const conditions = [eq(jobs.isActive, true)];

    // Optional: filter by job type
    if (jobType) {
      conditions.push(eq(jobs.jobType, jobType));
    }

    const allJobs = await db.select().from(jobs).where(and(...conditions));

    const userEmbedding = profile.embedding;
    const hasUserEmbedding = Array.isArray(userEmbedding) && userEmbedding.length > 0;
    const jobsWithEmbeddings = allJobs.filter((j) => Array.isArray(j.embedding) && j.embedding.length > 0);

    const isSemanticMatching = hasUserEmbedding && jobsWithEmbeddings.length > 0;

    // Calculate matches for all jobs
    const matches = allJobs
      .map((job) => {
        const metadataMatch = matchJobToProfile(
          {
            id: job.id,
            title: job.title,
            location: job.location,
            skills: (Array.isArray(job.skills) ? job.skills : []) as string[],
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
          },
          userProfile
        );

        let overallScore = metadataMatch.overallScore;
        let skillsScore = metadataMatch.skillsScore;

        if (isSemanticMatching && Array.isArray(job.embedding) && job.embedding.length > 0) {
          const similarity = calculateCosineSimilarity(userEmbedding as number[], job.embedding as number[]);
          // Combine vector similarity (tunable weight) with metadata fit (salary, location, experience)
          const metadataScore = (metadataMatch.locationScore + metadataMatch.salaryScore + metadataMatch.experienceScore) / 3;
          overallScore = Math.round((similarity * 100) * semanticWeight + metadataScore * (1 - semanticWeight));
          skillsScore = Math.round(similarity * 100);
        }

        return {
          job,
          metadataMatch,
          overallScore,
          skillsScore,
        };
      })
      // Filter by minimum score
      .filter((m) => m.overallScore >= minScore)
      // Sort by score descending
      .sort((a, b) => b.overallScore - a.overallScore)
      // Take limit
      .slice(0, limit);

    // Build response with explanations
    const recommendations = matches.map((m) => {
      const hasAllSkills = m.metadataMatch.missingSkills.length === 0;
      const isRemote = m.job.jobType === "remote" || m.job.location.toLowerCase().includes("remote");

      const explanation = generateMatchExplanation(m.job.title, {
        skillsScore: m.skillsScore,
        locationScore: m.metadataMatch.locationScore,
        salaryScore: m.metadataMatch.salaryScore,
        experienceScore: m.metadataMatch.experienceScore,
        overallScore: m.overallScore,
      }, m.metadataMatch.missingSkills);

      return {
        job: {
          id: m.job.id,
          title: m.job.title,
          description: m.job.description,
          location: m.job.location,
          jobType: m.job.jobType,
          salaryMin: m.job.salaryMin,
          salaryMax: m.job.salaryMax,
          skills: m.job.skills,
          createdAt: m.job.createdAt,
        },
        matchScore: m.overallScore,
        matchBreakdown: {
          skills: m.skillsScore,
          location: m.metadataMatch.locationScore,
          salary: m.metadataMatch.salaryScore,
          experience: m.metadataMatch.experienceScore,
        },
        explanation,
        missingSkills: m.metadataMatch.missingSkills,
        suggestedAction: generateSuggestedAction(
          m.overallScore,
          hasAllSkills,
          m.metadataMatch.missingSkills,
          isRemote,
          user.location
        ),
      };
    });

    // Clear old explanations for this user
    await db.delete(matchExplanations).where(eq(matchExplanations.userId, userId)).catch((err) => {
      console.warn("Failed to delete old match explanations:", err);
    });

    // Save new match explanations to DB
    if (recommendations.length > 0) {
      await db.insert(matchExplanations).values(
        recommendations.map((rec) => ({
          userId,
          jobId: rec.job.id,
          explanationText: rec.explanation,
          matchScore: rec.matchScore,
        }))
      ).catch((err) => {
        console.warn("Failed to insert new match explanations:", err);
      });
    }

    // Calculate summary stats
    const allMatchScores = matches.map((m) => ({
      overallScore: m.overallScore,
      skillsScore: m.skillsScore,
      locationScore: m.metadataMatch.locationScore,
      salaryScore: m.metadataMatch.salaryScore,
      experienceScore: m.metadataMatch.experienceScore,
    }));

    const stats = calculateSummaryStats(allMatchScores);

    const summary: RecommendationsSummary = {
      totalCount: allJobs.length,
      matchingCount: matches.length,
      averageScore: stats.averageScore,
      topCategoryScores: stats.topCategoryScores,
    };

    // Log to ai_events
    const latencyMs = Date.now() - startTime;
    await db
      .insert(aiEvents)
      .values({
        userId,
        feature: "job_recommendations",
        provider: isSemanticMatching ? "gemini" : "rule-based",
        model: isSemanticMatching ? "text-embedding-004" : "match-v1",
        status: "success",
        latencyMs,
        metadata: {
          recommendationCount: recommendations.length,
          minScore,
          jobType: jobType || null,
          averageScore: summary.averageScore,
          isSemanticMatching,
        },
      })
      .catch(() => {
        // Silently fail if logging fails
      });

    // Return response
    res.json({
      success: true,
      data: {
        recommendations,
        summary,
        latencyMs,
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log error to ai_events
    if (userId) {
      await db
        .insert(aiEvents)
        .values({
          userId,
          feature: "job_recommendations",
          provider: "gemini",
          status: "error",
          latencyMs,
          errorMessage,
          metadata: {},
        })
        .catch(() => {
          // Silently fail if logging fails
        });
    }

    // Return error response
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }
});

export default router;
