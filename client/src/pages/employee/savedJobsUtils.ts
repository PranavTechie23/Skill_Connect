// savedJobsUtils.ts

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

export const savedJobsUtils = {
  getSavedJobs: (): Job[] => {
    try {
      const saved = localStorage.getItem('savedJobs');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      return [];
    }
  },

  saveJob: (job: Job): void => {
    try {
      const savedJobs = savedJobsUtils.getSavedJobs();
      
      if (!savedJobs.find((savedJob: Job) => savedJob.id === job.id)) {
        savedJobs.push(job);
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
        window.dispatchEvent(new Event('savedJobsUpdated'));
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  },

  removeSavedJob: (jobId: string): void => {
    try {
      const savedJobs = savedJobsUtils.getSavedJobs();
      const updatedJobs = savedJobs.filter((job: Job) => job.id !== jobId);
      
      localStorage.setItem('savedJobs', JSON.stringify(updatedJobs));
      window.dispatchEvent(new Event('savedJobsUpdated'));
    } catch (error) {
      console.error('Error removing saved job:', error);
    }
  },

  isJobSaved: (jobId: string): boolean => {
    try {
      const savedJobs = savedJobsUtils.getSavedJobs();
      return savedJobs.some((job: Job) => job.id === jobId);
    } catch (error) {
      console.error('Error checking saved job:', error);
      return false;
    }
  },

  clearAllSavedJobs: (): void => {
    try {
      localStorage.setItem('savedJobs', JSON.stringify([]));
      window.dispatchEvent(new Event('savedJobsUpdated'));
    } catch (error) {
      console.error('Error clearing saved jobs:', error);
    }
  }
};