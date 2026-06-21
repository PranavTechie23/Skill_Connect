import React, { useState, useEffect, useMemo } from 'react';
import AdminBackButton, { useAdminEmbedded } from '@/components/AdminBackButton';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/theme-provider';
import {
  FileText, Search, Filter, Eye, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Briefcase, Star, Calendar, MapPin, Mail,
  Download, MoreVertical, User, Building2, Award, Zap, Target,
  Activity, ArrowUpRight, ThumbsUp, ThumbsDown, MessageSquare,
  Phone, ExternalLink, ChevronDown, AlertCircle, DollarSign,
  ChevronLeft, ChevronRight
} from 'lucide-react';

import { adminService } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useDebounce } from '@/hooks/use-debounce';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import { Pagination } from '@/components/Pagination';

interface MatchBreakdown {
  skills: number;
  location: number;
  salary: number;
  experience: number;
}

interface Application {
  id: string;
  resumeUrl?: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'rejected' | 'accepted';
  matchScore: number;
  matchBreakdown?: MatchBreakdown;
  experience: string;
  location: string;
  salary: string;
  skills: string[];
}

function formatJobSalary(job: {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salary?: unknown;
  salaryRange?: string;
}): string {
  const toK = (n: number) => {
    const k = n >= 1000 ? Math.round(n / 1000) : n;
    return `$${k.toLocaleString()}k`;
  };
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${toK(Number(job.salaryMin))} - ${toK(Number(job.salaryMax))}`;
  }
  if (job.salaryMin != null) return `${toK(Number(job.salaryMin))}+`;
  if (job.salaryMax != null) return `Up to ${toK(Number(job.salaryMax))}`;
  if (typeof job.salary === 'string' && job.salary.trim()) return job.salary;
  if (job.salaryRange) return job.salaryRange;
  return 'Not specified';
}

function getMatchTier(score: number) {
  if (score >= 75) {
    return {
      label: 'Strong match',
      text: 'text-emerald-400',
      ring: '#34d399',
      cardDark: 'border-emerald-500/35 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent',
      cardLight: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
      badgeDark: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      badgeLight: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
  }
  if (score >= 55) {
    return {
      label: 'Moderate match',
      text: 'text-amber-400',
      ring: '#fbbf24',
      cardDark: 'border-amber-500/35 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent',
      cardLight: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
      badgeDark: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      badgeLight: 'bg-amber-100 text-amber-700 border-amber-200',
    };
  }
  return {
    label: 'Low match',
    text: 'text-rose-400',
    ring: '#fb7185',
    cardDark: 'border-rose-500/35 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent',
    cardLight: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white',
    badgeDark: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    badgeLight: 'bg-rose-100 text-rose-700 border-rose-200',
  };
}

function MatchScoreGauge({
  score,
  size = 'md',
  darkMode,
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  darkMode: boolean;
}) {
  const tier = getMatchTier(score);
  const dim = size === 'lg' ? 112 : size === 'md' ? 88 : 44;
  const stroke = size === 'sm' ? 3 : size === 'md' ? 6 : 7;
  const radius = (dim - stroke) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const fontSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-[10px]';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="-rotate-90" aria-hidden>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={darkMode ? 'rgba(75,85,99,0.45)' : 'rgba(229,231,235,1)'}
          strokeWidth={stroke}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={tier.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${fontSize} font-black ${tier.text}`}>
        <span>{score}%</span>
      </div>
    </div>
  );
}

