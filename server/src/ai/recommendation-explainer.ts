/**
 * Recommendation Explainer
 * Generates human-readable explanations and suggested actions for job recommendations
 */

export interface MatchBreakdown {
  skillsScore: number;
  locationScore: number;
  salaryScore: number;
  experienceScore: number;
  overallScore: number;
}

/**
 * Generate human-readable explanation of why a job is recommended
 */
export function generateMatchExplanation(
  jobTitle: string,
  matchBreakdown: MatchBreakdown,
  missingSkills: string[]
): string {
  const score = matchBreakdown.overallScore;
  const parts: string[] = [];

  // Opening line
  if (score >= 90) {
    parts.push(`Excellent match for ${jobTitle}!`);
  } else if (score >= 80) {
    parts.push(`Great match for ${jobTitle}!`);
  } else if (score >= 70) {
    parts.push(`Good match for ${jobTitle}`);
  } else if (score >= 60) {
    parts.push(`Reasonable match for ${jobTitle}`);
  } else {
    parts.push(`Possible fit for ${jobTitle}`);
  }

  // Detailed breakdown
  const details: string[] = [];

  if (matchBreakdown.skillsScore >= 80) {
    details.push("✓ Skills: strong alignment");
  } else if (matchBreakdown.skillsScore >= 60) {
    details.push("✓ Skills: partial match");
  } else {
    details.push(`✗ Skills: only ${matchBreakdown.skillsScore}% match`);
  }

  if (matchBreakdown.locationScore >= 80) {
    details.push("✓ Location: perfect fit");
  } else if (matchBreakdown.locationScore >= 50) {
    details.push("~ Location: acceptable");
  } else {
    details.push("✗ Location: may require relocation");
  }

  if (matchBreakdown.experienceScore >= 80) {
    details.push("✓ Experience: right level");
  } else if (matchBreakdown.experienceScore >= 50) {
    details.push("~ Experience: somewhat aligned");
  } else {
    details.push("✗ Experience: may be under-qualified");
  }

  if (details.length > 0) {
    parts.push(details.join(", "));
  }

  // Missing skills advice
  if (missingSkills.length > 0) {
    if (missingSkills.length === 1) {
      parts.push(`Missing skill: ${missingSkills[0]}.`);
    } else if (missingSkills.length <= 3) {
      parts.push(`Missing skills: ${missingSkills.join(", ")}.`);
    } else {
      parts.push(`Missing ${missingSkills.length} skills: ${missingSkills.slice(0, 2).join(", ")} and ${missingSkills.length - 2} more.`);
    }
  }

  return parts.join(" ");
}

/**
 * Generate suggested action based on match score
 */
export function generateSuggestedAction(
  overallScore: number,
  hasAllSkills: boolean,
  missingSkills: string[],
  isRemote: boolean,
  userLocation: string | null
): string {
  if (overallScore >= 85) {
    return "✨ Strong fit! Apply immediately to showcase your qualifications.";
  }

  if (overallScore >= 75) {
    if (missingSkills.length > 0) {
      return `Good fit! Apply now, and consider learning ${missingSkills[0]} to strengthen future applications.`;
    }
    return "Good fit! Apply now to increase your chances.";
  }

  if (overallScore >= 65) {
    if (missingSkills.length > 2) {
      return `You match the basics. Consider gaining experience in ${missingSkills[0]} before applying.`;
    }
    return "Reasonable fit. Apply if interested — relevant experience matters.";
  }

  if (overallScore >= 50) {
    if (!hasAllSkills) {
      return `Learn ${missingSkills.slice(0, 2).join(" and ")} to become a stronger candidate for similar roles.`;
    }
    if (!isRemote && !userLocation) {
      return "Could work if location flexibility is OK. Reach out to clarify remote options.";
    }
    return "Stretch opportunity — apply if you're eager to learn.";
  }

  return "Not a strong fit currently. Focus on skill development for better matches.";
}

/**
 * Generate summary of recommendations (for metadata)
 */
export interface RecommendationsSummary {
  totalCount: number;
  matchingCount: number;
  averageScore: number;
  topCategoryScores: {
    skills: number;
    location: number;
    salary: number;
    experience: number;
  };
}

export function calculateSummaryStats(
  allMatches: Array<{ overallScore: number; skillsScore: number; locationScore: number; salaryScore: number; experienceScore: number }>
): {
  averageScore: number;
  topCategoryScores: RecommendationsSummary["topCategoryScores"];
} {
  if (allMatches.length === 0) {
    return {
      averageScore: 0,
      topCategoryScores: { skills: 0, location: 0, salary: 0, experience: 0 },
    };
  }

  const averageScore = Math.round(
    allMatches.reduce((sum, m) => sum + m.overallScore, 0) / allMatches.length
  );

  const avgSkills = Math.round(allMatches.reduce((sum, m) => sum + m.skillsScore, 0) / allMatches.length);
  const avgLocation = Math.round(allMatches.reduce((sum, m) => sum + m.locationScore, 0) / allMatches.length);
  const avgSalary = Math.round(allMatches.reduce((sum, m) => sum + m.salaryScore, 0) / allMatches.length);
  const avgExperience = Math.round(allMatches.reduce((sum, m) => sum + m.experienceScore, 0) / allMatches.length);

  return {
    averageScore,
    topCategoryScores: {
      skills: avgSkills,
      location: avgLocation,
      salary: avgSalary,
      experience: avgExperience,
    },
  };
}
