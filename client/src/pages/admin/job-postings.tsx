import React, { useState, useEffect } from 'react';
import AdminBackButton, { useAdminEmbedded } from '@/components/AdminBackButton';
import {
  Briefcase, Search, Plus, Edit, Trash2, MoreVertical, MapPin, Building2, Users, CheckCircle, XCircle, Pause, Play, Save, TrendingUp, Eye, PauseCircle, AlertTriangle, DollarSign, Calendar, Clock
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { adminService } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import { apiFetch } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  adminFormDialogBodyScrollClass,
  adminFormDialogContentClass,
  adminFormDialogFooterClass,
  adminFormDialogHeaderClass,
  adminFormModalHeaderGradientClass,
  adminFormModalIconWrapClass,
  adminFormModalSectionClass,
  adminFormModalSubtitleClass,
  adminFormModalTitleClass,
  adminFormDialogFieldClass,
  adminFormDialogTextareaClass,
  adminFormLabelClass,
} from '@/components/admin/admin-form-modal-styles';

interface CompanyForSelect {
  id: string;
  name: string;
}

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description?: string;
  requirements?: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  status: 'Active' | 'Paused' | 'Expired' | 'Pending' | 'Closed';
  applications: number;
  createdAt: string;
  companyId?: string;
  deadline?: string;
  isActive?: boolean;
}

function normalizeAdminJobStatus(status: string | undefined, isActive: boolean, deadline?: string | null): Job['status'] {
  if (status && status.toLowerCase() !== 'active') {
    return (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) as Job['status'];
  }
  if (!isActive) return 'Closed';
  if (deadline && new Date(deadline).getTime() < new Date().getTime()) {
    return 'Expired';
  }
  return 'Active';
}

function formatJobSalaryRange(min?: number, max?: number): string {
  if (min != null && max != null) {
    return `$${Math.round(min / 1000)}k–$${Math.round(max / 1000)}k`;
  }
  if (min != null) return `from $${min.toLocaleString()}`;
  if (max != null) return `up to $${max.toLocaleString()}`;
  return 'N/A';
}

function formatJobPostedDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type JobPostingsProps = {
  quickActionIntent?: string | null;
  onQuickActionConsumed?: () => void;
};

