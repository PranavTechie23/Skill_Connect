import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';

// Import ROUTES constant
const ROUTES = {
  EMPLOYEE: {
    MESSAGES: '/employee/messages'
  }
};
import {
  Search, MapPin, Bookmark, Bell, MessageSquare, User, FileText,
  TrendingUp, Clock, CheckCircle, XCircle, Briefcase, Filter,
  Settings, Star, ArrowRight, LogOut, ChevronDown, Zap, Target,
  Award, Heart, Moon, Sun, Menu, X, Home, BarChart3,
  Upload, Calendar, Building2
} from 'lucide-react';

import { apiFetch } from '@/lib/api';

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
  pendingApplications: number;
  interviewInvitations: number;
  profileCompletion: number;
}

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
  const { theme, setTheme } = useTheme();
  const darkMode = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [stats] = useState<UserStats>({
    totalApplications: 12,
    pendingApplications: 3,
    interviewInvitations: 2,
    profileCompletion: 75
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [notifications, setNotifications] = useState(() => {
    const defaultNotifications = [
      { id: 1, text: 'Your job application was reviewed', read: false, time: '2 hours ago', cleared: false },
      { id: 2, text: 'New message from TechCorp Inc.', read: false, time: '3 hours ago', cleared: false },
      { id: 3, text: 'Interview scheduled for tomorrow', read: false, time: '5 hours ago', cleared: false }
    ];
    return defaultNotifications;
  });

  const [messages, setMessages] = useState(() => {
    const defaultMessages = [
      { id: 1, from: 'Sarah Chen', text: 'Hi, I reviewed your application...', read: false, time: '1 hour ago', cleared: false },
      { id: 2, from: 'TechCorp HR', text: 'Thank you for your interest...', read: false, time: '2 hours ago', cleared: false }
    ];
    return defaultMessages;
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const resetNotificationsAndMessages = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: false, cleared: false })));
    setMessages(prev => prev.map(m => ({ ...m, read: false, cleared: false })));
    setShowNotifications(false);
    setShowMessages(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      resetNotificationsAndMessages();
    } catch (e) {
      console.warn('Logout failed:', e);
    }
    navigate('/', { replace: true });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const jobsResponse = await apiFetch('/api/jobs');
      const jobsData = await jobsResponse.json();

      const formattedJobs = jobsData.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company?.name || 'N/A',
        location: job.location,
        skills: job.skills || [],
        salary: job.salaryMin && job.salaryMax ? `$${job.salaryMin/1000}k - $${job.salaryMax/1000}k` : 'Not specified',
        matchPercentage: Math.floor(Math.random() * (98 - 75 + 1) + 75), // Placeholder match %
        postedTime: new Date(job.createdAt).toLocaleDateString(),
        isNew: (new Date().getTime() - new Date(job.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000, // New if within 7 days
        type: job.jobType,
        applicationsCount: job.applicationsCount || 0,
      }));

      setRecommendedJobs(formattedJobs.slice(0, 3)); // Show top 3 recommended jobs
      setRecentApplications(mockApplications);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Optionally, set an error state to show a message to the user
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        color: darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
        label: 'Under Review'
      },
      reviewed: { 
        color: darkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
        icon: CheckCircle,
        label: 'Reviewed'
      },
      interview: { 
        color: darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: TrendingUp,
        label: 'Interview'
      },
      rejected: { 
        color: darkMode ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200',
        icon: XCircle,
        label: 'Not Selected'
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const NavItem = ({ icon: Icon, label, id, badge }: any) => {
    // Map sidebar ids to employee routes
    const routeMap: Record<string, string> = {
      overview: '/employee/dashboard',
      jobs: '/employee/jobs',
      applications: '/employee/applications',
      saved: '/employee/saved-jobs',
      messages: '/employee/messages',
      profile: '/employee/profile',
      story: '/employee/story',
      settings: '/employee/settings'
    };
    
    const handleNavClick = () => {
      setActiveTab(id);
      const to = routeMap[id] || '/employee/dashboard';
      navigate(to);
    };

    return (
      <button
        onClick={handleNavClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
          activeTab === id
            ? darkMode
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-blue-50 text-blue-700'
            : darkMode
            ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="font-medium">{label}</span>
        </div>
        {badge && (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
          }`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  const JobCard: React.FC<{ job: Job }> = ({ job }) => {
    const isSaved = savedJobs.includes(job.id);
    
    return (
      <div className={`group rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border overflow-hidden ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                {job.company.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className={`text-lg font-bold line-clamp-1 transition-colors ${
                    darkMode ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'
                  }`}>
                    {job.title}
                  </h3>
                  {job.isNew && (
                    <span className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
                      NEW
                    </span>
                  )}
                </div>
                <p className={`font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {job.company}
                </p>
                <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {job.type}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="4" fill="none" />
                  <circle
                    cx="32" cy="32" r="28" stroke="url(#gradient)" strokeWidth="4" fill="none"
                    strokeDasharray={`${job.matchPercentage * 1.76} 176`} strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {job.matchPercentage}%
                  </span>
                </div>
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Match</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.slice(0, 3).map(skill => (
              <span key={skill} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                darkMode 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-100'
              }`}>
                {skill}
              </span> ?? null
            ))}
            {job.skills.length > 3 && (
              <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                +{job.skills.length - 3} more
              </span>
            )}
          </div>
          
          <div className={`flex items-center justify-between pt-4 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <div className="flex flex-col gap-1">
              <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {job.salary}
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {job.applicationsCount} applicants • {job.postedTime}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => toggleSaveJob(job.id)}
                className={`p-2.5 border-2 rounded-lg transition-all ${
                  isSaved 
                    ? darkMode
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-red-500 bg-red-50 text-red-600'
                    : darkMode
                    ? 'border-gray-600 hover:border-red-500 hover:bg-red-500/10 text-gray-400 hover:text-red-400'
                    : 'border-gray-200 hover:border-red-500 hover:bg-red-50 text-gray-400 hover:text-red-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 group">
                Quick Apply
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-screen transition-colors duration-300 fixed inset-0 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'
    } overflow-x-hidden`}>
  {/* Top Navbar */}
  <nav className={`${darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'} backdrop-blur-lg border-b fixed top-0 left-0 right-0 z-50`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                    {/* back button removed */}
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
              
              <div>
                <h1 className={`text-2xl font-bold ${
                  darkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
                }`}>
                  Welcome back, {user?.firstName || 'User'}! 👋
                </h1>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Let's find your dream job today
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-2.5 rounded-xl transition-all ${
                  darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowMessages(false);
                  }}
                  className={`relative p-2.5 rounded-xl transition-all ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Bell className="w-6 h-6" />
                  {notifications.filter(n => !n.read && !n.cleared).length > 0 && (
                    <span className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                      {notifications.filter(n => !n.read && !n.cleared).length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl border py-2 z-50 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notifications
                      </h3>
                      <div className="flex items-center gap-2">
                        {notifications.some(n => !n.read) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent dropdown from closing
                              const updatedNotifications = notifications.map(n => 
                                !n.cleared ? { ...n, read: true } : n
                              );
                              setNotifications(updatedNotifications);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
                          >
                            Mark all as read
                          </button>
                        )}
                        {notifications.some(n => !n.cleared) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent dropdown from closing
                              const updatedNotifications = [...notifications].map(n => ({ ...n, cleared: true }));
                              setNotifications(updatedNotifications);
                            }}
                            className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!notifications.some(n => !n.cleared) ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifications.filter(n => !n.cleared).map((notification) => (
                          <div
                            key={notification.id}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent dropdown from closing
                              if (!notification.cleared) {
                                const updatedNotifications = notifications.map(n => 
                                  n.id === notification.id ? { ...n, read: true } : n
                                );
                                setNotifications(updatedNotifications);
                              }
                            }}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                              !notification.read
                                ? darkMode
                                  ? 'bg-blue-500/10 hover:bg-blue-500/20'
                                  : 'bg-blue-50 hover:bg-blue-100'
                                : darkMode
                                ? 'hover:bg-gray-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <p className={`text-sm ${!notification.read && 'font-semibold'} ${
                              darkMode ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {notification.text}
                            </p>
                            <p className={`text-xs mt-1 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {notification.time}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={() => {
                    setShowMessages(!showMessages);
                    setShowNotifications(false);
                  }}
                  className={`relative p-2.5 rounded-xl transition-all ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <MessageSquare className="w-6 h-6" />
                  {messages.filter(m => !m.read && !m.cleared).length > 0 && (
                    <span className="absolute top-1 right-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                      {messages.filter(m => !m.read && !m.cleared).length}
                    </span>
                  )}
                </button>

                {showMessages && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl border py-2 z-50 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Messages
                      </h3>
                      <div className="flex items-center gap-2">
                        {messages.some(m => !m.read) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent dropdown from closing
                              const updatedMessages = messages.map(m => 
                                !m.cleared ? { ...m, read: true } : m
                              );
                              setMessages(updatedMessages);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
                          >
                            Mark all as read
                          </button>
                        )}
                        {messages.some(m => !m.cleared) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent dropdown from closing
                              const updatedMessages = [...messages].map(m => ({ ...m, cleared: true }));
                              setMessages(updatedMessages);
                            }}
                            className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!messages.some(m => !m.cleared) ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          No messages
                        </div>
                      ) : (
                        messages.filter(m => !m.cleared).map((message) => (
                          <div
                            key={message.id}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent dropdown from closing
                              if (!message.cleared) {
                                const updatedMessages = messages.map(m => 
                                  m.id === message.id ? { ...m, read: true } : m
                                );
                                setMessages(updatedMessages);
                                navigate('/employee/messages');
                                setShowMessages(false);
                              }
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
                          navigate(ROUTES.EMPLOYEE.MESSAGES); // Navigate to messages page using route constant
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

              <div className="relative group">
                <button className="flex items-center gap-2 p-2 pr-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    {user?.firstName?.[0] || 'A'}{user?.lastName?.[0] || ''}
                  </div>
                  <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>

                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.firstName} {user?.lastName}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/employee/profile')}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                      darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => navigate('/employee/settings')}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                      darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} mt-2 pt-2`}>
                    <button onClick={handleLogout} className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                      darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'
                    }`}>
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

  <div className="flex mt-[4.5rem] relative">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300 overflow-hidden border-r ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            {/* Quick Stats */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                  <FileText className={`w-5 h-5 mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.totalApplications}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Applications</p>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-emerald-50'}`}>
                  <TrendingUp className={`w-5 h-5 mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.interviewInvitations}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Interviews</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Navigation
              </h3>
              <div className="space-y-1">
                <NavItem icon={Home} label="Overview" id="overview" />
                <NavItem icon={Search} label="Browse Jobs" id="jobs" />
                <NavItem icon={FileText} label="Applications" id="applications" badge="3" />
                <NavItem icon={Bookmark} label="Saved Jobs" id="saved" badge={savedJobs.length} />
                <NavItem icon={MessageSquare} label="Messages" id="messages" badge="2" />
                <NavItem icon={User} label="Profile" id="profile" />
                <NavItem icon={TrendingUp} label="Story" id="story" />
                <NavItem icon={Settings} label="Settings" id="settings" />
              </div>
            </div>

            {/* Profile Completion Card */}
            <div className={`p-4 rounded-xl ${
              darkMode ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            } text-white`}>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5" />
                <h3 className="font-bold">Profile Strength</h3>
              </div>
              <div className="text-3xl font-bold mb-2">{stats.profileCompletion}%</div>
              <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.profileCompletion}%` }}
                ></div>
              </div>
              <button
                onClick={() => navigate('/employee/profile')}
                className="w-full py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all font-medium text-sm"
              >
                Complete Profile
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-6 overflow-y-auto min-h-[calc(100vh-4.5rem)]">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all group ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Applications
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalApplications}
                </p>
                <p className="text-xs text-green-600 font-semibold mt-2">↑ 23% from last month</p>
              </div>

              <div className={`rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all group ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <Target className="w-5 h-5 text-amber-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pending Review
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.pendingApplications}
                </p>
                <p className="text-xs text-blue-600 font-semibold mt-2">Awaiting response</p>
              </div>

              <div className={`rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all group ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <Award className="w-5 h-5 text-emerald-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Interviews
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.interviewInvitations}
                </p>
                <p className="text-xs text-green-600 font-semibold mt-2">↑ 2 new this week</p>
              </div>

              <div className={`rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all group ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <Heart className="w-5 h-5 text-purple-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Profile Score
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.profileCompletion}%
                </p>
                <p className="text-xs text-amber-600 font-semibold mt-2">Complete to boost matches</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className={`rounded-2xl shadow-lg border p-6 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`px-6 py-4 border rounded-xl font-medium transition-all flex items-center gap-2 ${
                      darkMode 
                        ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                    Filters
                  </button>
                  <button className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-blue-500/30">
                    <Search className="w-5 h-5" />
                    Search Jobs
                  </button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border ${
                  darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Job Type
                    </label>
                    <select className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                    }`}>
                      <option>All Types</option>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Location
                    </label>
                    <select className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                    }`}>
                      <option>Any Location</option>
                      <option>Remote</option>
                      <option>On-site</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Experience Level
                    </label>
                    <select className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                    }`}>
                      <option>Any Level</option>
                      <option>Entry Level</option>
                      <option>Mid Level</option>
                      <option>Senior Level</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Recommended Jobs Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Recommended For You
                  </h2>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Jobs that match your profile and preferences
                  </p>
                </div>
                <button className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  darkMode 
                    ? 'text-blue-400 hover:bg-blue-500/20' 
                    : 'text-blue-600 hover:bg-blue-50'
                }`}>
                  View All
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>

            {/* Recent Applications and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Applications */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Recent Applications
                    </h2>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Track your job application status
                    </p>
                  </div>
                  <button className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    darkMode 
                      ? 'text-blue-400 hover:bg-blue-500/20' 
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}>
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {recentApplications.map(application => {
                    const statusConfig = getStatusConfig(application.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div key={application.id} className={`p-4 rounded-xl border transition-all hover:shadow-lg ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                              {application.company.substring(0, 2)}
                            </div>
                            <div>
                              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {application.jobTitle}
                              </h3>
                              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                {application.company}
                              </p>
                              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                Applied on {application.appliedDate}
                              </p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Quick Actions
                </h2>
                <div className="space-y-4">
                  <button className={`w-full p-4 rounded-xl border transition-all hover:shadow-lg text-left group ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Upload Resume
                        </h3>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Update your latest resume
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className={`w-full p-4 rounded-xl border transition-all hover:shadow-lg text-left group ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Company Research
                        </h3>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Explore top companies
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className={`w-full p-4 rounded-xl border transition-all hover:shadow-lg text-left group ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Interview Prep
                        </h3>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Practice common questions
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className={`w-full p-4 rounded-xl border transition-all hover:shadow-lg text-left group ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Career Insights
                        </h3>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          View your progress analytics
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;