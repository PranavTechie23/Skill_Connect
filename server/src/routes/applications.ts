import { Request, Response } from 'express';
import { db } from '../db';
import { applications } from '../../../shared/schema';
import { storage as appStorage } from '../storage';
import { notifyApplicationSubmitted } from '../lib/activity-notifications';
import { runModerationScan } from '../ai/moderation-scanner';
import { z } from 'zod';

import multer from 'multer';
import { applicationStorage } from '../lib/cloudinary';

const upload = multer({
  storage: applicationStorage as any,
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
}).array('attachments', 5);

const applicantDetailsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
});

async function syncApplicantDetails(userId: string, raw: unknown): Promise<void> {
  const details = applicantDetailsSchema.parse(
    typeof raw === 'string' ? JSON.parse(raw) : raw
  );

  const userUpdates: Record<string, string> = {};
  if (details.firstName?.trim()) userUpdates.firstName = details.firstName.trim();
  if (details.lastName?.trim()) userUpdates.lastName = details.lastName.trim();
  if (details.email?.trim()) userUpdates.email = details.email.trim();
  if (details.location?.trim()) userUpdates.location = details.location.trim();
  if (details.phone?.trim()) userUpdates.telephoneNumber = details.phone.trim();

  if (Object.keys(userUpdates).length > 0) {
    await appStorage.updateUser(userId, userUpdates);
  }

  const profileUpdates: { headline?: string; bio?: string } = {};
  if (details.headline?.trim()) profileUpdates.headline = details.headline.trim();
  if (details.bio?.trim()) profileUpdates.bio = details.bio.trim();

  if (Object.keys(profileUpdates).length > 0) {
    await appStorage.updateProfessionalProfile(userId, profileUpdates);
  }
}

export const createApplication = async (req: Request, res: Response) => {
  const userId = (req.session as { userId?: string })?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    await new Promise<void>((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { jobId, coverLetter, useProfileResume } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    const existingApplications = await appStorage.getApplicationsByJob(String(jobId)).catch(() => []);
    const alreadyApplied = existingApplications.some(
      (app) => String(app.applicantId) === String(userId)
    );
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    if (req.body.applicantDetails) {
      try {
        await syncApplicantDetails(userId, req.body.applicantDetails);
      } catch (err: any) {
        if (err?.code === '23505' || err?.cause?.code === '23505' || err?.message?.includes('users_email_unique')) {
          return res.status(400).json({ error: 'This email is already in use by another account.' });
        }
        console.warn('applicantDetails ignored:', err);
      }
    }

    let attachments =
      (req.files as Express.Multer.File[])?.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
      })) ?? [];

    const wantsProfileResume =
      useProfileResume === 'true' || useProfileResume === true;

    if (attachments.length === 0 && wantsProfileResume) {
      const profile = await appStorage.getProfessionalProfileByUserId(userId);
      const resumeUrl = profile?.resumeUrl;
      if (!resumeUrl?.trim()) {
        return res.status(400).json({
          error: 'Resume required',
          message: 'No profile resume on file. Upload a resume in your profile or attach one.',
        });
      }

      attachments = [
        {
          filename: 'resume.pdf',
          originalName: profile.resumeName || 'resume.pdf',
          path: resumeUrl,
          size: 0,
          mimeType: 'application/pdf',
        },
      ];
    }

    if (attachments.length === 0) {
      return res.status(400).json({
        error: 'Resume required',
        message: 'Attach a resume or use your saved profile resume.',
      });
    }

    const [application] = await db
      .insert(applications)
      .values({
        applicantId: userId,
        jobId: String(jobId),
        coverLetter: coverLetter || null,
        resume: JSON.stringify(attachments),
        status: 'review',
      })
      .returning();

    const job = await appStorage.getJob(String(jobId)).catch(() => null);
    await notifyApplicationSubmitted(appStorage, {
      applicantId: userId,
      applicationId: application.id,
      jobTitle: (job as { title?: string } | null)?.title,
    }).catch((err) => console.error('Submit notification failed:', err));

    // Phase 6: Background moderation scan (modifies status if high risk)
    setImmediate(async () => {
      try {
        const user = await appStorage.getUser(userId);
        const scanResult = await runModerationScan({
          entityType: "application",
          entityId: String(application.id),
          details: {
            coverLetter: coverLetter || "",
            applicantName: user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "Unknown Applicant",
          },
        });

        if (scanResult.riskLevel === "medium" || scanResult.riskLevel === "high") {
          // Explicitly separate status so Phase 4 stale-check ignores it
          await appStorage.updateApplication(String(application.id), { status: "moderation_hold" });
          console.warn(`[Moderation] Application ${application.id} flagged (${scanResult.riskLevel} risk). Status set to moderation_hold.`);
        }
      } catch (modError) {
        console.error(`[Moderation] Application ${application.id} scan error:`, modError);
      }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);



    res.status(500).json({
      error: 'Failed to submit application',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const getUserApplications = async (req: Request, res: Response) => {
  const userId = (req.session as { userId?: string })?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userApplications = await appStorage.getApplicationsWithDetailsByApplicant(userId);
    res.json(userApplications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};