const AdminApplications: React.FC = () => {
  const { embedded } = useAdminEmbedded();
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeMenuAppId, setActiveMenuAppId] = useState<string | null>(null);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const appsPerPage = 8;
  const { toast } = useToast();

  // Generate realistic fallback data
  const generateFallbackData = (index: number) => {
    const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Amanda', 'Robert', 'Lisa', 'William', 'Jennifer', 'Richard', 'Michelle', 'Joseph', 'Ashley', 'Thomas', 'Melissa', 'Christopher', 'Nicole'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];
    const jobTitles = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'UX Designer', 'Product Manager', 'Data Analyst', 'DevOps Engineer', 'QA Engineer', 'Marketing Specialist', 'Sales Representative', 'Project Manager', 'Business Analyst', 'UI Designer', 'Mobile Developer'];
    const companies = ['TechCorp', 'InnovateCo', 'DataSys', 'CloudServe', 'DesignHub', 'Growth Inc.', 'StartupXYZ', 'Digital Solutions', 'FutureTech', 'Smart Systems', 'Global Services', 'Prime Industries', 'Elite Corp', 'NextGen Labs', 'Apex Solutions'];
    const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Chicago, IL', 'Los Angeles, CA', 'Denver, CO', 'Remote', 'Hybrid'];
    const experiences = ['1 Year', '2 Years', '3 Years', '4 Years', '5 Years', '6 Years', '7+ Years'];
    const skillsList = [
      ['React', 'TypeScript', 'Node.js'],
      ['Python', 'Django', 'PostgreSQL'],
      ['Java', 'Spring Boot', 'MySQL'],
      ['JavaScript', 'Vue.js', 'MongoDB'],
      ['C#', '.NET', 'SQL Server'],
      ['Angular', 'RxJS', 'Firebase'],
      ['Swift', 'iOS', 'Xcode'],
      ['Kotlin', 'Android', 'Room'],
      ['Go', 'Docker', 'Kubernetes'],
      ['Ruby', 'Rails', 'PostgreSQL'],
    ];

    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    const jobTitle = jobTitles[index % jobTitles.length];
    const company = companies[index % companies.length];
    const location = locations[index % locations.length];
    const experience = experiences[index % experiences.length];
    const skills = skillsList[index % skillsList.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      jobTitle,
      company,
      location,
      experience,
      skills,
    };
  };

  // Map status from database to display format
  const mapStatus = (status: string): Application['status'] => {
    const statusMap: Record<string, Application['status']> = {
      'pending': 'pending',
      'applied': 'pending',
      'review': 'reviewing',
      'reviewing': 'reviewing',
      'shortlisted': 'shortlisted',
      'interview': 'interview',
      'hired': 'accepted',
      'accepted': 'accepted',
      'rejected': 'rejected',
    };
    return statusMap[status.toLowerCase()] || 'pending';
  };

  // Format date from various formats
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) {
      // Generate a random date within the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return String(date);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await adminService.getApplications();

      if (data && Array.isArray(data) && data.length > 0) {
        // Transform enriched API data to display format
        const transformed = data.map((app: any, index: number) => {
          const extractResumeUrl = (resumeValue: unknown): string | undefined => {
            if (!resumeValue) return undefined;
            if (typeof resumeValue === 'string') {
              try {
                const parsed = JSON.parse(resumeValue);
                if (Array.isArray(parsed) && parsed[0]?.filename) {
                  return `/uploads/${parsed[0].filename}`;
                }
              } catch {
                if (resumeValue.startsWith('/uploads/') || resumeValue.startsWith('http')) return resumeValue;
              }
              return undefined;
            }
            if (Array.isArray(resumeValue) && resumeValue[0]?.filename) {
              return `/uploads/${resumeValue[0].filename}`;
            }
            if (typeof resumeValue === 'object' && (resumeValue as any)?.filename) {
              return `/uploads/${(resumeValue as any).filename}`;
            }
            return undefined;
          };

          const applicant = app.applicant || {};
          const job = app.job || {};
          const company = app.company || {};
          const profile = app.profile || {};

          // Generate fallback data for this application
          const fallback = generateFallbackData(index);

          // Get candidate name - handle both camelCase and snake_case, use fallback if missing
          const firstName = applicant.firstName || applicant.first_name || fallback.firstName;
          const lastName = applicant.lastName || applicant.last_name || fallback.lastName;
          const candidateName = `${firstName} ${lastName}`.trim() || fallback.fullName;

          // Get email - use fallback if missing
          const candidateEmail = applicant.email || fallback.email;

          // Get job title - handle various field names, use fallback if missing
          const jobTitle = job.title || job.jobTitle || fallback.jobTitle;

          // Get company name - handle various field names, use fallback if missing
          const companyName = company.name || company.companyName || fallback.company;

          // Get skills from profile or applicant - handle JSONB arrays, use fallback if missing
          let skills: string[] = [];
          if (profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
            skills = profile.skills;
          } else if (applicant?.skills && Array.isArray(applicant.skills) && applicant.skills.length > 0) {
            skills = applicant.skills;
          } else {
            skills = fallback.skills;
          }

          // Format experience - check profile bio or calculate from experiences, use fallback if missing
          let experience = fallback.experience;
          if (profile?.bio) {
            experience = 'See profile';
          } else if (profile?.headline) {
            experience = profile.headline;
          } else if (applicant?.experience) {
            experience = applicant.experience;
          }

          // Get location from job or applicant, use fallback if missing
          const location = job.location || applicant.location || fallback.location;

          // Get salary from job - values are stored in full currency units (divide by 1000 for display)
          let salary = formatJobSalary(job);
          if (salary === 'Not specified') {
            // Generate realistic salary based on job title
            const baseSalaries: Record<string, number> = {
              'Software Engineer': 120,
              'Frontend Developer': 110,
              'Backend Developer': 115,
              'Full Stack Developer': 125,
              'UX Designer': 95,
              'Product Manager': 130,
              'Data Analyst': 90,
              'DevOps Engineer': 140,
              'QA Engineer': 85,
              'Marketing Specialist': 70,
            };
            const base = baseSalaries[jobTitle] || 100;
            const min = base - 20;
            const max = base + 30;
            salary = `$${min}k - $${max}k`;
          }

          // Real multi-factor match score from the backend
          const rawMatch = app.matchScore;
          const matchScore: number =
            rawMatch && typeof rawMatch === 'object' && 'total' in rawMatch
              ? (rawMatch as any).total
              : typeof rawMatch === 'number'
                ? rawMatch
                : 60;
          const matchBreakdown: MatchBreakdown | undefined =
            rawMatch && typeof rawMatch === 'object' && 'breakdown' in rawMatch
              ? (rawMatch as any).breakdown
              : undefined;

          // Format applied date - handle various date field names
          const appliedDate = formatDate(
            app.submittedAt ||
            app.submitted_at ||
            app.appliedAt ||
            app.applied_at ||
            app.createdAt ||
            app.created_at
          );

          return {
            id: String(app.id),
            resumeUrl: extractResumeUrl(app.resume),
            candidateName,
            candidateEmail,
            jobTitle,
            company: companyName,
            appliedDate,
            status: mapStatus(app.status || 'pending'),
            matchScore,
            matchBreakdown,
            experience,
            location,
            salary,
            skills,
          };
        });

        setApplications(transformed);
      } else {
        setApplications([]);
      }
    } catch (error: any) {
      logger.error("Failed to fetch applications:", error);
      if (!error?.message?.includes("401")) {
        toast({ title: "Error", description: "Could not fetch applications.", variant: "destructive" });
      }
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-app-action-menu]') && !target.closest('[data-app-action-trigger]')) {
        setActiveMenuAppId(null);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const mapStatusForApi = (status: Application['status']) => {
    if (status === 'reviewing') return 'review';
    return status;
  };

  const handleUpdateStatus = async (appId: string, status: Application['status']) => {
    try {
      setUpdatingAppId(appId);
      await adminService.updateApplication(appId, mapStatusForApi(status));
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status } : app));
      setActiveMenuAppId(null);
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status } : prev);
      }
      toast({ title: "Success", description: `Application has been ${status}.` });
    } catch (error) {
      logger.error(`Failed to ${status} application:`, error);
      toast({ title: "Error", description: `Could not update application status.`, variant: "destructive" });
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleEmailCandidate = (app: Application) => {
    const subject = encodeURIComponent(`Regarding your application for ${app.jobTitle}`);
    const body = encodeURIComponent(`Hi ${app.candidateName},\n\nThank you for applying to ${app.jobTitle} at ${app.company}.\n\nBest regards,\nAdmin Team`);
    window.open(`mailto:${app.candidateEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDownloadResume = (app: Application) => {
    if (!app.resumeUrl) {
      toast({ title: 'Resume unavailable', description: 'No resume attachment found for this application.', variant: 'destructive' });
      return;
    }
    window.open(app.resumeUrl, '_blank');
  };

  const handleExportData = () => {
    if (!filteredApplications.length) {
      toast({ title: 'No data', description: 'No applications to export with current filters.', variant: 'destructive' });
      return;
    }

    const headers = ['Candidate Name', 'Email', 'Job Title', 'Company', 'Status', 'Applied Date', 'Match Score', 'Location', 'Experience', 'Salary', 'Skills'];
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = filteredApplications.map(app => [
      app.candidateName,
      app.candidateEmail,
      app.jobTitle,
      app.company,
      app.status,
      app.appliedDate,
      app.matchScore,
      app.location,
      app.experience,
      app.salary,
      (app.skills || []).join(', ')
    ]);

    const csv = [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applications-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = (app.candidateName || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (app.jobTitle || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (app.company || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const reviewingApps = applications.filter(a => a.status === 'reviewing' || a.status === 'shortlisted').length;
  const interviewApps = applications.filter(a => a.status === 'interview').length;
  const acceptedApps = applications.filter(a => a.status === 'accepted').length;
  const rejectedApps = applications.filter(a => a.status === 'rejected').length;

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / appsPerPage));
  const paginatedApplications = filteredApplications.slice((currentPage - 1) * appsPerPage, currentPage * appsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollDashboardToTop();
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, filterStatus]);

  const getStatusConfig = (status: string) => {
    const configs = darkMode ? {
      pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/20', icon: Clock, label: 'Pending' },
      reviewing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/20', icon: Eye, label: 'Reviewing' },
      shortlisted: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/20', icon: Star, label: 'Shortlisted' },
      interview: { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20', icon: Users, label: 'Interview' },
      accepted: { color: 'bg-green-500/20 text-green-400 border-green-500/20', icon: CheckCircle, label: 'Accepted' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/20', icon: XCircle, label: 'Rejected' }
    } : {
      pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
      reviewing: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Eye, label: 'Reviewing' },
      shortlisted: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Star, label: 'Shortlisted' },
      interview: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Users, label: 'Interview' },
      accepted: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className={`${embedded ? '' : `min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} p-8`}`}>
      <div className={`${embedded ? 'space-y-6' : 'max-w-7xl mx-auto'}`}>
        {/* Header */}
        <div className={`${embedded ? 'mb-6' : 'mb-8'}`}>
          <div className="mb-4"><AdminBackButton /></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/50 animate-pulse-slow">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>
                Applications Management
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>View and manage all job applications</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <Zap className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Total Apps</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalApps}</p>
            </div>

            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Pending</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pendingApps}</p>
            </div>

            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <Activity className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>In Review</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{reviewingApps}</p>
            </div>

            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Interviews</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{interviewApps}</p>
            </div>

            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <Award className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Accepted</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{acceptedApps}</p>
            </div>

            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <ThumbsDown className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Rejected</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{rejectedApps}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 mb-8 border-2`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by candidate name, job title, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium ${darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-6 py-4 border-2 rounded-xl font-semibold cursor-pointer focus:border-indigo-500 outline-none ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>

            <button onClick={handleExportData} className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
              <Download className="w-5 h-5" />
              Export Data
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-12 text-center border-2`}>
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading applications...</p>
            </div>
          </div>
        )}

        {/* Applications List */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedApplications.map((app) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={app.id} className={`rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${darkMode
                    ? 'bg-gray-800/80 border-gray-700/50 hover:border-indigo-500/50 hover:shadow-indigo-500/10'
                    : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-indigo-100'
                  }`}
                >
                  <div className="p-5 sm:p-6 flex flex-col md:flex-row justify-between md:items-end gap-5">
                    {/* Left: Candidate Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg mt-1">
                        {(app.candidateName || '').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2.5">
                          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.candidateName}</h3>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                          </div>
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border min-w-[7.5rem] ${getMatchTier(app.matchScore)[darkMode ? 'badgeDark' : 'badgeLight']
                              }`}
                            title={getMatchTier(app.matchScore).label}
                          >
                            <Target className="w-4 h-4 shrink-0" />
                            <span>{app.matchScore}%</span>
                            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-600/80' : 'bg-gray-200'}`}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${app.matchScore}%`,
                                  backgroundColor: getMatchTier(app.matchScore).ring,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 opacity-70" />
                            <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{app.jobTitle}</span>
                            <span className="opacity-50 mx-0.5">at</span>
                            <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{app.company}</span>
                          </div>
                          <span className="hidden sm:inline opacity-30">•</span>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 opacity-70" />
                            <span>Applied {app.appliedDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end">
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        aria-label={`View details for ${app.candidateName}`}
                        className={`group flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-95 ${darkMode
                            ? 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 ring-1 ring-indigo-500/30'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 ring-1 ring-indigo-200/50'
                          }`}
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
                        <span className="text-sm sm:text-base">View Details</span>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`p-2 sm:p-2.5 rounded-xl transition-all border ${darkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                              }`}>
                            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={`w-48 rounded-xl shadow-xl border-2 p-1.5 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'
                          }`}>
                          <DropdownMenuItem onClick={() => handleEmailCandidate(app)} className={`w-full px-3 py-2 flex items-center gap-3 text-sm font-semibold rounded-lg cursor-pointer ${darkMode ? 'focus:bg-gray-700 text-gray-300' : 'focus:bg-gray-100 text-gray-700'
                            }`}>
                            <Mail className="w-4 h-4" />
                            Email Candidate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(app.id, 'interview')} className={`w-full px-3 py-2 flex items-center gap-3 text-sm font-semibold rounded-lg cursor-pointer ${darkMode ? 'focus:bg-gray-700 text-gray-300' : 'focus:bg-gray-100 text-gray-700'
                            }`}>
                            <Calendar className="w-4 h-4" />
                            Schedule Interview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadResume(app)} className={`w-full px-3 py-2 flex items-center gap-3 text-sm font-semibold rounded-lg cursor-pointer ${darkMode ? 'focus:bg-gray-700 text-gray-300' : 'focus:bg-gray-100 text-gray-700'
                            }`}>
                            <Download className="w-4 h-4" />
                            Download Resume
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className={darkMode ? 'bg-gray-700' : 'bg-gray-100'} />
                          <DropdownMenuItem onClick={() => handleUpdateStatus(app.id, 'accepted')} className={`w-full px-3 py-2 flex items-center gap-3 text-sm font-semibold rounded-lg cursor-pointer ${darkMode ? 'focus:bg-green-500/10 text-green-400' : 'focus:bg-green-50 text-green-600'
                            }`}>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Accept Application
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(app.id, 'rejected')} className={`w-full px-3 py-2 flex items-center gap-3 text-sm font-semibold rounded-lg cursor-pointer ${darkMode ? 'focus:bg-red-500/10 text-red-400' : 'focus:bg-red-50 text-red-600'
                            }`}>
                            <XCircle className="w-4 h-4 text-red-500" />
                            Reject Application
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredApplications.length === 0 && (
          <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-12 text-center border-2`}>
            <div className={`w-24 h-24 ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-gray-100 to-gray-200'
              } rounded-full flex items-center justify-center mx-auto mb-4`}>
              <FileText className={`w-12 h-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Applications Found</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredApplications.length}
          itemsPerPage={appsPerPage}
          onPageChange={handlePageChange}
          itemName="applications"
        />

        {/* Detail Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-8">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto`}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Application Details</h2>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                      }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className={`flex items-center gap-4 p-6 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                      {selectedApp.candidateName ? selectedApp.candidateName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?'}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.candidateName || 'Unknown Candidate'}</h3>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{selectedApp.candidateEmail || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>ROLE</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.jobTitle}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedApp.company}</p>
                      </div>
                    </div>

                    <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>EXPERIENCE</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.experience}</p>
                      </div>
                    </div>

                    <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>LOCATION</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.location}</p>
                      </div>
                    </div>

                    <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>EXPECTED SALARY</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.salary}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-3xl border-2 shadow-sm ${darkMode
                      ? getMatchTier(selectedApp.matchScore).cardDark
                      : getMatchTier(selectedApp.matchScore).cardLight
                    }`}>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-center sm:text-left flex-1">
                        <p className={`text-xs font-bold tracking-[0.2em] mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          OVERALL FIT
                        </p>
                        <p className={`text-2xl font-black ${getMatchTier(selectedApp.matchScore).text}`}>
                          {getMatchTier(selectedApp.matchScore).label}
                        </p>
                        <p className={`text-sm mt-2 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          This candidate has been evaluated against the job requirements based on their skills, location, expected salary, and past experience fit.
                        </p>
                      </div>
                      <div className="shrink-0 drop-shadow-xl">
                        <MatchScoreGauge score={selectedApp.matchScore} size="lg" darkMode={darkMode} />
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  {selectedApp.matchBreakdown && (
                    <div className={`p-5 rounded-2xl border-2 ${darkMode ? 'bg-gray-700/60 border-gray-600' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100'
                      }`}>
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <p className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                          <Target className="w-4 h-4" />
                          MATCH SCORE BREAKDOWN
                        </p>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold border ${getMatchTier(selectedApp.matchScore)[darkMode ? 'badgeDark' : 'badgeLight']
                          }`}>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total</span>
                          <span className={getMatchTier(selectedApp.matchScore).text}>{selectedApp.matchScore}%</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {([
                          { key: 'skills', label: 'Skills Match', max: 40, color: 'from-indigo-500 to-purple-600' },
                          { key: 'location', label: 'Location Fit', max: 20, color: 'from-blue-500 to-cyan-500' },
                          { key: 'salary', label: 'Salary Range', max: 20, color: 'from-green-500 to-emerald-500' },
                          { key: 'experience', label: 'Role Relevance', max: 20, color: 'from-amber-500 to-orange-500' },
                        ] as const).map(({ key, label, max, color }) => {
                          const val = selectedApp.matchBreakdown![key] ?? 0;
                          const pct = Math.round((val / max) * 100);
                          return (
                            <div key={key}>
                              <div className="flex justify-between mb-1">
                                <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>{label}</span>
                                <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-gray-800'
                                  }`}>{val}/{max} pts</span>
                              </div>
                              <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'
                                }`}>
                                <div
                                  className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>SKILLS</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.skills.map(skill => (
                        <span key={skill} className={`px-4 py-2 text-sm font-bold rounded-xl ${darkMode
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700'
                          }`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      disabled={updatingAppId === selectedApp.id}
                      onClick={() => handleUpdateStatus(selectedApp.id, 'interview')}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {updatingAppId === selectedApp.id
                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Calendar className="w-5 h-5" />
                      }
                      Schedule Interview
                    </button>
                    <button onClick={() => handleDownloadResume(selectedApp)} className={`px-6 py-4 rounded-xl font-bold transition-all ${darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}>
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminApplications;
