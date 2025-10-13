import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the Job interface
interface Job {
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

// Define the context value type
interface SavedJobsContextType {
  savedJobs: Job[];
  addJob: (job: Job) => void;
  removeJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
  clearAllJobs: () => void;
}

// Create the context
const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);

// localStorage utility functions
const savedJobsUtils = {
  getSavedJobs: (): Job[] => {
    try {
      const saved = localStorage.getItem('savedJobs');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      return [];
    }
  },

  setSavedJobs: (jobs: Job[]): void => {
    try {
      localStorage.setItem('savedJobs', JSON.stringify(jobs));
      window.dispatchEvent(new Event('savedJobsUpdated'));
    } catch (error) {
      console.error('Error saving jobs:', error);
    }
  }
};

// Create the provider component
export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  // Load saved jobs from localStorage on mount
  useEffect(() => {
    const jobs = savedJobsUtils.getSavedJobs();
    setSavedJobs(jobs);

    // Listen for storage events to sync across tabs
    const handleStorageChange = () => {
      const jobs = savedJobsUtils.getSavedJobs();
      setSavedJobs(jobs);
    };

    window.addEventListener('savedJobsUpdated', handleStorageChange);
    return () => window.removeEventListener('savedJobsUpdated', handleStorageChange);
  }, []);

  // Add a job to saved jobs
  const addJob = (job: Job) => {
    if (!isJobSaved(job.id)) {
      const newJobs = [...savedJobs, job];
      setSavedJobs(newJobs);
      savedJobsUtils.setSavedJobs(newJobs);
    }
  };

  // Remove a job from saved jobs
  const removeJob = (jobId: string) => {
    const newJobs = savedJobs.filter(job => job.id !== jobId);
    setSavedJobs(newJobs);
    savedJobsUtils.setSavedJobs(newJobs);
  };

  // Check if a job is saved
  const isJobSaved = (jobId: string) => {
    return savedJobs.some(job => job.id === jobId);
  };

  // Clear all saved jobs
  const clearAllJobs = () => {
    setSavedJobs([]);
    savedJobsUtils.setSavedJobs([]);
  };

  return (
    <SavedJobsContext.Provider 
      value={{
        savedJobs,
        addJob,
        removeJob,
        isJobSaved,
        clearAllJobs
      }}
    >
      {children}
    </SavedJobsContext.Provider>
  );
}

// Create a custom hook to use the saved jobs context
export function useSavedJobs() {
  const context = useContext(SavedJobsContext);
  if (context === undefined) {
    throw new Error('useSavedJobs must be used within a SavedJobsProvider');
  }
  return context;
}