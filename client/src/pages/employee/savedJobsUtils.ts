// Shared saved-jobs persistence (localStorage) — single source of truth for badge + Saved Jobs page.

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  postedTime: string;
  applicants: number;
  matchPercentage: number;
  skills: string[];
  isNew: boolean;
  isFeatured?: boolean;
  isRemote?: boolean;
}

const STORAGE_KEY = 'savedJobs';

/** Normalize legacy or partial entries so list + badge stay in sync. */
export function normalizeSavedJobs(raw: unknown): Job[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const jobs: Job[] = [];

  for (const entry of raw) {
    const job = normalizeSavedJobEntry(entry);
    if (!job || seen.has(job.id)) continue;
    seen.add(job.id);
    jobs.push(job);
  }

  return jobs;
}

function normalizeSavedJobEntry(entry: unknown): Job | null {
  if (typeof entry === 'string') {
    const id = entry.trim();
    if (!id) return null;
    return placeholderJob(id);
  }

  if (!entry || typeof entry !== 'object') return null;

  const o = entry as Record<string, unknown>;
  const id = String(o.id ?? o.jobId ?? '').trim();
  if (!id) return null;

  const skills = Array.isArray(o.skills) ? o.skills.map((s) => String(s)) : [];

  return {
    id,
    title: String(o.title ?? 'Saved position'),
    company: String(o.company ?? 'Unknown Company'),
    location: String(o.location ?? 'Location not specified'),
    type: String(o.type ?? o.jobType ?? 'Role'),
    salary: String(o.salary ?? 'Competitive'),
    postedTime: String(o.postedTime ?? o.createdAt ?? 'Recently'),
    applicants: Number(o.applicants ?? o.applicationsCount ?? 0) || 0,
    matchPercentage: Number(o.matchPercentage) || 0,
    skills,
    isNew: Boolean(o.isNew),
    isFeatured: o.isFeatured != null ? Boolean(o.isFeatured) : undefined,
    isRemote: o.isRemote != null ? Boolean(o.isRemote) : undefined,
  };
}

function placeholderJob(id: string): Job {
  return {
    id,
    title: 'Saved position',
    company: 'Unknown Company',
    location: '—',
    type: '—',
    salary: '—',
    postedTime: 'Recently',
    applicants: 0,
    matchPercentage: 0,
    skills: [],
    isNew: false,
  };
}

function persistJobs(jobs: Job[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  window.dispatchEvent(new Event('savedJobsUpdated'));
}

export const savedJobsUtils = {
  getSavedJobs: (): Job[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      return normalizeSavedJobs(JSON.parse(saved));
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      return [];
    }
  },

  getSavedJobsCount: (): number => savedJobsUtils.getSavedJobs().length,

  saveJob: (job: Job): void => {
    try {
      const savedJobs = savedJobsUtils.getSavedJobs();
      const id = String(job.id);
      if (!savedJobs.find((savedJob) => savedJob.id === id)) {
        savedJobs.push({ ...job, id });
        persistJobs(savedJobs);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  },

  removeSavedJob: (jobId: string): void => {
    try {
      const id = String(jobId);
      const updatedJobs = savedJobsUtils.getSavedJobs().filter((job) => job.id !== id);
      persistJobs(updatedJobs);
    } catch (error) {
      console.error('Error removing saved job:', error);
    }
  },

  isJobSaved: (jobId: string): boolean => {
    try {
      const id = String(jobId);
      return savedJobsUtils.getSavedJobs().some((job) => job.id === id);
    } catch (error) {
      console.error('Error checking saved job:', error);
      return false;
    }
  },

  clearAllSavedJobs: (): void => {
    try {
      persistJobs([]);
    } catch (error) {
      console.error('Error clearing saved jobs:', error);
    }
  },

  setSavedJobs: (jobs: Job[]): void => {
    try {
      persistJobs(normalizeSavedJobs(jobs));
    } catch (error) {
      console.error('Error setting saved jobs:', error);
    }
  },
};
