// useApplicationSubmit.ts
import { useState } from 'react';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';

interface ApplicationData {
  jobId: string;
  coverLetter?: string;
  attachments?: File[];
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
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('jobId', data.jobId);
      
      if (data.coverLetter) {
        formData.append('coverLetter', data.coverLetter);
      }
      
      if (data.attachments) {
        data.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const response = await fetch('/api/applications/quick-apply', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
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
        description: "Failed to submit your application. Please try again.",
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