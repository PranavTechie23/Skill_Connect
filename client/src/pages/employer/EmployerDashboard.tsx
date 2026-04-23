import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import CandidatesPage from './candidates';
import JobManagement from './job-management';
import ApplicationsPage from './applications';
import MessagesPage from './messages';
import AnalyticsPage from './analytics';
import StoriesPage from './stories';
import ProfilePage from './profile';
import SettingsPage from './settings';

import { ModeToggle } from "@/components/ui/dark-mode-toggle";

import { 
  Briefcase, Users, TrendingUp, Clock, Plus, MoreVertical, 
  MapPin, DollarSign, Calendar, Eye, Settings, LogOut, Menu, X, 
  Home, BarChart3, User, Star, ChevronDown, Edit, Pause, Play, 
  Trash2, Copy, CheckCircle, ArrowRight, Target, Award, Zap, Mail,
  Bell, Search, Filter, Download, Share2, UserCircle, Loader2
} from 'lucide-react';

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
  matchScore: number;
  status: 'new' | 'reviewing' | 'shortlisted' | 'interview' | 'rejected';
  skills: string[];
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $150k',
    postedDate: '2024-01-15',
    applications: 45,
    newApplications: 12,
    status: 'active',
    views: 234
  },
  {
    id: '2',
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90k - $120k',
    postedDate: '2024-01-10',
    applications: 67,
    newApplications: 8,
    status: 'active',
    views: 189
  },
  {
    id: '3',
    title: 'Marketing Manager',
    department: 'Marketing',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$80k - $100k',
    postedDate: '2024-01-05',
    applications: 32,
    newApplications: 0,
    status: 'paused',
    views: 156
  }
];

