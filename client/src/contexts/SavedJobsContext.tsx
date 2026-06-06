import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Job, savedJobsUtils } from '@/pages/employee/savedJobsUtils';

interface SavedJobsContextType {
  savedJobs: Job[];
  addJob: (job: Job) => void;
  removeJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
  clearAllJobs: () => void;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);

export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  const syncFromStorage = useCallback(() => {
    setSavedJobs(savedJobsUtils.getSavedJobs());
  }, []);

  useEffect(() => {
    syncFromStorage();

    const handleUpdate = () => syncFromStorage();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'savedJobs') syncFromStorage();
    };

    window.addEventListener('savedJobsUpdated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('savedJobsUpdated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [syncFromStorage]);

  const addJob = useCallback((job: Job) => {
    savedJobsUtils.saveJob({ ...job, id: String(job.id) });
    syncFromStorage();
  }, [syncFromStorage]);

  const removeJob = useCallback((jobId: string) => {
    savedJobsUtils.removeSavedJob(jobId);
    syncFromStorage();
  }, [syncFromStorage]);

  const isJobSaved = useCallback((jobId: string) => {
    return savedJobsUtils.isJobSaved(jobId);
  }, []);

  const clearAllJobs = useCallback(() => {
    savedJobsUtils.clearAllSavedJobs();
    syncFromStorage();
  }, [syncFromStorage]);

  return (
    <SavedJobsContext.Provider
      value={{
        savedJobs,
        addJob,
        removeJob,
        isJobSaved,
        clearAllJobs,
      }}
    >
      {children}
    </SavedJobsContext.Provider>
  );
}

export function useSavedJobs() {
  const context = useContext(SavedJobsContext);
  if (context === undefined) {
    throw new Error('useSavedJobs must be used within a SavedJobsProvider');
  }
  return context;
}

export type { Job };
