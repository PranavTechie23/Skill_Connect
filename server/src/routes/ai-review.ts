import { Router } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { resumeParses, users, professionalProfiles } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { generateReviewPack } from "../ai/review-pack-generator";

const router = Router();

router.get("/:id/review", async (req, res) => {
  const userId = (req.session as { userId?: string })?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const applicationId = req.params.id;
  if (!applicationId) {
    return res.status(400).json({ message: "Application ID is required" });
  }

  try {
    // 1. Fetch Application
    const application = await storage.getApplication(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // 2. Fetch Job
    if (!application.jobId) {
       return res.status(400).json({ message: "Application has no associated job" });
    }
    const job = await storage.getJob(application.jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // 3. Authorization Check: Ensure the user is the employer who posted the job
    // Actually, storage.getJob might return employerId. 
    // Wait, let's verify if the user owns the job.
    if (job.employerId !== userId) {
      // Also check if admin
      const currentUser = await storage.getUser(userId);
      if (currentUser?.userType !== 'admin') {
         return res.status(403).json({ message: "Not authorized to review this application" });
      }
    }

    // 4. Fetch Candidate details
    if (!application.applicantId) {
      return res.status(400).json({ message: "Application has no applicant" });
    }

    const applicant = await storage.getUser(application.applicantId);
    const candidateProfile = await storage.getProfessionalProfileByUserId(application.applicantId);
    
    if (!applicant) {
       return res.status(404).json({ message: "Applicant not found" });
    }

    if ((applicant.privacySettings as any)?.aiOptOut) {
      return res.status(403).json({ message: "Candidate has opted out of AI processing. Please review manually." });
    }

    // 5. Fetch Resume Parse (if available)
    // We check the resume_parses table for the applicant's latest parsed resume
    const parsedResumes = await db.select()
      .from(resumeParses)
      .where(eq(resumeParses.userId, application.applicantId))
      .orderBy(resumeParses.createdAt) // might need desc() but we'll just take the last element
      .execute();
    
    let resumeText = null;
    if (parsedResumes && parsedResumes.length > 0) {
       const latestParse = parsedResumes[parsedResumes.length - 1];
       if (latestParse.extractedText) {
         resumeText = latestParse.extractedText;
       }
    }

    // If no text from table, we might check if application has cover letter
    if (!resumeText && application.coverLetter) {
        resumeText = application.coverLetter; // Fallback to cover letter for some context
    }

    // 6. Generate Review Pack
    const candidateName = `${applicant.firstName} ${applicant.lastName}`;
    const jobSkills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills || [];

    const reviewPack = await generateReviewPack({
      candidateName,
      candidateProfile: candidateProfile || {},
      resumeText,
      jobTitle: job.title,
      jobDescription: job.description,
      jobRequirements: job.requirements,
      jobSkills: Array.isArray(jobSkills) ? jobSkills : [],
    });

    return res.json(reviewPack);
  } catch (error) {
    console.error("Error generating review pack:", error);
    return res.status(500).json({ 
      message: "Failed to generate AI review pack",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
