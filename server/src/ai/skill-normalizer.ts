/**
 * Skill Normalizer
 * Standardizes extracted skills from resumes
 * - Lowercase all skills
 * - Deduplicate
 * - Remove empty/whitespace-only entries
 * - Sort alphabetically for consistency
 */

export function normalizeSkills(skills: unknown[]): string[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  return (
    skills
      .map((skill) => {
        if (typeof skill !== "string") return "";
        return skill.trim().toLowerCase();
      })
      .filter((skill) => skill.length > 0)
      // Remove duplicates using Set
      .filter((skill, index, self) => self.indexOf(skill) === index)
      // Sort for consistency
      .sort()
  );
}

/**
 * Merge two skill arrays non-destructively
 * Returns union of both arrays (old + new), deduplicated and sorted
 */
export function mergeSkills(
  existingSkills: unknown,
  newSkills: unknown[]
): string[] {
  const normalized = normalizeSkills(newSkills);
  const existing = normalizeSkills(existingSkills as unknown[]);

  // Union: combine both, deduplicate, sort
  const merged = [...existing, ...normalized];
  return merged
    .filter((skill, index) => merged.indexOf(skill) === index)
    .sort();
}
