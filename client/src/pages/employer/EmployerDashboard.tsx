import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from '@/lib/api';
import { LogoLoader } from '@/components/LogoLoader';
import {
  applicantDisplayName,
  computeApplicationStats,
  fetchEmployerApplications,
  fetchEmployerJobs,
  mapToEmployerTabStatus,
  resolveApplicantSkills,
} from '@/lib/employer-service';
import { formatRelativeTime } from '@/lib/notifications-service';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import { cn } from '@/lib/utils';
import { employerPageTitleClass } from '@/lib/employer-page-styles';
import { useToast } from "@/hooks/use-toast";
import JobManagement from './job-management';
import ApplicationsPage from './applications';
import MessagesPage from './messages';
import AnalyticsPage from './analytics';
import StoriesPage from './stories';
import ProfilePage from './profile';
import SettingsPage from './settings';
import AgentsPage from '../agents';

import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

import {
  Briefcase, Users, TrendingUp, Clock, MoreVertical,
  MapPin, DollarSign, Calendar, Eye, Settings, LogOut, Menu, X,
  Home, BarChart3, User, Star, ChevronDown, ChevronLeft, ChevronRight, Edit, Pause, Play,
  Trash2, Copy, CheckCircle, ArrowRight, Target, Award, Mail,
  Bell, Search, UserCircle, Sparkles, Loader2, XCircle, Bot
} from 'lucide-react';
import { DialogHeader } from '@/components/ui/dialog';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  postedDate: string;
  applications: number;
  newApplications: number;
  status: 'active' | 'paused' | 'closed';
  views: number;
}

interface Application {
  id: string;
  candidateName: string;
  candidatePhoto?: string;
  jobTitle: string;
  appliedDate: string;
  appliedAt?: string;
  matchScore: number;
  status: 'new' | 'reviewing' | 'shortlisted' | 'interview' | 'rejected';
  skills: string[];
}

const PIPELINE_STAGE_META: {
  stage: string;
  short: string;
  bar: string;
  glow: string;
  ring: string;
}[] = [
    { stage: 'New Applications', short: 'New', bar: 'from-sky-400 to-blue-500', glow: 'shadow-sky-500/30', ring: 'ring-sky-400/40' },
    { stage: 'Under Review', short: 'Review', bar: 'from-violet-400 to-purple-500', glow: 'shadow-violet-500/30', ring: 'ring-violet-400/40' },
    { stage: 'Shortlisted', short: 'Shortlist', bar: 'from-fuchsia-400 to-pink-500', glow: 'shadow-fuchsia-500/30', ring: 'ring-fuchsia-400/40' },
    { stage: 'Interview', short: 'Interview', bar: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/30', ring: 'ring-amber-400/40' },
    { stage: 'Hired', short: 'Hired', bar: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/30', ring: 'ring-emerald-400/40' },
  ];

const ACTIVITY_STYLES: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  blue: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    ring: 'ring-blue-400/25',
    dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]',
  },
  purple: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    ring: 'ring-purple-400/25',
    dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]',
  },
  emerald: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    ring: 'ring-emerald-400/25',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
  },
  indigo: {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    ring: 'ring-indigo-400/25',
    dot: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]',
  },
  rose: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    ring: 'ring-rose-400/25',
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]',
  },
};

/** Shared dashboard card typography */
const widgetTitle = 'text-lg font-extrabold tracking-tight';
const widgetSubtitle = 'text-sm font-medium';
const widgetBody = 'text-sm';
const widgetMeta = 'text-sm';

function WidgetShine({ darkMode }: { darkMode: boolean }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 h-px',
        darkMode
          ? 'bg-gradient-to-r from-transparent via-white/15 to-transparent'
          : 'bg-gradient-to-r from-transparent via-slate-300/70 to-transparent',
      )}
    />
  );
}

function buildWeekActivity(applications: Application[]) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOffset = now.getDay() === 0 ? 6 : now.getDay() - 1;
  startOfWeek.setDate(now.getDate() - dayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const prevWeekStart = new Date(startOfWeek);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  let thisWeek = 0;
  let prevWeek = 0;

  for (const app of applications) {
    const raw = app.appliedAt ?? app.appliedDate;
    const applied = new Date(raw);
    if (Number.isNaN(applied.getTime())) continue;

    if (applied >= startOfWeek) {
      const idx = applied.getDay() === 0 ? 6 : applied.getDay() - 1;
      counts[idx] += 1;
      thisWeek += 1;
    } else if (applied >= prevWeekStart && applied < startOfWeek) {
      prevWeek += 1;
    }
  }

  const chart = labels.map((name, i) => ({ name, value: counts[i] }));
  const peak = Math.max(...counts, 1);
  const trendPct =
    prevWeek === 0
      ? thisWeek > 0
        ? 100
        : null
      : Math.round(((thisWeek - prevWeek) / prevWeek) * 100);

  return { chart, thisWeek, peak, trendPct };
}

const EmployerDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const premiumSurface = darkMode
    ? 'bg-gray-800/50 border-gray-700'
    : 'bg-white/90 border-slate-200/90 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]';
  const premiumInset = darkMode
    ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500'
    : 'bg-gradient-to-b from-slate-50 to-white border-slate-200 hover:border-indigo-200';
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJobPage, setCurrentJobPage] = useState(1);
  const jobsPerPage = 3;

  const indexOfLastJob = currentJobPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = jobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalJobPages = Math.ceil(jobs.length / jobsPerPage);

  const [applications, setApplications] = useState<Application[]>([]);
  const [currentAppPage, setCurrentAppPage] = useState(1);
  const appsPerPage = 3;

  const indexOfLastApp = currentAppPage * appsPerPage;
  const indexOfFirstApp = indexOfLastApp - appsPerPage;
  const currentApps = applications.slice(indexOfFirstApp, indexOfLastApp);
  const totalAppPages = Math.ceil(applications.length / appsPerPage);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    interviewed: 0,
    newApplications: 0,
    thisWeek: 0,
    hired: 0,
  });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pipelineCounts, setPipelineCounts] = useState<{ stage: string; count: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<
    { icon: typeof Users; color: string; title: string; description: string; time: string }[]
  >([]);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [isReportExpanded, setIsReportExpanded] = useState(false);

  const [outreachApp, setOutreachApp] = useState<any | null>(null);
  const [outreachType, setOutreachType] = useState<'interview' | 'rejection' | 'general'>('interview');
  const [outreachInstructions, setOutreachInstructions] = useState('');
  const [isDraftingOutreach, setIsDraftingOutreach] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');

  const fetchWeeklyReport = async (forceRefresh = false) => {
    setLoadingReport(true);
    try {
      const url = `/api/ai/employer/reports/weekly${forceRefresh ? '?refresh=true' : ''}`;
      const res = await apiFetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWeeklyReport(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch weekly report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await apiFetch('/api/ai/employer/pipeline/recommendations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRecommendations(data.recommendations || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview' && user?.id) {
      fetchWeeklyReport();
      fetchRecommendations();
    }
  }, [activeTab, user?.id]);

  const [profileScore, setProfileScore] = useState(0);
  const [company, setCompany] = useState({
    name: 'Your Company',
    logo: 'YC',
    plan: 'Professional'
  });
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      active: darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      paused: darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
      closed: darkMode ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-50 text-gray-700 border-gray-200',
      new: darkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
      reviewing: darkMode ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200',
      shortlisted: darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      interview: darkMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
      rejected: darkMode ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const switchToTab = (tabId: string, state?: Record<string, unknown>) => {
    const resolved = tabId === "candidates" ? "applications" : tabId;
    setActiveTab(resolved);
    const query = resolved === "overview" ? "" : `?tab=${resolved}`;
    navigate(`/employer/dashboard${query}`, state ? { state } : undefined);
  };

  const formatNavBadge = (value: number) => (value > 99 ? "99+" : String(value));

  const NavBadge = ({ value, collapsed }: { value: number; collapsed: boolean }) => (
    <span
      className={cn(
        "flex items-center justify-center font-bold leading-none z-10",
        collapsed
          ? "absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[10px] shadow-sm ring-2"
          : "px-2 py-0.5 min-w-[1.25rem] rounded-full text-xs",
        darkMode
          ? "bg-blue-500 text-white ring-gray-900"
          : "bg-blue-600 text-white ring-white",
      )}
      aria-hidden
    >
      {formatNavBadge(value)}
    </span>
  );

  const NavItem = ({ icon: Icon, label, id, badge }: any) => {
    const handleNavClick = () => {
      switchToTab(id);
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    const badgeCount = typeof badge === "number" && badge > 0 ? badge : undefined;
    const tooltipText =
      badgeCount != null ? `${label} (${formatNavBadge(badgeCount)})` : label;

    return (
      <button
        type="button"
        onClick={handleNavClick}
        title={!sidebarOpen ? tooltipText : undefined}
        aria-label={tooltipText}
        aria-current={activeTab === id ? "page" : undefined}
        className={cn(
          "w-full flex items-center rounded-xl transition-all duration-200 group relative overflow-visible",
          sidebarOpen ? "justify-between px-4 py-3" : "justify-center h-11 px-0 py-0",
          activeTab === id
            ? darkMode
              ? "bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10"
              : "bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/20"
            : darkMode
              ? "text-gray-200 hover:bg-gray-800/50 hover:text-white"
              : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900",
          !sidebarOpen &&
          activeTab === id &&
          (darkMode ? "ring-1 ring-inset ring-blue-500/35" : "ring-1 ring-inset ring-blue-200"),
        )}
      >
        <div
          className={cn(
            "flex items-center z-10 min-w-0",
            sidebarOpen ? "gap-3" : "justify-center w-full",
          )}
        >
          <span
            className={cn(
              "relative flex shrink-0 items-center justify-center",
              sidebarOpen ? "w-5 h-5" : "w-10 h-10",
            )}
          >
            <Icon className="w-5 h-5" aria-hidden />
            {!sidebarOpen && badgeCount != null && (
              <NavBadge value={badgeCount} collapsed />
            )}
          </span>
          {sidebarOpen && (
            <span className="font-medium whitespace-nowrap">{label}</span>
          )}
        </div>
        {sidebarOpen && badgeCount != null && (
          <NavBadge value={badgeCount} collapsed={false} />
        )}
        {!sidebarOpen && (
          <span
            className={cn(
              "pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[90] -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-1",
              darkMode
                ? "bg-gray-800 text-gray-100 border border-gray-700"
                : "bg-white text-gray-900 border border-gray-300",
            )}
          >
            {tooltipText}
          </span>
        )}
        {activeTab === id && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r",
              darkMode
                ? "from-blue-500/5 to-indigo-500/5"
                : "from-blue-500/10 to-indigo-500/10",
            )}
          />
        )}
      </button>
    );
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

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

    void logout().catch((e) => console.warn('Logout failed:', e));
    window.setTimeout(() => navigate('/', { replace: true }), 450);
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setShowLogoutConfirmation(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Sync activeTab with current route
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    setActiveTab(tab ?? 'overview');
  }, [location.search]);

  useEffect(() => {
    scrollDashboardToTop();
  }, [activeTab]);

  // Calculate profile completion score
  const calculateProfileScore = (companyData: any, userData: any): number => {
    if (!companyData) return 0;

    let totalFields = 0;
    let completedFields = 0;

    // Core company fields
    const fields = [
      { value: companyData.name },
      { value: companyData.industry },
      { value: companyData.location },
      { value: companyData.size },
      { value: companyData.description },
      { value: companyData.website },
      { value: companyData.logo }
    ];

    fields.forEach(field => {
      totalFields++;
      if (field.value && String(field.value).trim() !== '') {
        completedFields++;
      }
    });

    // Contact info from user
    if (userData?.email) {
      totalFields++;
      completedFields++;
    }
    if (userData?.telephoneNumber) {
      totalFields++;
      if (String(userData.telephoneNumber).trim() !== '') completedFields++;
    }

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  };

  // Update company name when user data changes - fetch from backend
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!user?.id) {
        return;
      }

      let companyData = null;

      // First check if company is in user object (from /api/auth/me)
      if (user?.company?.id) {
        try {
          const companyResponse = await apiFetch(`/api/companies/${user.company.id}`, {
            credentials: 'include'
          });

          if (companyResponse.ok) {
            companyData = await companyResponse.json();
            console.log('Company name from user object:', companyData.name);
            setCompany({
              name: companyData.name,
              logo: companyData.name.substring(0, 2).toUpperCase(),
              plan: 'Professional'
            });
            // Calculate profile score
            const score = calculateProfileScore(companyData, user);
            setProfileScore(score);
            return;
          }
        } catch (error) {
          console.error('Error fetching company details:', error);
        }
      }

      // If not in user object, fetch from companies endpoint
      try {
        console.log('Fetching company for ownerId:', user.id);
        const companiesResponse = await apiFetch(`/api/companies?ownerId=${user.id}`, {
          credentials: 'include'
        });

        if (companiesResponse.ok) {
          const companies = await companiesResponse.json();
          console.log('Companies response:', companies);

          if (companies && Array.isArray(companies) && companies.length > 0 && companies[0]?.name) {
            companyData = companies[0];
            const companyName = companyData.name;
            console.log('Setting company name to:', companyName);
            setCompany({
              name: companyName,
              logo: companyName.substring(0, 2).toUpperCase(),
              plan: 'Professional'
            });
            // Calculate profile score
            const score = calculateProfileScore(companyData, user);
            setProfileScore(score);
            return;
          }
        } else {
          console.warn('Failed to fetch companies, status:', companiesResponse.status);
        }
      } catch (error) {
        console.error('Error fetching company:', error);
      }

      // Fallback to user name if no company found
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      console.log('Using fallback name:', name || 'Your Company');
      setCompany({
        name: name || 'Your Company',
        logo: name ? name.substring(0, 2).toUpperCase() : 'YC',
        plan: 'Professional'
      });
      setProfileScore(0);
    };

    fetchCompanyName();
  }, [user?.id, user?.company?.id, user?.company?.name, user?.firstName, user?.lastName]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [jobsData, applicationsData] = await Promise.all([
          fetchEmployerJobs(),
          fetchEmployerApplications(user.id),
        ]);

        const transformedJobs: Job[] = jobsData.map((job) => ({
          id: job.id,
          title: job.title,
          department: job.company?.industry || "General",
          location: job.location,
          type: job.jobType || "Full-time",
          salary:
            job.salaryMin && job.salaryMax
              ? `$${Math.round(job.salaryMin / 1000)}k - $${Math.round(job.salaryMax / 1000)}k`
              : "Not specified",
          postedDate: job.createdAt
            ? new Date(job.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          applications: job.applications || 0,
          newApplications: job.newApplications || 0,
          status: job.isActive ? "active" : "paused",
          views: job.views || 0,
        }));

        setJobs(transformedJobs);

        const transformedApplications: Application[] = applicationsData.map((app) => {
          const tabStatus = mapToEmployerTabStatus(app.status);
          return {
            id: String(app.id),
            candidateName: applicantDisplayName(app.applicant),
            candidatePhoto: app.applicant?.profilePhoto ?? undefined,
            jobTitle: app.job?.title || "Unknown Position",
            appliedAt: app.appliedAt ? String(app.appliedAt) : undefined,
            appliedDate: app.appliedAt
              ? new Date(app.appliedAt).toLocaleDateString()
              : new Date().toLocaleDateString(),
            matchScore: app.matchScore ?? 0,
            status: tabStatus === "new" ? "new" : tabStatus === "reviewing" ? "reviewing" : tabStatus === "shortlisted" ? "shortlisted" : tabStatus === "interview" ? "interview" : tabStatus === "rejected" ? "rejected" : "new",
            skills: resolveApplicantSkills(app),
          };
        });

        setApplications(transformedApplications);

        const appStats = computeApplicationStats(applicationsData);
        const activeJobs = transformedJobs.filter((j) => j.status === "active").length;

        setStats({
          activeJobs,
          totalApplications: appStats.total,
          shortlisted: appStats.shortlisted,
          interviewed: appStats.interview,
          newApplications: appStats.newCount,
          thisWeek: appStats.thisWeek,
          hired: appStats.hired,
        });

        setPipelineCounts(appStats.pipeline);

        const activity = applicationsData
          .filter((app) => mapToEmployerTabStatus(app.status) !== 'rejected')
          .slice(0, 8)
          .map((app) => {
            const name = applicantDisplayName(app.applicant);
            const jobTitle = app.job?.title || 'a role';
            const tab = mapToEmployerTabStatus(app.status);
            let title = 'New application received';
            let color = 'blue';
            if (tab === 'shortlisted') {
              title = 'Candidate shortlisted';
              color = 'purple';
            } else if (tab === 'interview') {
              title = 'Interview stage';
              color = 'emerald';
            } else if (tab === 'hired') {
              title = 'Candidate hired';
              color = 'indigo';
            }
            return {
              icon: Users,
              color,
              title,
              description: `${name} — ${jobTitle}`,
              time: formatRelativeTime(app.appliedAt),
            };
          })
          .slice(0, 3);
        setRecentActivity(activity);

        const messagesRes = await apiFetch("/api/messages", { credentials: "include" });
        if (messagesRes.ok) {
          const messages = await messagesRes.json();
          const unread = (Array.isArray(messages) ? messages : []).filter(
            (m: { receiverId?: string; receiver_id?: string; isRead?: boolean; is_read?: boolean }) =>
              String(m.receiverId ?? m.receiver_id) === String(user.id) &&
              !(m.isRead ?? m.is_read),
          ).length;
          setUnreadMessages(unread);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setJobs([]);
        setApplications([]);
        setStats({
          activeJobs: 0,
          totalApplications: 0,
          shortlisted: 0,
          interviewed: 0,
          newApplications: 0,
          thisWeek: 0,
          hired: 0,
        });
        setPipelineCounts([]);
        setRecentActivity([]);
        setUnreadMessages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const weekActivity = useMemo(() => buildWeekActivity(applications), [applications]);

  const pipelineRows = useMemo(() => {
    const source =
      pipelineCounts.length > 0
        ? pipelineCounts
        : PIPELINE_STAGE_META.map((m) => ({ stage: m.stage, count: 0 }));
    const byStage = new Map(source.map((r) => [r.stage, r.count]));
    return PIPELINE_STAGE_META.map((meta) => ({
      ...meta,
      count: byStage.get(meta.stage) ?? 0,
    }));
  }, [pipelineCounts]);

  const pipelineTotal = pipelineRows.reduce((sum, r) => sum + r.count, 0);
  const pipelineMax = Math.max(...pipelineRows.map((r) => r.count), 1);

  if (loading) {
    return (
      <div className={`min-h-screen w-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'}`}>
        <div className="flex flex-col items-center justify-center p-12 text-center h-64">
          <LogoLoader size="md" className="mx-auto mb-4" />
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-screen transition-colors duration-300 fixed inset-0 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-100/40'} overflow-x-hidden`}>
      {/* Subtle Dot Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: darkMode
            ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)'
            : 'radial-gradient(circle at 1px 1px, rgba(79,70,229,0.07) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
      {/* Enhanced Animated background */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none ${darkMode ? 'opacity-100' : 'opacity-70'}`}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Enhanced Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-900/90 backdrop-blur-xl border-gray-800' : 'bg-white/95 backdrop-blur-xl border-gray-200 shadow-sm'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                className={`p-2.5 rounded-xl border transition-all duration-200 ${darkMode
                    ? 'bg-gray-900/40 border-gray-700 text-gray-300 hover:bg-gray-800'
                    : 'bg-white/70 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {company.logo}
                </div>
                <h1 className={`text-lg font-bold tracking-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'} font-['Poppins']`}>
                  {company.name}
                </h1>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className={`relative w-full ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} rounded-xl backdrop-blur-sm`}>
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search jobs, candidates, analytics..."
                  className={`w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:ring-2 focus:ring-blue-500/50 rounded-xl ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                    }`}
                />
              </div>
            </div>

            {/* Right Side Actions - Minimal & Premium */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button className={`relative p-2.5 rounded-full transition-all duration-300 ${darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <Mail className="w-5 h-5" />
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-gray-900 dark:ring-gray-900"></span>
              </button>

              <button className={`p-2.5 rounded-full transition-all duration-300 ${darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <Bell className="w-5 h-5" />
              </button>

              <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

              <div className="flex items-center">
                <ModeToggle />
              </div>

              {/* Minimal Profile Avatar */}
              <button
                onClick={() => switchToTab('profile')}
                className="ml-1 relative group focus:outline-none"
                title={`${company.name} Profile`}
              >
                <div className={`h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg ${darkMode ? 'ring-2 ring-gray-800' : 'ring-2 ring-white'}`}>
                  {company.logo}
                </div>
              </button>

              <button
                onClick={handleLogout}
                className={`ml-3 px-3.5 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all duration-300 shadow-sm ${darkMode
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300'
                    : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700'
                  }`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div> {/* Added missing closing div */}
        </div>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <div className="flex mt-16 relative">
        {/* Enhanced Sidebar */}
        <aside className={`fixed lg:sticky top-16 left-0 z-40 lg:z-auto h-[calc(100vh-4rem)] ${sidebarOpen ? 'translate-x-0 w-80 lg:w-80' : '-translate-x-full w-80 lg:translate-x-0 lg:w-20'} ${darkMode ? 'bg-gray-900/80 border-gray-700/50 shadow-2xl' : 'bg-white border-gray-200 shadow-xl'} border-r transition-all duration-300 overflow-visible backdrop-blur-sm`}>
          <div className={`${sidebarOpen ? 'p-6' : 'p-3'} space-y-6 h-full overflow-y-auto overflow-x-visible`}>
            {sidebarOpen ? (
              <>
                {/* Quick Stats */}
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'} backdrop-blur-sm`}>
                      <Briefcase className={`w-5 h-5 mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeJobs}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Jobs</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-200'} backdrop-blur-sm`}>
                      <Users className={`w-5 h-5 mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalApplications}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Applications</p>
                    </div>
                  </div>

                  {/* Profile Completion Score — from company + contact fields */}
                  {profileScore > 0 && (
                    <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'} backdrop-blur-sm`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-emerald-600'}`} />
                          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile Score</p>
                        </div>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileScore}%</p>
                      </div>
                      <div className={`w-full rounded-full h-2 mb-2 ${darkMode ? 'bg-gray-700/30' : 'bg-emerald-100'}`}>
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${profileScore}%` }}
                        ></div>
                      </div>
                      <button
                        onClick={() => {
                          switchToTab('profile');
                        }}
                        className={`w-full mt-2 py-1.5 text-xs rounded-lg transition-all font-medium ${darkMode ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'}`}
                      >
                        {profileScore >= 100 ? 'View Profile' : 'Complete Profile'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-2" />
            )}

            {/* Navigation */}
            <div>
              {sidebarOpen && (
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Navigation
                </h3>
              )}
              <div className="space-y-2">
                <NavItem icon={Home} label="Overview" id="overview" />
                <NavItem icon={Briefcase} label="Job Postings" id="jobs" badge={stats.activeJobs} />
                <NavItem icon={Users} label="Applications" id="applications" badge={stats.totalApplications > 0 ? stats.totalApplications : undefined} />
                <NavItem icon={Mail} label="Messages" id="messages" badge={unreadMessages > 0 ? unreadMessages : undefined} />
                <NavItem icon={BarChart3} label="Analytics" id="analytics" />
                <NavItem icon={TrendingUp} label="Stories" id="stories" />
                <NavItem icon={Bot} label="Agent History" id="agents" />
                <NavItem icon={UserCircle} label="Profile" id="profile" />
                <NavItem icon={Settings} label="Settings" id="settings" />
              </div>
            </div>
          </div>
        </aside>

        {/* Enhanced Main Content */}
        <main
          data-dashboard-scroll-root
          className="flex-1 px-6 py-8 overflow-y-auto min-h-[calc(100vh-4rem)]"
        >
          {activeTab === 'jobs' ? (
            <div className="w-full">
              <JobManagement embedded />
            </div>
          ) : activeTab === 'applications' ? (
            <div className="w-full">
              <ApplicationsPage embedded />
            </div>
          ) : activeTab === 'messages' ? (
            <div className="w-full">
              <MessagesPage embedded />
            </div>
          ) : activeTab === 'analytics' ? (
            <div className="w-full">
              <AnalyticsPage embedded />
            </div>
          ) : activeTab === 'stories' ? (
            <div className="w-full">
              <StoriesPage embedded />
            </div>
          ) : activeTab === 'profile' ? (
            <div className="w-full">
              <ProfilePage embedded />
            </div>
          ) : activeTab === 'settings' ? (
            <div className="w-full">
              <SettingsPage embedded />
            </div>
          ) : activeTab === 'agents' ? (
            <div className="w-full">
              <AgentsPage />
            </div>
          ) : (
            <div className="w-full space-y-5">
              {/* Enhanced Header */}
              <div>
                <h1 className={employerPageTitleClass(darkMode)}>
                  {t("employer.dashboard.overview")}
                </h1>
              </div>

              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { icon: Briefcase, label: 'Active Jobs', value: stats.activeJobs, change: stats.activeJobs > 0 ? `${stats.activeJobs} live` : 'Post a job', color: 'blue', trend: 'up' as const },
                  { icon: Users, label: 'Total Applications', value: stats.totalApplications, change: stats.thisWeek > 0 ? `${stats.thisWeek} this week` : 'No new apps', color: 'purple', trend: 'up' as const },
                  { icon: Star, label: 'Shortlisted', value: stats.shortlisted, change: stats.shortlisted > 0 ? `${stats.shortlisted} in pipeline` : '—', color: 'emerald', trend: 'up' as const },
                  { icon: TrendingUp, label: 'Hired', value: stats.hired, change: stats.interviewed > 0 ? `${stats.interviewed} interviewing` : '—', color: 'amber', trend: 'up' as const }
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl p-5 backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${premiumSurface} ${darkMode ? 'hover:border-gray-600' : 'hover:border-indigo-200'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                          stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                            stat.color === 'emerald' ? 'from-emerald-500 to-green-500' :
                              'from-amber-500 to-orange-500'
                        } shadow-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${stat.trend === 'up'
                          ? darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                          : darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
                        }`}>
                        {stat.change}
                      </div>
                    </div>
                    <p className={`text-xs uppercase tracking-wide font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                    <p className={`text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {jobs.length === 0 && applications.length === 0 && (
                <div className={`rounded-2xl border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                  }`}>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>Your workspace is ready</h3>
                    <p className={`text-sm ${darkMode ? 'text-blue-100/80' : 'text-blue-800/80'}`}>
                      Publish your first role and start receiving applications here.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => switchToTab('jobs', { openCreate: true })}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
                    >
                      Post First Job
                    </button>
                    <button
                      onClick={() => switchToTab('profile')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-blue-300 text-blue-800 hover:bg-blue-100'
                        }`}
                    >
                      Complete Company Profile
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 lg:gap-4">
                {/* Enhanced Active Jobs Section */}
                <div className="flex flex-col gap-4 h-full lg:col-span-2">
                  <div
                    className={cn(
                      'relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300',
                      darkMode
                        ? 'border-blue-500/20 bg-gradient-to-br from-slate-900/95 via-blue-950/25 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(59,130,246,0.45)]'
                        : 'border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white shadow-[0_20px_50px_-28px_rgba(59,130,246,0.18)]',
                    )}
                  >
                    <WidgetShine darkMode={darkMode} />
                    <div
                      className={cn(
                        'relative border-b px-5 py-4',
                        darkMode ? 'border-white/[0.06]' : 'border-blue-100/80',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/30">
                            <Briefcase className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h2 className={cn(widgetTitle, darkMode ? 'text-white' : 'text-gray-900')}>
                              Active Job Postings
                            </h2>
                            <p className={cn(widgetSubtitle, darkMode ? 'text-blue-200/70' : 'text-blue-700/80')}>
                              Manage and track your job listings
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => switchToTab('jobs')}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors group',
                            darkMode
                              ? 'text-blue-300 hover:bg-white/5 hover:text-blue-200'
                              : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700',
                          )}
                        >
                          View All
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>

                    <div className="relative space-y-2.5 p-4 sm:p-5">
                      {jobs.length === 0 ? (
                        <div className={`text-center py-8 rounded-xl border border-dashed ${darkMode ? 'border-gray-700 bg-gray-800/20' : 'border-indigo-200 bg-gradient-to-b from-white to-slate-50'}`}>
                          <Briefcase className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`} />
                          <p className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>No job postings yet</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'} mt-2`}>Create your first listing to start collecting candidates.</p>
                          <button
                            onClick={() => switchToTab('jobs', { openCreate: true })}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                          >
                            Post Your First Job
                          </button>
                        </div>
                      ) : (
                        currentJobs.map(job => (
                          <div
                            key={job.id}
                            className={cn(
                              'group relative overflow-hidden rounded-xl border p-3.5 transition-all duration-300',
                              darkMode
                                ? 'border-white/[0.07] bg-white/[0.03] hover:border-blue-400/30 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_-12px_rgba(59,130,246,0.35)]'
                                : 'border-slate-200/90 bg-white/80 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/50',
                            )}
                          >
                            <div
                              className={cn(
                                'absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-to-b',
                                job.status === 'active'
                                  ? 'from-blue-400 to-indigo-500'
                                  : job.status === 'paused'
                                    ? 'from-amber-400 to-orange-500'
                                    : 'from-slate-400 to-slate-500',
                              )}
                            />
                            <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                  <h3
                                    className={cn(
                                      'truncate text-base font-bold transition-colors',
                                      darkMode ? 'text-white group-hover:text-blue-300' : 'text-gray-900 group-hover:text-blue-600',
                                    )}
                                  >
                                    {job.title}
                                  </h3>
                                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(job.status)}`}>
                                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                  </span>
                                </div>
                                <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', widgetMeta, darkMode ? 'text-slate-400' : 'text-slate-600')}>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    {job.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                                    {job.salary}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                    {job.postedDate}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 shrink-0" />
                                    <span className="font-semibold">{job.applications}</span> apps
                                  </span>
                                  {job.newApplications > 0 && (
                                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                                      {job.newApplications} new
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5 shrink-0" />
                                    {job.views} views
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => switchToTab('applications', { jobId: job.id })}
                                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg"
                              >
                                View Applications
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}

                      {totalJobPages > 1 && (
                        <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-200 dark:border-gray-700/50">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Showing <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{indexOfFirstJob + 1}</span> to <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.min(indexOfLastJob, jobs.length)}</span> of <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{jobs.length}</span> jobs
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setCurrentJobPage(p => Math.max(1, p - 1))}
                              disabled={currentJobPage === 1}
                              className={`p-2 rounded-lg border transition-colors ${currentJobPage === 1
                                  ? darkMode ? 'border-gray-700/50 text-gray-600 bg-gray-800/20' : 'border-gray-200 text-gray-400 bg-gray-50'
                                  : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center px-1">
                              {Array.from({ length: Math.min(5, totalJobPages) }).map((_, i) => {
                                let pageNum = i + 1;
                                if (totalJobPages > 5 && currentJobPage > 3) {
                                  pageNum = currentJobPage - 2 + i;
                                  if (pageNum > totalJobPages) pageNum = totalJobPages - 4 + i;
                                }
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setCurrentJobPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentJobPage === pageNum
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                      }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => setCurrentJobPage(p => Math.min(totalJobPages, p + 1))}
                              disabled={currentJobPage === totalJobPages}
                              className={`p-2 rounded-lg border transition-colors ${currentJobPage === totalJobPages
                                  ? darkMode ? 'border-gray-700/50 text-gray-600 bg-gray-800/20' : 'border-gray-200 text-gray-400 bg-gray-50'
                                  : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid min-h-0 grid-cols-1 items-stretch gap-3 xl:grid-cols-2">
                    {/* Recent Activity Timeline */}
                    <div
                      className={cn(
                        'relative flex flex-col rounded-2xl border p-5 sm:p-6',
                        darkMode
                          ? 'border-amber-500/20 bg-gradient-to-br from-slate-900/95 via-amber-950/20 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(245,158,11,0.35)]'
                          : 'border-amber-100 bg-gradient-to-br from-white via-amber-50/30 to-white shadow-[0_20px_50px_-28px_rgba(245,158,11,0.15)]',
                      )}
                    >
                      <WidgetShine darkMode={darkMode} />
                      <div className="relative mb-4 flex items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 shadow-lg shadow-amber-500/30">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className={cn(widgetTitle, darkMode ? 'text-white' : 'text-gray-900')}>
                            Recent Activity
                          </h2>
                          <p className={cn(widgetSubtitle, darkMode ? 'text-amber-200/70' : 'text-amber-700/80')}>
                            Latest pipeline updates
                          </p>
                        </div>
                      </div>

                      <div className="relative flex flex-1 flex-col justify-start space-y-0">
                        {recentActivity.length === 0 && (
                          <div
                            className={cn(
                              'rounded-xl border border-dashed px-4 py-6 text-center',
                              darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-amber-200/80 bg-amber-50/30',
                            )}
                          >
                            <Clock className={cn('mx-auto mb-2 h-7 w-7', darkMode ? 'text-gray-600' : 'text-amber-400')} />
                            <p className={cn('text-sm font-medium', darkMode ? 'text-gray-400' : 'text-gray-600')}>No activity yet</p>
                          </div>
                        )}
                        {recentActivity.map((activity, index) => {
                          const style = ACTIVITY_STYLES[activity.color] ?? ACTIVITY_STYLES.blue;
                          const isLast = index === recentActivity.length - 1;
                          return (
                            <div key={index} className="relative flex flex-1 gap-3">
                              {!isLast && (
                                <div
                                  className={cn(
                                    'absolute left-[15px] top-8 bottom-0 w-px',
                                    darkMode ? 'bg-gradient-to-b from-white/15 to-transparent' : 'bg-gradient-to-b from-amber-200 to-transparent',
                                  )}
                                />
                              )}
                              <div
                                className={cn(
                                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 mt-1',
                                  style.bg,
                                  style.ring,
                                )}
                              >
                                <span className={cn('h-2 w-2 rounded-full', style.dot)} />
                              </div>
                              <div
                                className={cn(
                                  'group min-w-0 flex-1 rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm',
                                  darkMode
                                    ? 'border-white/[0.06] bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]'
                                    : 'border-slate-100 bg-white/70 hover:border-amber-100 hover:bg-white',
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className={cn('font-semibold leading-tight', widgetBody, darkMode ? 'text-white' : 'text-gray-900')}>
                                    {activity.title}
                                  </p>
                                  <activity.icon className={cn('h-4 w-4 shrink-0', style.text)} />
                                </div>
                                {activity.description.includes(' — ') ? (
                                  <p className={cn('mt-1 leading-relaxed', widgetBody)}>
                                    <span className={cn('font-bold', style.text)}>{activity.description.split(' — ')[0]}</span>
                                    <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}> applied for </span>
                                    <span className={cn('font-medium', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                                      {activity.description.split(' — ')[1]}
                                    </span>
                                  </p>
                                ) : (
                                  <p className={cn('mt-1', widgetBody, darkMode ? 'text-gray-400' : 'text-gray-600')}>
                                    {activity.description}
                                  </p>
                                )}
                                <p className={cn('mt-1.5 flex items-center gap-1 font-medium', widgetMeta, darkMode ? 'text-gray-500' : 'text-gray-400')}>
                                  <Clock className="h-3 w-3" />
                                  {activity.time}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hiring Performance */}
                    <div
                      className={cn(
                        'relative flex flex-col rounded-2xl border p-5 sm:p-6',
                        darkMode
                          ? 'border-emerald-500/20 bg-gradient-to-br from-slate-900/95 via-emerald-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(16,185,129,0.45)]'
                          : 'border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white shadow-[0_20px_50px_-28px_rgba(16,185,129,0.2)]',
                      )}
                    >
                      <WidgetShine darkMode={darkMode} />
                      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 shadow-lg ${darkMode ? 'shadow-emerald-500/25' : 'shadow-emerald-500/30'}`}
                          >
                            <TrendingUp className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h2 className={cn(widgetTitle, darkMode ? 'text-white' : 'text-gray-900')}>
                              Hiring Performance
                            </h2>
                            <p className={cn(widgetSubtitle, darkMode ? 'text-emerald-200/70' : 'text-emerald-700/80')}>
                              Applications received this week
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="relative flex min-h-0 flex-1 flex-col gap-4">
                        <div className="grid shrink-0 grid-cols-3 gap-3">
                          {[
                            {
                              label: 'This week',
                              value: weekActivity.thisWeek,
                              accent: darkMode ? 'text-white' : 'text-gray-900',
                            },
                            {
                              label: 'Daily avg',
                              value:
                                weekActivity.thisWeek > 0
                                  ? (weekActivity.thisWeek / 7).toFixed(1)
                                  : '0',
                              accent: darkMode ? 'text-emerald-300' : 'text-emerald-700',
                            },
                            {
                              label: 'Peak day',
                              value: weekActivity.peak,
                              accent: darkMode ? 'text-teal-300' : 'text-teal-700',
                            },
                          ].map((metric) => (
                            <div
                              key={metric.label}
                              className={cn(
                                'rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5',
                                darkMode
                                  ? 'border-white/10 bg-white/[0.04]'
                                  : 'border-emerald-100/80 bg-white/80',
                              )}
                            >
                              <p
                                className={cn(
                                  'text-xs font-bold uppercase tracking-wider',
                                  darkMode ? 'text-gray-400' : 'text-gray-500',
                                )}
                              >
                                {metric.label}
                              </p>
                              <p className={cn('mt-1.5 text-2xl font-black tabular-nums tracking-tight sm:text-3xl', metric.accent)}>
                                {metric.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div
                          className={cn(
                            'relative min-h-[180px] flex-1 overflow-hidden rounded-xl px-2 py-3 sm:min-h-[200px] sm:px-4 sm:py-4',
                            darkMode ? 'bg-emerald-500/[0.04] ring-1 ring-white/[0.06]' : 'bg-emerald-500/[0.05] ring-1 ring-emerald-100/80',
                          )}
                        >
                          {weekActivity.thisWeek === 0 && (
                            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                              <p className={cn('text-sm font-medium sm:text-base', darkMode ? 'text-gray-500' : 'text-gray-500')}>
                                No applications yet this week
                              </p>
                            </div>
                          )}
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weekActivity.chart} margin={{ top: 10, right: 12, left: -12, bottom: 4 }}>
                              <defs>
                                <linearGradient id="hiringPerfFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={darkMode ? '#34d399' : '#10b981'} stopOpacity={0.45} />
                                  <stop offset="100%" stopColor={darkMode ? '#34d399' : '#10b981'} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke={darkMode ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)'}
                              />
                              <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 13, fontWeight: 600 }}
                                dy={8}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                                  borderRadius: '10px',
                                  border: darkMode ? '1px solid rgba(52,211,153,0.25)' : '1px solid #d1fae5',
                                  boxShadow: '0 12px 28px -8px rgba(0,0,0,0.35)',
                                }}
                                itemStyle={{ color: darkMode ? '#6ee7b7' : '#059669', fontWeight: 700 }}
                                labelStyle={{ color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                                formatter={(value: any) => [`${value} apps`, 'Applications']}
                              />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke={darkMode ? '#34d399' : '#059669'}
                                strokeWidth={2.5}
                                fill="url(#hiringPerfFill)"
                                dot={{
                                  r: 3,
                                  fill: darkMode ? '#10b981' : '#059669',
                                  stroke: darkMode ? '#ecfdf5' : '#ffffff',
                                  strokeWidth: 2,
                                }}
                                activeDot={{ r: 5 }}
                                animationDuration={1200}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Sidebar Content */}
                <div className="flex flex-col gap-4">
                  {/* AI Weekly Hiring Funnel Summary */}
                  <div
                    className={cn(
                      'relative flex flex-col overflow-hidden rounded-2xl border p-4 sm:p-5',
                      darkMode
                        ? 'border-indigo-500/20 bg-gradient-to-br from-slate-900/95 via-indigo-950/20 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.3)]'
                        : 'border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-white shadow-[0_20px_50px_-28px_rgba(99,102,241,0.1)]',
                    )}
                  >
                    <WidgetShine darkMode={darkMode} />
                    <div className="relative mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5 shadow-lg shadow-indigo-500/20">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className={cn(widgetTitle, darkMode ? 'text-white' : 'text-gray-900')}>
                            AI Weekly hiring report
                          </h3>
                          <p className={cn(widgetSubtitle, darkMode ? 'text-indigo-200/70' : 'text-indigo-700/80')}>
                            Gemini Funnel Analysis
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => fetchWeeklyReport(true)}
                          disabled={loadingReport}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                          title="Refresh report with live stats"
                        >
                          <TrendingUp className={cn("w-4 h-4", loadingReport && "animate-spin")} />
                        </button>
                        <button
                          onClick={() => setIsReportExpanded(!isReportExpanded)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                          title={isReportExpanded ? "Collapse report" : "Expand report"}
                        >
                          <ChevronDown className={cn("w-4 h-4 transition-transform", isReportExpanded && "rotate-180")} />
                        </button>
                      </div>
                    </div>

                    {isReportExpanded && (
                      loadingReport ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                          <span className="text-xs text-gray-500">Compiling stats...</span>
                        </div>
                      ) : weeklyReport ? (
                        <div className="space-y-3 relative text-left">
                          <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {weeklyReport.summary}
                          </p>

                          {weeklyReport.highlights?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">Highlights</p>
                              <ul className="space-y-1">
                                {weeklyReport.highlights.slice(0, 2).map((h: string, i: number) => (
                                  <li key={i} className="text-xs flex items-start gap-1.5 text-gray-400 dark:text-gray-400">
                                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />
                                    <span>{h}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {weeklyReport.bottlenecks?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">Bottlenecks</p>
                              <ul className="space-y-1">
                                {weeklyReport.bottlenecks.slice(0, 2).map((b: string, i: number) => (
                                  <li key={i} className="text-xs flex items-start gap-1.5 text-gray-400 dark:text-gray-400">
                                    <XCircle className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                                    <span>{b}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-gray-500">
                          No report generated yet.
                        </div>
                      )
                    )}
                  </div>



                  {/* Recent Applications */}
                  <div
                    className={cn(
                      'relative flex flex-col overflow-hidden rounded-2xl border p-4 sm:p-5',
                      darkMode
                        ? 'border-violet-500/20 bg-gradient-to-br from-slate-900/95 via-violet-950/25 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(139,92,246,0.45)]'
                        : 'border-violet-100 bg-gradient-to-br from-white via-violet-50/35 to-white shadow-[0_20px_50px_-28px_rgba(139,92,246,0.16)]',
                    )}
                  >
                    <WidgetShine darkMode={darkMode} />
                    <div className="relative mb-4 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 shadow-lg shadow-violet-500/30">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className={cn('truncate', widgetTitle, darkMode ? 'text-white' : 'text-gray-900')}>
                            Recent Applications
                          </h3>
                          <p className={cn(widgetSubtitle, darkMode ? 'text-violet-200/70' : 'text-violet-700/80')}>
                            Latest submissions
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchToTab('applications')}
                        className={cn(
                          'shrink-0 rounded-lg px-2 py-1 text-xs font-semibold transition-colors',
                          darkMode ? 'text-violet-300 hover:bg-white/5 hover:text-violet-200' : 'text-violet-600 hover:bg-violet-50',
                        )}
                      >
                        View all
                      </button>
                    </div>

                    <div className="relative space-y-2.5">
                      {applications.length === 0 ? (
                        <div className={`text-center py-5 rounded-xl border border-dashed ${darkMode ? 'border-gray-700 bg-gray-800/20' : 'border-indigo-200 bg-gradient-to-b from-white to-slate-50'}`}>
                          <Users className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`} />
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>No applications yet</p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>Applications will appear here once candidates apply.</p>
                          <button
                            onClick={() => switchToTab('jobs', { openCreate: true })}
                            className={`mt-4 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${darkMode ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              }`}
                          >
                            Publish a Job
                          </button>
                        </div>
                      ) : (
                        currentApps.map(app => (
                          <div
                            key={app.id}
                            onClick={() => switchToTab('applications', { appId: app.id })}
                            className={cn(
                              'group cursor-pointer rounded-xl border p-3 transition-all duration-200',
                              darkMode
                                ? 'border-white/[0.07] bg-white/[0.03] hover:border-violet-400/30 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_-12px_rgba(139,92,246,0.35)]'
                                : 'border-slate-200/90 bg-white/75 hover:border-violet-200 hover:bg-white hover:shadow-md hover:shadow-violet-100/40',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-md ring-2 ring-violet-400/30">
                                  {app.candidateName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span
                                  className={cn(
                                    'absolute -bottom-1 -right-1 rounded-md px-1 py-px text-[9px] font-bold tabular-nums',
                                    darkMode ? 'bg-violet-500/90 text-white' : 'bg-violet-600 text-white',
                                  )}
                                >
                                  {app.matchScore}%
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <h4
                                    className={cn(
                                      'truncate font-bold transition-colors',
                                      widgetBody,
                                      darkMode ? 'text-white group-hover:text-violet-300' : 'text-gray-900 group-hover:text-violet-700',
                                    )}
                                  >
                                    {app.candidateName}
                                  </h4>
                                  <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${getStatusColor(app.status)}`}>
                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                  </span>
                                </div>
                                <p className={cn('truncate', widgetMeta, darkMode ? 'text-slate-400' : 'text-slate-600')}>{app.jobTitle}</p>
                                <div className={cn('mt-2 h-1 overflow-hidden rounded-full', darkMode ? 'bg-white/5' : 'bg-slate-100')}>
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                                    style={{ width: `${Math.min(app.matchScore, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {totalAppPages > 1 && (
                      <div className="flex items-center justify-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCurrentAppPage(p => Math.max(1, p - 1))}
                            disabled={currentAppPage === 1}
                            className={`p-1.5 rounded-lg border transition-colors ${currentAppPage === 1
                                ? darkMode ? 'border-gray-700/50 text-gray-600 bg-gray-800/20' : 'border-gray-200 text-gray-400 bg-gray-50'
                                : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm'
                              }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <span className={`text-xs font-semibold px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {currentAppPage} / {totalAppPages}
                          </span>

                          <button
                            onClick={() => setCurrentAppPage(p => Math.min(totalAppPages, p + 1))}
                            disabled={currentAppPage === totalAppPages}
                            className={`p-1.5 rounded-lg border transition-colors ${currentAppPage === totalAppPages
                                ? darkMode ? 'border-gray-700/50 text-gray-600 bg-gray-800/20' : 'border-gray-200 text-gray-400 bg-gray-50'
                                : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm'
                              }`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Hiring Pipeline */}
                  <div
                    className={cn(
                      'relative flex flex-col rounded-2xl border p-5 sm:p-6',
                      darkMode
                        ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]'
                        : 'border-indigo-100 bg-gradient-to-br from-white via-indigo-50/50 to-white shadow-[0_20px_50px_-28px_rgba(99,102,241,0.2)]',
                    )}
                  >
                    <WidgetShine darkMode={darkMode} />
                    <div className="relative mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className={cn(widgetTitle, darkMode ? 'text-white' : 'text-gray-900')}>
                            Hiring Pipeline
                          </h3>
                          <p className={cn(widgetSubtitle, darkMode ? 'text-indigo-200/70' : 'text-indigo-700/80')}>
                            Live candidate flow
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-right rounded-xl px-3 py-2 ${darkMode ? 'bg-white/[0.05] border border-white/10' : 'bg-indigo-50 border border-indigo-100'
                          }`}
                      >
                        <p className={cn('text-xs font-bold uppercase tracking-wider', darkMode ? 'text-gray-500' : 'text-gray-500')}>
                          In pipeline
                        </p>
                        <p className={`text-2xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-indigo-950'}`}>
                          {pipelineTotal}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-start space-y-3 mt-2">
                      {pipelineRows.map((row) => {
                        const pct = pipelineTotal > 0 ? Math.round((row.count / pipelineTotal) * 100) : 0;
                        const barWidth = Math.max((row.count / pipelineMax) * 100, row.count > 0 ? 8 : 0);
                        return (
                          <div key={row.stage} className="group flex items-center gap-3">
                            <div className="flex items-center gap-2 w-32 shrink-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 bg-gradient-to-r ${row.bar} ring-2 ${row.ring}`}
                              />
                              <span
                                className={`truncate text-sm font-semibold sm:text-base ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}
                              >
                                {row.stage}
                              </span>
                            </div>

                            <div
                              className={`flex-1 h-2.5 overflow-hidden rounded-full ${darkMode ? 'bg-white/[0.06]' : 'bg-slate-100'
                                }`}
                            >
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${row.bar} transition-all duration-500 ease-out shadow-sm ${row.glow}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 w-20 shrink-0">
                              {pipelineTotal > 0 && (
                                <span className={`text-xs font-bold tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {pct}%
                                </span>
                              )}
                              <span
                                className={`min-w-[2rem] rounded-lg bg-gradient-to-r px-2 py-0.5 text-center text-xs font-black tabular-nums text-white shadow-md sm:text-sm ${row.bar} ${row.glow}`}
                              >
                                {row.count}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={cn("mt-1 mb-2 p-3.5 rounded-xl flex items-start gap-3 border", darkMode ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50/80 border-indigo-100")}>
                      <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5", darkMode ? "text-indigo-300" : "text-indigo-700")}>Pipeline Insight</p>
                        <p className={cn("text-[13px] font-medium leading-snug", darkMode ? "text-indigo-100/80" : "text-indigo-900/80")}>
                          <span className={darkMode ? "text-white font-bold" : "text-indigo-950 font-bold"}>24%</span> of your candidates reached the interview stage. Great conversion!
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => switchToTab('analytics')}
                      className={`mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 sm:py-3 ${darkMode
                          ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-100 border border-indigo-400/30 hover:from-indigo-500/30 hover:to-violet-500/30 hover:border-indigo-300/40'
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg'
                        }`}
                    >
                      View Pipeline Analytics
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!outreachApp} onOpenChange={(open) => {
        if (!open) {
          setOutreachApp(null);
          setGeneratedDraft('');
          setOutreachInstructions('');
        }
      }}>
        <DialogContent className={`overflow-hidden p-6 border-0 ${darkMode ? "bg-slate-900 shadow-2xl text-white shadow-blue-900/10" : "bg-white shadow-xl text-gray-900"} max-w-lg rounded-2xl z-[80]`}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              AI Outreach Draft Generator
            </DialogTitle>
            <DialogDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Draft a personalized outreach message.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-semibold block mb-1.5">Message Type</label>
              <div className="flex gap-2">
                {(['interview', 'rejection', 'general'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOutreachType(t)}
                    className={`flex-1 py-2 px-3 text-xs font-semibold border rounded-lg capitalize transition-all cursor-pointer ${outreachType === t
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : darkMode
                          ? 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {t === 'general' ? 'general update' : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5">Custom Focus / Context (Optional)</label>
              <textarea
                value={outreachInstructions}
                onChange={(e) => setOutreachInstructions(e.target.value)}
                placeholder="e.g. Propose next Tuesday at 3 PM, highlight their React skills."
                rows={3}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-offset-0 ${darkMode ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-400' : 'bg-white border-gray-200 text-gray-950 placeholder-gray-400 focus:border-indigo-500'
                  }`}
              />
            </div>

            {generatedDraft && (
              <div>
                <label className="text-xs font-semibold block mb-1.5">Generated Message Draft</label>
                <textarea
                  readOnly
                  value={generatedDraft}
                  rows={6}
                  className={`w-full p-3 text-xs font-mono rounded-lg border leading-relaxed ${darkMode ? 'bg-slate-950/80 border-slate-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOutreachApp(null)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-150 hover:bg-gray-200'}`}
            >
              Close
            </button>

            {generatedDraft && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedDraft);
                  toast({
                    title: "Copied to clipboard",
                    description: "You can now paste it in the chat or email.",
                  });
                }}
                className="px-4 py-2 text-sm border border-indigo-500/20 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg transition-colors cursor-pointer"
              >
                Copy
              </button>
            )}

            <button
              onClick={async () => {
                if (!outreachApp) return;
                setIsDraftingOutreach(true);
                try {
                  const res = await apiFetch('/api/ai/employer/messages/draft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      applicationId: outreachApp.id,
                      type: outreachType,
                      customInstructions: outreachInstructions.trim(),
                    }),
                    credentials: 'include',
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({ error: 'Outreach generation failed' }));
                    throw new Error(data.error || 'Request failed');
                  }
                  const result = await res.json();
                  if (result.success && result.messageDraft) {
                    setGeneratedDraft(result.messageDraft);
                    toast({
                      title: "Draft generated!",
                      description: "Outreach message is ready for review.",
                    });
                  } else {
                    throw new Error(result.error || "Failed to generate outreach");
                  }
                } catch (err: any) {
                  console.error(err);
                  toast({
                    title: "Drafting failed",
                    description: err.message || "Failed to generate outreach draft. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsDraftingOutreach(false);
                }
              }}
              disabled={isDraftingOutreach}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isDraftingOutreach ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Draft'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {showLogoutConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Are you sure?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">You will be logged out of your account.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowLogoutConfirmation(false)}
                  className="px-6 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
