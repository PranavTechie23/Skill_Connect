/**
 * Job Matcher
 * Rule-based matching algorithm for job recommendations
 * Weights: Skills 40%, Location 20%, Salary 20%, Experience 20%
 * Returns match score 0-100 with breakdown and missing skills
 */

export interface UserProfile {
  location: string | null;
  skills: string[];
  experience: Array<{ title?: string; company?: string; startDate?: Date; endDate?: Date; isCurrent?: boolean }>;
}

export interface JobData {
  id: string;
  title: string;
  location: string;
  skills: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
}

export interface MatchResult {
  skillsScore: number;
  locationScore: number;
  salaryScore: number;
  experienceScore: number;
  overallScore: number;
  explanation: string;
  missingSkills: string[];
}

/**
 * Calculate years of experience from experience array
 * Simple heuristic: count number of jobs + assume ~2 years per job
 */
function inferYearsOfExperience(experience: UserProfile["experience"]): number {
  if (!experience || experience.length === 0) {
    return 0;
  }

  // Simple heuristic: 1-2 years per position
  const baseYears = experience.length * 1.5;

  // Check if has current role
  const hasCurrent = experience.some((e) => e.isCurrent);

  return Math.round(baseYears + (hasCurrent ? 0.5 : 0));
}

/**
 * Match skills: overlapping_skills / required_skills
 * Score: 1.0 (100%) if all match, decreases with missing skills
 * Bonus for extra relevant skills
 */
export function calculateSkillsMatch(
  jobSkills: string[],
  userSkills: string[]
): { score: number; missingSkills: string[] } {
  if (!jobSkills || jobSkills.length === 0) {
    return { score: 1.0, missingSkills: [] };
  }

  if (!userSkills || userSkills.length === 0) {
    return { score: 0.0, missingSkills: jobSkills };
  }

  // Normalize for comparison (lowercase)
  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase());
  const normalizedJobSkills = jobSkills.map((s) => s.toLowerCase());

  // Count matches
  const matchingSkills = normalizedJobSkills.filter((skill) => normalizedUserSkills.includes(skill));
  const missingSkills = jobSkills.filter(
    (skill, index) => !normalizedUserSkills.includes(normalizedJobSkills[index])
  );

  // Base score
  let score = matchingSkills.length / normalizedJobSkills.length;

  // Penalty for missing skills
  if (normalizedJobSkills.length > 0) {
    const missingCount = normalizedJobSkills.length - matchingSkills.length;
    if (missingCount === 1 || missingCount === 2) {
      score = Math.max(score, 0.7); // 70% if missing 1-2 skills
    } else if (missingCount >= 3) {
      score = Math.max(score, 0.3); // 30% if missing 3+ skills
    }
  }

  // Bonus for extra skills (up to +0.1)
  const extraSkills = userSkills.length - matchingSkills.length;
  if (extraSkills > 0) {
    score = Math.min(score + 0.05, 1.0);
  }

  return { score, missingSkills };
}

/**
 * Match location
 * Score: 1.0 exact match, 0.9 same region, 0.7 same country, 0.2 far away, 1.0 if remote
 */
export function calculateLocationMatch(jobLocation: string, userLocation: string | null): number {
  if (!userLocation || !jobLocation) {
    return 0.5; // Neutral if missing data
  }

  const normalizedJobLoc = jobLocation.toLowerCase();
  const normalizedUserLoc = userLocation.toLowerCase();

  // Remote is always perfect for user location
  if (normalizedJobLoc === "remote" || normalizedJobLoc.includes("remote")) {
    return 1.0;
  }

  // Exact match
  if (normalizedJobLoc === normalizedUserLoc) {
    return 1.0;
  }

  // Extract city/region from "City, State/Country" format
  const jobParts = normalizedJobLoc.split(",").map((s) => s.trim());
  const userParts = normalizedUserLoc.split(",").map((s) => s.trim());

  // Same city
  if (jobParts[0] === userParts[0]) {
    return 0.9;
  }

  // Same state/country (last part)
  if (jobParts[jobParts.length - 1] === userParts[userParts.length - 1]) {
    return 0.7;
  }

  // Different country/region
  return 0.2;
}

/**
 * Match salary expectations
 * Score: 1.0 if within range, 0.8 if 5% below, 0.6 if 10% below, 0.3 if 20% below, 0 if way below
 * Assumes user's "expected" salary is mid-range of industry (we don't have this, so we're lenient)
 */
