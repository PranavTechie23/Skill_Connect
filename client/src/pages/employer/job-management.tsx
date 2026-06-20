import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildEmployerHiringUrl } from '@/lib/employer-hiring-nav';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from "@/components/theme-provider";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { employerPageTitleClass } from '@/lib/employer-page-styles';
import {
  computeEmployerJobPageStats,
  fetchEmployerApplications,
  fetchEmployerJobs,
  type EmployerJob,
  type MonthTrend,
} from '@/lib/employer-service';
import AdminBackButton from "@/components/AdminBackButton";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Pause, 
  Play,
  Users,
  ArrowRight,
  ChevronDown,
  MoreHorizontal,
  FileText,
  CheckCircle,
  XCircle,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  Loader2,
  Code,
  Palette,
  Database,
  Smartphone,
  Cloud,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { scrollPageToTop } from '@/lib/scroll-to-top';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary: string;
  experience: string;
  description: string;
  requirements: string[];
  status: 'active' | 'paused' | 'draft' | 'closed';
  applicants: number;
  newApplicants: number;
  postedDate: string;
  expiryDate: string;
  views: number;
  conversionRate: number;
}

interface JobManagementProps {
  embedded?: boolean;
}

type NewJobFormField =
  | 'title'
  | 'location'
  | 'type'
  | 'description'
  | 'requirements';

type NewJobFormErrors = Partial<Record<NewJobFormField, string>>;

const REQUIRED_MARK = <span className="text-red-500" aria-hidden="true"> *</span>;

function fieldClass(darkMode: boolean, hasError: boolean): string {
  const base = darkMode
    ? 'bg-slate-800/80 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:ring-violet-500/25 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0'
    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-500/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0';
  const error = 'border-red-500 focus:border-red-500 focus:ring-red-500/30';
  return `${base} ${hasError ? error : ''}`;
}

function formatSalaryRange(min?: number | null, max?: number | null): string {
  if (min != null && max != null) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min != null) return `$${min.toLocaleString()}`;
  if (max != null) return `$${max.toLocaleString()}`;
  return 'Not specified';
}

function parseSalaryRange(input: string): { min: number | null; max: number | null } {
  const cleaned = input.replace(/[,$]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return { min: null, max: null };
  const nums = cleaned.match(/\d+/g)?.map((n) => Number(n)) ?? [];
  if (nums.length === 0) return { min: null, max: null };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: nums[0], max: nums[1] };
}

