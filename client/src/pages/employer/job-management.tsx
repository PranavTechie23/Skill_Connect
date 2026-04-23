import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from "@/components/theme-provider";
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
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
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ChevronDown,
  MoreHorizontal,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  Code,
  Palette,
  Database,
  Smartphone,
  Cloud,
  Briefcase
} from 'lucide-react';

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
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
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
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase());
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

  const duplicateJob = (jobId: string) => {
    const jobToDuplicate = jobs.find(job => job.id === jobId);
    if (jobToDuplicate) {
      const duplicatedJob = {
        ...jobToDuplicate,
        id: Date.now().toString(),
        title: `${jobToDuplicate.title} (Copy)`,
        status: 'draft' as const,
        applicants: 0,
        newApplicants: 0,
        postedDate: new Date().toISOString().split('T')[0],
        views: 0,
        conversionRate: 0
      };
      setJobs(prev => [duplicatedJob, ...prev]);
    }
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

  const stats = {
    total: jobs.length,
    active: jobs.filter(job => job.status === 'active').length,
    paused: jobs.filter(job => job.status === 'paused').length,
    draft: jobs.filter(job => job.status === 'draft').length,
    totalApplicants: jobs.reduce((sum, job) => sum + job.applicants, 0),
    newApplicants: jobs.reduce((sum, job) => sum + job.newApplicants, 0),
    totalViews: jobs.reduce((sum, job) => sum + job.views, 0),
    avgConversion: jobs.filter(job => job.applicants > 0).reduce((sum, job) => sum + job.conversionRate, 0) / jobs.filter(job => job.applicants > 0).length || 0
  };

  // Create Job modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [helpTopic, setHelpTopic] = useState<string>('required');

  const location = useLocation();

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

  const mapApiJobToUi = (job: any): Job => ({
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
    conversionRate: Number(job.conversionRate ?? 0),
  });

  const fetchEmployerJobs = async () => {
    if (!user?.id) return;
    setIsLoadingJobs(true);
    try {
      const res = await apiFetch('/api/employer/jobs', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(Array.isArray(data) ? data.map(mapApiJobToUi) : []);
    } catch (e) {
      console.error('Failed to load employer jobs:', e);
      setJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchEmployerJobs();
  }, [user?.id]);

  const resolveCompanyId = async (): Promise<string | null> => {
    if (user?.company?.id) return String(user.company.id);
    if (!user?.id) return null;
    try {
      const res = await apiFetch(`/api/companies?ownerId=${user.id}`, { credentials: 'include' });
      if (!res.ok) return null;
      const companies = await res.json();
      if (Array.isArray(companies) && companies[0]?.id) return String(companies[0].id);
    } catch {
      // ignore
    }
    return null;
  };

  const [newJobForm, setNewJobForm] = useState({
    title: "",
    department: "",
    location: "",
    type: 'full-time' as Job['type'],
    salary: '',
    experience: '',
    description: '',
    requirements: '' , // comma separated
    skills: '' , // comma separated
    status: 'draft' as Job['status']
  });

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

  const handleCreateJobOpen = () => setShowCreateModal(true);
  const handleCreateJobClose = () => setShowCreateModal(false);

  // Icon for preview in create modal
  const CreateIcon = pickIconForTitle(newJobForm.title);

  const createJob = async () => {
    // basic validation: title + description required
    if (!newJobForm.title.trim() || !newJobForm.description.trim()) {
      alert('Please fill required fields: Title and Description');
      return;
    }
    if (!newJobForm.location.trim()) {
      alert('Please fill required field: Location');
      return;
    }

    const companyId = await resolveCompanyId();
    if (!user?.id || !companyId) {
      alert('Unable to resolve employer/company. Please update company profile first.');
      return;
    }

    // parse comma separated requirements/skills into arrays
    const requirementsArr = newJobForm.requirements
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const skillsArr = newJobForm.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const { min: salaryMin, max: salaryMax } = parseSalaryRange(newJobForm.salary);

    if (requirementsArr.length === 0) {
      alert('Please add at least one requirement.');
      return;
    }

    const payload = {
      title: newJobForm.title,
      description: newJobForm.description,
      requirements: requirementsArr.join(', '),
      location: newJobForm.location,
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
        const text = await res.text();
        throw new Error(text || 'Create job failed');
      }

      await fetchEmployerJobs();
      setNewJobForm({ title: '', department: '', location: '', type: 'full-time', salary: '', experience: '', description: '', requirements: '', skills: '', status: 'draft' });
      setHelpTopic('required');
      setShowCreateModal(false);
    } catch (e: any) {
      console.error('Failed to create job:', e);
      alert(e?.message || 'Failed to create job');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, trend = 'up', color }: any) => (
    <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-xl p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <p className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className={`flex items-center space-x-1 text-sm ${
              trend === 'up' ? 'text-emerald-500' : 'text-red-500'
            }`}>
              <TrendingUp className="w-4 h-4" />
              <span>{change}% from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} ${darkMode ? 'bg-opacity-20' : 'bg-opacity-10'}`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Job Management
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create and manage your job postings
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-xl transition-colors duration-300">
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
            <button onClick={handleCreateJobOpen} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors duration-300 shadow-lg shadow-blue-600/25">
              <Plus className="w-5 h-5" />
              <span>Create Job</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Jobs"
            value={stats.total}
            change={12.5}
            icon={FileText}
            trend="up"
            color="bg-blue-500"
          />
          <StatCard
            title="Active Jobs"
            value={stats.active}
            change={8.3}
            icon={CheckCircle}
            trend="up"
            color="bg-emerald-500"
          />
          <StatCard
            title="Total Applicants"
            value={stats.totalApplicants}
            change={15.2}
            icon={Users}
            trend="up"
            color="bg-purple-500"
          />
          <StatCard
            title="Avg. Conversion"
            value={`${(stats.avgConversion * 100).toFixed(1)}%`}
            change={2.1}
            icon={Target}
            trend="up"
            color="bg-amber-500"
          />
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} border rounded-2xl shadow-xl p-6 backdrop-blur-sm mb-6`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs by title, department, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'
                }`}
              />
            </div>

            {/* Enhanced Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:bg-gray-700'
                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
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
                className={`px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:bg-gray-700'
                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                }`}
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:bg-gray-700'
                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="applicants">Most Applicants</option>
                <option value="views">Most Views</option>
              </select>

              {/* Enhanced View Toggle */}
              <div className={`flex rounded-xl p-1 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : darkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : darkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
              </div>
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
        {isLoadingJobs ? (
          <div className="text-center py-16">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading jobs...</p>
          </div>
        ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-6'}>
          {sortedJobs.map((job) => {
            const StatusIcon = getStatusIcon(job.status);
            return (
              <div
                key={job.id}
                className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-2xl shadow-lg backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group`}
              >
                {/* Header */}
                <div className={`p-6 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id)}
                        onChange={() => toggleJobSelection(job.id)}
                        className="mt-1 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {job.title}
                        </h3>
                        <p className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} text-sm`}>
                          {job.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)} flex items-center space-x-1`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{getStatusText(job.status)}</span>
                      </span>
                      <div className="relative">
                        <button className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-300`}>
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className={`flex items-center space-x-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salary}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Clock className="w-4 h-4" />
                      <span className="capitalize">{job.type.replace('-', ' ')}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Users className="w-4 h-4" />
                      <span>{job.applicants} applicants</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-6">
                  <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {job.description}
                  </p>
                  
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {job.views.toLocaleString()}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Views</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${
                        job.conversionRate > 0.8 ? 'text-emerald-500' : 
                        job.conversionRate > 0.5 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {(job.conversionRate * 100).toFixed(1)}%
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Conversion</p>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="mb-4">
                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Key Requirements:</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.slice(0, 3).map((req, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            darkMode 
                              ? 'bg-gray-700 text-gray-300 border border-gray-600' 
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {req}
                        </span>
                      ))}
                      {job.requirements.length > 3 && (
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-400 border border-gray-600' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          +{job.requirements.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={`flex items-center justify-between pt-4 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
                    <div className={`flex items-center space-x-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                      </div>
                      {job.newApplicants > 0 && (
                        <span className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {job.newApplicants} new
                        </span>
                      )}
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => duplicateJob(job.id)}
                        className={`p-2 ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'} transition-colors duration-300`}
                        title="Duplicate"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'} transition-colors duration-300`}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'} transition-colors duration-300`}>
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleJobStatus(job.id)}
                        className={`p-2 ${darkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-500 hover:text-yellow-600'} transition-colors duration-300`}
                      >
                        {job.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(job.id)}
                        className={`p-2 ${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'} transition-colors duration-300`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Enhanced Empty State */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-16">
            <FileText className={`w-20 h-20 ${darkMode ? 'text-gray-400' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-2xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              No jobs found
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-8 max-w-md mx-auto`}>
              {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by creating your first job posting to attract top talent.'
              }
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition-colors duration-300 shadow-lg shadow-blue-600/25">
              Create Your First Job
            </button>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl max-w-2xl w-full p-6`}>
            <div className="flex items-start space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CreateIcon className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create New Job</h3>
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
                  Job title <span className="text-red-500">*</span>
                </label>
                <input
                  value={newJobForm.title}
                  onChange={(e) => setNewJobForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Job title"
                  className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Department
                </label>
                <input
                  value={newJobForm.department}
                  onChange={(e) => setNewJobForm(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Department (optional)"
                  className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                />
              </div>
              <input
                value={newJobForm.location}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Location"
                className={`px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
              <select
                value={newJobForm.type}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, type: e.target.value as Job['type'] }))}
                className={`px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
              <input
                value={newJobForm.salary}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="Salary range"
                className={`px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
              <input
                value={newJobForm.experience}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="Experience required"
                className={`px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
            </div>

            <div className="mb-4">
              <label className={`text-sm font-medium mb-1 block ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Detailed description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newJobForm.description}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description"
                rows={4}
                className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                value={newJobForm.requirements}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Key requirements (comma separated)"
                className={`px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
              <input
                value={newJobForm.skills}
                onChange={(e) => setNewJobForm(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="Skills (comma separated)"
                className={`px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
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
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl max-w-md w-full p-6`}>
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
      )}
    </div>
  );
}
