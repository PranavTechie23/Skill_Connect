import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Users, Building2, Briefcase, TrendingUp, Activity, Settings, BookOpen,
  LogOut, Moon, Sun, Menu, Search, Eye, Edit, Link as LinkIcon,
  Trash2, CheckCircle, XCircle, AlertCircle, Clock,
  Calendar, BarChart3, FileText, UserCheck, Pause, Play, Ban, ArrowRight, Zap, Target, Award, MessageSquare, Bell, Home, ChevronDown, Download
} from 'lucide-react';
import { adminService, type UpdateUserData } from '@/lib/admin-service';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from "@/contexts/LanguageContext";
import UserManagement from './user-management';
import JobPostings from './job-postings';
import CompanyManagement from './companies';
import Analytics from './analytics';
import AdminEmployees from './employees';
import AdminApplications from './applications';
import AdminApprovals from './approvals';
import AdminStories from './success-stories';
import AdminSettings from './settings';
import { AdminEmbeddedProvider } from '@/components/AdminBackButton';
import {
  AdminAmbientBackground,
  adminHeaderClass,
  adminHeaderClusterClass,
  adminIconButtonClass,
  adminMenuToggleClass,
  adminShellClass,
  adminSidebarClass,
  useAdminDarkMode,
} from '@/lib/admin-page-styles';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const AdminDashboard: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const darkMode = useAdminDarkMode();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    return window.location.pathname.split('/admin/')[1] || 'dashboard';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = React.useRef<HTMLDivElement>(null);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [reportsPanelOpen, setReportsPanelOpen] = useState(false);
  const [quickActionIntent, setQuickActionIntent] = useState<string | null>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle browser back button
  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      setShowBackConfirmation(true);
      window.history.pushState(null, '', window.location.pathname);
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, []);

  // Prevent background scrolling when the sidebar is open on small screens.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobileViewport = window.innerWidth < 1024;
    if (!sidebarOpen || !isMobileViewport) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [approvalsList, setApprovalsList] = useState<any[] | null>(null);
  const [recentUsersPage, setRecentUsersPage] = useState(1);
  const recentUsersPerPage = 5;
  
  const [allRecentUsers, setAllRecentUsers] = useState<any[]>([]);
  const recentUsers = React.useMemo(() => {
    const startIndex = (recentUsersPage - 1) * recentUsersPerPage;
    return allRecentUsers.slice(startIndex, startIndex + recentUsersPerPage);
  }, [allRecentUsers, recentUsersPage]);
  const totalRecentUsersPages = Math.max(1, Math.ceil(allRecentUsers.length / recentUsersPerPage));

  const [allRecentJobs, setAllRecentJobs] = useState<any[]>([]);
  
  const recentJobs = React.useMemo(() => {
    return allRecentJobs.filter((job: any) => {
      const matchesSearch = !searchQuery || 
        (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (job.company?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      let jobStatus = (job.status || 'active').toLowerCase();
      if (job.is_active === false) jobStatus = 'paused';
      const matchesFilter = filterType === 'all' || jobStatus === filterType;
      
      return matchesSearch && matchesFilter;
    }).slice(0, 5);
  }, [allRecentJobs, searchQuery, filterType]);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const { toast } = useToast();

  const admin = {
    name: 'Admin User',
    email: 'admin@gmail.com',
    avatar: 'AD'
  };

  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic notifications/messages so the icons aren't static
  const [notifications, setNotifications] = useState<{ id: string; title: string; time: string }[]>([]);
  const [messagesList, setMessagesList] = useState<{ id: string; from: string; preview: string; time: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const sampleNotificationTitles = [
    'New user registered',
    'New job posted',
    'Payment failed for Employer X',
    'Database backup completed',
    'New support ticket opened',
    'System alert: High CPU usage'
  ];

  const sampleMessagePreviews = [
    'Can you review my application?',
    'We need to update the job post',
    'Thanks for the quick response!',
    'Please confirm your availability',
    'Here are the attachments you requested'
  ];

  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const generateNotifications = () => {
    const count = randomInt(1, 5);
    const items = Array.from({ length: count }).map((_, i) => ({
      id: String(Date.now()) + i,
      title: sampleNotificationTitles[Math.floor(Math.random() * sampleNotificationTitles.length)],
      time: `${randomInt(1, 59)}m ago`
    }));
    setNotifications(items);
  };

  const generateMessages = () => {
    const count = randomInt(1, 6);
    const items = Array.from({ length: count }).map((_, i) => ({
      id: String(Date.now()) + i,
      from: ['Jane S.', 'TechCorp HR', 'Support'][Math.floor(Math.random() * 3)],
      preview: sampleMessagePreviews[Math.floor(Math.random() * sampleMessagePreviews.length)],
      time: `${randomInt(1, 59)}m ago`
    }));
    setMessagesList(items);
  };

  const loadUsers = async () => {
    try {
      const usersData = await adminService.getUsers();
      console.log('Loaded users data:', usersData);
      setAllRecentUsers((usersData || []).slice(0, 5).map(user => ({
        ...user,
        displayName: `${user.firstName} ${user.lastName}`.trim(),
        userType: user.userType || 'Professional'
      })));
    } catch (error) {
      console.error("Failed to reload users", error);
      toast({ title: "Error", description: "Could not refresh user list.", variant: "destructive" });
    }
  };

  const loadJobs = async () => {
    try {
      const jobsData = await adminService.getJobs();
      setAllRecentJobs(jobsData || []);
    } catch (error) {
      console.error("Failed to reload jobs", error);
      toast({ title: "Error", description: "Could not refresh job list.", variant: "destructive" });
    }
  };

  const handleViewUser = async (user: any) => {
    try {
      // Fetch complete user details from backend
      const userDetails = await adminService.getUser(user.id);
      setSelectedUser(userDetails);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      toast({ title: "Error", description: "Failed to load user details.", variant: "destructive" });
    }
  };

  const handleEditUser = async (user: any) => {
    try {
      // Fetch complete user details before editing
      const userDetails = await adminService.getUser(user.id);
      setUserToEdit(userDetails);
    } catch (error) {
      console.error("Failed to fetch user details for editing:", error);
      toast({ title: "Error", description: "Failed to load user details for editing.", variant: "destructive" });
    }
  };

  const handleDeleteUserClick = (user: any) => {
    setUserToDelete(user);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    const updatedData: UpdateUserData = {
      firstName: userToEdit.firstName,
      lastName: userToEdit.lastName,
      email: userToEdit.email,
      location: userToEdit.location,
    };

    try {
      await adminService.updateUser(userToEdit.id, updatedData);
      toast({ title: "Success", description: "User updated successfully." });
      setUserToEdit(null);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminService.deleteUser(userToDelete.id);
      toast({ title: "Success", description: "User deleted successfully." });
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete user. Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleViewJob = async (job: any) => {
    try {
      // Fetch complete job details from backend (use getJob if available, otherwise fall back to getJobs and find)
      const svc: any = adminService;
      let jobDetails: any = null;

      if (typeof svc.getJob === 'function') {
        jobDetails = await svc.getJob(job.id);
      } else if (typeof svc.getJobs === 'function') {
        const jobs = await svc.getJobs();
        jobDetails = (jobs || []).find((j: any) => String(j.id) === String(job.id));
      } else {
        throw new Error('No method available on adminService to fetch job details');
      }

      if (!jobDetails) {
        throw new Error('Job not found');
      }

      setSelectedJob(jobDetails);
    } catch (error) {
      console.error("Failed to fetch job details:", error);
      toast({ title: "Error", description: "Failed to load job details.", variant: "destructive" });
    }
  };

  const handleToggleJobStatus = async (job: any) => {
    try {
      // Determine current status - check multiple possible fields
      const currentStatus = job.status || 
                           (job.is_active === false ? 'paused' : 'active') ||
                           (job.isActive === false ? 'paused' : 'active') ||
                           'active';
      
      // Toggle between active and paused
      const newStatus = currentStatus === 'active' || currentStatus === 'Active' ? 'paused' : 'active';
      
      console.log('🔄 Toggling job status:', {
        jobId: job.id,
        currentStatus: currentStatus,
        newStatus: newStatus,
        jobData: {
          status: job.status,
          is_active: job.is_active,
          isActive: job.isActive
        }
      });

      // Use updateJob method
      await adminService.updateJob(job.id, { status: newStatus });

      toast({ 
        title: "Success", 
        description: `Job ${newStatus === 'active' ? 'activated' : 'paused'} successfully.` 
      });
      
      // Reload jobs to get updated data
      loadJobs();
    } catch (error) {
      console.error("❌ Failed to update job status:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ 
        title: "Error", 
        description: `Failed to update job status: ${errorMessage}`, 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteJob = async (job: any) => {
    try {
      await adminService.deleteJob(job.id);
      toast({ title: "Success", description: "Job deleted successfully." });
      loadJobs();
    } catch (error) {
      console.error("Failed to delete job:", error);
      toast({ title: "Error", description: "Failed to delete job.", variant: "destructive" });
    }
  };

  // initialize a few items on mount
  useEffect(() => {
    generateNotifications();
    generateMessages();
    
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching admin data...');
        const [statsData, usersData, jobsResult, companiesData, approvalsData] = await Promise.all([
          adminService.getStats(),
          adminService.getUsers(),
          adminService.getJobs(),
          adminService.getCompanies(),
          adminService.getApprovals()
        ]);

        // Process jobs data
        console.log('Processing jobs data:', jobsResult);
        const processedJobs = jobsResult?.jobs || jobsResult || [];
        
        // Count active jobs - check multiple conditions to match database
        const activeJobsCount = processedJobs.filter((job: any) => {
          // Check if job is active based on various possible fields
          const isActive = 
            job.is_active === true || 
            job.isActive === true ||
            job.status === 'active' || 
            job.status === 'Active' ||
            (!job.status && !job.isClosed && !job.isPaused && job.is_active !== false);
          return isActive;
        }).length;
        
        console.log('📊 Jobs breakdown:', {
          totalJobs: processedJobs.length,
          activeJobs: activeJobsCount,
          sampleJob: processedJobs[0] ? {
            id: processedJobs[0].id,
            title: processedJobs[0].title,
            status: processedJobs[0].status,
            is_active: processedJobs[0].is_active,
            isActive: processedJobs[0].isActive,
            isClosed: processedJobs[0].isClosed,
            isPaused: processedJobs[0].isPaused
          } : 'No jobs found'
        });
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const newJobsThisWeek = processedJobs.filter((job: any) => {
          const jobDate = new Date(job.createdAt);
          return jobDate >= weekAgo;
        }).length;

        // Process companies data
        console.log('Processing companies data:', companiesData);
        
        const newJobsThisMonth = processedJobs.filter((job: any) => {
          const jobDate = new Date(job.createdAt);
          return jobDate >= monthAgo;
        }).length;

        const totalCompanies = companiesData?.length || 0;
        console.log('Total companies:', totalCompanies);

        const approvalsArray = Array.isArray(approvalsData) ? approvalsData : [];
        adminService.setApprovalsCache(approvalsArray);
        setApprovalsList(approvalsArray);
        const pendingApprovalsCount = approvalsArray.length;

        // Process data for Recent Activity feed
        const allUsersActivity = (usersData || []).map(user => {
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || user.email || 'Unknown User';
            return {
              type: 'user',
              action: `New user registered: ${fullName}`,
              user: user.email,
              time: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
              timestamp: user.createdAt ? new Date(user.createdAt).getTime() : 0,
              id: `user-${user.id}`
            };
          });

        const allJobsActivity = processedJobs.map((job: any) => ({
            type: 'job',
            action: `New job posted: ${job.title}`,
            user: job.company?.name || 'N/A',
            time: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A',
            timestamp: job.createdAt ? new Date(job.createdAt).getTime() : 0,
            id: `job-${job.id}`
          }));

        const combinedActivity = [...allUsersActivity, ...allJobsActivity]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10); // keep a few top items, the UI will slice to 3

        // Count professionals/employees only (not all users)
        const professionals = (usersData || []).filter((user: any) => {
          const userType = user.userType || (user as any).user_type || '';
          return userType === 'Professional' || userType === 'job_seeker' || userType === 'professional';
        });
        
        const newProfessionalsThisWeek = professionals.filter((user: any) => {
          const userDate = new Date(user.createdAt);
          return userDate >= weekAgo;
        }).length;

        // Calculate new users this week (all users, not just professionals) for User Management badge
        const newUsersThisWeekAll = (usersData || []).filter((user: any) => {
          const userDate = new Date(user.createdAt);
          return userDate >= weekAgo;
        }).length;

        const processedStats = {
          // Override API stats with our calculated values
          pendingApprovals: pendingApprovalsCount,
          activeJobs: activeJobsCount,
          totalJobs: processedJobs.length,
          newJobsThisWeek,
          newJobsThisMonth,
          totalUsers: professionals.length, // Only count professionals/employees
          totalAllUsers: (usersData || []).length, // All users (for the Users card)
          newUsersThisWeek: newUsersThisWeekAll, // New users this week (all users) for User Management badge
          newProfessionalsThisWeek: newProfessionalsThisWeek, // New professionals this week
          totalCompanies,
          // Keep other stats from API if needed
          totalApplications: statsData?.totalApplications || 0,
          newCompaniesThisWeek: statsData?.newCompaniesThisWeek || 0,
          newApplicationsThisWeek: statsData?.newApplicationsThisWeek || 0
        };
        
        console.log('📊 Navigation badges:', {
          newUsersThisWeek: newUsersThisWeekAll,
          pendingApprovals: pendingApprovalsCount,
          newJobsThisWeek: newJobsThisWeek,
          approvalsDataLength: approvalsData?.length
        });
        
        console.log('📊 Dashboard stats calculation:', {
          fromAPI: {
            totalUsers: statsData?.totalUsers,
            activeJobs: statsData?.activeJobs,
            totalCompanies: statsData?.totalCompanies
          },
          calculated: {
            totalProfessionals: professionals.length,
            totalAllUsers: (usersData || []).length,
            activeJobs: activeJobsCount,
            totalJobs: processedJobs.length,
            totalCompanies: totalCompanies
          },
          finalStats: {
            totalUsers: processedStats.totalUsers,
            totalAllUsers: processedStats.totalAllUsers,
            activeJobs: processedStats.activeJobs,
            totalJobs: processedStats.totalJobs,
            totalCompanies: processedStats.totalCompanies
          }
        });
        
        setStats(processedStats);
        // Ensure we have firstName and lastName for Recent Users
        // Map both camelCase and snake_case fields
        const recentUsersWithNames = (usersData || []).map((user: any) => {
          const firstName = user.firstName || user.first_name || '';
          const lastName = user.lastName || user.last_name || '';
          const displayName = firstName && lastName 
            ? `${firstName} ${lastName}`.trim()
            : firstName || lastName || 'Unknown User';
          
          return {
            ...user,
            firstName: firstName,
            lastName: lastName,
            displayName: displayName
          };
        });
        setAllRecentUsers(recentUsersWithNames);
        setRecentUsersPage(1); // Reset to page 1 on load
        
        setAllRecentJobs(processedJobs);
        setRecentActivity(combinedActivity.slice(0, 4));
      } catch (error: any) {
        console.error("Failed to fetch admin data", error);
        if (!error?.message?.includes("401")) {
          toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    window.setTimeout(() => navigate('/login', { replace: true }), 450);
  };

  const NavItem = ({ icon: Icon, label, id, badge }: any) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => changeTab(id)}
        title={!sidebarOpen ? label : undefined}
        className={`relative w-full flex items-center transition-all group ${
          sidebarOpen ? 'justify-between px-5 py-3.5 rounded-xl' : 'justify-center h-12 rounded-xl px-0'
        } ${
          isActive
            ? darkMode
              ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 shadow-lg shadow-red-500/10'
              : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 shadow-md'
            : darkMode
            ? 'text-gray-400 hover:bg-white/10 hover:text-gray-100'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <div className={`flex items-center min-w-0 ${sidebarOpen ? 'gap-4' : 'justify-center w-full'}`}>
          <Icon className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span className="font-medium truncate min-w-0">{label}</span>}
        </div>
        {sidebarOpen && badge !== undefined && badge !== null && badge > 0 && (
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
            darkMode ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' : 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
          }`}>
            {badge}
          </span>
        )}
        {!sidebarOpen && badge !== undefined && badge !== null && badge > 0 && (
          <span className={`absolute top-0 right-0 flex items-center justify-center font-bold leading-none w-4 h-4 rounded-full text-[10px] shadow-sm ${
            darkMode ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
          }`}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { 
        color: darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: CheckCircle 
      },
      suspended: { 
        color: darkMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200', 
        icon: Ban 
      },
      pending: { 
        color: darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200', 
        icon: Clock 
      },
      paused: { 
        color: darkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200', 
        icon: Pause
      },
      closed: { 
        color: darkMode ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-50 text-gray-700 border-gray-200', 
        icon: XCircle 
      }
    };
    const config = configs[status as keyof typeof configs] || configs.active;
    const Icon = config.icon;
    return { ...config, Icon };
  };

  const validTabs = new Set([
    'dashboard',
    'users',
    'jobs',
    'companies',
    'analytics',
    'employees',
    'applications',
    'approvals',
    'stories',
    'settings',
  ]);

  const changeTab = (tabId: string) => {
    const nextTab = validTabs.has(tabId) ? tabId : 'dashboard';
    setActiveTab(nextTab);
    const nextPath = nextTab === 'dashboard' ? '/admin' : `/admin/${nextTab}`;
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
    // Auto-close sidebar on mobile viewports on tab switch
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const consumeQuickAction = () => setQuickActionIntent(null);

  const handleQuickAddUser = () => {
    setQuickActionIntent('add-user');
    changeTab('users');
  };

  const handleQuickPostJob = () => {
    setQuickActionIntent('post-job');
    changeTab('jobs');
  };

  const handleQuickViewAnalytics = () => {
    setReportsPanelOpen(false);
    changeTab('analytics');
  };

  const handleQuickDownloadAnalytics = () => {
    setReportsPanelOpen(false);
    setQuickActionIntent('analytics-export');
    changeTab('analytics');
  };

  useEffect(() => {
    const pathTab = location.pathname.split('/admin/')[1] || 'dashboard';
    const normalized = validTabs.has(pathTab) ? pathTab : 'dashboard';
    if (normalized !== activeTab) {
      setActiveTab(normalized);
    }
  }, [location.pathname, activeTab]);

  const renderEmbeddedTab = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement quickActionIntent={quickActionIntent} onQuickActionConsumed={consumeQuickAction} />;
      case 'jobs':
        return <JobPostings quickActionIntent={quickActionIntent} onQuickActionConsumed={consumeQuickAction} />;
      case 'companies':
        return <CompanyManagement />;
      case 'analytics':
        return <Analytics quickActionIntent={quickActionIntent} onQuickActionConsumed={consumeQuickAction} />;
      case 'employees':
        return <AdminEmployees />;
      case 'applications':
        return <AdminApplications />;
      case 'approvals':
        return (
          <AdminApprovals
            initialApprovals={approvalsList}
            onApprovalsChange={(items) => {
              setApprovalsList(items);
              adminService.setApprovalsCache(items);
              setStats((prev: any) => ({ ...prev, pendingApprovals: items.length }));
            }}
          />
        );
      case 'stories':
        return <AdminStories />;
      case 'settings':
        return <AdminSettings />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="relative">
        {showBackConfirmation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white'} rounded-3xl shadow-2xl max-w-md w-full p-8 border-2`}>
              <div className="text-center">
                <h2 className={`text-2xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Leave Admin Panel?
                </h2>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Would you like to logout or stay on this page?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowBackConfirmation(false);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    Stay Here
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className={adminShellClass(darkMode)}>
          <AdminAmbientBackground isDark={darkMode} />
          {loading && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]">
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white font-bold shadow-lg animate-pulse">
                Loading...
              </div>
            </div>
          )}
          
          {/* Top Bar */}
          <div className={adminHeaderClass(darkMode)}>
            <div className="max-w-[1800px] mx-auto h-full px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex h-full min-w-0 items-center justify-between gap-2 sm:gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={adminMenuToggleClass(darkMode)}
                    aria-label="Toggle sidebar"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="hidden sm:grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h1 className={`truncate text-base sm:text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-950'}`}>
                        {t("admin.controlPanel")}
                      </h1>
                      <p className={`hidden md:truncate md:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        SkillConnect Management System
                      </p>
                    </div>
                  </div>
                </div>

                <div className={adminHeaderClusterClass(darkMode)}>
                  <button
                    onClick={() => setTheme(darkMode ? 'light' : 'dark')}
                    className={`${adminIconButtonClass(darkMode)} ${
                      darkMode ? 'bg-white/5 text-yellow-300 hover:bg-white/10' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Toggle theme"
                  >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => { generateNotifications(); setShowNotifications(s => !s); setShowMessages(false); }}
                      className={adminIconButtonClass(darkMode)}
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white shadow-sm">
                          {notifications.length}
                        </span>
                      )}
                    </button>

                    {showNotifications && notifications.length > 0 && (
                      <div className={`absolute right-0 mt-3 w-[min(24rem,85vw)] rounded-2xl shadow-2xl border py-3 z-[60] transition-all animate-in backdrop-blur-xl ${
                        darkMode ? 'bg-gray-900/95 border-white/10 shadow-black/40' : 'bg-white border-gray-200'
                      }`}>
                        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</span>
                            <button onClick={() => setNotifications([])} className={`text-xs font-medium px-4 py-2 rounded-lg ${darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}>Clear All</button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-auto">
                          {notifications.map(n => (
                            <div key={n.id} className={`px-4 py-3 border-b last:border-b-0 hover:bg-opacity-50 cursor-pointer transition-all ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <div className={`text-sm font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{n.title}</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{n.time}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => { generateMessages(); setShowMessages(s => !s); setShowNotifications(false); }}
                      className={adminIconButtonClass(darkMode)}
                      title="Messages"
                    >
                      <MessageSquare className="w-5 h-5" />
                      {messagesList.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1 text-xs font-bold text-white shadow-sm">
                          {messagesList.length}
                        </span>
                      )}
                    </button>

                    {showMessages && messagesList.length > 0 && (
                      <div className={`absolute right-0 mt-2 w-[min(20rem,85vw)] rounded-2xl shadow-2xl border py-2 z-[60] transition-all backdrop-blur-xl ${
                        darkMode ? 'bg-gray-900/95 border-white/10 shadow-black/40' : 'bg-white border-gray-200'
                      }`}>
                        <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Messages</span>
                            <button onClick={() => setMessagesList([])} className={`text-xs font-medium px-3 py-1 rounded-lg ${darkMode ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'}`}>Clear All</button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-auto">
                          {messagesList.map(m => (
                            <div key={m.id} className={`px-4 py-3 border-b last:border-b-0 hover:bg-opacity-50 cursor-pointer transition-all ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{m.from}</div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.time}</div>
                              </div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{m.preview}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => changeTab('settings')}
                    className={`ml-1 hidden items-center gap-3 rounded-xl border py-1.5 pl-1.5 pr-4 transition-all md:flex ${
                      darkMode
                        ? 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07]'
                        : 'bg-gray-50 border-gray-200 hover:bg-white'
                    }`}
                    title="Open settings"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 text-sm font-black text-white shadow-sm">
                      {admin.avatar}
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-semibold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{admin.name}</p>
                      <p className={`text-xs leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{admin.email}</p>
                    </div>
                  </button>

                  {/* Easy logout */}
                  <button
                    onClick={handleLogout}
                    className={`ml-1 flex h-10 sm:h-11 items-center gap-2 rounded-xl border px-3 sm:px-4 text-sm font-bold transition-all shadow-sm ${
                      darkMode
                        ? 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                        : 'border-red-100 bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex min-w-0">
            {/* Sidebar */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-[35] bg-black/40 backdrop-blur-[2px] lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden
              />
            )}
            <aside className={`fixed top-20 bottom-0 left-0 transform transition-all duration-300 ${
              sidebarOpen ? 'translate-x-0 w-[min(20rem,85vw)] lg:w-80' : '-translate-x-full lg:translate-x-0 lg:w-[4.5rem]'
            } ${adminSidebarClass(darkMode)} z-40 overflow-y-auto overflow-x-hidden`}>
              <div className={sidebarOpen ? "p-6 space-y-6" : "px-2 py-6 space-y-6"}>
                {/* Quick Stats */}
                {sidebarOpen && (
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    System Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer ${darkMode ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30' : 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200'}`}>
                      <Users className={`w-6 h-6 mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats?.totalAllUsers ?? (stats?.totalUsers ?? 0)}
                      </p>
                      <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                    </div>
                    <div className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer ${darkMode ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'}`}>
                      <Briefcase className={`w-6 h-6 mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats?.activeJobs ?? 0}
                      </p>
                      <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Jobs</p>
                    </div>
                  </div>
                </div>
                )}

                {/* Navigation */}
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} ${sidebarOpen ? '' : 'sr-only'}`}>
                    Navigation
                  </h3>
                  <div className="space-y-1.5">
                    <NavItem icon={Home} label="Dashboard" id="dashboard" />
                    <NavItem icon={Users} label="User Management" id="users" />
                    <NavItem icon={Building2} label="Companies" id="companies" />
                    <NavItem icon={UserCheck} label="Employees" id="employees" />
                    <NavItem icon={Briefcase} label="Job Postings" id="jobs" />
                    <NavItem icon={FileText} label="Applications" id="applications" />
                    <NavItem icon={AlertCircle} label="Approvals" id="approvals" />
                    <NavItem icon={BookOpen} label="Success Stories" id="stories" />
                    <NavItem icon={BarChart3} label="Analytics" id="analytics" />
                    <NavItem icon={Settings} label="System Settings" id="settings" />
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className={`relative flex-1 min-h-screen w-full min-w-0 pt-20 px-4 sm:px-6 pb-6 overflow-x-hidden transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : 'lg:ml-[4.5rem]'}`}>
              {activeTab !== 'dashboard' && (
                <div className="admin-embedded-ui w-full min-w-0 max-w-[1800px] mx-auto overflow-x-hidden">
                  <AdminEmbeddedProvider value={{ embedded: true }}>
                    {renderEmbeddedTab()}
                  </AdminEmbeddedProvider>
                </div>
              )}
              <div className={`admin-embedded-ui w-full min-w-0 max-w-[1800px] mx-auto space-y-6 ${activeTab !== 'dashboard' ? 'hidden' : ''}`}>
                {/* Header with Welcome Message */}
                <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-2xl border transition-all duration-500 hover:shadow-indigo-500/10 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-950 border-gray-700/50' : 'bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/30 border-white/50'} backdrop-blur-2xl`}>
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                  
                  <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold uppercase tracking-wider mb-3 border border-indigo-500/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        System Online
                      </div>
                      <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">{admin.name}</span>! <span className="inline-block animate-bounce origin-bottom-right" style={{ animationDuration: '2s' }}>👋</span>
                      </h1>
                      <p className={`text-base sm:text-lg max-w-2xl font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Monitor and manage all platform activities from your central command center.
                      </p>
                    </div>
                    
                    <div className={`px-5 py-4 rounded-2xl border backdrop-blur-md shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg ${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'}`}>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                          </p>
                          <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Cards - Enhanced */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                  {/* 1. Total Users */}
                  <div className={`rounded-2xl border p-6 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden ${
                    darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)] hover:border-purple-500' : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <Zap className="w-5 h-5 text-purple-500 opacity-50" />
                      </div>
                      <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Users
                      </p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalAllUsers || 0}
                      </p>
                    </div>
                  </div>

                  {/* 2. Total Employees */}
                  <div className={`rounded-2xl border p-6 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden ${
                    darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)] hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <UserCheck className="w-6 h-6 text-white" />
                        </div>
                        <Zap className="w-5 h-5 text-blue-500 opacity-50" />
                      </div>
                      <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Users
                      </p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalUsers || 0}
                      </p>
                    </div>
                  </div>

                  {/* 3. Total Companies */}
                  <div className={`rounded-2xl border p-6 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden ${
                    darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)] hover:border-green-500' : 'bg-white border-gray-200 hover:border-green-300'
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <Target className="w-5 h-5 text-green-500 opacity-50" />
                      </div>
                      <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Companies
                      </p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalCompanies || 0}
                      </p>
                    </div>
                  </div>

                  {/* 4. Total Jobs */}
                  <div className={`rounded-2xl border p-6 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden ${
                    darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)] hover:border-amber-500' : 'bg-white border-gray-200 hover:border-amber-300'
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <Award className="w-5 h-5 text-amber-500 opacity-50" />
                      </div>
                      <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Jobs
                      </p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalJobs || 0}
                      </p>
                    </div>
                  </div>

                  {/* 5. Total Applications */}
                  <div className={`rounded-2xl border p-6 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden ${
                    darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)] hover:border-indigo-500' : 'bg-white border-gray-200 hover:border-indigo-300'
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <Activity className="w-5 h-5 text-indigo-500 opacity-50" />
                      </div>
                      <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Applications
                      </p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalApplications || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 min-w-0 items-stretch">
                  {/* Recent Users */}
                  <div className={`rounded-2xl border p-5 sm:p-8 xl:col-span-2 min-w-0 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                      <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Recent Users
                      </h2>
                      <button 
                        onClick={() => changeTab('users')}
                        className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        View All
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {recentUsers.map(user => {
                        const userStatus = user.status || 'active';
                        const statusConfig = getStatusBadge(userStatus);
                        const StatusIcon = statusConfig.Icon;
                        const isEmployer = user.userType?.toLowerCase() === 'employer';
                        
                        return (
                          <div key={user.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 rounded-xl border transition-all hover:shadow-lg ${
                            darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                          }`}>
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg bg-gradient-to-br ${
                                isEmployer 
                                  ? 'from-purple-500 to-pink-600'
                                  : 'from-blue-500 to-indigo-600'
                              } text-white flex-shrink-0`}>
                                {((user.firstName || user.first_name)?.[0] || '').toUpperCase()}{((user.lastName || user.last_name)?.[0] || '').toUpperCase() || (user.email?.[0] || 'U').toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className={`text-lg sm:text-xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {(user.firstName || user.first_name || user.lastName || user.last_name)
                                    ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim()
                                    : 'Unknown User'
                                  }
                                </div>
                                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-0.5 truncate`}>
                                  {user.email || 'No email'}
                                </div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'} mt-0.5`}>
                                  {user.userType || 'User'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 shrink-0 ${
                                statusConfig.color
                              }`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleViewUser(user)}
                                  className={`p-2 rounded-lg transition-all hover:shadow-md ${
                                    darkMode 
                                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                  }`}
                                  title="View Details"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleEditUser(user)}
                                  className={`p-2.5 rounded-lg transition-all hover:shadow-md ${
                                    darkMode 
                                      ? 'hover:bg-blue-500/10 text-blue-400 hover:text-blue-300' 
                                      : 'hover:bg-blue-50 text-blue-600 hover:text-blue-700'
                                  }`}
                                  title="Edit User"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUserClick(user)}
                                  className={`p-2.5 rounded-lg transition-all hover:shadow-md ${
                                    darkMode 
                                      ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' 
                                      : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                                  }`}
                                  title="Delete User"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {allRecentUsers.length > recentUsersPerPage && (
                      <div className={`mt-6 pt-6 border-t flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Showing <span className="font-semibold">{Math.min((recentUsersPage - 1) * recentUsersPerPage + 1, allRecentUsers.length)}</span> to <span className="font-semibold">{Math.min(recentUsersPage * recentUsersPerPage, allRecentUsers.length)}</span> of <span className="font-semibold">{allRecentUsers.length}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRecentUsersPage(prev => Math.max(1, prev - 1))}
                            disabled={recentUsersPage === 1}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              recentUsersPage === 1 
                                ? (darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                                : (darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50')
                            }`}
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setRecentUsersPage(prev => Math.min(totalRecentUsersPages, prev + 1))}
                            disabled={recentUsersPage === totalRecentUsersPages}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              recentUsersPage === totalRecentUsersPages 
                                ? (darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                                : (darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50')
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions & Recent Activity */}
                  <div className="flex flex-col gap-4 min-w-0 h-full">
                    {/* Quick Actions */}
                    <div className={`rounded-2xl border p-5 sm:p-6 shrink-0 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}>
                      <h2 className={`text-lg font-bold mb-4 shrink-0 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Quick Actions
                      </h2>

                      {reportsPanelOpen ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm shrink-0">
                                <BarChart3 className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reports</p>
                                <p className={`text-[11px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose how to continue</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReportsPanelOpen(false)}
                              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              Back
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <button
                              type="button"
                              onClick={handleQuickViewAnalytics}
                              className={`group w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                                darkMode
                                  ? 'border-violet-500/20 bg-violet-500/10 hover:bg-violet-500/15 hover:border-violet-500/30'
                                  : 'border-violet-100 bg-violet-50/80 hover:bg-violet-50 hover:border-violet-200 hover:shadow-sm'
                              }`}
                            >
                              <div className={`p-2.5 rounded-xl shrink-0 ${darkMode ? 'bg-violet-500/20 text-violet-300' : 'bg-white text-violet-600 shadow-sm'}`}>
                                <Eye className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>View Analytics</p>
                                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Open the full analytics dashboard</p>
                              </div>
                              <ArrowRight className={`w-4 h-4 shrink-0 opacity-40 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 ${darkMode ? 'text-violet-300' : 'text-violet-500'}`} />
                            </button>

                            <button
                              type="button"
                              onClick={handleQuickDownloadAnalytics}
                              className={`group w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                                darkMode
                                  ? 'border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/15 hover:border-indigo-500/30'
                                  : 'border-indigo-100 bg-indigo-50/80 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-sm'
                              }`}
                            >
                              <div className={`p-2.5 rounded-xl shrink-0 ${darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white text-indigo-600 shadow-sm'}`}>
                                <Download className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Download Report</p>
                                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Export PDF, Excel, CSV, or JSON</p>
                              </div>
                              <ArrowRight className={`w-4 h-4 shrink-0 opacity-40 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Add User', icon: Users, gradient: 'from-blue-500 to-indigo-600', onClick: handleQuickAddUser },
                            { label: 'Post Job', icon: Briefcase, gradient: 'from-emerald-500 to-teal-600', onClick: handleQuickPostJob },
                            { label: 'Reports', icon: BarChart3, gradient: 'from-violet-500 to-purple-600', onClick: () => setReportsPanelOpen(true) },
                            { label: 'Settings', icon: Settings, gradient: 'from-gray-500 to-slate-600', onClick: () => changeTab('settings') },
                          ].map(({ label, icon: Icon, gradient, onClick }) => (
                            <button
                              key={label}
                              type="button"
                              onClick={onClick}
                              className={`group flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border transition-all min-h-[5.75rem] ${
                                darkMode
                                  ? 'border-gray-700/80 hover:bg-gray-700/50 hover:border-gray-600'
                                  : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm'
                              }`}
                            >
                              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-md transition-transform group-hover:scale-105`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <span className={`text-sm font-semibold text-center leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Activity */}
                    <div className={`rounded-2xl border p-4 sm:p-5 flex-1 flex flex-col min-h-0 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}>
                      <h2 className={`text-base font-bold mb-4 shrink-0 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Recent Activity
                      </h2>
                      
                      <div className="flex-1 flex flex-col justify-between space-y-0 relative before:absolute before:inset-0 before:ml-[1rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
                        {recentActivity.slice(0, 4).map((activity: any, index: number) => {
                          const isUser = activity.type === 'user';
                          const isJob = activity.type === 'job';
                          
                          // Parse action into title and entity name if possible
                          let actionTitle = activity.action;
                          let entityName = '';
                          if (activity.action.includes(':')) {
                            const parts = activity.action.split(':');
                            actionTitle = parts[0];
                            entityName = parts.slice(1).join(':').trim();
                          }
                          
                          return (
                            <div key={activity.id} className="relative flex items-start group flex-1">
                              {/* Timeline dot */}
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-[3px] shrink-0 shadow-sm z-10 ${
                                isUser 
                                  ? darkMode ? 'bg-gray-800 border-gray-800 text-blue-400' : 'bg-white border-white text-blue-500'
                                  : isJob
                                  ? darkMode ? 'bg-gray-800 border-gray-800 text-green-400' : 'bg-white border-white text-green-500'
                                  : darkMode ? 'bg-gray-800 border-gray-800 text-purple-400' : 'bg-white border-white text-purple-500'
                              } ${
                                isUser ? 'ring-2 ring-blue-500/20' : isJob ? 'ring-2 ring-green-500/20' : 'ring-2 ring-purple-500/20'
                              }`}>
                                {isUser && <Users className="w-3.5 h-3.5" />}
                                {isJob && <Briefcase className="w-3.5 h-3.5" />}
                                {!isUser && !isJob && <FileText className="w-3.5 h-3.5" />}
                              </div>
                              
                              {/* Content card */}
                              <div className={`ml-3 w-full p-3 rounded-xl border ${
                                darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'
                              }`}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                                    isUser ? 'text-blue-500' : isJob ? 'text-green-500' : 'text-purple-500'
                                  }`}>{actionTitle}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                  }`}>{activity.time}</span>
                                </div>
                                {entityName && (
                                  <h4 className={`text-sm font-bold mt-1 leading-snug truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{entityName}</h4>
                                )}
                                <p className={`text-xs font-medium truncate mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{activity.user}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Jobs Table */}
                <div style={{ overflow: 'visible', position: 'relative', zIndex: filterDropdownOpen ? 20 : undefined }} className={`rounded-2xl border p-5 sm:p-6 min-w-0 mt-6 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 min-w-0 relative">
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Recent Job Postings
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0 w-full lg:w-auto">
                      <div className={`relative min-w-0 flex-1 lg:w-72 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search jobs..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 placeholder-gray-500 text-white focus:border-red-500' 
                              : 'bg-gray-50 border-gray-300 placeholder-gray-400 text-gray-900 focus:border-red-500'
                          }`}
                        />
                      </div>
                      <div className="relative shrink-0 z-20" ref={filterDropdownRef}>
                        <button
                          onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                          className={`w-full sm:w-40 flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                            darkMode 
                              ? 'bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-500' 
                              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <span className="capitalize">{filterType === 'all' ? 'All Status' : filterType}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {filterDropdownOpen && (
                          <div data-floating-menu className={`absolute top-full right-0 mt-2 w-full sm:w-48 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 border-2 ${
                            darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'
                          }`}>
                            <div className={`px-3 py-2.5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Filter by status</p>
                            </div>
                            <div className="py-1.5 px-1.5">
                              {[
                                { value: 'all', label: 'All Status', dotColor: '' },
                                { value: 'active', label: 'Active', dotColor: 'bg-emerald-500' },
                                { value: 'paused', label: 'Paused', dotColor: 'bg-amber-500' },
                                { value: 'closed', label: 'Closed', dotColor: 'bg-gray-400' },
                              ].map(({ value, label, dotColor }) => (
                                <button
                                  key={value}
                                  onClick={() => {
                                    setFilterType(value);
                                    setFilterDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                                    filterType === value 
                                      ? (darkMode ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-700')
                                      : (darkMode ? 'text-gray-300 hover:bg-gray-700/60' : 'text-gray-700 hover:bg-gray-50')
                                  }`}
                                >
                                  {dotColor ? (
                                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ${darkMode ? 'ring-gray-700' : 'ring-white'} shadow-sm`} />
                                  ) : (
                                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 via-amber-400 to-gray-400 ring-2 ${darkMode ? 'ring-gray-700' : 'ring-white'} shadow-sm`} />
                                  )}
                                  <span className="flex-1 text-left">{label}</span>
                                  {filterType === value && (
                                    <CheckCircle className={`w-4 h-4 shrink-0 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {recentJobs.length === 0 ? (
                      <div className={`flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed ${
                        darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'
                      }`}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                          darkMode ? 'bg-gray-700/60' : 'bg-gray-100'
                        }`}>
                          <Briefcase className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                        <h3 className={`text-lg font-bold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          No Records Found
                        </h3>
                        <p className={`text-sm max-w-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {searchQuery || filterType !== 'all'
                            ? 'Try adjusting your search or filter to find what you\'re looking for.'
                            : 'No job postings have been created yet.'}
                        </p>
                        {(searchQuery || filterType !== 'all') && (
                          <button
                            onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                            className={`mt-4 px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
                              darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    ) : (
                    <>
                    <table className="w-full hidden md:table">
                      <thead>
                        <tr className={`border-b ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <th className={`text-left py-4 px-4 font-semibold text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Job Title
                          </th>
                          <th className={`text-left py-4 px-4 font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Company
                          </th>
                          <th className={`text-left py-4 px-4 font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Status
                          </th>
                          <th className={`text-left py-4 px-4 font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Applications
                          </th>
                          <th className={`text-left py-4 px-4 font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Posted
                          </th>
                          <th className={`text-left py-4 px-4 font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentJobs.map(job => {
                          const jobStatus = job.status || 'active';
                          const statusConfig = getStatusBadge(jobStatus);
                          const StatusIcon = statusConfig.Icon;
                          
                          return (
                            <tr key={job.id} className={`border-b ${
                              darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                            } transition-all`}>
                              <td className="py-4 px-4">
                                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {job.title}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {job.company?.name || 'N/A'}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${
                                  statusConfig.color
                                }`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {job.applications || 0}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {new Date(job.createdAt).toLocaleDateString()}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => handleViewJob(job)} 
                                    className={`p-2 rounded-lg transition-all ${
                                      darkMode 
                                        ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200' 
                                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                    }`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleToggleJobStatus(job)}
                                    className={`p-2 rounded-lg transition-all ${
                                      (jobStatus === 'active' || jobStatus === 'Active' || job.is_active !== false)
                                        ? 'text-amber-500 hover:bg-amber-500/10' 
                                        : 'text-emerald-500 hover:bg-emerald-500/10'
                                    }`}
                                    title={(jobStatus === 'active' || jobStatus === 'Active' || job.is_active !== false) ? 'Pause Job' : 'Activate Job'}
                                  >
                                    {(jobStatus === 'active' || jobStatus === 'Active' || job.is_active !== false) ? (
                                      <Pause className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteJob(job)}
                                    className={`p-2 rounded-lg transition-all ${
                                      darkMode 
                                        ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' 
                                        : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Mobile Card-Based Fallback for Recent Jobs */}
                    <div className="space-y-4 md:hidden mt-2">
                      {recentJobs.map(job => {
                        const jobStatus = job.status || 'active';
                        const statusConfig = getStatusBadge(jobStatus);
                        const StatusIcon = statusConfig.Icon;
                        return (
                          <div key={job.id} className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all hover:shadow-md ${
                            darkMode ? 'border-gray-700 bg-gray-900/40 hover:border-gray-600' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                          }`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className={`font-bold text-base truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{job.title}</h3>
                                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{job.company?.name || 'N/A'}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${statusConfig.color}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs font-semibold mt-1">
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {job.applications || 0} applications
                              </span>
                              <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                                {new Date(job.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className={`flex items-center gap-2 pt-2 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                              <button 
                                onClick={() => handleViewJob(job)} 
                                className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold border rounded-lg transition-all ${
                                  darkMode 
                                    ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                                    : 'border-gray-200 hover:bg-white text-gray-600'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                              <button 
                                onClick={() => handleToggleJobStatus(job)}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold border rounded-lg transition-all ${
                                  (jobStatus === 'active' || jobStatus === 'Active' || job.is_active !== false)
                                    ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10' 
                                    : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'
                                }`}
                              >
                                {(jobStatus === 'active' || jobStatus === 'Active' || job.is_active !== false) ? (
                                  <>
                                    <Pause className="w-3.5 h-3.5" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={() => handleDeleteJob(job)}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold border rounded-lg transition-all border-red-500/20 text-red-500 hover:bg-red-500/10`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>

          {/* Job Detail Modal */}
          {selectedJob && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 sm:p-8">
              <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white'} rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto`}>
                <div className="p-5 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Job Details</h2>
                    <button onClick={() => setSelectedJob(null)} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600`}>
                        {selectedJob.company?.name?.substring(0, 2).toUpperCase() || 'NA'}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-xl sm:text-2xl font-black break-words ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedJob.title}</h3>
                        <p className={`break-words ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedJob.company?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>LOCATION</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedJob.location}</p>
                      </div>
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>JOB TYPE</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} capitalize`}>{selectedJob.jobType}</p>
                      </div>
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>SALARY</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedJob.salaryMin && selectedJob.salaryMax ? `₹${selectedJob.salaryMin/1000}k - ₹${selectedJob.salaryMax/1000}k` : 'Not specified'}
                        </p>
                      </div>
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>APPLICATIONS</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedJob.applications || 0}</p>
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>DESCRIPTION</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedJob.description}</p>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>REQUIREMENTS</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedJob.requirements}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                        <LinkIcon className="w-5 h-5" />
                        View Public Page
                      </button>
                      <button className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                        <Edit className="w-5 h-5" />
                        Edit Job
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Detail Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 sm:p-8">
              <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white'} rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto`}>
                <div className="p-5 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Profile</h2>
                    <button onClick={() => setSelectedUser(null)} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ${selectedUser.userType === 'Professional' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
                        {selectedUser.firstName.substring(0, 1).toUpperCase()}{selectedUser.lastName.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-xl sm:text-2xl font-black break-words ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.firstName} {selectedUser.lastName}</h3>
                        <p className={`break-all ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>TYPE</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} capitalize`}>{selectedUser.userType}</p>
                      </div>
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>STATUS</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} capitalize`}>{selectedUser.status || 'active'}</p>
                      </div>
                      {selectedUser.location && (
                        <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>LOCATION</p>
                          <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.location}</p>
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>JOINED</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {userToEdit && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 sm:p-8">
              <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white'} rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto`}>
                <form onSubmit={handleUpdateUser} className="p-5 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit User</h2>
                    <button type="button" onClick={() => setUserToEdit(null)} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>First Name</label>
                        <input value={userToEdit.firstName} onChange={(e) => setUserToEdit({ ...userToEdit, firstName: e.target.value })} className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Last Name</label>
                        <input value={userToEdit.lastName} onChange={(e) => setUserToEdit({ ...userToEdit, lastName: e.target.value })} className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                      <input type="email" value={userToEdit.email} onChange={(e) => setUserToEdit({ ...userToEdit, email: e.target.value })} className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                      <input value={userToEdit.location || ''} onChange={(e) => setUserToEdit({ ...userToEdit, location: e.target.value })} className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button type="button" onClick={() => setUserToEdit(null)} className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>Cancel</button>
                      <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">Save Changes</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {userToDelete && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white'} rounded-3xl shadow-2xl max-w-md w-full p-8 border-2`}>
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${darkMode ? 'from-red-500/20 to-red-900/20' : 'from-red-100 to-red-200'}`}>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete User?</h2>
                  <p className={`mt-2 mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Are you sure you want to delete <strong>{userToDelete.firstName} {userToDelete.lastName}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <button onClick={() => setUserToDelete(null)} className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                      Cancel
                    </button>
                    <button onClick={handleDeleteUser} className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;

