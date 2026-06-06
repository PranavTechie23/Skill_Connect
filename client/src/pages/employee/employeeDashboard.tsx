import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from '@/hooks/use-toast';

import {
  Search, MapPin, Bookmark, Bell, MessageSquare, User, FileText,
  TrendingUp, Clock, CheckCircle, XCircle, Briefcase, Filter,
  Settings, ArrowRight, LogOut, Zap, Target,
  Award, Heart, Moon, Sun, Menu, Home, BarChart3,
  Upload, Calendar, Sparkles, ChevronRight
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QuickApplyModal } from '../../components/quick-apply-modal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import BrowseJobsPage from './browse-jobs';
import ApplicationsPage from './applications';
import SavedJobsPage from './saved-jobs';
import MessagesPage from './messages';
import ProfilePage from './profile';
import ActivityPage from './activity';
import SettingsPage from './settings';

import { apiFetch, withSkipGlobalLoader } from '@/lib/api';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  formatRelativeTime,
  type AppNotification,
} from '@/lib/notifications-service';
import {
  normalizeApplicationStatus,
  getStatusLabel,
  DEFAULT_STATUS_EXPLANATIONS,
} from '@/lib/application-status';
import { useSavedJobs } from '@/contexts/SavedJobsContext';
import type { Job as SavedJobRecord } from '@/pages/employee/savedJobsUtils';

// Types
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  skills?: string[];
  salary: string;
  matchPercentage: number;
  postedTime: string;
  isNew: boolean;
  type: string;
  applicationsCount?: number;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected';
}

