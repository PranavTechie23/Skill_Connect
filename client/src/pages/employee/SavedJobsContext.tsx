import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Job, savedJobsUtils } from './savedJobsUtils';

interface SavedJobsContextType {
  savedJobs: Job[];
  saveJob: (job: Job) => void;
  removeSavedJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
  clearAllSavedJobs: () => void;
  getSavedJobsCount: () => number;
  getCompaniesCount: () => number;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);

export const useSavedJobs = () => {
  const context = useContext(SavedJobsContext);
  if (context === undefined) {
    throw new Error('useSavedJobs must be used within a SavedJobsProvider');
  }
  return context;
};

interface SavedJobsProviderProps {
  children: ReactNode;
}

export const SavedJobsProvider: React.FC<SavedJobsProviderProps> = ({ children }) => {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  // Load saved jobs from localStorage on component mount
  useEffect(() => {
    const loadSavedJobs = () => {
      const jobs = savedJobsUtils.getSavedJobs();
      setSavedJobs(jobs);
    };

    loadSavedJobs();

    // Listen for storage events to sync across tabs and components
    const handleStorageUpdate = () => {
      loadSavedJobs();
    };

    window.addEventListener('savedJobsUpdated', handleStorageUpdate);
    return () => window.removeEventListener('savedJobsUpdated', handleStorageUpdate);
  }, []);

  const saveJob = (job: Job) => {
    savedJobsUtils.saveJob(job);
    // The state will update automatically due to the event listener
  };

  const removeSavedJob = (jobId: string) => {
    savedJobsUtils.removeSavedJob(jobId);
    // The state will update automatically due to the event listener
  };

  const isJobSaved = (jobId: string) => {
    return savedJobsUtils.isJobSaved(jobId);
  };

  const clearAllSavedJobs = () => {
    savedJobsUtils.clearAllSavedJobs();
    // The state will update automatically due to the event listener
  };

  const getSavedJobsCount = () => {
    return savedJobs.length;
  };

  const getCompaniesCount = () => {
    const companies = new Set(savedJobs.map(job => job.company));
    return companies.size;
  };

  const value: SavedJobsContextType = {
    savedJobs,
    saveJob,
    removeSavedJob,
    isJobSaved,
    clearAllSavedJobs,
    getSavedJobsCount,
    getCompaniesCount
  };

  return (
    <SavedJobsContext.Provider value={value}>
      {children}
    </SavedJobsContext.Provider>
  );
};

// Export the Job type for use in other components
export type { Job };