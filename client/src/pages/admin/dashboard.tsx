import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Users, Building2, Briefcase, TrendingUp, Activity, Settings,
  LogOut, Moon, Sun, Menu, X, Search, MoreVertical, Eye, Edit,
  Trash2, CheckCircle, XCircle, AlertCircle, Clock, Mail,
  Calendar, BarChart3, FileText, UserCheck, Pause, Play, Ban, ChevronDown,
  ArrowRight, Zap, Target, Award, MessageSquare, Bell, Home
} from 'lucide-react';
interface AdminStats {
  totalUsers: number;
  totalEmployees: number;
  totalEmployers: number;
  activeJobs: number;
  totalApplications: number;
  newUsersToday: number;
  newJobsToday: number;
  pendingApprovals: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  type: 'employee' | 'employer';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  lastActive: string;
  location?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  status: 'active' | 'paused' | 'closed';
  applications: number;
  postedDate: string;
  salary: string;
}

const mockStats: AdminStats = {
  totalUsers: 1247,
  totalEmployees: 893,
  totalEmployers: 354,
  activeJobs: 428,
  totalApplications: 5632,
  newUsersToday: 23,
  newJobsToday: 15,
  pendingApprovals: 8
};

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    type: 'employee',
    status: 'active',
    joinDate: '2024-01-15',
    lastActive: '2 hours ago',
    location: 'San Francisco, CA'
  },
  {
    id: '2',
    name: 'TechCorp Inc.',
    email: 'hr@techcorp.com',
    type: 'employer',
    status: 'active',
    joinDate: '2024-01-10',
    lastActive: '1 day ago',
    location: 'New York, NY'
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    type: 'employee',
    status: 'pending',
    joinDate: '2024-01-20',
    lastActive: '5 minutes ago',
    location: 'Austin, TX'
  },
  {
    id: '4',
    name: 'StartupXYZ',
    email: 'contact@startupxyz.com',
    type: 'employer',
    status: 'active',
    joinDate: '2024-01-25',
    lastActive: '3 days ago',
    location: 'San Francisco, CA'
  },
  {
    id: '5',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    type: 'employee',
    status: 'pending',
    joinDate: '2024-01-28',
    lastActive: '2 weeks ago',
    location: 'Chicago, IL'
  }
];

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    status: 'active',
    applications: 45,
    postedDate: '2024-01-15',
    salary: '$120k - $150k'
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'StartupXYZ',
    status: 'active',
    applications: 67,
    postedDate: '2024-01-18',
    salary: '$100k - $130k'
  }
];

