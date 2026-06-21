/**
 * Profile Updater
 * Non-destructive profile updates based on parsed resume data
 * - Suggests what would change
 * - Merges skills instead of replacing
 * - Appends experience/education instead of replacing
 * - Flags conflicts for user review
 */

import { normalizeSkills, mergeSkills } from "./skill-normalizer.js";
import { z } from "zod";

// Type definitions for profile and parsed resume
export interface ParsedResumeMetadata {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: Array<{
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
  }>;
  education?: Array<{
    degree?: string;
    school?: string;
    year?: string;
    field?: string;
  }>;
}

export interface ProfessionalProfile {
  headline?: string | null;
  bio?: string | null;
  skills?: unknown;
  experience?: unknown;
  education?: unknown;
}

// Schema for profile update suggestions
export const updateSuggestionsSchema = z.object({
  newSkills: z.array(z.string()),
  removedSkills: z.array(z.string()),
  newExperience: z.array(
    z.object({
      title: z.string().optional(),
      company: z.string().optional(),
      duration: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  newEducation: z.array(
    z.object({
      degree: z.string().optional(),
      school: z.string().optional(),
      year: z.string().optional(),
      field: z.string().optional(),
    })
  ),
  suggestedHeadline: z.string().nullable(),
  suggestedBio: z.string().nullable(),
  conflicts: z.record(z.string()),
  missing: z.array(z.string()),
});

export type UpdateSuggestions = z.infer<typeof updateSuggestionsSchema>;

/**
 * Generate profile update suggestions without modifying the profile
 * @param existingProfile - Current professional profile
 * @param parsedResume - Parsed data from resume
 * @returns Suggestions object with what would change
 */
export function suggestProfileUpdates(
  existingProfile: ProfessionalProfile,
  parsedResume: ParsedResumeMetadata
): UpdateSuggestions {
  const conflicts: Record<string, string> = {};
  const missing: string[] = [];

  // Skills analysis
  const existingSkills = normalizeSkills(
    Array.isArray(existingProfile.skills) ? existingProfile.skills : []
  );
  const resumeSkills = normalizeSkills(parsedResume.skills || []);
  const newSkills = resumeSkills.filter((s) => !existingSkills.includes(s));
  const removedSkills: string[] = []; // We don't remove skills, only add

  if (resumeSkills.length === 0) {
    missing.push("skills");
  }

  // Experience analysis
  const existingExperience = Array.isArray(existingProfile.experience)
    ? (existingProfile.experience as object[])
    : [];
  const newExperience = (parsedResume.experience || []).filter(
    (exp) => exp.title || exp.company
  );

  if (newExperience.length === 0 && existingExperience.length === 0) {
    missing.push("experience");
  }

  // Education analysis
  const existingEducation = Array.isArray(existingProfile.education)
    ? (existingProfile.education as object[])
    : [];
  const newEducation = (parsedResume.education || []).filter(
    (edu) => edu.degree || edu.school
  );

  if (newEducation.length === 0 && existingEducation.length === 0) {
    missing.push("education");
  }

  // Headline generation and conflict detection
  let suggestedHeadline: string | null = null;
  if (parsedResume.name && parsedResume.email) {
    const titleGuess = (parsedResume.experience?.[0]?.title ||
      "Professional") as string;
    suggestedHeadline = titleGuess;

    if (
      existingProfile.headline &&
      existingProfile.headline.toLowerCase() !==
        suggestedHeadline.toLowerCase()
    ) {
      conflicts.headline = `Current: "${existingProfile.headline}" → Suggested: "${suggestedHeadline}"`;
    }
  }

  // Bio generation (simple heuristic)
  let suggestedBio: string | null = null;
  if (parsedResume.experience && parsedResume.experience.length > 0) {
    const yearsCount = parsedResume.experience.length;
    suggestedBio = `${yearsCount}+ years of professional experience`;

    if (existingProfile.bio && suggestedBio) {
      conflicts.bio = `Current: "${existingProfile.bio}" → Suggested: "${suggestedBio}"`;
    }
  }

  return {
    newSkills,
    removedSkills,
    newExperience,
    newEducation,
    suggestedHeadline,
    suggestedBio,
    conflicts,
    missing,
  };
}

/**
 * Apply user-selected updates to a profile
 * Non-destructive: merges skills, appends experience/education
 * @param existingProfile - Current professional profile
 * @param suggestions - Generated suggestions from suggestProfileUpdates
 * @param selectedUpdates - Which fields to actually apply
 * @returns Updated profile with before/after tracking
 */
export function applyProfileUpdates(
  existingProfile: ProfessionalProfile,
  suggestions: UpdateSuggestions,
  selectedUpdates: {
    skills?: boolean;
    headline?: boolean;
    bio?: boolean;
    experience?: boolean;
    education?: boolean;
  }
): {
  updatedProfile: Partial<ProfessionalProfile>;
  appliedUpdates: string[];
  skippedUpdates: string[];
  before: Record<string, unknown>;
  after: Record<string, unknown>;
} {
  const appliedUpdates: string[] = [];
  const skippedUpdates: string[] = [];
  const updatedProfile: Partial<ProfessionalProfile> = {};
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};

  // Skills: merge if selected
  if (selectedUpdates.skills && suggestions.newSkills.length > 0) {
    const merged = mergeSkills(existingProfile.skills, suggestions.newSkills);
    updatedProfile.skills = merged;
    before.skills = existingProfile.skills;
    after.skills = merged;
    appliedUpdates.push("skills");
  } else if (suggestions.newSkills.length > 0) {
    skippedUpdates.push("skills");
  }

  // Headline: replace if selected
  if (selectedUpdates.headline && suggestions.suggestedHeadline) {
    updatedProfile.headline = suggestions.suggestedHeadline;
    before.headline = existingProfile.headline;
    after.headline = suggestions.suggestedHeadline;
    appliedUpdates.push("headline");
  }

  // Bio: replace if selected
  if (selectedUpdates.bio && suggestions.suggestedBio) {
    updatedProfile.bio = suggestions.suggestedBio;
    before.bio = existingProfile.bio;
    after.bio = suggestions.suggestedBio;
    appliedUpdates.push("bio");
  }

  // Experience: append if selected
  if (selectedUpdates.experience && suggestions.newExperience.length > 0) {
    const existing = Array.isArray(existingProfile.experience)
      ? (existingProfile.experience as object[])
      : [];
    const merged = [...existing, ...suggestions.newExperience];
    updatedProfile.experience = merged;
    before.experience = existing;
    after.experience = merged;
    appliedUpdates.push("experience");
  } else if (suggestions.newExperience.length > 0) {
    skippedUpdates.push("experience");
  }

  // Education: append if selected
  if (selectedUpdates.education && suggestions.newEducation.length > 0) {
    const existing = Array.isArray(existingProfile.education)
      ? (existingProfile.education as object[])
      : [];
    const merged = [...existing, ...suggestions.newEducation];
    updatedProfile.education = merged;
    before.education = existing;
    after.education = merged;
    appliedUpdates.push("education");
  } else if (suggestions.newEducation.length > 0) {
    skippedUpdates.push("education");
  }

  return {
    updatedProfile,
    appliedUpdates,
    skippedUpdates,
    before,
    after,
  };
}
