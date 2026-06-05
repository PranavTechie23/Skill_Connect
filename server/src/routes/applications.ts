import { Request, Response } from 'express';
import { db } from '../db';
import { applications } from '../../../shared/schema';
import { storage as appStorage } from '../storage';
import { notifyApplicationSubmitted } from '../lib/activity-notifications';
import { z } from 'zod';

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
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
      } catch (parseErr) {
        console.warn('applicantDetails ignored:', parseErr);
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

      const basename = path.basename(resumeUrl.replace(/\\/g, '/'));
      attachments = [
        {
          filename: basename,
          originalName: profile.resumeName || basename,
          path: path.join(process.cwd(), 'uploads', basename),
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

    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);

    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
      await Promise.all(
        files.map((file) => {
          const f = file as Express.Multer.File;
          return fs.unlink(f.path).catch((err) =>
            console.error(`Failed to delete file ${f.path}:`, err)
          );
        })
      );
    }

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