interface UserStats {
  totalApplications: number;
  inProgressCount: number;
  interviewInvitations: number;
  offersCount: number;
  profileCompletion: number;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const formatSalaryINR = (salaryMin?: number | null, salaryMax?: number | null, fallback?: string) => {
  if (typeof salaryMin === 'number' && typeof salaryMax === 'number') {
    return `${formatINR(salaryMin)} - ${formatINR(salaryMax)}`;
  }

  if (fallback) {
    // Convert known dollar-like formats to rupee symbol for display consistency.
    return fallback.replace(/\$/g, '₹');
  }

  return 'Not specified';
};

const mockApplications: Application[] = [
  {
    id: '1',
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    appliedDate: '2024-01-15',
    status: 'interview'
  },
  {
    id: '2',
    jobId: '2',
    jobTitle: 'Full Stack Engineer',
    company: 'StartupXYZ',
    appliedDate: '2024-01-12',
    status: 'reviewed'
  },
  {
    id: '3',
    jobId: '3',
    jobTitle: 'UI/UX Developer',
    company: 'DesignStudio',
    appliedDate: '2024-01-10',
    status: 'pending'
  }
];

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('employee-sidebar-open');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('employee-sidebar-open', String(sidebarOpen));
    } catch {
      // ignore storage errors
    }
  }, [sidebarOpen]);
  const [activeTab, setActiveTab] = useState('overview');
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalApplications: 0,
    inProgressCount: 0,
    interviewInvitations: 0,
    offersCount: 0,
    profileCompletion: 0,
  });
  const [loading, setLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { savedJobs, addJob, removeJob, isJobSaved } = useSavedJobs();
  const queryClient = useQueryClient();

  const { data: apiNotifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: fetchNotifications,
    enabled: !!user?.id,
    refetchInterval: 45_000,
  });

  const { data: unreadNotifCount = 0 } = useQuery({
    queryKey: ['notifications-unread', user?.id],
    queryFn: fetchUnreadCount,
    enabled: !!user?.id,
    refetchInterval: 45_000,
  });

  const { data: apiMessages = [] } = useQuery({
    queryKey: ['messages-preview', user?.id],
    queryFn: async () => {
      const res = await apiFetch('/api/messages');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const switchToTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
    const query = tabId === 'overview' ? '' : `?tab=${tabId}`;
    navigate(`/employee/dashboard${query}`);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    setActiveTab(tab ?? 'overview');
  }, [location.search]);

  useEffect(() => {
    scrollDashboardToTop();
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notifications-dropdown') && !target.closest('.messages-dropdown')) {
        setShowNotifications(false);
        setShowMessages(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const avatarSrc = (() => {
    const raw = user?.profilePhoto;
    if (!raw) return null;
    if (raw.startsWith('data:image/')) return raw;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return raw;
    return `/${raw.replace(/^\/+/, '')}`;
  })();

  const resetNotificationsAndMessages = () => {
    setShowNotifications(false);
    setShowMessages(false);
  };

  const normalizeMsg = (m: Record<string, unknown>) => ({
    id: String(m.id ?? ''),
    senderId: String(m.senderId ?? m.sender_id ?? ''),
    receiverId: String(m.receiverId ?? m.receiver_id ?? ''),
    content: String(m.content ?? ''),
    isRead: Boolean(m.isRead ?? m.is_read),
    createdAt: String(m.createdAt ?? m.created_at ?? ''),
  });

  const unreadMessageCount = apiMessages.filter((m: Record<string, unknown>) => {
    const msg = normalizeMsg(m);
    return msg.receiverId === user?.id && !msg.isRead;
  }).length;

  const headerMessagePreviews = (() => {
    const byPeer = new Map<string, { from: string; text: string; read: boolean; time: string }>();
    for (const raw of apiMessages as Record<string, unknown>[]) {
      const m = normalizeMsg(raw);
      const peerId = m.senderId === user?.id ? m.receiverId : m.senderId;
      if (!peerId || peerId === user?.id) continue;
      const existing = byPeer.get(peerId);
      const time = m.createdAt ? formatRelativeTime(m.createdAt) : '';
      if (!existing) {
        byPeer.set(peerId, {
          from: `User ${peerId.slice(0, 6)}`,
          text: m.content,
          read: !(m.receiverId === user?.id && !m.isRead),
          time,
        });
      }
    }
    return Array.from(byPeer.values()).slice(0, 8);
  })();

  const handleLogout = async () => {
    toast({
      title: "",
      className: "border border-emerald-500/20 bg-slate-950 text-white p-0 pr-8 overflow-hidden min-h-[64px] shadow-2xl",
      duration: 850,
      description: (
        <div className="relative w-full px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </span>
            <span className="text-lg leading-none font-semibold text-white">Logout Successful</span>
          </div>
        </div>
      ),
    });

    resetNotificationsAndMessages();
    void logout().catch((e) => console.warn('Logout failed:', e));
    window.setTimeout(() => navigate('/', { replace: true }), 450);
  };

  const computeProfileCompletionFromUser = (u: any): number => {
    if (!u) return 0;

    const bio = (u.profile?.bio ?? u.bio ?? '').toString().trim();
    const headline = (u.profile?.headline ?? '').toString().trim();
    const skills = Array.isArray(u.profile?.skills)
      ? u.profile.skills
      : (Array.isArray(u.skills) ? u.skills : []);

    const checks = [
      !!u.firstName?.toString().trim(),
      !!u.lastName?.toString().trim(),
      !!u.email?.toString().trim(),
      !!u.telephoneNumber?.toString().trim(),
      !!u.location?.toString().trim(),
      bio.length >= 40,
      !!headline,
      skills.length > 0,
      true, // education is treated as complete in dashboard context
      true, // experience is treated as complete in dashboard context
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

const fetchDashboardData = async () => {
  if (!hasLoadedOnceRef.current) setLoading(true);
  try {
    const skip = withSkipGlobalLoader();
    const dashboardPromise = apiFetch('/api/dashboard', skip);
    const appsPromise =
      user?.id
        ? apiFetch(`/api/applications?applicantId=${user.id}`, skip)
        : Promise.resolve(null);

    const [response, appsRes] = await Promise.all([dashboardPromise, appsPromise]);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.stats) {
      const localProfileCompletion = computeProfileCompletionFromUser(user);
      setStats({
        totalApplications: data.stats.totalApplications ?? 0,
        inProgressCount: data.stats.pendingApplications ?? 0,
        interviewInvitations: data.stats.interviewInvitations ?? 0,
        offersCount: 0,
        // Prefer latest client-side profile state so dashboard reflects immediate saves.
        profileCompletion: localProfileCompletion || data.stats.profileCompletion,
      });
    }

    if (appsRes && 'ok' in appsRes && appsRes.ok) {
      try {
        const appsData = await appsRes.json();
        const apps = Array.isArray(appsData) ? appsData : [];
        const inProgress = apps.filter((app: { status?: string }) => {
          const s = normalizeApplicationStatus(app.status ?? '');
          return s === 'applied' || s === 'pending' || s === 'reviewed';
        }).length;
        const offers = apps.filter(
          (app: { status?: string }) => normalizeApplicationStatus(app.status ?? '') === 'accepted'
        ).length;
        setStats((prev) => ({
          ...prev,
          inProgressCount: inProgress,
          offersCount: offers,
        }));
      } catch {
        // keep API-derived counts
      }
    }

    if (data.recommendedJobs) {
      setRecommendedJobs(data.recommendedJobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company?.name || job.companyName || 'N/A',
        location: job.location || 'Remote',
        skills: Array.isArray(job.skills) ? job.skills : [],
        salary: formatSalaryINR(job.salaryMin, job.salaryMax, job.salary),
        matchPercentage: job.matchPercentage || Math.floor(Math.random() * (98 - 75 + 1) + 75),
        postedTime: job.createdAt 
          ? new Date(job.createdAt).toLocaleDateString()
          : 'Recently',
        isNew: job.createdAt 
          ? (new Date().getTime() - new Date(job.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
          : false,
        type: job.jobType || job.type || 'Full-time',
        applicationsCount: job.applicationsCount || 0,
      })));
    }

    if (data.recentApplications) {
      setRecentApplications(data.recentApplications);

      const hasUnknownRows = data.recentApplications.some(
        (app: any) =>
          !app?.jobTitle ||
          !app?.company ||
          app.jobTitle === 'Unknown Position' ||
          app.company === 'Unknown Company'
      );

      if (hasUnknownRows && user?.id) {
        void (async () => {
          try {
            const appsRes = await apiFetch(`/api/applications?applicantId=${user.id}`, skip);
            if (!appsRes.ok) return;
            const appsData = await appsRes.json();
            const baseRows = (Array.isArray(appsData) ? appsData : [])
              .slice(0, 3)
              .map((app: any) => ({
                id: app.id,
                jobId: app.jobId,
                jobTitle: app?.job?.title || 'Unknown Position',
                company: app?.job?.company?.name || app?.company?.name || 'Unknown Company',
                appliedDate: app.appliedAt,
                status: app.status,
              }));

            const normalizedRecentApplications = await Promise.all(
              baseRows.map(async (row: any) => {
                const needsJobLookup =
                  (!!row.jobId) &&
                  (row.jobTitle === 'Unknown Position' || row.company === 'Unknown Company');

                if (!needsJobLookup) return row;

                try {
                  const jobRes = await apiFetch(`/api/jobs/${row.jobId}`, skip);
                  if (!jobRes.ok) return row;
                  const jobData = await jobRes.json();
                  return {
                    ...row,
                    jobTitle: jobData?.title || row.jobTitle,
                    company: jobData?.company?.name || jobData?.companyName || row.company,
                  };
                } catch {
                  return row;
                }
              })
            );
            setRecentApplications(normalizedRecentApplications);
          } catch {
            // keep initial dashboard payload
          }
        })();
      }
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // If the API fails, use mock data as fallback
    setRecommendedJobs([]);
    setRecentApplications(mockApplications);
  } finally {
    hasLoadedOnceRef.current = true;
    setLoading(false);
  }
};

  useEffect(() => {
    const localProfileCompletion = computeProfileCompletionFromUser(user);
    if (localProfileCompletion > 0) {
      setStats((prev) => ({ ...prev, profileCompletion: localProfileCompletion }));
    }
  }, [user]);

  const toggleSaveJob = (job: Job) => {
    const id = String(job.id);
    if (isJobSaved(id)) {
      removeJob(id);
    } else {
      const record: SavedJobRecord = {
        id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        postedTime: job.postedTime,
        applicants: job.applicationsCount ?? 0,
        matchPercentage: job.matchPercentage,
        skills: job.skills ?? [],
        isNew: job.isNew,
      };
      addJob(record);
    }
  };

  const formatApplicationDate = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const APPLICATION_PIPELINE = ['applied', 'reviewed', 'interview', 'accepted'] as const;

  const getPipelineStepIndex = (status: string) => {
    const normalized = normalizeApplicationStatus(status);
    if (normalized === 'rejected') return 2;
    const idx = APPLICATION_PIPELINE.indexOf(normalized as (typeof APPLICATION_PIPELINE)[number]);
    return idx >= 0 ? idx : 0;
  };

  const getStatusConfig = (status: string) => {
    const normalized = normalizeApplicationStatus(status);
    const configs: Record<
      string,
      { color: string; icon: LucideIcon; label: string; stepColor: string }
    > = {
      applied: {
        color: darkMode
          ? 'bg-sky-500/15 text-sky-300 border-sky-400/30'
          : 'bg-sky-50 text-sky-700 border-sky-200',
        icon: FileText,
        label: getStatusLabel(status),
        stepColor: 'bg-sky-400',
      },
      pending: {
        color: darkMode
          ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
          : 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
        label: getStatusLabel(status),
        stepColor: 'bg-amber-400',
      },
      reviewed: {
        color: darkMode
          ? 'bg-blue-500/15 text-blue-300 border-blue-400/30'
          : 'bg-blue-50 text-blue-700 border-blue-200',
        icon: CheckCircle,
        label: getStatusLabel(status),
        stepColor: 'bg-blue-400',
      },
      interview: {
        color: darkMode
          ? 'bg-violet-500/15 text-violet-300 border-violet-400/30'
          : 'bg-violet-50 text-violet-700 border-violet-200',
        icon: TrendingUp,
        label: getStatusLabel(status),
        stepColor: 'bg-violet-400',
      },
      accepted: {
        color: darkMode
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Award,
        label: getStatusLabel(status),
        stepColor: 'bg-emerald-400',
      },
      rejected: {
        color: darkMode
          ? 'bg-rose-500/15 text-rose-300 border-rose-400/30'
          : 'bg-rose-50 text-rose-700 border-rose-200',
        icon: XCircle,
        label: getStatusLabel(status),
        stepColor: 'bg-rose-400',
      },
    };
    return configs[normalized] || configs.applied;
  };

  type QuickActionItem = {
    id: string;
    icon: LucideIcon;
    title: string;
    description: string;
    gradient: string;
    tab: string;
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'resume',
      icon: Upload,
      title: 'Upload Resume',
      description: 'Keep your profile and applications up to date',
      gradient: 'from-emerald-500 to-teal-600',
      tab: 'profile',
    },
    {
      id: 'browse',
      icon: Search,
      title: 'Browse Jobs',
      description: 'Discover roles matched to your skills',
      gradient: 'from-blue-500 to-indigo-600',
      tab: 'jobs',
    },
    {
      id: 'messages',
      icon: MessageSquare,
      title: 'Check Messages',
      description: 'Reply to recruiters and interview invites',
      gradient: 'from-violet-500 to-purple-600',
      tab: 'messages',
    },
    {
      id: 'activity',
      icon: BarChart3,
      title: 'Career Insights',
      description: 'Review activity and application trends',
      gradient: 'from-amber-500 to-orange-600',
      tab: 'activity',
    },
  ];

  type NavConfigItem = {
    icon: LucideIcon;
    label: string;
    id: string;
    badge?: number;
    hideWhenCollapsed?: boolean;
  };

  const overviewGlassCard = darkMode
    ? 'bg-slate-900/60 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl'
    : 'bg-white/90 border-slate-200/80 shadow-sm';

  type OverviewStatItem = {
    label: string;
    value: string | number;
    hint: string;
    icon: LucideIcon;
    accent: LucideIcon;
    iconGradient: string;
    hoverBorder: string;
    hintTone?: string;
  };

  const overviewStatCards: OverviewStatItem[] = [
    {
      label: 'Total Applications',
      value: stats.totalApplications,
      hint: 'Across all roles you\'ve applied to',
      icon: FileText,
      accent: Zap,
      iconGradient: 'from-blue-500 to-indigo-600',
      hoverBorder: 'hover:border-sky-400/30',
    },
    {
      label: 'In Progress',
      value: stats.inProgressCount,
      hint: 'Sent, in review, or awaiting response',
      icon: Clock,
      accent: Target,
      iconGradient: 'from-amber-500 to-orange-500',
      hoverBorder: 'hover:border-amber-400/30',
    },
    {
      label: 'Interviews',
      value: stats.interviewInvitations,
      hint:
        stats.interviewInvitations > 0 ? 'Active pipeline stage' : 'None scheduled yet',
      icon: TrendingUp,
      accent: Award,
      iconGradient: 'from-emerald-500 to-teal-500',
      hoverBorder: 'hover:border-emerald-400/30',
      hintTone: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Offers',
      value: stats.offersCount,
      hint:
        stats.offersCount > 0
          ? `${stats.offersCount} offer${stats.offersCount === 1 ? '' : 's'} received`
          : 'Keep applying — you\'re close',
      icon: Briefcase,
      accent: Sparkles,
      iconGradient: 'from-violet-500 to-purple-600',
      hoverBorder: 'hover:border-violet-400/30',
      hintTone: 'text-violet-600 dark:text-violet-400',
    },
  ];

  const navItems: NavConfigItem[] = [
    { icon: Home, label: 'Overview', id: 'overview' },
    { icon: Search, label: 'Browse Jobs', id: 'jobs' },
    {
      icon: FileText,
      label: 'Applications',
      id: 'applications',
      badge: stats.totalApplications > 0 ? stats.totalApplications : undefined,
    },
    {
      icon: Bookmark,
      label: 'Saved Jobs',
      id: 'saved',
      badge: savedJobs.length > 0 ? savedJobs.length : undefined,
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      id: 'messages',
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
    { icon: User, label: 'Profile', id: 'profile' },
    {
      icon: Sparkles,
      label: 'Activity',
      id: 'activity',
      badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
      hideWhenCollapsed: true,
    },
    { icon: Settings, label: 'Settings', id: 'settings' },
  ];

  const formatNavBadge = (value: number) => (value > 99 ? '99+' : String(value));

  const NavBadge = ({
    value,
    collapsed,
  }: {
    value: number;
    collapsed: boolean;
  }) => (
    <span
      className={cn(
        'flex items-center justify-center font-bold leading-none',
        collapsed
          ? 'absolute -top-1 -right-1 z-10 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[10px] shadow-sm ring-2'
          : 'px-2 py-0.5 min-w-[1.25rem] rounded-full text-xs',
        darkMode
          ? 'bg-sky-400 text-slate-950 ring-slate-950'
          : 'bg-blue-600 text-white ring-white'
      )}
      aria-hidden
    >
      {formatNavBadge(value)}
    </span>
  );

  const NavItem = ({ icon: Icon, label, id, badge, hideWhenCollapsed }: NavConfigItem) => {
    if (!sidebarOpen && hideWhenCollapsed) return null;

    const isActive = activeTab === id;
    const tooltipText =
      badge != null && badge > 0 ? `${label} (${formatNavBadge(badge)})` : label;

    const button = (
      <button
        type="button"
        onClick={() => switchToTab(id)}
        aria-label={tooltipText}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'w-full flex items-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          sidebarOpen ? 'justify-between gap-2 px-3 py-2.5' : 'justify-center h-11 px-0',
          isActive
            ? darkMode
              ? 'bg-sky-400/10 text-sky-300 shadow-sm ring-1 ring-inset ring-sky-400/25'
              : 'bg-blue-50 text-blue-700 shadow-sm'
            : darkMode
              ? 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          !sidebarOpen &&
            isActive &&
            (darkMode
              ? 'ring-1 ring-inset ring-sky-400/35'
              : 'ring-1 ring-inset ring-blue-200')
        )}
      >
        <div
          className={cn(
            'flex items-center min-w-0',
            sidebarOpen ? 'gap-3' : 'justify-center'
          )}
        >
          <span
            className={cn(
              'relative flex shrink-0 items-center justify-center',
              sidebarOpen ? 'w-5 h-5' : 'w-10 h-10'
            )}
          >
            <Icon className="w-5 h-5" aria-hidden />
            {!sidebarOpen && badge != null && badge > 0 && (
              <NavBadge value={badge} collapsed />
            )}
          </span>
          {sidebarOpen && (
            <span className="font-medium truncate">{label}</span>
          )}
        </div>
        {sidebarOpen && badge != null && badge > 0 && (
          <NavBadge value={badge} collapsed={false} />
        )}
      </button>
    );

    if (!sidebarOpen) {
      return (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={12}
            className={cn(
              'font-medium border shadow-lg',
              darkMode
                ? 'bg-slate-900 text-slate-100 border-white/10'
                : 'bg-white text-gray-900 border-gray-200'
            )}
          >
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  const JobCard: React.FC<{ job: Job }> = ({ job }) => {
    const isSaved = isJobSaved(String(job.id));
    const matchGradientId = `match-${job.id}`;

    return (
      <article
        className={cn(
          'group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5',
          overviewGlassCard,
          darkMode
            ? 'hover:border-sky-400/30 hover:shadow-[0_16px_48px_rgba(56,189,248,0.08)]'
            : 'hover:border-blue-200 hover:shadow-md'
        )}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600">
              {job.company.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <h3
                  className={cn(
                    'text-base font-bold line-clamp-2 transition-colors',
                    darkMode ? 'text-slate-50 group-hover:text-sky-200' : 'text-slate-900 group-hover:text-blue-700'
                  )}
                >
                  {job.title}
                </h3>
                {job.isNew && (
                  <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    New
                  </span>
                )}
              </div>
              <p className={cn('mt-0.5 text-sm font-medium', darkMode ? 'text-slate-400' : 'text-slate-600')}>
                {job.company}
              </p>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48" aria-hidden>
                  <circle cx="24" cy="24" r="20" stroke={darkMode ? '#334155' : '#e2e8f0'} strokeWidth="3" fill="none" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke={`url(#${matchGradientId})`}
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${job.matchPercentage * 1.26} 126`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient id={matchGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span
                  className={cn(
                    'absolute inset-0 flex items-center justify-center text-[11px] font-bold',
                    darkMode ? 'text-slate-50' : 'text-slate-900'
                  )}
                >
                  {job.matchPercentage}%
                </span>
              </div>
              <span className={cn('text-[10px] font-medium mt-0.5', darkMode ? 'text-slate-500' : 'text-slate-500')}>
                Match
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                darkMode
                  ? 'bg-white/[0.06] text-slate-400 border border-white/10'
                  : 'bg-slate-50 text-slate-600 border border-slate-100'
              )}
            >
              <MapPin className="w-3 h-3 shrink-0" />
              {job.location}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                darkMode
                  ? 'bg-white/[0.06] text-slate-400 border border-white/10'
                  : 'bg-slate-50 text-slate-600 border border-slate-100'
              )}
            >
              <Briefcase className="w-3 h-3 shrink-0" />
              {job.type}
            </span>
            {(job.skills ?? []).slice(0, 2).map((skill) => (
              <span
                key={skill}
                className={cn(
                  'px-2 py-1 text-xs font-semibold rounded-md border',
                  darkMode
                    ? 'bg-sky-400/10 text-sky-300 border-sky-400/20'
                    : 'bg-blue-50 text-blue-700 border-blue-100'
                )}
              >
                {skill}
              </span>
            ))}
          </div>

          <div
            className={cn(
              'flex items-center justify-between gap-3 pt-3 border-t',
              darkMode ? 'border-white/10' : 'border-slate-100'
            )}
          >
            <div className="min-w-0">
              <p className={cn('text-sm font-bold truncate', darkMode ? 'text-slate-50' : 'text-slate-900')}>
                {job.salary}
              </p>
              <p className={cn('text-[11px] mt-0.5', darkMode ? 'text-slate-500' : 'text-slate-500')}>
                {job.applicationsCount} applicants · {job.postedTime}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleSaveJob(job)}
                aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
                className={cn(
                  'p-2 rounded-lg border transition-all',
                  isSaved
                    ? darkMode
                      ? 'border-rose-400/35 bg-rose-400/10 text-rose-300'
                      : 'border-rose-300 bg-rose-50 text-rose-600'
                    : darkMode
                      ? 'border-white/10 text-slate-400 hover:border-rose-400/35 hover:bg-rose-400/10 hover:text-rose-300'
                      : 'border-slate-200 text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600'
                )}
              >
                <Heart className={cn('w-4 h-4', isSaved && 'fill-current')} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJob(job);
                  setShowQuickApply(true);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                Quick Apply
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const overviewSkeletonPulse = darkMode ? 'bg-white/10 animate-pulse' : 'bg-slate-200/80 animate-pulse';

  return (
    <>
    <div className={`min-h-screen w-screen transition-colors duration-300 fixed inset-0 ${
      darkMode ? 'bg-[#070b14] text-slate-100' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'
    } overflow-x-hidden`}>
  <div className="pointer-events-none absolute inset-0">
    <div className={`${darkMode ? 'opacity-100' : 'opacity-70'} absolute inset-0 bg-[radial-gradient(1100px_460px_at_18%_-12%,rgba(56,189,248,0.16),transparent_58%),radial-gradient(900px_420px_at_88%_-8%,rgba(99,102,241,0.16),transparent_60%),linear-gradient(to_bottom,rgba(15,23,42,0.2),transparent)]`} />
    <div className={`${darkMode ? 'opacity-90' : 'opacity-50'} absolute inset-0 bg-[radial-gradient(900px_360px_at_55%_120%,rgba(124,58,237,0.13),transparent_60%)]`} />
    {darkMode && <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30" />}
  </div>
  {/* Top Navbar */}
  <nav className={`${darkMode ? 'bg-slate-950/70 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.35)]' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border-b fixed top-0 left-0 right-0 z-50`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
                    {/* back button removed */}
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          setMobileSidebarOpen((prev) => !prev);
                        } else {
                          setSidebarOpen(!sidebarOpen);
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition-all ${
                        darkMode
                          ? 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                          : 'bg-white/70 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-label={mobileSidebarOpen || sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                      aria-expanded={mobileSidebarOpen || sidebarOpen}
                      aria-controls="employee-dashboard-sidebar"
                    >
                      <Menu className="w-5 h-5" aria-hidden />
                    </button>
              
              <div className="min-w-0">
                <h1 className={`text-2xl font-bold ${
                  darkMode ? 'text-slate-50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
                } truncate`}>
                  {t("employee.dashboard.welcomeBack")}, {user?.firstName}! 👋
                </h1>
                <p className={`${darkMode ? 'text-slate-400' : 'text-gray-600'} truncate`}>
                  Let's find your dream job today
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={() => switchToTab('profile')}
                className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all max-w-[220px] ${
                  darkMode
                    ? 'bg-gray-700/40 border-gray-600 hover:bg-gray-700 text-gray-200'
                    : 'bg-white/80 border-gray-200 hover:bg-white text-gray-700'
                }`}
                title="Open profile"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md overflow-hidden flex-shrink-0">
                  {avatarSrc && !avatarLoadFailed ? (
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    <>{user?.firstName?.[0] || 'A'}{user?.lastName?.[0] || ''}</>
                  )}
                </div>
                <span className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.firstName} {user?.lastName}
                </span>
              </button>

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-2.5 rounded-xl transition-all ${
                  darkMode ? 'text-slate-300 hover:bg-white/[0.08]' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative notifications-dropdown">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowMessages(false);
                  }}
                  className={`relative p-2.5 rounded-xl transition-all ${
                    darkMode ? 'text-slate-300 hover:bg-white/[0.08]' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Bell className="w-6 h-6" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border py-2 z-50 overflow-hidden ${
                    darkMode ? 'bg-slate-950/95 border-white/10 shadow-black/40' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notifications
                      </h3>
                      <div className="flex items-center gap-2">
                        {apiNotifications.some((n: AppNotification) => !n.isRead) && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await markAllNotificationsRead();
                              queryClient.invalidateQueries({ queryKey: ['notifications'] });
                              queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
                          >
                            Mark all as read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNotifications(false);
                            switchToTab('activity');
                          }}
                          className="text-sm text-violet-600 hover:text-violet-700 px-2 py-1 rounded"
                        >
                          View all
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {apiNotifications.length === 0 ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          No notifications
                        </div>
                      ) : (
                        apiNotifications.slice(0, 8).map((notification: AppNotification) => (
                          <div
                            key={notification.id}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!notification.isRead) {
                                await markNotificationRead(notification.id);
                                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                                queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
                              }
                              setShowNotifications(false);
                              if (notification.linkTab) switchToTab(notification.linkTab);
                            }}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                              !notification.isRead
                                ? darkMode
                                  ? 'bg-blue-500/10 hover:bg-blue-500/20'
                                  : 'bg-blue-50 hover:bg-blue-100'
                                : darkMode
                                ? 'hover:bg-gray-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <p className={`text-sm ${!notification.isRead && 'font-semibold'} ${
                              darkMode ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-xs mt-0.5 line-clamp-2 ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {notification.body}
                            </p>
                            <p className={`text-xs mt-1 ${
                              darkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative messages-dropdown">
                <button 
                  onClick={() => {
                    setShowMessages(!showMessages);
                    setShowNotifications(false);
                  }}
                  className={`relative p-2.5 rounded-xl transition-all ${
                    darkMode ? 'text-slate-300 hover:bg-white/[0.08]' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <MessageSquare className="w-6 h-6" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute top-1 right-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </button>

                {showMessages && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border py-2 z-50 overflow-hidden ${
                    darkMode ? 'bg-slate-950/95 border-white/10 shadow-black/40' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Messages
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMessages(false);
                            switchToTab('messages');
                          }}
                          className="text-sm text-violet-600 hover:text-violet-700 px-2 py-1 rounded"
                        >
                          Open inbox
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {headerMessagePreviews.length === 0 ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          No messages yet
                        </div>
                      ) : (
                        headerMessagePreviews.map((message, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              switchToTab('messages');
                              setShowMessages(false);
                            }}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                              !message.read
                                ? darkMode
                                  ? 'bg-blue-500/10 hover:bg-blue-500/20'
                                  : 'bg-blue-50 hover:bg-blue-100'
                                : darkMode
                                ? 'hover:bg-gray-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <p className={`text-sm font-semibold ${
                              darkMode ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {message.from}
                            </p>
                            <p className={`text-sm truncate ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {message.text}
                            </p>
                            <p className={`text-xs mt-1 ${
                              darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {message.time}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowMessages(false); // Close the dropdown first
                          switchToTab('messages');
                        }}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                          darkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        View All Messages
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                  darkMode
                    ? 'bg-rose-400/10 hover:bg-rose-400/15 text-rose-200 border border-rose-300/20'
                    : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                }`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

  <div className="flex mt-[4.5rem] relative h-[calc(100vh-4.5rem)] overflow-hidden min-w-0">
        {/* Sidebar */}
        <aside
          id="employee-dashboard-sidebar"
          aria-label="Employee dashboard navigation"
          className={cn(
            'hidden lg:block h-full shrink-0 border-r transition-[width] duration-300 ease-in-out',
            sidebarOpen ? 'lg:w-72' : 'lg:w-[4.5rem]',
            darkMode ? 'bg-slate-950/55 border-white/10 backdrop-blur-xl shadow-[18px_0_60px_rgba(0,0,0,0.22)]' : 'bg-white border-gray-200'
          )}
        >
          <TooltipProvider delayDuration={200}>
          <div
            className={cn(
              'space-y-6 h-full overflow-y-auto overflow-x-visible',
              sidebarOpen ? 'p-6' : 'px-2 py-4'
            )}
          >
            {/* Quick Stats */}
            {sidebarOpen && <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                darkMode ? 'text-slate-500' : 'text-gray-500'
              }`}>
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                  <FileText className={`w-5 h-5 mb-1 ${darkMode ? 'text-sky-300' : 'text-blue-600'}`} />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-slate-50' : 'text-gray-900'}`}>
                    {stats.totalApplications}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Applications</p>
                </div>
                <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                  <TrendingUp className={`w-5 h-5 mb-1 ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`} />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-slate-50' : 'text-gray-900'}`}>
                    {stats.interviewInvitations}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Interviews</p>
                </div>
              </div>
            </div>}

            {/* Navigation */}
            <div>
              <h3
                className={cn(
                  'text-xs font-semibold uppercase tracking-wider mb-3',
                  darkMode ? 'text-slate-500' : 'text-gray-500',
                  sidebarOpen ? '' : 'sr-only'
                )}
              >
                Navigation
              </h3>
              <nav
                className={cn('space-y-1.5', !sidebarOpen && 'w-full')}
                aria-label="Dashboard sections"
              >
                {navItems.map((item) => (
                  <NavItem key={item.id} {...item} />
                ))}
              </nav>
            </div>


          </div>
          </TooltipProvider>
        </aside>

        {mobileSidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px]"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden
          />
        )}

        <aside
          aria-label="Mobile employee dashboard navigation"
          className={cn(
            'lg:hidden absolute left-0 top-0 bottom-0 z-50 w-[min(20rem,85vw)] border-r transition-transform duration-300 ease-out',
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            darkMode ? 'bg-slate-950/95 border-white/10 backdrop-blur-xl' : 'bg-white border-gray-200'
          )}
        >
          <TooltipProvider delayDuration={200}>
            <div className="space-y-6 h-full overflow-y-auto overflow-x-hidden p-5">
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                  darkMode ? 'text-slate-500' : 'text-gray-500'
                }`}>
                  Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                    <FileText className={`w-5 h-5 mb-1 ${darkMode ? 'text-sky-300' : 'text-blue-600'}`} />
                    <p className={`text-2xl font-bold ${darkMode ? 'text-slate-50' : 'text-gray-900'}`}>
                      {stats.totalApplications}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Applications</p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                    <TrendingUp className={`w-5 h-5 mb-1 ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    <p className={`text-2xl font-bold ${darkMode ? 'text-slate-50' : 'text-gray-900'}`}>
                      {stats.interviewInvitations}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Interviews</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={cn(
                  'text-xs font-semibold uppercase tracking-wider mb-3',
                  darkMode ? 'text-slate-500' : 'text-gray-500'
                )}>
                  Navigation
                </h3>
                <nav className="space-y-1.5" aria-label="Dashboard sections">
                  {navItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => switchToTab(item.id)}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                          isActive
                            ? darkMode
                              ? 'bg-sky-400/10 text-sky-300 shadow-sm ring-1 ring-inset ring-sky-400/25'
                              : 'bg-blue-50 text-blue-700 shadow-sm'
                            : darkMode
                              ? 'text-slate-300 hover:bg-white/[0.06] hover:text-slate-100'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <ItemIcon className="w-5 h-5 shrink-0" aria-hidden />
                          <span className="font-medium truncate">{item.label}</span>
                        </span>
                        {item.badge != null && item.badge > 0 && (
                          <NavBadge value={item.badge} collapsed={false} />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </TooltipProvider>
        </aside>

        {/* Main Content */}
        <main
          data-dashboard-scroll-root
          className={cn(
            'relative flex-1 min-h-0 min-w-0 w-full px-4 sm:px-6',
            activeTab === 'messages'
              ? 'py-4 overflow-hidden flex flex-col h-full'
              : 'py-5 sm:py-6 overflow-y-auto min-h-[calc(100vh-4.5rem)]',
            activeTab !== 'messages' &&
              (darkMode
                ? 'bg-transparent'
                : 'bg-gradient-to-br from-slate-50/90 via-blue-50/50 to-indigo-50/40'),
          )}
        >
          {activeTab === 'jobs' ? (
            <div className="w-full">
              <BrowseJobsPage embedded />
            </div>
          ) : activeTab === 'applications' ? (
            <div className="w-full">
              <ApplicationsPage embedded onNavigateTab={switchToTab} />
            </div>
          ) : activeTab === 'saved' ? (
            <div className="w-full">
              <SavedJobsPage embedded onNavigateTab={switchToTab} />
            </div>
          ) : activeTab === 'messages' ? (
            <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
              <MessagesPage embedded />
            </div>
          ) : activeTab === 'profile' ? (
            <div className="w-full">
              <ProfilePage embedded />
            </div>
          ) : activeTab === 'activity' ? (
            <div className="w-full">
              <ActivityPage embedded onNavigateTab={switchToTab} />
            </div>
          ) : activeTab === 'settings' ? (
            <div className="w-full">
              <SettingsPage embedded />
            </div>
          ) : (
          <div className="w-full space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn('rounded-2xl border p-4', overviewGlassCard)}
                    >
                      <div className={cn('h-9 w-9 rounded-lg mb-3', overviewSkeletonPulse)} />
                      <div className={cn('h-3 w-20 rounded mb-2', overviewSkeletonPulse)} />
                      <div className={cn('h-8 w-12 rounded mb-2', overviewSkeletonPulse)} />
                      <div className={cn('h-3 w-full rounded', overviewSkeletonPulse)} />
                    </div>
                  ))
                : overviewStatCards.map((stat) => {
                const Icon = stat.icon;
                const Accent = stat.accent;
                return (
                  <div
                    key={stat.label}
                    className={cn(
                      'rounded-2xl border p-4 transition-all group',
                      overviewGlassCard,
                      stat.hoverBorder,
                      darkMode && 'hover:bg-slate-900/75'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={cn(
                          'p-2 bg-gradient-to-br rounded-lg shadow-md group-hover:scale-105 transition-transform',
                          stat.iconGradient
                        )}
                      >
                        <Icon className="w-4 h-4 text-white" aria-hidden />
                      </div>
                      <Accent
                        className={cn('w-4 h-4', darkMode ? 'text-slate-500' : 'text-slate-400')}
                        aria-hidden
                      />
                    </div>
                    <p
                      className={cn(
                        'text-xs font-medium mb-0.5',
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                      )}
                    >
                      {stat.label}
                    </p>
                    <p
                      className={cn(
                        'text-2xl font-bold tracking-tight',
                        darkMode ? 'text-slate-50' : 'text-slate-900'
                      )}
                    >
                      {stat.value}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] font-medium mt-1.5 line-clamp-2',
                        stat.hintTone ?? (darkMode ? 'text-slate-500' : 'text-slate-500')
                      )}
                    >
                      {stat.hint}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className={cn('rounded-2xl border p-4 sm:p-5', overviewGlassCard)}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search
                    className={cn(
                      'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                      darkMode ? 'text-slate-500' : 'text-slate-400'
                    )}
                    aria-hidden
                  />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                      darkMode
                        ? 'bg-white/[0.06] border-white/10 text-slate-50 placeholder-slate-500 focus:bg-white/[0.08]'
                        : 'bg-slate-50/80 border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-white'
                    )}
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={cn(
                      'px-4 py-2.5 border rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                      darkMode
                        ? 'border-white/10 hover:bg-white/[0.08] text-slate-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                    )}
                  >
                    <Filter className="w-4 h-4" aria-hidden />
                    Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => switchToTab('jobs')}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20"
                  >
                    <Search className="w-4 h-4" aria-hidden />
                    Search Jobs
                  </button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div
                  className={cn(
                    'grid grid-cols-1 md:grid-cols-3 gap-3 p-3 mt-3 rounded-xl border',
                    darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50/90 border-slate-200'
                  )}
                >
                  <div>
                    <label
                      className={cn(
                        'block text-xs font-medium mb-1.5',
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      )}
                    >
                      Job Type
                    </label>
                    <select
                      className={cn(
                        'w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500',
                        darkMode
                          ? 'bg-slate-950/60 border-white/10 text-slate-50'
                          : 'bg-white border-slate-200 text-slate-900'
                      )}
                    >
                      <option>All Types</option>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Remote</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className={cn(
                        'block text-xs font-medium mb-1.5',
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      )}
                    >
                      Location
                    </label>
                    <select
                      className={cn(
                        'w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500',
                        darkMode
                          ? 'bg-slate-950/60 border-white/10 text-slate-50'
                          : 'bg-white border-slate-200 text-slate-900'
                      )}
                    >
                      <option>Any Location</option>
                      <option>Remote</option>
                      <option>On-site</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className={cn(
                        'block text-xs font-medium mb-1.5',
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      )}
                    >
                      Experience Level
                    </label>
                    <select
                      className={cn(
                        'w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500',
                        darkMode
                          ? 'bg-slate-950/60 border-white/10 text-slate-50'
                          : 'bg-white border-slate-200 text-slate-900'
                      )}
                    >
                      <option>Any Level</option>
                      <option>Entry Level</option>
                      <option>Mid Level</option>
                      <option>Senior Level</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Recommended Jobs Section */}            {/* Recommended Jobs Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    className={cn(
                      'text-xl font-bold',
                      darkMode ? 'text-slate-50' : 'text-slate-900'
                    )}
                  >
                    Recommended For You
                  </h2>
                  <p className={cn('text-sm mt-0.5', darkMode ? 'text-slate-400' : 'text-slate-600')}>
                    Jobs that match your profile and preferences
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchToTab('jobs')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    darkMode
                      ? 'text-sky-300 hover:bg-sky-400/10 ring-1 ring-inset ring-sky-400/20'
                      : 'text-blue-600 hover:bg-blue-50'
                  )}
                >
                  View All
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn('rounded-2xl border p-5 space-y-3', overviewGlassCard)}
                      >
                        <div className={cn('h-5 w-3/4 rounded', overviewSkeletonPulse)} />
                        <div className={cn('h-4 w-1/2 rounded', overviewSkeletonPulse)} />
                        <div className={cn('h-4 w-full rounded', overviewSkeletonPulse)} />
                        <div className={cn('h-9 w-full rounded-xl mt-2', overviewSkeletonPulse)} />
                      </div>
                    ))
                  : recommendedJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>

            {/* Recent Applications and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Recent Applications */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-50' : 'text-gray-900'}`}>
                      Recent Applications
                    </h2>
                    <p className={darkMode ? 'text-slate-400' : 'text-gray-600'}>
                      Track your job application status
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchToTab('applications')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                      darkMode
                        ? 'text-sky-300 hover:bg-sky-400/10 ring-1 ring-inset ring-sky-400/20'
                        : 'text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn('rounded-2xl border p-5 space-y-3', overviewGlassCard)}
                      >
                        <div className="flex justify-between gap-4">
                          <div className={cn('h-5 w-48 rounded', overviewSkeletonPulse)} />
                          <div className={cn('h-6 w-20 rounded-full', overviewSkeletonPulse)} />
                        </div>
                        <div className={cn('h-4 w-32 rounded', overviewSkeletonPulse)} />
                        <div className={cn('h-2 w-full rounded-full', overviewSkeletonPulse)} />
                      </div>
                    ))
                  ) : recentApplications.length === 0 ? (
                    <div
                      className={cn(
                        'rounded-2xl border p-10 text-center',
                        darkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white border-gray-100 shadow-sm'
                      )}
                    >
                      <FileText className={cn('w-10 h-10 mx-auto mb-3', darkMode ? 'text-slate-500' : 'text-gray-400')} />
                      <p className={cn('font-semibold', darkMode ? 'text-slate-200' : 'text-gray-900')}>No applications yet</p>
                      <p className={cn('text-sm mt-1 mb-4', darkMode ? 'text-slate-400' : 'text-gray-600')}>
                        Apply to recommended jobs to see status updates here.
                      </p>
                      <button
                        type="button"
                        onClick={() => switchToTab('jobs')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all"
                      >
                        Browse Jobs
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    recentApplications.map((application) => {
                      const statusConfig = getStatusConfig(application.status);
                      const StatusIcon = statusConfig.icon;
                      const normalizedStatus = normalizeApplicationStatus(application.status);
                      const pipelineIndex = getPipelineStepIndex(application.status);
                      const isTerminal =
                        normalizedStatus === 'rejected' || normalizedStatus === 'accepted';
                      const companyLabel =
                        application.company === 'Unknown Company'
                          ? 'Company details pending'
                          : application.company;
                      const jobTitle =
                        application.jobTitle === 'Unknown Position'
                          ? `Application #${application.id}`
                          : application.jobTitle;
                      const statusHint =
                        DEFAULT_STATUS_EXPLANATIONS[normalizedStatus] ??
                        DEFAULT_STATUS_EXPLANATIONS.applied;

                      return (
                        <button
                          key={application.id}
                          type="button"
                          onClick={() => switchToTab('applications')}
                          className={cn(
                            'group w-full text-left rounded-2xl border p-4 sm:p-5 transition-all duration-200',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                            darkMode
                              ? 'bg-slate-900/60 border-white/10 hover:border-sky-400/35 hover:bg-slate-900/80 shadow-[0_12px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_16px_48px_rgba(56,189,248,0.08)]'
                              : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg'
                          )}
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-4 min-w-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/25">
                                {companyLabel.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <h3
                                      className={cn(
                                        'font-bold text-base sm:text-lg truncate transition-colors',
                                        darkMode
                                          ? 'text-slate-50 group-hover:text-sky-200'
                                          : 'text-gray-900 group-hover:text-blue-700'
                                      )}
                                    >
                                      {jobTitle}
                                    </h3>
                                    <p
                                      className={cn(
                                        'text-sm font-medium truncate mt-0.5',
                                        darkMode ? 'text-slate-400' : 'text-gray-600'
                                      )}
                                    >
                                      {companyLabel}
                                    </p>
                                  </div>
                                  <div
                                    className={cn(
                                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold shrink-0',
                                      statusConfig.color
                                    )}
                                  >
                                    <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden />
                                    {statusConfig.label}
                                  </div>
                                </div>
                                <div
                                  className={cn(
                                    'flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm',
                                    darkMode ? 'text-slate-500' : 'text-gray-500'
                                  )}
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" aria-hidden />
                                    Applied {formatApplicationDate(application.appliedDate)}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5" aria-hidden />
                                    {isTerminal
                                      ? normalizedStatus === 'accepted'
                                        ? 'Pipeline complete'
                                        : 'Application closed'
                                      : `Step ${pipelineIndex + 1} of ${APPLICATION_PIPELINE.length}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-1" aria-label="Application progress">
                                {APPLICATION_PIPELINE.map((step, idx) => {
                                  const filled = idx <= pipelineIndex;
                                  return (
                                    <div key={step} className="flex-1">
                                      <div
                                        className={cn(
                                          'h-1.5 rounded-full transition-all duration-300',
                                          filled
                                            ? normalizedStatus === 'rejected' && idx === pipelineIndex
                                              ? 'bg-rose-400'
                                              : statusConfig.stepColor
                                            : darkMode
                                              ? 'bg-white/10'
                                              : 'bg-gray-200'
                                        )}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <p
                                  className={cn(
                                    'text-xs sm:text-sm line-clamp-2 flex-1',
                                    darkMode ? 'text-slate-400' : 'text-gray-600'
                                  )}
                                >
                                  {statusHint}
                                </p>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 text-xs font-semibold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                                    darkMode ? 'text-sky-300' : 'text-blue-600'
                                  )}
                                >
                                  Details
                                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <div className="mb-6">
                  <h2 className={cn('text-2xl font-bold', darkMode ? 'text-slate-50' : 'text-gray-900')}>
                    Quick Actions
                  </h2>
                  <p className={cn('text-sm mt-1', darkMode ? 'text-slate-400' : 'text-gray-600')}>
                    Shortcuts to move your search forward
                  </p>
                </div>

                <div
                  className={cn(
                    'rounded-3xl border p-4 space-y-3',
                    darkMode
                      ? 'bg-slate-900/60 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.25)]'
                      : 'bg-white border-gray-100 shadow-lg'
                  )}
                >
                  {quickActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => switchToTab(action.tab)}
                        className={cn(
                          'group w-full rounded-2xl border p-4 text-left transition-all duration-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
                          darkMode
                            ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-violet-400/30 hover:shadow-[0_8px_32px_rgba(124,58,237,0.12)]'
                            : 'bg-gray-50/80 border-gray-100 hover:bg-white hover:border-indigo-200 hover:shadow-md'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'p-3 rounded-xl bg-gradient-to-br shadow-lg shrink-0 transition-transform duration-200 group-hover:scale-105',
                              action.gradient
                            )}
                          >
                            <ActionIcon className="w-5 h-5 text-white" aria-hidden />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className={cn(
                                'font-bold text-sm sm:text-base transition-colors',
                                darkMode
                                  ? 'text-slate-50 group-hover:text-violet-200'
                                  : 'text-gray-900 group-hover:text-indigo-700'
                              )}
                            >
                              {action.title}
                            </h3>
                            <p
                              className={cn(
                                'text-xs sm:text-sm mt-0.5 line-clamp-2',
                                darkMode ? 'text-slate-400' : 'text-gray-600'
                              )}
                            >
                              {action.description}
                            </p>
                          </div>
                          <ChevronRight
                            className={cn(
                              'w-5 h-5 shrink-0 transition-all duration-200',
                              'opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5',
                              darkMode
                                ? 'text-slate-400 group-hover:text-violet-300'
                                : 'text-gray-400 group-hover:text-indigo-600'
                            )}
                            aria-hidden
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          )}
        </main>
      </div>
    </div>

    {/* Quick Apply Modal */}
    {selectedJob && (
      <QuickApplyModal
        isOpen={showQuickApply}
        onClose={() => {
          setShowQuickApply(false);
          setSelectedJob(null);
        }}
        jobId={selectedJob.id}
        jobTitle={selectedJob.title}
        companyName={selectedJob.company}
        matchPercentage={selectedJob.matchPercentage}
      />
    )}
    </>
  );
};

export default EmployeeDashboard;