const mockApplications: Application[] = [
  {
    id: '1',
    candidateName: 'Sarah Johnson',
    jobTitle: 'Senior Frontend Developer',
    appliedDate: '2024-01-20',
    matchScore: 95,
    status: 'shortlisted',
    skills: ['React', 'TypeScript', 'Node.js']
  },
  {
    id: '2',
    candidateName: 'Michael Chen',
    jobTitle: 'Product Designer',
    appliedDate: '2024-01-19',
    matchScore: 88,
    status: 'new',
    skills: ['Figma', 'UI/UX', 'Prototyping']
  },
  {
    id: '3',
    candidateName: 'Emily Rodriguez',
    jobTitle: 'Senior Frontend Developer',
    appliedDate: '2024-01-18',
    matchScore: 92,
    status: 'interview',
    skills: ['React', 'Redux', 'GraphQL']
  }
];

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
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    interviewed: 0
  });
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
    setActiveTab(tabId);
    const query = tabId === 'overview' ? '' : `?tab=${tabId}`;
    navigate(`/employer/dashboard${query}`, state ? { state } : undefined);
  };

  const NavItem = ({ icon: Icon, label, id, badge }: any) => {
    const handleNavClick = () => {
      switchToTab(id);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    return (
      <button
        onClick={handleNavClick}
        title={!sidebarOpen ? label : undefined}
        className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-2'} py-3 rounded-xl transition-all duration-200 group relative overflow-visible ${
          activeTab === id
            ? darkMode
              ? 'bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10'
              : 'bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/20'
            : darkMode
            ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
        }`}
      >
        <div className={`flex items-center z-10 ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
          <Icon className="w-5 h-5" />
          {sidebarOpen && <span className="font-medium whitespace-nowrap">{label}</span>}
        </div>
        {badge && (
          <span className={`px-2 py-1 rounded-full text-xs font-bold z-10 ${
            darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
          } ${
            sidebarOpen
              ? 'opacity-100'
              : 'opacity-0 max-w-0 overflow-hidden px-0 py-0'
          }`}>
            {badge}
          </span>
        )}
        {!sidebarOpen && (
          <span
            className={`pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[90] -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-1 ${
              darkMode ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-white text-gray-900 border border-gray-300'
            }`}
          >
            {label}
          </span>
        )}
        {activeTab === id && (
          <div className={`absolute inset-0 bg-gradient-to-r ${
            darkMode ? 'from-blue-500/5 to-indigo-500/5' : 'from-blue-500/10 to-indigo-500/10'
          }`} />
        )}
      </button>
    );
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    const logoutToast = toast({
      title: "Logging out...",
      description: (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Please wait
        </span>
      ),
    });

    try {
      await logout();
      logoutToast.update({
        id: logoutToast.id,
        title: "",
        className: "border-0 bg-white text-gray-800 p-0 pr-8 overflow-hidden min-h-[72px]",
        duration: 1800,
        description: (
          <div className="relative w-full px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </span>
              <span className="text-xl leading-none font-medium text-gray-600">Logout Successful</span>
            </div>
            <span className="absolute bottom-0 left-0 h-1 bg-green-500 animate-[logout-progress-fill_1.8s_linear_forwards]" />
          </div>
        ),
      });
    } catch (e) {
      console.warn('Logout failed:', e);
      logoutToast.update({
        id: logoutToast.id,
        title: "Logout failed",
        description: "Something went wrong while logging out.",
        variant: "destructive",
      });
      return;
    }
    navigate('/', { replace: true });
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
        // Fetch jobs for this employer
        const jobsResponse = await apiFetch('/api/employer/jobs', {
          credentials: 'include'
        });

        if (!jobsResponse.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const jobsData = await jobsResponse.json();
        
        // Transform jobs data to match the Job interface
        const transformedJobs: Job[] = jobsData.map((job: any) => ({
          id: String(job.id),
          title: job.title,
          department: job.company?.industry || 'General',
          location: job.location,
          type: job.jobType || 'Full-time',
          salary: job.salaryMin && job.salaryMax 
            ? `$${Math.round(job.salaryMin/1000)}k - $${Math.round(job.salaryMax/1000)}k`
            : 'Not specified',
          postedDate: job.createdAt 
            ? new Date(job.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          applications: job.applications || 0,
          newApplications: job.newApplications || 0,
          status: job.isActive ? 'active' : 'paused',
          views: job.views || 0
        }));

        setJobs(transformedJobs);

        // Fetch applications for this employer
        const applicationsResponse = await apiFetch(`/api/applications?employerId=${user.id}`, {
          credentials: 'include'
        });

        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          
          // Transform applications data
          const transformedApplications: Application[] = applicationsData.slice(0, 3).map((app: any) => {
            const applicant = app.applicant || {};
            const applicantName = applicant.firstName && applicant.lastName
              ? `${applicant.firstName} ${applicant.lastName}`
              : applicant.email || 'Unknown Candidate';
            
            // Get skills from applicant profile or job
            const skills = applicant.skills || app.job?.skills || [];
            
            return {
              id: String(app.id),
              candidateName: applicantName,
              candidatePhoto: applicant.profilePhoto,
              jobTitle: app.job?.title || 'Unknown Position',
              appliedDate: app.appliedAt 
                ? new Date(app.appliedAt).toLocaleDateString()
                : new Date().toLocaleDateString(),
              matchScore: Math.floor(Math.random() * (95 - 80 + 1) + 80), // TODO: Calculate real match score
              status: app.status || 'new',
              skills: Array.isArray(skills) ? skills : []
            };
          });

          setApplications(transformedApplications);

          // Calculate stats
          const activeJobs = transformedJobs.filter(j => j.status === 'active').length;
          const totalApplications = applicationsData.length;
          const shortlisted = applicationsData.filter((app: any) => app.status === 'shortlisted').length;
          const interviewed = applicationsData.filter((app: any) => app.status === 'interview').length;

          setStats({
            activeJobs,
            totalApplications,
            shortlisted,
            interviewed
          });
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Keep empty state on error; DB/API is source of truth
        setJobs([]);
        setStats({
          activeJobs: 0,
          totalApplications: 0,
          shortlisted: 0,
          interviewed: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className={`min-h-screen w-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-screen transition-colors duration-300 fixed inset-0 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-slate-50 via-indigo-50/35 to-violet-100/35'} overflow-x-hidden`}>
      {/* Enhanced Animated background */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none ${darkMode ? 'opacity-100' : 'opacity-30'}`}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Enhanced Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-900/90 backdrop-blur-xl border-gray-800' : 'bg-white/95 backdrop-blur-xl border-gray-200 shadow-sm'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                className={`p-2.5 rounded-xl border transition-all duration-200 ${
                  darkMode
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
                  className={`w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:ring-2 focus:ring-blue-500/50 rounded-xl ${
                    darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            <div className={`flex items-center gap-2 rounded-2xl p-1.5 border ${
              darkMode ? 'bg-gray-900/30 border-white/10' : 'bg-white/60 border-gray-200'
            }`}>
              <div className="flex items-center gap-1">
                <button className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/80' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}>
                  <Mail className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-gray-50 dark:ring-gray-900"></span>
                </button>
                
                <button className={`p-2.5 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/80' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}>
                  <Bell className="w-5 h-5" />
                </button>
              </div>

              {/* Company Info + Direct Logout */}
              <button
                onClick={() => switchToTab('profile')}
                className={`ml-1 flex items-center rounded-xl text-sm p-2 gap-2.5 transition-all duration-200 border ${
                  darkMode
                    ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-800'
                    : 'bg-white/80 border-gray-200 hover:bg-white shadow-sm'
                }`}
                title="Open profile"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {company.logo}
                </div>
                <div className="hidden xl:block text-left max-w-[140px]">
                  <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</p>
                  <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{company.plan} Plan</p>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className={`ml-1 px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                  darkMode
                    ? 'text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20'
                    : 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>

              <div className={`ml-1 rounded-xl ${darkMode ? 'bg-gray-800/70' : 'bg-white/80'}`}>
                <ModeToggle />
              </div>
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
              
              {/* Profile Completion Score */}
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
                  Complete Profile
                </button>
              </div>
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
                <NavItem icon={Users} label="Applications" id="applications" badge="12" />
                <NavItem icon={Star} label="Candidates" id="candidates" />
                <NavItem icon={Mail} label="Messages" id="messages" badge="3" />
                <NavItem icon={BarChart3} label="Analytics" id="analytics" />
                <NavItem icon={TrendingUp} label="Stories" id="stories" />
                <NavItem icon={UserCircle} label="Profile" id="profile" />
                <NavItem icon={Settings} label="Settings" id="settings" />
              </div>
            </div>

            {/* Quick Actions */}
            {sidebarOpen && (
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => switchToTab('jobs', { openCreate: true })}
                  className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Post New Job
                </button>
                <button className={`w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-2 ${
                  darkMode 
                    ? 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300' 
                    : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                }`}>
                  <Share2 className="w-4 h-4" />
                  Share Dashboard
                </button>
              </div>
            </div>
            )}
          </div>
        </aside>

        {/* Enhanced Main Content */}
        <main className="flex-1 px-6 py-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {activeTab === 'candidates' ? (
            <div className="w-full">
              <CandidatesPage embedded />
            </div>
          ) : activeTab === 'jobs' ? (
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
          ) : (
          <div className="w-full space-y-7">
            {/* Enhanced Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r ${darkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-700'} bg-clip-text text-transparent`}>
                  {t("employer.dashboard.overview")}
                </h1>
                <p className={`text-base sm:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Welcome back! Here's what's happening with your hiring today.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                }`}>
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                }`}>
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Briefcase, label: 'Active Jobs', value: stats.activeJobs, change: '+12%', color: 'blue', trend: 'up' },
                { icon: Users, label: 'Total Applications', value: stats.totalApplications, change: '45 this week', color: 'purple', trend: 'up' },
                { icon: Star, label: 'Shortlisted', value: stats.shortlisted, change: '8 ready', color: 'emerald', trend: 'up' },
                { icon: TrendingUp, label: 'Interviewed', value: stats.interviewed, change: '3 offers', color: 'amber', trend: 'up' }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className={`rounded-2xl p-5 backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${premiumSurface} ${
                    darkMode ? 'hover:border-gray-600' : 'hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${
                      stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                      stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                      stat.color === 'emerald' ? 'from-emerald-500 to-green-500' :
                      'from-amber-500 to-orange-500'
                    } shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      stat.trend === 'up' 
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
              <div className={`rounded-2xl border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
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
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-blue-300 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    Complete Company Profile
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Active Jobs Section */}
              <div className="lg:col-span-2 space-y-8">
                <div className={`rounded-2xl backdrop-blur-sm border transition-all duration-300 ${premiumSurface}`}>
                  <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                        }`}>
                          <Briefcase className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <h2 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Job Postings</h2>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and track your job listings</p>
                        </div>
                      </div>
                      <button
                        onClick={() => switchToTab('jobs')}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-2 group"
                      >
                        View All
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {jobs.length === 0 ? (
                      <div className={`text-center py-12 rounded-xl border border-dashed ${darkMode ? 'border-gray-700 bg-gray-800/20' : 'border-indigo-200 bg-gradient-to-b from-white to-slate-50'}`}>
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
                      jobs.map(job => (
                      <div
                        key={job.id}
                        className={`rounded-xl p-5 transition-all duration-300 border backdrop-blur-sm group hover:shadow-lg ${premiumInset}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-lg font-bold ${darkMode ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'} transition-colors`}>
                                {job.title}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(job.status)}`}>
                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                              </span>
                            </div>
                            <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" />
                                {job.salary}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {job.postedDate}
                              </span>
                            </div>
                          </div>
                          
                          <div className="relative group/menu">
                            <button className={`p-2 rounded-lg transition-colors ${
                              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                            }`}>
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10 backdrop-blur-sm ${
                              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                              {[
                                { icon: Eye, label: 'View Details' },
                                { icon: Edit, label: 'Edit Job' },
                                { icon: job.status === 'active' ? Pause : Play, label: job.status === 'active' ? 'Pause Job' : 'Resume Job' },
                                { icon: Copy, label: 'Duplicate' },
                                { icon: Trash2, label: 'Delete Job', destructive: true }
                              ].map((action, index) => (
                                <button
                                  key={index}
                                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${
                                    action.destructive
                                      ? darkMode 
                                        ? 'text-red-400 hover:bg-red-500/10' 
                                        : 'text-red-600 hover:bg-red-50'
                                      : darkMode 
                                        ? 'text-gray-300 hover:bg-gray-700' 
                                        : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <action.icon className="w-4 h-4" />
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Users className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <span className="font-semibold">{job.applications}</span> applications
                              </span>
                            </div>
                            {job.newApplications > 0 && (
                              <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                                {job.newApplications} new
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                              <Eye className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {job.views} views
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => switchToTab('applications', { jobId: job.id })}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"
                          >
                            View Applications
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className={`rounded-2xl backdrop-blur-sm border p-5 ${premiumSurface}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                      <Clock className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Latest updates from your hiring pipeline</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: Users, color: 'blue', title: 'New application received', description: 'Sarah Johnson applied for Senior Frontend Developer', time: '2 minutes ago' },
                      { icon: CheckCircle, color: 'emerald', title: 'Interview scheduled', description: 'Michael Chen - Product Designer position', time: '1 hour ago' },
                      { icon: Star, color: 'purple', title: 'Candidate shortlisted', description: 'Emily Rodriguez added to shortlist', time: '3 hours ago' },
                      { icon: Briefcase, color: 'indigo', title: 'Job posting published', description: 'Senior Frontend Developer is now live', time: '2 days ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 group">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          darkMode 
                            ? `bg-${activity.color}-500/20 group-hover:bg-${activity.color}-500/30` 
                            : `bg-${activity.color}-100 group-hover:bg-${activity.color}-200`
                        } transition-colors`}>
                          <activity.icon className={`w-6 h-6 ${
                            darkMode ? `text-${activity.color}-400` : `text-${activity.color}-600`
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {activity.title}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {activity.description}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Sidebar Content */}
              <div className="space-y-8">
                {/* Recent Applications */}
                <div className={`rounded-2xl backdrop-blur-sm border p-5 ${premiumSurface}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                      <Users className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Applications</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Latest candidate submissions</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {applications.length === 0 ? (
                      <div className={`text-center py-8 rounded-xl border border-dashed ${darkMode ? 'border-gray-700 bg-gray-800/20' : 'border-indigo-200 bg-gradient-to-b from-white to-slate-50'}`}>
                        <Users className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`} />
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>No applications yet</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>Applications will appear here once candidates apply.</p>
                        <button
                          onClick={() => switchToTab('jobs', { openCreate: true })}
                          className={`mt-4 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            darkMode ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}
                        >
                          Publish a Job
                        </button>
                      </div>
                    ) : (
                      applications.map(app => (
                      <div
                        key={app.id}
                        className={`rounded-xl p-4 transition-all duration-300 cursor-pointer group border backdrop-blur-sm ${premiumInset}`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                            {app.candidateName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold ${darkMode ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'} transition-colors truncate`}>
                              {app.candidateName}
                            </h4>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>{app.jobTitle}</p>
                          </div>
                          <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {app.matchScore}%
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {app.skills.slice(0, 2).map(skill => (
                            <span
                              key={skill}
                              className={`text-xs px-2 py-1 rounded-md backdrop-blur-sm ${
                                darkMode ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-700'
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                          {app.skills.length > 2 && (
                            <span className={`text-xs px-2 py-1 rounded-md backdrop-blur-sm ${
                              darkMode ? 'bg-gray-600 text-gray-400' : 'bg-white text-gray-500'
                            }`}>
                              +{app.skills.length - 2}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(app.status)}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                          <button
                            onClick={() => switchToTab('applications', { appId: app.id })}
                            className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 group"
                          >
                            View
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => switchToTab('applications')}
                    className={`w-full mt-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 border ${
                      darkMode 
                        ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500 text-gray-300' 
                        : 'bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    View All Applications
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Hiring Pipeline */}
                <div className={`rounded-2xl p-5 text-white ${
                  darkMode
                    ? 'bg-gradient-to-b from-slate-900/95 to-slate-900/90 border border-indigo-400/20 shadow-[0_20px_50px_-25px_rgba(79,70,229,0.45)]'
                    : 'bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 ring-1 ring-indigo-300/40 shadow-xl'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/15 border border-indigo-400/25' : 'bg-white/20 backdrop-blur-sm'}`}>
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight">Hiring Pipeline</h3>
                      <p className={`text-sm ${darkMode ? 'text-slate-300/90' : 'text-white/80'}`}>Track your candidate flow</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { stage: 'New Applications', count: 24 },
                      { stage: 'Under Review', count: 18 },
                      { stage: 'Shortlisted', count: 12 },
                      { stage: 'Interview', count: 8 },
                      { stage: 'Offer Extended', count: 3 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <span className={`text-sm font-medium transition-colors ${darkMode ? 'text-slate-200 group-hover:text-white' : 'text-white/90 group-hover:text-white'}`}>
                          {item.stage}
                        </span>
                        <span className={`backdrop-blur-sm px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${
                          darkMode
                            ? 'bg-slate-700/60 text-indigo-100 border border-indigo-300/20 group-hover:bg-slate-700/80'
                            : 'bg-white/30 group-hover:bg-white/40'
                        }`}>
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button className={`w-full mt-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    darkMode
                      ? 'bg-indigo-500/15 text-indigo-100 border border-indigo-300/25 hover:bg-indigo-500/25'
                      : 'bg-white/95 text-indigo-700 hover:bg-white shadow-lg hover:shadow-xl'
                  }`}>
                    View Pipeline Analytics
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Premium Tip */}
                <div className={`rounded-2xl p-5 text-white ${
                  darkMode
                    ? 'bg-gradient-to-b from-slate-900/95 to-slate-900/90 border border-rose-400/20 shadow-[0_20px_50px_-25px_rgba(244,63,94,0.35)]'
                    : 'bg-gradient-to-br from-rose-500 via-fuchsia-500 to-pink-500 ring-1 ring-rose-300/40 shadow-xl'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-rose-500/15 border border-rose-300/25' : 'bg-white/20 backdrop-blur-sm'}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-extrabold tracking-tight">Pro Tip</h3>
                    </div>
                  </div>
                  <p className={`text-sm mb-4 leading-relaxed ${darkMode ? 'text-slate-200/90' : 'text-white/90'}`}>
                    Jobs with detailed descriptions get <span className="font-bold">2.5x more</span> quality applications. Add videos and team photos to boost engagement!
                  </p>
                  <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    darkMode
                      ? 'bg-rose-500/15 text-rose-100 border border-rose-300/25 hover:bg-rose-500/25'
                      : 'bg-white/95 text-rose-600 hover:bg-white shadow-lg hover:shadow-xl'
                  }`}>
                    Improve Job Posts
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </main>
      </div>

      {showLogoutConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
      )}
    </div>
  );
};

export default EmployerDashboard;