export default function JobPostings({ quickActionIntent = null, onQuickActionConsumed }: JobPostingsProps = {}) {
  const { embedded } = useAdminEmbedded();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterJobType, setFilterJobType] = useState('All Types');
  const [filterCompany, setFilterCompany] = useState('All Companies');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyForSelect[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [actionMenuJobId, setActionMenuJobId] = useState<number | null>(null);
  const [actionLoadingJobId, setActionLoadingJobId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    jobType: 'Full-time',
    salaryMin: '',
    salaryMax: '',
    companyId: '',
    deadline: '',
  });
  const [editJobForm, setEditJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    jobType: 'Full-time',
    salaryMin: '',
    salaryMax: '',
    deadline: '',
    status: 'Pending' as 'Active' | 'Paused' | 'Expired' | 'Pending' | 'Closed',
  });
  
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewJob(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewJob(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditJobForm(prev => ({ ...prev, [id]: value }));
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setEditJobForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePostJob = async () => {
    setFormLoading(true);
    setFormError(null);

    if (!newJob.title || !newJob.companyId) {
      setFormError('Job Title and Company are required.');
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        ...newJob,
        employerId: user?.id,
        salaryMin: newJob.salaryMin ? parseInt(newJob.salaryMin, 10) : undefined,
        salaryMax: newJob.salaryMax ? parseInt(newJob.salaryMax, 10) : undefined,
        deadline: newJob.deadline ? new Date(newJob.deadline).toISOString() : undefined,
      };

      const response = await apiFetch('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post job.');
      }

      toast({ title: "Success", description: "Job posted successfully." });
      setIsModalOpen(false);
      setNewJob({ title: '', description: '', requirements: '', location: '', jobType: 'Full-time', salaryMin: '', salaryMax: '', companyId: '', deadline: '' });
      fetchJobs(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setFormError(errorMessage);
      toast({ title: "Error", description: `Failed to post job: ${errorMessage}`, variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getJobs();
      // Assuming getJobs returns jobs posted by admin or has a way to filter them
      // For now, we'll map the response to the local Job interface
      const adminJobs = data.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company?.name || 'Admin Posted',
        description: job.description || '',
        requirements: job.requirements || '',
        location: job.location,
        jobType: job.jobType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax, // Corrected from salaryMax
        status: normalizeAdminJobStatus(job.status, job.isActive ?? true, job.deadline),
        applications: job.applicationsCount || 0,
        createdAt: job.createdAt,
        companyId: job.companyId ? String(job.companyId) : undefined,
        deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : undefined,
        isActive: job.isActive,
      }));
      setJobs(adminJobs);
    } catch (error: any) {
      console.error("Failed to fetch jobs:", error);
      if (!error?.message?.includes("401")) {
        toast({ title: "Error", description: "Could not fetch job data.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const fetchCompaniesForSelect = async () => {
      try {
        const companiesData = await adminService.getCompanies();
        setCompanies(companiesData.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (error: any) {
        console.error("Failed to fetch companies for select:", error);
        if (!error?.message?.includes("401")) {
          toast({ title: "Error", description: "Could not load companies for the form.", variant: "destructive" });
        }
      }
    };
    fetchCompaniesForSelect();
  }, []);

  useEffect(() => {
    if (quickActionIntent !== 'post-job') return;
    setIsModalOpen(true);
    onQuickActionConsumed?.();
  }, [quickActionIntent, onQuickActionConsumed]);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-job-action-menu]') && !target.closest('[data-job-action-trigger]')) {
        setActionMenuJobId(null);
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All Status' || job.status === filterStatus;
    const matchesJobType = filterJobType === 'All Types' || job.jobType === filterJobType;
    const matchesCompany = filterCompany === 'All Companies' || job.company === filterCompany;
    return matchesSearch && matchesStatus && matchesJobType && matchesCompany;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterJobType, filterCompany]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollDashboardToTop();
  };

  const uniqueCompanies = Array.from(new Set(jobs.map(j => j.company))).filter(Boolean).sort();
  const uniqueJobTypes = Array.from(new Set(jobs.map(j => j.jobType))).filter(Boolean).sort();

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.status === 'Active').length;
  const totalApplications = jobs.reduce((sum, job) => sum + job.applications, 0);
  const avgApplications = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : '0.0';

  const openEditModal = (job: Job) => {
    setJobToEdit(job);
    setEditJobForm({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      location: job.location || '',
      jobType: job.jobType || 'Full-time',
      salaryMin: job.salaryMin ? String(job.salaryMin) : '',
      salaryMax: job.salaryMax ? String(job.salaryMax) : '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
      status: job.status || 'Pending',
    });
  };

  const handleSaveJobEdit = async () => {
    if (!jobToEdit) return;
    if (!editJobForm.title.trim()) {
      toast({ title: 'Validation', description: 'Job title is required.', variant: 'destructive' });
      return;
    }

    setEditLoading(true);
    try {
      await adminService.updateJob(String(jobToEdit.id), {
        title: editJobForm.title,
        description: editJobForm.description,
        requirements: editJobForm.requirements,
        location: editJobForm.location,
        jobType: editJobForm.jobType,
        salaryMin: editJobForm.salaryMin ? parseInt(editJobForm.salaryMin, 10) : undefined,
        salaryMax: editJobForm.salaryMax ? parseInt(editJobForm.salaryMax, 10) : undefined,
        deadline: editJobForm.deadline ? new Date(editJobForm.deadline).toISOString() : null,
        status: editJobForm.status.toLowerCase(),
      });
      toast({ title: 'Success', description: 'Job updated successfully.' });
      setJobToEdit(null);
      fetchJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update job.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    setActionLoadingJobId(jobToDelete.id);
    try {
      await adminService.deleteJob(String(jobToDelete.id));
      toast({ title: 'Deleted', description: 'Job deleted successfully.' });
      setJobToDelete(null);
      fetchJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete job.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setActionLoadingJobId(null);
    }
  };

  const updateJobStatus = async (job: Job, status: Job['status']) => {
    setActionLoadingJobId(job.id);
    try {
      await adminService.updateJob(String(job.id), { status: status.toLowerCase() });
      toast({ title: 'Updated', description: `Job marked as ${status}.` });
      setActionMenuJobId(null);
      fetchJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setActionLoadingJobId(null);
    }
  };

  const stats = [
    { label: 'Total Jobs', value: totalJobs.toLocaleString(), change: 'All admin-posted jobs', icon: Briefcase, color: 'bg-orange-500', bgLight: 'bg-orange-50' },
    { label: 'Active Postings', value: activeJobs.toLocaleString(), change: `${totalJobs > 0 ? Math.round((activeJobs / totalJobs) * 100) : 0}% active rate`, icon: CheckCircle, color: 'bg-green-500', bgLight: 'bg-green-50' },
    { label: 'Total Applications', value: totalApplications.toLocaleString(), change: 'Across all jobs', icon: Users, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
    { label: 'Avg. Applications', value: avgApplications, change: 'Per job posting', icon: TrendingUp, color: 'bg-purple-500', bgLight: 'bg-purple-50' }
  ];

  const skeletonTone = darkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <>
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedJob(null)}>
          <div
            className={`w-full max-w-2xl rounded-3xl border-2 p-7 shadow-2xl ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedJob.title}</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedJob.company} - {selectedJob.location}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
              }`}>{selectedJob.status}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Job Type</p>
                <p className={`mt-1 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedJob.jobType}</p>
              </div>
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Salary Range</p>
                <p className={`mt-1 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedJob.salaryMin && selectedJob.salaryMax ? `$${selectedJob.salaryMin.toLocaleString()} - $${selectedJob.salaryMax.toLocaleString()}` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</p>
                <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{selectedJob.description || 'No description provided.'}</p>
              </div>
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Requirements</p>
                <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{selectedJob.requirements || 'No requirements specified.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {jobToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setJobToEdit(null)}>
          <div
            className={`w-full max-w-3xl rounded-3xl border-2 p-7 shadow-2xl ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`mb-5 text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Job</h3>
            <div className="grid gap-4">
              <Input id="title" value={editJobForm.title} onChange={handleEditInputChange} placeholder="Job title" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input id="location" value={editJobForm.location} onChange={handleEditInputChange} placeholder="Location" />
                <Select onValueChange={(value) => handleEditSelectChange('jobType', value)} value={editJobForm.jobType}>
                  <SelectTrigger><SelectValue placeholder="Job type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input id="salaryMin" type="number" value={editJobForm.salaryMin} onChange={handleEditInputChange} placeholder="Salary min" />
                <Input id="salaryMax" type="number" value={editJobForm.salaryMax} onChange={handleEditInputChange} placeholder="Salary max" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select onValueChange={(value) => handleEditSelectChange('status', value as Job['status'])} value={editJobForm.status}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Input id="deadline" type="date" value={editJobForm.deadline} onChange={handleEditInputChange} placeholder="Deadline" />
              </div>
              <Textarea id="description" value={editJobForm.description} onChange={handleEditInputChange} placeholder="Description" rows={4} />
              <Textarea id="requirements" value={editJobForm.requirements} onChange={handleEditInputChange} placeholder="Requirements" rows={4} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setJobToEdit(null)}
                className={`rounded-xl px-4 py-2.5 font-semibold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJobEdit}
                disabled={editLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 font-semibold text-white hover:shadow-lg disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border-2 p-7 shadow-2xl ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete Job</h3>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Are you sure you want to delete <span className="font-semibold">{jobToDelete.title}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className={`rounded-xl px-4 py-2.5 font-semibold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteJob}
                disabled={actionLoadingJobId === jobToDelete.id}
                className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 font-semibold text-white hover:shadow-lg disabled:opacity-70"
              >
                {actionLoadingJobId === jobToDelete.id ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}

    <div className={`${embedded ? '' : `min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} p-8`}`}>
      <div className={`${embedded ? 'space-y-6' : 'max-w-7xl mx-auto'}`}>
        <div className={`${embedded ? 'mb-6' : 'mb-8'}`}>
          <div className="mb-4"><AdminBackButton /></div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/40">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-4xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent'}`}>Admin Job Postings</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Create and manage jobs posted by admin team</p>
              </div>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-amber-800 transition-all shadow-lg">
                  <Plus className="w-5 h-5" />
                  Post New Job
                </button>
              </DialogTrigger>
              <DialogContent className={adminFormDialogContentClass(darkMode)}>
                <DialogHeader className={adminFormDialogHeaderClass(darkMode)}>
                  <div className={adminFormModalHeaderGradientClass(darkMode)} aria-hidden />
                  <div className="relative flex items-start gap-5 pr-10">
                    <div className={adminFormModalIconWrapClass()}>
                      <Briefcase className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <DialogTitle className={adminFormModalTitleClass(darkMode)}>Post a New Job</DialogTitle>
                      <DialogDescription className={adminFormModalSubtitleClass(darkMode)}>
                        Fill in the essentials to publish a clear job listing.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className={adminFormDialogBodyScrollClass()}>
                  <div className={adminFormModalSectionClass(darkMode)}>
                    <div className="mb-4">
                      <p className={`text-sm font-semibold tracking-[0.3em] uppercase ${darkMode ? 'text-indigo-200/75' : 'text-gray-500'}`}>
                        Job Details
                      </p>
                      <p className={`mt-1 text-base ${darkMode ? 'text-indigo-100/80' : 'text-gray-600'}`}>
                        Keep the posting concise and informative.
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {formError && <p className={`text-sm font-medium ${darkMode ? 'text-rose-300' : 'text-red-600'}`}>{formError}</p>}
                      <div className="space-y-1.5">
                        <Label htmlFor="title" className={adminFormLabelClass(darkMode)}>Title</Label>
                        <Input id="title" value={newJob.title} onChange={handleInputChange} placeholder="e.g., Senior Frontend Developer" className={adminFormDialogFieldClass(darkMode, 'orange')} />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="companyId" className={adminFormLabelClass(darkMode)}>Company</Label>
                        <Select onValueChange={(value) => handleSelectChange('companyId', value)} value={newJob.companyId}>
                          <SelectTrigger className={adminFormDialogFieldClass(darkMode, 'orange')}>
                            <SelectValue placeholder="Select a company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map(company => (
                              <SelectItem key={company.id} value={company.id.toString()}>{company.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="location" className={adminFormLabelClass(darkMode)}>Location</Label>
                          <Input id="location" value={newJob.location} onChange={handleInputChange} placeholder="e.g., Bangalore / Remote" className={adminFormDialogFieldClass(darkMode, 'orange')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="jobType" className={adminFormLabelClass(darkMode)}>Job Type</Label>
                          <Select onValueChange={(value) => handleSelectChange('jobType', value)} value={newJob.jobType}>
                            <SelectTrigger className={adminFormDialogFieldClass(darkMode, 'orange')}>
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Full-time">Full-time</SelectItem>
                              <SelectItem value="Part-time">Part-time</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                              <SelectItem value="Internship">Internship</SelectItem>
                              <SelectItem value="Remote">Remote</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="salaryMin" className={adminFormLabelClass(darkMode)}>Salary Range</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <Input id="salaryMin" type="number" placeholder="Min salary" value={newJob.salaryMin} onChange={handleInputChange} className={adminFormDialogFieldClass(darkMode, 'orange')} />
                            <Input id="salaryMax" type="number" placeholder="Max salary" value={newJob.salaryMax} onChange={handleInputChange} className={adminFormDialogFieldClass(darkMode, 'orange')} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="deadline" className={adminFormLabelClass(darkMode)}>Deadline</Label>
                          <Input id="deadline" type="date" value={newJob.deadline} onChange={handleInputChange} className={adminFormDialogFieldClass(darkMode, 'orange')} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="description" className={adminFormLabelClass(darkMode)}>Description</Label>
                        <Textarea id="description" value={newJob.description} onChange={handleInputChange} className={adminFormDialogTextareaClass(darkMode, 'orange')} rows={3} placeholder="Describe responsibilities, team context, and impact." />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="requirements" className={adminFormLabelClass(darkMode)}>Requirements</Label>
                        <Textarea id="requirements" value={newJob.requirements} onChange={handleInputChange} className={adminFormDialogTextareaClass(darkMode, 'orange')} rows={3} placeholder="List required skills, tools, and years of experience." />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className={adminFormDialogFooterClass(darkMode)}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={`min-w-[120px] rounded-xl px-4 py-2.5 text-base font-semibold transition-colors ${darkMode ? 'text-indigo-100 hover:bg-[#223560]' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Cancel
                  </button>
                  <button type="submit" onClick={handlePostJob} disabled={formLoading} className={`inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold text-white transition-all ${
                    formLoading
                      ? 'cursor-not-allowed bg-orange-400/80'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 hover:shadow-lg hover:shadow-orange-900/40'
                  }`}>
                    <Save className="w-4 h-4" />
                    {formLoading ? 'Posting...' : 'Post Job'}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6" aria-busy={loading}>
            {loading
              ? stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-lg border-2 p-6 flex flex-col items-center justify-center min-h-[160px]`}
                  >
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading {stat.label}...</span>
                  </div>
                ))
              : stats.map((stat, index) => (
                  <div key={index} className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-lg border-2 p-6 hover:shadow-xl transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${darkMode ? stat.color + '/20' : stat.bgLight} p-3 rounded-lg`}>
                        <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className={`w-2 h-2 rounded-full ${stat.color} animate-pulse`}></div>
                    </div>
                    <div>
                      <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>{stat.label}</h3>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stat.value}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.change}</p>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-xl border-2 w-full`}>
          {/* Search and Filter Bar */}
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-11 pr-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`flex-1 min-w-[140px] px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Pending</option>
                  <option>Expired</option>
                  <option>Closed</option>
                </select>

                <select
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                  className={`flex-1 min-w-[140px] px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="All Types">All Types</option>
                  {uniqueJobTypes.map((type) => (
                    <option key={String(type)} value={String(type)}>{String(type)}</option>
                  ))}
                </select>

                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className={`flex-1 min-w-[140px] px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="All Companies">All Companies</option>
                  {uniqueCompanies.map((company) => (
                    <option key={String(company)} value={String(company)}>{String(company)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Job Cards */}
          {loading ? (
            <div className={`m-6 rounded-3xl p-12 text-center border-2 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'}`}>
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading job postings...</p>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 xl:grid-cols-2">
            {paginatedJobs.map((job) => {
              const initials = (job.company || job.title || 'J')
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const salaryLabel = formatJobSalaryRange(job.salaryMin, job.salaryMax);
              const postedLabel = formatJobPostedDate(job.createdAt);

              return (
              <div key={job.id} className={`relative rounded-2xl border p-4 sm:p-5 transition-all hover:shadow-lg ${actionMenuJobId === job.id ? 'z-50' : 'z-10'} ${
                darkMode ? 'border-gray-700 bg-gray-800/60 hover:border-orange-500/40' : 'border-gray-200 bg-white hover:border-orange-200'
              }`}>
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-sm font-bold text-white shadow-lg sm:h-14 sm:w-14">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`truncate font-bold text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`} title={job.title}>
                        {job.title}
                      </h3>
                      <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="inline-flex max-w-full items-center gap-1 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </span>
                        <span className="inline-flex max-w-full items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {job.jobType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex shrink-0 flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap sm:px-3 sm:py-1.5 sm:text-sm ${
                      darkMode ? (
                        job.status === 'Active' ? 'bg-green-900/30 text-green-400' :
                        job.status === 'Paused' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-gray-800 text-gray-300'
                      ) : (
                        job.status === 'Active' ? 'bg-green-100 text-green-700' :
                        job.status === 'Paused' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      )
                    }`}>
                      {job.status === 'Active' && <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      {job.status === 'Paused' && <PauseCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      {job.status === 'Expired' && <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      {job.status}
                    </span>
                    <div className={`flex items-center gap-1 rounded-xl border p-1 sm:gap-2 sm:p-1.5 ${
                      darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <button
                        type="button"
                        title="View job"
                        onClick={() => setSelectedJob(job)}
                        className={`rounded-lg p-1.5 transition-colors sm:p-2 ${
                        darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'
                      }`}>
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        type="button"
                        title="Edit job"
                        onClick={() => openEditModal(job)}
                        className={`rounded-lg p-1.5 transition-colors sm:p-2 ${
                        darkMode ? 'text-blue-300 hover:bg-blue-500/15' : 'text-blue-600 hover:bg-blue-50'
                      }`}>
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        type="button"
                        title="Delete job"
                        onClick={() => setJobToDelete(job)}
                        className={`rounded-lg p-1.5 transition-colors sm:p-2 ${
                        darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                      }`}>
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title="More actions"
                            className={`rounded-lg p-1.5 transition-colors sm:p-2 ${
                            darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'
                          }`}>
                            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={`w-44 rounded-xl border p-2 shadow-xl ${
                          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                        }`}>
                          <DropdownMenuItem
                            onClick={() => updateJobStatus(job, 'Active')}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${
                              darkMode ? 'text-gray-200 focus:bg-gray-700' : 'text-gray-700 focus:bg-gray-100'
                            }`}
                          >
                            <Play className="h-4 w-4 text-green-500" />
                            Mark Active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateJobStatus(job, 'Paused')}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${
                              darkMode ? 'text-gray-200 focus:bg-gray-700' : 'text-gray-700 focus:bg-gray-100'
                            }`}
                          >
                            <Pause className="h-4 w-4 text-amber-500" />
                            Pause Job
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateJobStatus(job, 'Expired')}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${
                              darkMode ? 'text-red-300 focus:bg-red-900/20' : 'text-red-600 focus:bg-red-50'
                            }`}
                          >
                            <XCircle className="h-4 w-4" />
                            Mark Expired
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateJobStatus(job, 'Pending')}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${
                              darkMode ? 'text-blue-300 focus:bg-blue-900/20' : 'text-blue-600 focus:bg-blue-50'
                            }`}
                          >
                            <Clock className="h-4 w-4" />
                            Mark Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateJobStatus(job, 'Closed')}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${
                              darkMode ? 'text-gray-300 focus:bg-gray-700' : 'text-gray-600 focus:bg-gray-100'
                            }`}
                          >
                            <XCircle className="h-4 w-4" />
                            Close Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-3 flex min-w-0 items-center gap-2 overflow-x-auto rounded-lg border px-3 py-2 text-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:text-sm ${
                    darkMode ? 'border-gray-700/80 bg-gray-900/30 text-gray-400' : 'border-gray-100 bg-gray-50 text-gray-500'
                  }`}
                  aria-label="Job posting details"
                >
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap"
                    title={`Salary: ${salaryLabel}`}
                  >
                    <DollarSign className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{salaryLabel}</span>
                  </span>
                  <span className={`h-3 w-px shrink-0 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} aria-hidden />
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap"
                    title={`${job.applications} applications`}
                  >
                    <Users className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      {job.applications}
                      <span className={`font-normal ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}> apps</span>
                    </span>
                  </span>
                  <span className={`h-3 w-px shrink-0 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} aria-hidden />
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap"
                    title={`Posted ${postedLabel}`}
                  >
                    <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{postedLabel}</span>
                  </span>
                </div>
              </div>
            );
            })}
          </div>
          )}
          
          {!loading && paginatedJobs.length === 0 && (
            <div className={`flex flex-col items-center justify-center p-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <Search className="w-8 h-8 opacity-50" />
              </div>
              <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>No job postings found</h3>
              <p className="text-sm max-w-md">Try adjusting your search or filters, or create a new job posting to get started.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className={`p-6 border-t flex flex-col sm:flex-row gap-4 items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredJobs.length)}</span> of <span className="font-medium">{filteredJobs.length}</span> results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 1 
                      ? (darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                      : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border hover:bg-gray-50 text-gray-700')
                  }`}
                >
                  Previous
                </button>
                <div className="items-center gap-1 hidden sm:flex">
                  {(() => {
                    const getVisiblePages = (current: number, total: number) => {
                      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
                      if (current <= 3) return [1, 2, 3, 4, '...', total];
                      if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
                      return [1, '...', current - 1, current, current + 1, '...', total];
                    };
                    return getVisiblePages(currentPage, totalPages).map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className={`px-2 font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>...</span>
                      ) : (
                        <button
                          key={`page-${page}`}
                          onClick={() => handlePageChange(page as number)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                              : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white border text-gray-600 hover:bg-gray-50')
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}
                </div>
                <button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === totalPages
                      ? (darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                      : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border hover:bg-gray-50 text-gray-700')
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {!loading && filteredJobs.length === 0 && (
            <div className="p-12 text-center">
              <Briefcase className={`w-16 h-16 ${darkMode ? 'text-gray-700' : 'text-gray-300'} mx-auto mb-4`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No job postings found</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