const AdminDashboard: React.FC = () => {
  // use global theme provider so toggling here applies across the app
  const { theme, setTheme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

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

  // initialize a few items on mount
  useEffect(() => {
    generateNotifications();
    generateMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout failed:', e);
    }
    navigate('/', { replace: true });
  };

  const NavItem = ({ icon: Icon, label, id, badge }: any) => (
    <button
      onClick={() => {
        setActiveTab(id);
        // map sidebar ids to admin routes
        const routeMap: Record<string, string> = {
          overview: '/admin',
          users: '/admin/users',
          employers: '/admin/companies',
          employees: '/admin/employees',
          jobs: '/admin/jobs',
          applications: '/admin/applications',
          approvals: '/admin/approvals',
          analytics: '/admin/analytics',
          settings: '/admin/settings',
        };
        const to = routeMap[id] || '/admin';
        navigate(to);
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
        activeTab === id
          ? darkMode
            ? 'bg-red-500/20 text-red-400'
            : 'bg-red-50 text-red-700'
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
          darkMode ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  // Sync activeTab with route when location changes (keeps sidebar highlighted)
  React.useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      setActiveTab('overview');
    } else if (location.pathname.startsWith('/admin/settings')) {
      setActiveTab('settings');
    }
  }, [location.pathname]);

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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Navbar */}
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-opacity-80`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Admin Control Panel
                  </h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    SkillConnect Admin Panel
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(darkMode ? 'light' : 'dark')}
                className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative">
                <button onClick={() => { generateNotifications(); setShowNotifications(s => !s); setShowMessages(false); }} className={`relative p-2.5 rounded-xl transition-all ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {showNotifications && notifications.length > 0 && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl border py-2 z-40 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="px-4 py-2 border-b">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</span>
                        <button onClick={() => setNotifications([])} className="text-xs text-gray-400">Clear</button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{n.title}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{n.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => { generateMessages(); setShowMessages(s => !s); setShowNotifications(false); }} className={`relative p-2.5 rounded-xl transition-all ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <MessageSquare className="w-5 h-5" />
                  {messagesList.length > 0 && (
                    <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {messagesList.length}
                    </span>
                  )}
                </button>

                {/* Messages dropdown */}
                {showMessages && messagesList.length > 0 && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl border py-2 z-40 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="px-4 py-2 border-b">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Messages</span>
                        <button onClick={() => setMessagesList([])} className="text-xs text-gray-400">Clear</button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {messagesList.map(m => (
                        <div key={m.id} className={`px-4 py-3 border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{m.from}</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.preview}</div>
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative group">
                <button className="flex items-center gap-2 p-2 pr-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">
                  <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {admin.avatar}
                  </div>
                  <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>

                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{admin.name}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{admin.email}</p>
                  </div>
                  <button onClick={() => navigate('/admin/settings')} className={`w-full px-4 py-2 text-left flex items-center gap-3 ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} mt-2 pt-2`}>
                    <button onClick={handleLogout} className={`w-full px-4 py-2 text-left flex items-center gap-3 ${darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>
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

  <div className="flex mt-16">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden border-r ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                System Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-red-50'}`}>
                  <Users className={`w-5 h-5 mb-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {mockStats.totalUsers}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                  <Briefcase className={`w-5 h-5 mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {mockStats.activeJobs}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Jobs</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Navigation
              </h3>
              <div className="space-y-1">
                <NavItem icon={Home} label="Overview" id="overview" />
                <NavItem icon={Users} label="User Management" id="users" badge={mockStats.newUsersToday} />
                <NavItem icon={Building2} label="Employers" id="employers" />
                <NavItem icon={UserCheck} label="Employees" id="employees" />
                <NavItem icon={Briefcase} label="Job Postings" id="jobs" badge={mockStats.newJobsToday} />
                <NavItem icon={FileText} label="Applications" id="applications" />
                <NavItem icon={AlertCircle} label="Pending Approvals" id="approvals" badge={mockStats.pendingApprovals} />
                <NavItem icon={BarChart3} label="Analytics" id="analytics" />
                <NavItem icon={Settings} label="System Settings" id="settings" />
              </div>
            </div>

            {/* System Status */}
            <div className={`p-4 rounded-xl ${
              darkMode ? 'bg-gradient-to-br from-emerald-600 to-green-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'
            } text-white`}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5" />
                <h3 className="font-bold">System Status</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/90">Server</span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">Database</span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">API</span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Running
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Dashboard Overview
              </h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Monitor and manage all platform activities
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`rounded-2xl border p-6 hover:shadow-xl transition-all group ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Users
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {mockStats.totalUsers}
                </p>
                <p className="text-xs text-emerald-600 font-semibold mt-2">
                  ↑ {mockStats.newUsersToday} new today
                </p>
              </div>

              <div className={`rounded-2xl border p-6 hover:shadow-xl transition-all group ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Employers
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {mockStats.totalEmployers}
                </p>
                <p className="text-xs text-blue-600 font-semibold mt-2">
                  {Math.round((mockStats.totalEmployers / mockStats.totalUsers) * 100)}% of users
                </p>
              </div>

              <div className={`rounded-2xl border p-6 hover:shadow-xl transition-all group ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <Award className="w-5 h-5 text-emerald-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Employees
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {mockStats.totalEmployees}
                </p>
                <p className="text-xs text-emerald-600 font-semibold mt-2">
                  {Math.round((mockStats.totalEmployees / mockStats.totalUsers) * 100)}% of users
                </p>
              </div>

              <div className={`rounded-2xl border p-6 hover:shadow-xl transition-all group ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Active Jobs
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {mockStats.activeJobs}
                </p>
                <p className="text-xs text-amber-600 font-semibold mt-2">
                  ↑ {mockStats.newJobsToday} posted today
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Users Table */}
              <div className="lg:col-span-2">
                <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                        <Users className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Recent Users
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`pl-10 pr-4 py-2 rounded-lg border text-sm ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className={`px-3 py-2 rounded-lg border text-sm ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      >
                        <option value="all">All Users</option>
                        <option value="employee">Employees</option>
                        <option value="employer">Employers</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {mockUsers.map(user => {
                      const statusBadge = getStatusBadge(user.status);
                      const StatusIcon = statusBadge.Icon;

                      return (
                        <div
                          key={user.id}
                          className={`p-4 rounded-xl border transition-all ${
                            darkMode 
                              ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                                user.type === 'employee' 
                                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                  : 'bg-gradient-to-br from-purple-500 to-pink-600'
                              }`}>
                                {user.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {user.name}
                                  </h3>
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                    user.type === 'employee'
                                      ? darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                      : darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {user.type}
                                  </span>
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {user.email}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                  Joined {user.joinDate} • Last active {user.lastActive}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusBadge.color}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </span>

                              <div className="relative group/menu">
                                <button className={`p-2 rounded-lg transition-colors ${
                                  darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                }`}>
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 ${
                                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                }`}>
                                  <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                    darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                  }`}>
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </button>
                                  <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                    darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                  }`}>
                                    <Edit className="w-4 h-4" />
                                    Edit User
                                  </button>
                                  <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                    darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                  }`}>
                                    <Mail className="w-4 h-4" />
                                    Send Message
                                  </button>
                                  <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} my-2`}></div>
                                  {user.status === 'active' ? (
                                    <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                      darkMode ? 'hover:bg-amber-500/10 text-amber-400' : 'hover:bg-amber-50 text-amber-600'
                                    }`}>
                                      <Ban className="w-4 h-4" />
                                      Suspend User
                                    </button>
                                  ) : (
                                    <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                      darkMode ? 'hover:bg-emerald-500/10 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-600'
                                    }`}>
                                      <CheckCircle className="w-4 h-4" />
                                      Activate User
                                    </button>
                                  )}
                                  <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                    darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'
                                  }`}>
                                    <Trash2 className="w-4 h-4" />
                                    Delete User
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button className={`w-full mt-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                    View All Users
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sidebar - Stats & Actions */}
              <div className="space-y-6">
                {/* Pending Approvals */}
                <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                      <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    </div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Pending Approvals
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'} border`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                          New Employers
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          darkMode ? 'bg-amber-500 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          3
                        </span>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                        Pending company verification
                      </p>
                    </div>

                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                          Job Postings
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          5
                        </span>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        Awaiting content review
                      </p>
                    </div>

                    <button className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all font-semibold text-sm flex items-center justify-center gap-2">
                      Review All
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                      <Activity className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Recent Activity
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border ${
                      darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                          <Users className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            New User Registered
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Jane Smith joined as employee
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                            5 minutes ago
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                          <Briefcase className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Job Posted
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Senior Developer at TechCorp
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                            1 hour ago
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      darkMode ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                          <Building2 className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Company Verified
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            StartupXYZ approved
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                            3 hours ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>



            {/* Recent Jobs Table */}
            <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <Briefcase className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Recent Job Postings
                  </h2>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-2 group">
                  View All
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="space-y-3">
                {mockJobs.map(job => {
                  const statusBadge = getStatusBadge(job.status);
                  const StatusIcon = statusBadge.Icon;

                  return (
                    <div
                      key={job.id}
                      className={`p-4 rounded-xl border transition-all ${
                        darkMode 
                          ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                            {job.company.substring(0, 2)}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {job.title}
                            </h3>
                            <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {job.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {job.applications} applications
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {job.postedDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusBadge.color}`}>
                            <StatusIcon className="w-3.5 h-3.5 inline mr-1" />
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>

                          <div className="relative group/menu">
                            <button className={`p-2 rounded-lg transition-colors ${
                              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                            }`}>
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 ${
                              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                              <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                              }`}>
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                              }`}>
                                <Edit className="w-4 h-4" />
                                Edit Job
                              </button>
                              <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                darkMode ? 'hover:bg-amber-500/10 text-amber-400' : 'hover:bg-amber-50 text-amber-600'
                              }`}>
                                {job.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {job.status === 'active' ? 'Pause' : 'Resume'} Job
                              </button>
                              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} my-2`}></div>
                              <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${
                                darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'
                              }`}>
                                <Trash2 className="w-4 h-4" />
                                Delete Job
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;