export function calculateSalaryMatch(
  salaryMin: number | null | undefined,
  salaryMax: number | null | undefined
): number {
  // If no salary posted, neutral
  if (!salaryMin && !salaryMax) {
    return 0.5;
  }

  // Only min posted
  if (salaryMin && !salaryMax) {
    // Assume user expects ~1.3x the minimum as mid-point
    // If it's reasonable, score well
    if (salaryMin >= 40000) {
      // Reasonable salary
      return 0.85;
    } else {
      // Low salary
      return 0.5;
    }
  }

  // Both posted - check midpoint
  if (salaryMin && salaryMax) {
    const midpoint = (salaryMin + salaryMax) / 2;

    // Reasonable range (40k-200k in various tech/skill sectors)
    if (midpoint >= 40000 && midpoint <= 200000) {
      return 0.9;
    } else if (midpoint >= 20000) {
      return 0.6;
    } else {
      return 0.3;
    }
  }

  return 0.5;
}

/**
 * Match experience level
 * Score based on job level (inferred from title) vs user's years
 */
export function calculateExperienceMatch(
  jobTitle: string,
  userExperienceYears: number
): number {
  const title = jobTitle.toLowerCase();

  // Detect job level from title
  const isSenior =
    title.includes("senior") ||
    title.includes("lead") ||
    title.includes("principal") ||
    title.includes("architect");
  const isJunior =
    title.includes("junior") ||
    title.includes("entry") ||
    title.includes("graduate") ||
    title.includes("trainee");
  const isMid = !isSenior && !isJunior;

  // Match logic
  if (isSenior) {
    // Senior roles need 5+ years
    if (userExperienceYears >= 5) return 1.0;
    if (userExperienceYears >= 3) return 0.7;
    if (userExperienceYears >= 1) return 0.4;
    return 0.2;
  }

  if (isJunior) {
    // Junior roles: any experience is OK, fresh grads also OK
    if (userExperienceYears <= 2) return 0.9;
    if (userExperienceYears <= 5) return 1.0;
    if (userExperienceYears > 5) return 0.7; // Over-qualified, might leave
    return 0.8;
  }

  // Mid-level roles: 3-5 years is ideal
  if (userExperienceYears >= 3 && userExperienceYears <= 5) return 1.0;
  if (userExperienceYears >= 1 && userExperienceYears < 3) return 0.8;
  if (userExperienceYears > 5) return 0.9;
  return 0.5; // Less than 1 year experience
}

/**
 * Calculate overall match score (0-100)
 * Weights: Skills 40%, Location 20%, Salary 20%, Experience 20%
 */
export function calculateOverallMatch(
  skillsScore: number,
  locationScore: number,
  salaryScore: number,
  experienceScore: number
): number {
  const weighted =
    skillsScore * 0.4 + locationScore * 0.2 + salaryScore * 0.2 + experienceScore * 0.2;
  return Math.round(weighted * 100);
}

/**
 * Main function: Match job to user profile
 */
export function matchJobToProfile(job: JobData, userProfile: UserProfile): MatchResult {
  // Calculate individual scores
  const skillsMatch = calculateSkillsMatch(job.skills || [], userProfile.skills || []);
  const locationScore = calculateLocationMatch(job.location, userProfile.location);
  const salaryScore = calculateSalaryMatch(job.salaryMin, job.salaryMax);
  const userYears = inferYearsOfExperience(userProfile.experience);
  const experienceScore = calculateExperienceMatch(job.title, userYears);

  // Calculate overall
  const overallScore = calculateOverallMatch(
    skillsMatch.score,
    locationScore,
    salaryScore,
    experienceScore
  );

  // Generate explanation
  const explanation = generateExplanation(
    job.title,
    skillsMatch.score,
    locationScore,
    salaryScore,
    experienceScore,
    skillsMatch.missingSkills,
    userProfile.skills || []
  );

  return {
    skillsScore: Math.round(skillsMatch.score * 100),
    locationScore: Math.round(locationScore * 100),
    salaryScore: Math.round(salaryScore * 100),
    experienceScore: Math.round(experienceScore * 100),
    overallScore,
    explanation,
    missingSkills: skillsMatch.missingSkills,
  };
}

/**
 * Helper: Generate human-readable explanation
 */
function generateExplanation(
  jobTitle: string,
  skillsScore: number,
  locationScore: number,
  salaryScore: number,
  experienceScore: number,
  missingSkills: string[],
  userSkills: string[]
): string {
  const parts: string[] = [];

  if (skillsScore >= 0.8) {
    parts.push(`You have most skills for this ${jobTitle} role`);
  } else if (skillsScore >= 0.6) {
    parts.push(`You have some relevant skills for this ${jobTitle} role`);
  } else {
    parts.push(`You have limited skills overlap for this ${jobTitle} role`);
  }

  if (locationScore >= 0.9) {
    parts.push("Location is a great fit");
  } else if (locationScore >= 0.7) {
    parts.push("Location is acceptable");
  }

  if (experienceScore >= 0.8) {
    parts.push("Your experience level matches well");
  }

  if (missingSkills.length > 0 && missingSkills.length <= 2) {
    parts.push(`Consider learning: ${missingSkills.join(", ")}`);
  } else if (missingSkills.length > 2) {
    parts.push(`You're missing ${missingSkills.length} key skills`);
  }

  return parts.join(". ") + ".";
}
