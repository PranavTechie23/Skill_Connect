/** Normalize UI job-type labels to API/DB values (e.g. "Full-time" → "full-time"). */
export function normalizeJobTypeFilter(value: string): string {
  return value.trim().toLowerCase();
}

export function hasActiveJobFilters(filters: {
  location?: string;
  skills?: string[];
  jobType?: string;
  search?: string;
}): boolean {
  return Boolean(
    filters.search?.trim() ||
      filters.location?.trim() ||
      filters.jobType?.trim() ||
      (filters.skills?.length ?? 0) > 0
  );
}
