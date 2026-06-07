// useApplicationSubmit.ts
import { useState } from 'react';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';
import type { ApplyDetailsForm } from '@/lib/employee-resume';

interface ApplicationData {
  jobId: string;
  coverLetter?: string;
  attachments?: File[];
  useProfileResume?: boolean;
  applicantDetails?: ApplyDetailsForm;
}

export function useApplicationSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const submitApplication = async (data: ApplicationData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login or register to apply for jobs.",
        variant: "destructive",
      });
      return false;
    }

    const hasNewFiles = (data.attachments?.length ?? 0) > 0;
    const useProfileResume = Boolean(data.useProfileResume && !hasNewFiles);

    if (!hasNewFiles && !useProfileResume) {
      toast({
        title: "Resume required",
        description: "Attach a resume or use your saved profile resume.",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('jobId', data.jobId);

      if (data.coverLetter) {
        formData.append('coverLetter', data.coverLetter);
      }

      if (useProfileResume) {
        formData.append('useProfileResume', 'true');
      }

      if (data.applicantDetails) {
        formData.append('applicantDetails', JSON.stringify(data.applicantDetails));
      }

      if (data.attachments) {
        data.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      const response = await fetch('/api/applications/quick-apply', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        let message = 'Failed to submit application';
        try {
          const err = await response.json();
          message = err.message || err.error || message;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
        variant: "success",
      });

      return true;
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitApplication,
    isSubmitting,
  };
}