export default function JobManagement({ embedded = false }: JobManagementProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const queryClient = useQueryClient();
  const employerId = user?.id ?? '';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  const filteredJobs = jobs.filter(job => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      job.title.toLowerCase().includes(term) ||
      job.department.toLowerCase().includes(term) ||
      job.requirements.some((r) => r.toLowerCase().includes(term));
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesType;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      case 'oldest':
        return new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime();
      case 'applicants':
        return b.applicants - a.applicants;
      case 'views':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  const toggleJobStatus = (jobId: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        const newStatus = job.status === 'active' ? 'paused' : 'active';
        return { ...job, status: newStatus };
      }
      return job;
    }));
  };

  const deleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    setShowDeleteModal(null);
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const selectAllJobs = () => {
    setSelectedJobs(filteredJobs.map(job => job.id));
  };

  const clearSelection = () => {
    setSelectedJobs([]);
  };

  const handleBulkApply = () => {
    if (!bulkAction || selectedJobs.length === 0) return;

    if (bulkAction === 'activate') {
      setJobs(prev =>
        prev.map(job =>
          selectedJobs.includes(job.id) ? { ...job, status: 'active' } : job
        )
      );
    } else if (bulkAction === 'pause') {
      setJobs(prev =>
        prev.map(job =>
          selectedJobs.includes(job.id) ? { ...job, status: 'paused' } : job
        )
      );
    } else if (bulkAction === 'duplicate') {
      const toDuplicate = jobs.filter(job => selectedJobs.includes(job.id));
      const duplicates: Job[] = toDuplicate.map(job => ({
        ...job,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: `${job.title} (Copy)`,
        status: 'draft',
        applicants: 0,
        newApplicants: 0,
        postedDate: new Date().toISOString().split('T')[0],
        views: 0,
        conversionRate: 0,
      }));
      setJobs(prev => [...duplicates, ...prev]);
    } else if (bulkAction === 'delete') {
      setJobs(prev => prev.filter(job => !selectedJobs.includes(job.id)));
    }

    setBulkAction('');
    clearSelection();
  };

  const getStatusColor = (status: Job['status']) => {
    const colors = {
      active: darkMode 
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      paused: darkMode 
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
        : 'bg-amber-50 text-amber-700 border-amber-200',
      draft: darkMode 
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
        : 'bg-blue-50 text-blue-700 border-blue-200',
      closed: darkMode 
        ? 'bg-red-500/20 text-red-400 border-red-500/30' 
        : 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status];
  };

  const getStatusIcon = (status: Job['status']) => {
    const icons = {
      active: CheckCircle,
      paused: Pause,
      draft: FileText,
      closed: XCircle
    };
    return icons[status];
  };

  const getStatusText = (status: Job['status']) => {
    const texts = {
      active: 'Active',
      paused: 'Paused',
      draft: 'Draft',
      closed: 'Closed'
    };
    return texts[status];
  };

  const { data: apiJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['employer-jobs', employerId],
    queryFn: fetchEmployerJobs,
    enabled: !!employerId,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['employer-applications', employerId],
    queryFn: () => fetchEmployerApplications(employerId),
    enabled: !!employerId,
  });

  const pageStats = useMemo(
    () => computeEmployerJobPageStats(apiJobs, applications),
    [apiJobs, applications],
  );

  const departments = useMemo(() => {
    const set = new Set(jobs.map((j) => j.department).filter(Boolean));
    return Array.from(set).sort();
  }, [jobs]);

  // Create Job modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [helpTopic, setHelpTopic] = useState<string>('required');
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [aiCustomInstructions, setAiCustomInstructions] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const openHiringPipeline = (jobId: string, newOnly = false) => {
    navigate(
      buildEmployerHiringUrl(
        { jobId, stage: newOnly ? 'new' : 'all' },
        embedded,
      ),
    );
  };

  // If navigated here with state.openCreate, open the modal automatically
  useEffect(() => {
    try {
      const state = (location as any).state;
      if (state && state.openCreate) {
        setShowCreateModal(true);
        // Optionally clear the flag so it doesn't reopen on remount
        // history.replaceState can be used but we keep it simple here
      }
    } catch (e) {
      // ignore
    }
  }, [location]);

  const mapApiJobToUi = (job: EmployerJob): Job => ({
    id: String(job.id),
    title: job.title ?? 'Untitled Job',
    department: job.company?.industry || 'General',
    location: job.location ?? 'Not specified',
    type: (job.jobType || 'full-time') as Job['type'],
    salary: formatSalaryRange(job.salaryMin, job.salaryMax),
    experience: '-',
    description: job.description ?? '',
    requirements: Array.isArray(job.skills) && job.skills.length > 0
      ? job.skills
      : typeof job.requirements === 'string'
      ? job.requirements.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [],
    status: job.isActive ? 'active' : 'paused',
    applicants: Number(job.applications ?? 0),
    newApplicants: Number(job.newApplications ?? 0),
    postedDate: job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expiryDate: '',
    views: Number(job.views ?? 0),
    conversionRate:
      (job.applications ?? 0) > 0 && (job.views ?? 0) > 0
        ? (job.applications ?? 0) / (job.views ?? 1)
        : (job.applications ?? 0) > 0
          ? 1
          : 0,
  });

  useEffect(() => {
    setJobs(apiJobs.map(mapApiJobToUi));
  }, [apiJobs]);

  const refreshJobs = async () => {
    await queryClient.invalidateQueries({ queryKey: ['employer-jobs', employerId] });
    await queryClient.invalidateQueries({ queryKey: ['employer-applications', employerId] });
  };

  const resolveCompanyId = async (): Promise<string | null> => {
    if (!user?.id) return null;

    const pickCompanyId = (row: unknown): string | null => {
      if (!row || typeof row !== 'object') return null;
      const id = (row as { id?: string | number }).id;
      return id != null ? String(id) : null;
    };

    try {
      const res = await apiFetch(`/api/companies?ownerId=${user.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data ? [data] : [];
        for (const row of rows) {
          const id = pickCompanyId(row);
          if (id) return id;
        }
      }
    } catch {
      // ignore
    }

    return pickCompanyId(user.company);
  };

  const initialNewJobForm = {
    title: "",
    department: "",
    location: "",
    type: 'full-time' as Job['type'],
    salary: '',
    experience: '',
    description: '',
    requirements: '',
    skills: '',
    status: 'draft' as Job['status'],
  };

  const [newJobForm, setNewJobForm] = useState(initialNewJobForm);
  const [newJobFormErrors, setNewJobFormErrors] = useState<NewJobFormErrors>({});

  // Simple icon chooser based on job title keywords
  const iconMap: Record<string, any> = {
    frontend: Code,
    backend: Database,
    devops: Zap,
    design: Palette,
    mobile: Smartphone,
    cloud: Cloud,
    data: Database,
    default: Briefcase,
  };

  const pickIconForTitle = (title: string) => {
    const t = title.toLowerCase();
    for (const k of Object.keys(iconMap)) {
      if (k !== 'default' && t.includes(k)) return iconMap[k];
    }
    return iconMap.default;
  };

  const validateNewJobForm = (form: typeof initialNewJobForm): NewJobFormErrors => {
    const errors: NewJobFormErrors = {};
    if (!form.title.trim()) errors.title = 'Job title is required';
    if (!form.location.trim()) errors.location = 'Location is required';
    if (!form.type) errors.type = 'Job type is required';
    if (!form.description.trim()) errors.description = 'Job description is required';
    if (!form.requirements.trim()) {
      errors.requirements = 'Key requirements are required (comma-separated or plain text)';
    }
    return errors;
  };

  const clearNewJobFieldError = (field: NewJobFormField) => {
    setNewJobFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCreateJobOpen = () => {
    setNewJobFormErrors({});
    setShowCreateModal(true);
  };
  const handleCreateJobClose = () => {
    setNewJobFormErrors({});
    setShowCreateModal(false);
  };

  // Icon for preview in create modal
  const CreateIcon = pickIconForTitle(newJobForm.title);

  const createJob = async () => {
    const validationErrors = validateNewJobForm(newJobForm);
    if (Object.keys(validationErrors).length > 0) {
      setNewJobFormErrors(validationErrors);
      toast({
        title: 'Missing required fields',
        description: 'Please complete all fields marked with a red asterisk (*).',
        variant: 'destructive',
      });
      return;
    }

    const companyId = await resolveCompanyId();
    if (!user?.id || !companyId) {
      toast({
        title: 'Company profile required',
        description: 'Unable to resolve your company. Please complete your company profile first.',
        variant: 'destructive',
      });
      return;
    }

    const requirementsText = newJobForm.requirements.trim();
    const skillsArr = newJobForm.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const { min: salaryMin, max: salaryMax } = parseSalaryRange(newJobForm.salary);

    const payload = {
      title: newJobForm.title.trim(),
      description: newJobForm.description.trim(),
      requirements: requirementsText,
      location: newJobForm.location.trim(),
      jobType: newJobForm.type === 'internship' ? 'contract' : newJobForm.type,
      salaryMin,
      salaryMax,
      skills: skillsArr,
      companyId,
      employerId: String(user.id),
      isActive: newJobForm.status === 'active',
    };

    setIsCreatingJob(true);
    try {
      const res = await apiFetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = 'Create job failed';
        const raw = await res.text();
        if (raw) {
          try {
            const body = JSON.parse(raw) as { message?: string; errors?: { message?: string }[] };
            if (Array.isArray(body.errors) && body.errors.length > 0) {
              message =
                body.errors.map((e) => e.message).filter(Boolean).join('; ') ||
                body.message ||
                message;
            } else {
              message = body.message || raw;
            }
          } catch {
            message = raw;
          }
        }
        throw new Error(message);
      }

      await refreshJobs();
      setNewJobForm(initialNewJobForm);
      setNewJobFormErrors({});
      setHelpTopic('required');
      setShowCreateModal(false);
      toast({
        title: 'Job created',
        description: 'Your job posting has been saved successfully.',
      });
    } catch (e: unknown) {
      console.error('Failed to create job:', e);
      toast({
        title: 'Failed to create job',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingJob(false);
    }
  };

  const formatTrendLabel = (trend: MonthTrend | null | undefined) => {
    if (!trend) return null;
    const sign = trend.changePercent > 0 ? '+' : trend.changePercent < 0 ? '' : '';
    return `${sign}${trend.changePercent}% vs last month`;
  };

  const StatCard = ({
    title,
    value,
    monthTrend,
    icon: Icon,
    gradient,
  }: {
    title: string;
    value: string | number;
    monthTrend?: MonthTrend | null;
    icon: typeof FileText;
    gradient: string;
  }) => {
    const trendLabel = formatTrendLabel(monthTrend);
    const trendColor =
      !monthTrend || monthTrend.trend === 'flat'
        ? darkMode ? 'text-gray-400' : 'text-gray-500'
        : monthTrend.trend === 'up'
          ? 'text-emerald-500'
          : 'text-rose-500';
    const TrendIcon = monthTrend?.trend === 'down' ? TrendingDown : TrendingUp;

    return (
      <div className={`group ${darkMode ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md'} backdrop-blur-xl border rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
            <p className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        {/* Removed negative trend labels for a cleaner look */}
      </div>
    );
  };

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} transition-colors duration-300 ${
      embedded
        ? 'bg-transparent'
        : darkMode
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50'
    }`}>
      {/* Enhanced Animated Background */}
      {!embedded && (
        <div className={`fixed inset-0 overflow-hidden pointer-events-none ${
          darkMode ? 'opacity-100' : 'opacity-40'
        }`}>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      )}

      <div className={`${embedded ? 'w-full' : 'container mx-auto max-w-7xl'} relative ${embedded ? 'p-2' : 'p-6'}`}>
        {/* Back Button */}
        {!embedded && (
          <div className="mb-6">
            <AdminBackButton />
          </div>
        )}

        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={employerPageTitleClass(darkMode)}>Job Postings</h1>
          </div>
          <button onClick={handleCreateJobOpen} className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4" />
            <span>Create Job</span>
          </button>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Jobs"
            value={pageStats.total}
            monthTrend={pageStats.trends.totalJobs}
            icon={FileText}
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Active Jobs"
            value={pageStats.active}
            monthTrend={pageStats.trends.activeJobs}
            icon={CheckCircle}
            gradient="from-emerald-500 to-teal-500"
          />
          <StatCard
            title="Total Applicants"
            value={pageStats.totalApplicants}
            monthTrend={pageStats.trends.totalApplicants}
            icon={Users}
            gradient="from-purple-500 to-pink-500"
          />
          <StatCard
            title="Avg. Conversion"
            value={
              pageStats.avgConversionPercent != null
                ? `${pageStats.avgConversionPercent}%`
                : '—'
            }
            monthTrend={pageStats.trends.avgConversion}
            icon={Target}
            gradient="from-amber-500 to-orange-500"
          />
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className={`${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-gray-100 shadow-sm'} backdrop-blur-xl border rounded-2xl p-3 mb-6`}>
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 border rounded-xl text-sm transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-800'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
                }`}
              />
            </div>

            {/* Enhanced Filters */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2 border rounded-xl text-sm transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:bg-gray-800'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                }`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className={`px-3 py-2 border rounded-xl text-sm transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:bg-gray-800'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                }`}
              >
                <option value="all">All Depts</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-3 py-2 border rounded-xl text-sm transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500 focus:bg-gray-800'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="applicants">Most Apps</option>
                <option value="views">Most Views</option>
              </select>


            </div>
          </div>

          {/* Bulk Actions */}
          {selectedJobs.length > 0 && (
            <div className="flex items-center justify-between mt-4 p-4 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <div className="flex items-center space-x-3">
                <span className="text-white font-medium">
                  {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-blue-300 hover:text-white text-sm transition-colors duration-300"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className={`px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                } border text-sm`}>
                  <option value="">Bulk actions</option>
                  <option value="activate">Activate selected</option>
                  <option value="pause">Pause selected</option>
                  <option value="duplicate">Duplicate selected</option>
                  <option value="delete">Delete selected</option>
                </select>
                <button
                  onClick={handleBulkApply}
                  disabled={!bulkAction || selectedJobs.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400/60 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors duration-300"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Jobs Grid/List */}
        {(() => {
          const [currentPage, setCurrentPage] = useState(1);
          const itemsPerPage = viewMode === 'grid' ? 6 : 10;
          
          useEffect(() => {
            setCurrentPage(1);
          }, [searchTerm, statusFilter, departmentFilter, sortBy, viewMode]);
          
          const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
          const paginatedJobs = sortedJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

          if (isLoadingJobs) {
            return (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className={`w-10 h-10 animate-spin mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading jobs...</p>
              </div>
            );
          }
          
          if (sortedJobs.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-20">
                <FileText className={`w-12 h-12 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No jobs found</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your filters or create a new job.</p>
              </div>
            );
          }

          return (
            <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-5'}>
                {paginatedJobs.map((job) => {
            const StatusIcon = getStatusIcon(job.status);
            const conversionPct = (job.conversionRate * 100).toFixed(0);
            const metaParts = [
              job.location,
              job.type.replace('-', ' '),
              job.salary !== 'Not specified' ? job.salary : null,
            ].filter(Boolean);
            const skillPreview =
              job.requirements.length > 0
                ? job.requirements.slice(0, 2).join(' · ') +
                  (job.requirements.length > 2 ? ` +${job.requirements.length - 2}` : '')
                : null;

            return (
              <div
                key={job.id}
                className={`group relative overflow-hidden rounded-2xl border p-4 min-h-[148px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  darkMode
                    ? 'border-slate-700/60 bg-slate-800/50 hover:border-indigo-500/40'
                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-indigo-500/10'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(job.status)}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {getStatusText(job.status)}
                      </span>
                      {job.newApplicants > 0 && (
                        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          {job.newApplicants} new
                        </span>
                      )}
                    </div>
                    <h3
                      className={`truncate text-base font-bold leading-snug ${darkMode ? 'text-white group-hover:text-indigo-300' : 'text-gray-900 group-hover:text-indigo-600'}`}
                      title={job.title}
                    >
                      {job.title}
                    </h3>
                    <p className={`mt-1 truncate text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {job.department}
                      {metaParts.length > 0 && ` · ${metaParts.join(' · ')}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => toggleJobStatus(job.id)}
                      className={`rounded-lg p-1.5 transition-colors ${darkMode ? 'text-amber-400 hover:bg-amber-500/15' : 'text-amber-600 hover:bg-amber-50'}`}
                      title={job.status === 'active' ? 'Pause' : 'Activate'}
                    >
                      {job.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(job.id)}
                      className={`rounded-lg p-1.5 transition-colors ${darkMode ? 'text-red-400 hover:bg-red-500/15' : 'text-red-600 hover:bg-red-50'}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div
                  className={`mt-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs tabular-nums ${
                    darkMode ? 'bg-slate-900/50 text-slate-300' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{job.applicants}</span>
                    <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}> applicants</span>
                  </span>
                  <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
                  <span>{job.views.toLocaleString()} views</span>
                  <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
                  <span
                    className={
                      job.conversionRate > 0.8
                        ? 'font-semibold text-emerald-500'
                        : job.conversionRate > 0.5
                          ? 'font-semibold text-amber-500'
                          : 'font-semibold text-rose-500'
                    }
                  >
                    {conversionPct}%
                  </span>
                </div>

                {skillPreview && (
                  <p className={`mt-2.5 truncate text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {skillPreview}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => openHiringPipeline(job.id, job.newApplicants > 0)}
                  className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                    darkMode
                      ? 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Manage Pipeline
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Showing <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{Math.min(currentPage * itemsPerPage, sortedJobs.length)}</span> of <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{sortedJobs.length}</span> jobs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  scrollPageToTop();
                }}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? darkMode ? 'border-slate-700/50 text-gray-600 bg-slate-800/20' : 'border-gray-200 text-gray-400 bg-gray-50'
                    : darkMode ? 'border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let startPage = 1;
                  if (totalPages > 5) {
                    startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  }
                  const pageNum = startPage + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        scrollPageToTop();
                      }}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-md'
                          : darkMode ? 'text-gray-400 hover:bg-slate-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  scrollPageToTop();
                }}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? darkMode ? 'border-slate-700/50 text-gray-600 bg-slate-800/20' : 'border-gray-200 text-gray-400 bg-gray-50'
                    : darkMode ? 'border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  })()}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900/80 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.25)]' : 'bg-white/95 border-gray-100 shadow-2xl'} backdrop-blur-xl border rounded-2xl max-w-2xl w-full p-6`}>
            <div className="flex items-start space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CreateIcon className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create New Job</h3>
                  <button
                    type="button"
                    onClick={() => setShowAIModal(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Draft with AI
                  </button>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Fill the details below to publish a new job posting.</p>
              </div>
            </div>

            {/* Help dropdown */}
            <div className={`mb-4 p-3 rounded-xl border ${darkMode ? 'bg-gray-700/40 border-gray-600' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Need help?
                </label>
                <select
                  value={helpTopic}
                  onChange={(e) => setHelpTopic(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                >
                  <option value="required">Required fields</option>
                  <option value="salary">Salary format</option>
                  <option value="requirements">Requirements format</option>
                </select>
              </div>
              <p className={`mt-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {helpTopic === 'required' && 'Fields marked with a red * are required to create the job.'}
                {helpTopic === 'salary' && 'Use either a single number (e.g., 50000) or a range (e.g., 50000 - 70000).'}
                {helpTopic === 'requirements' && 'Enter requirements as comma-separated values, e.g., React, TypeScript, Communication.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Job title{REQUIRED_MARK}
                </label>
                <input
                  value={newJobForm.title}
                  onChange={(e) => {
                    clearNewJobFieldError('title');
                    setNewJobForm(prev => ({ ...prev, title: e.target.value }));
                  }}
                  placeholder="Job title"
                  aria-invalid={!!newJobFormErrors.title}
                  className={`w-full px-4 py-2 rounded-xl border ${fieldClass(darkMode, !!newJobFormErrors.title)}`}
                />
                {newJobFormErrors.title && (
                  <p className="text-xs text-red-500" role="alert">{newJobFormErrors.title}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Department
                </label>
                <input
                  value={newJobForm.department}
                  onChange={(e) => setNewJobForm(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Department (optional)"
                  className={`w-full px-4 py-2 rounded-xl border ${fieldClass(darkMode, false)}`}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Location{REQUIRED_MARK}
                </label>
                <input
                  value={newJobForm.location}
                  onChange={(e) => {
                    clearNewJobFieldError('location');
                    setNewJobForm(prev => ({ ...prev, location: e.target.value }));
                  }}
                  placeholder="City, region, or remote"
                  aria-invalid={!!newJobFormErrors.location}
                  className={`w-full px-4 py-2 rounded-xl border ${fieldClass(darkMode, !!newJobFormErrors.location)}`}
                />
                {newJobFormErrors.location && (
                  <p className="text-xs text-red-500" role="alert">{newJobFormErrors.location}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Job type{REQUIRED_MARK}
                </label>
                <select
                  value={newJobForm.type}
                  onChange={(e) => {
                    clearNewJobFieldError('type');
                    setNewJobForm(prev => ({ ...prev, type: e.target.value as Job['type'] }));
                  }}
                  aria-invalid={!!newJobFormErrors.type}
                  className={`w-full px-4 py-2 rounded-xl border ${fieldClass(darkMode, !!newJobFormErrors.type)}`}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
                {newJobFormErrors.type && (
                  <p className="text-xs text-red-500" role="alert">{newJobFormErrors.type}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Salary range
                </label>
                <input
                  value={newJobForm.salary}
                  onChange={(e) => setNewJobForm(prev => ({ ...prev, salary: e.target.value }))}
                  placeholder="e.g. 50000 or 50000 - 70000 (optional)"
                  className={`w-full px-4 py-2 rounded-xl border ${fieldClass(darkMode, false)}`}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Experience
                </label>
                <input
                  value={newJobForm.experience}
                  onChange={(e) => setNewJobForm(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="Experience (optional)"
                  className={`w-full px-4 py-2 rounded-xl border ${fieldClass(darkMode, false)}`}
                />
              </div>
            </div>

            <div className="mb-4 space-y-1">
              <label className={`text-sm font-medium block ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Detailed description{REQUIRED_MARK}
              </label>
              <textarea
                value={newJobForm.description}
                onChange={(e) => {
                  clearNewJobFieldError('description');
                  setNewJobForm(prev => ({ ...prev, description: e.target.value }));
                }}
                placeholder="Role overview, responsibilities, and team context"
                rows={4}
                aria-invalid={!!newJobFormErrors.description}
                className={`w-full px-4 py-3 rounded-xl border ${fieldClass(darkMode, !!newJobFormErrors.description)}`}
              />
              {newJobFormErrors.description && (
                <p className="text-xs text-red-500" role="alert">{newJobFormErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Key requirements{REQUIRED_MARK}
                </label>
                <textarea
                  value={newJobForm.requirements}
                  onChange={(e) => {
                    clearNewJobFieldError('requirements');
                    setNewJobForm(prev => ({ ...prev, requirements: e.target.value }));
                  }}
                  placeholder="e.g. 2+ years React, Bachelor's in CS (comma-separated or plain text)"
                  rows={3}
                  aria-invalid={!!newJobFormErrors.requirements}
                  className={`w-full px-4 py-2 rounded-xl border ${fieldClass(darkMode, !!newJobFormErrors.requirements)}`}
                />
                {newJobFormErrors.requirements && (
                  <p className="text-xs text-red-500" role="alert">{newJobFormErrors.requirements}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Skills
                </label>
                <textarea
                  value={newJobForm.skills}
                  onChange={(e) => setNewJobForm(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="Skills (comma separated, optional)"
                  rows={3}
                  className={`w-full px-4 py-2 rounded-xl border ${fieldClass(darkMode, false)}`}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCreateJobClose}
                className={`px-4 py-2 rounded-xl transition-colors duration-300 ${darkMode ? 'text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-600 hover:text-gray-900 bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={createJob}
                disabled={isCreatingJob}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400/60 disabled:cursor-not-allowed text-white rounded-xl transition-colors duration-300 shadow-lg shadow-blue-600/25"
              >
                {isCreatingJob ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900/80 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.25)]' : 'bg-white/95 border-gray-100 shadow-2xl'} backdrop-blur-xl border rounded-2xl max-w-md w-full p-6`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delete Job Posting
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              Are you sure you want to delete <strong>{jobs.find(j => j.id === showDeleteModal)?.title}</strong>? 
              This will permanently remove the job posting and all associated data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className={`px-6 py-2 rounded-xl transition-colors duration-300 ${
                  darkMode 
                    ? 'text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-600 hover:text-gray-900 bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteJob(showDeleteModal)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors duration-300 shadow-lg shadow-red-600/25"
              >
                Delete Job
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
      
      {/* AI Job Drafting Assistant Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/75 z-[60] backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-slate-900 border-white/10 text-white shadow-[0_18px_60px_rgba(0,0,0,0.4)]' : 'bg-white border-gray-100 text-gray-900 shadow-2xl'} max-w-md w-full p-6 border rounded-2xl`}>
            <h4 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              AI Job Drafting Assistant
            </h4>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
              Enter a job title and optional focus instructions, and Gemini will generate details to populate the fields of the job form.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-medium block mb-1">Job Title *</label>
                <input
                  value={newJobForm.title}
                  onChange={(e) => {
                    clearNewJobFieldError('title');
                    setNewJobForm(prev => ({ ...prev, title: e.target.value }));
                  }}
                  placeholder="e.g. Senior Frontend Engineer"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${fieldClass(darkMode, false)}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Custom Instructions / Focus Areas (Optional)</label>
                <textarea
                  value={aiCustomInstructions}
                  onChange={(e) => setAiCustomInstructions(e.target.value)}
                  placeholder="e.g. Focus on React Native, state management, and a hybrid layout."
                  rows={3}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${fieldClass(darkMode, false)}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAIModal(false)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newJobForm.title.trim()) {
                    toast({
                      title: "Job title required",
                      description: "Please enter a job title before drafting.",
                      variant: "destructive"
                    });
                    return;
                  }
                  setIsDraftingAI(true);
                  try {
                    const res = await apiFetch('/api/ai/employer/jobs/draft', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: newJobForm.title.trim(),
                        customInstructions: aiCustomInstructions.trim(),
                      }),
                      credentials: 'include',
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({ error: 'Drafting failed' }));
                      throw new Error(data.error || 'Request failed');
                    }
                    const result = await res.json();
                    if (result.success) {
                      setNewJobForm(prev => ({
                        ...prev,
                        description: result.description || '',
                        requirements: result.requirements || '',
                        skills: Array.isArray(result.skills) ? result.skills.join(', ') : '',
                      }));
                      setShowAIModal(false);
                      toast({
                        title: "Draft generated!",
                        description: "Job description, requirements, and skills populated.",
                      });
                    } else {
                      throw new Error(result.error || "Failed to generate draft");
                    }
                  } catch (err: any) {
                    console.error(err);
                    toast({
                      title: "Drafting failed",
                      description: err.message || "Failed to call AI drafting service. Please try again.",
                      variant: "destructive"
                    });
                  } finally {
                    setIsDraftingAI(false);
                  }
                }}
                disabled={isDraftingAI}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isDraftingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Drafting...
                  </>
                ) : (
                  'Generate Draft'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
