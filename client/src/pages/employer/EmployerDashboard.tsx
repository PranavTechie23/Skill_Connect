import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from "@/components/theme-provider";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import {
  Briefcase, Users, TrendingUp, Clock, Plus, MoreVertical, 
  MapPin, DollarSign, Calendar, Eye, Settings, LogOut, Menu, X, 
  Home, BarChart3, User, Star, ChevronDown, Edit, Pause, Play, 
  Trash2, Copy, CheckCircle, ArrowRight, Target, Award, Zap, Mail,
  Bell, Search, Filter, Download, Share2
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
  const darkMode = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs] = useState<Job[]>(mockJobs);
  const [applications] = useState<Application[]>(mockApplications);

  const company = {
    name: 'TechCorp Inc.',
    logo: 'TC',
    plan: 'Professional'
  };

  const stats = {
    activeJobs: 8,
    totalApplications: 234,
    shortlisted: 45,
    interviewed: 12
  };

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

  const NavItem = ({ icon: Icon, label, id, badge }: any) => {
    const routeMap: Record<string, string> = {
      overview: '/employer/dashboard',
      jobs: '/employer/jobs',
      applications: '/employer/applications',
      candidates: '/employer/candidates',
      messages: '/employer/messages',
      analytics: '/employer/analytics',
      stories: '/employer/stories',
      settings: '/employer/settings'
    };
    
    const handleNavClick = () => {
      setActiveTab(id);
      const to = routeMap[id] || '/employer/dashboard';
      navigate(to);
    };

    return (
      <button
        onClick={handleNavClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
          activeTab === id
            ? darkMode
              ? 'bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10'
              : 'bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/20'
            : darkMode
            ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3 z-10">
          <Icon className="w-5 h-5" />
          <span className="font-medium">{label}</span>
        </div>
        {badge && (
          <span className={`px-2 py-1 rounded-full text-xs font-bold z-10 ${
            darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
          }`}>
            {badge}
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
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout failed:', e);
    }
    navigate('/', { replace: true });
  };

  return (
    <div className={`min-h-screen w-screen transition-colors duration-300 fixed inset-0 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'} overflow-x-hidden`}>
      {/* Enhanced Animated background */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none ${darkMode ? 'opacity-100' : 'opacity-40'}`}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Enhanced Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-900/90 backdrop-blur-xl border-gray-800' : 'bg-white/90 backdrop-blur-xl border-gray-200/80'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/80' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {company.logo}
                </div>
                <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} font-['Poppins']`}>
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

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
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

              {/* Action Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <button className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}>
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={() => navigate('/employer/jobs')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  New Job
                </button>
              </div>

              {/* User Menu */}
              <div className="ml-2 relative group">
                <button className={`flex items-center max-w-xs rounded-xl text-sm p-2 gap-3 transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gray-800/80 hover:bg-gray-700/80' 
                    : 'bg-white/80 hover:bg-gray-100/80 shadow-sm'
                }`}>
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {company.logo}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{company.plan} Plan</p>
                  </div>
                  <ChevronDown className={`hidden lg:block w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>

                <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl py-2 ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border backdrop-blur-sm z-50`}>
                  <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{company.plan} Plan</p>
                  </div>
                  <button className={`w-full px-4 py-2.5 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'} flex items-center gap-3 transition-colors`}>
                    <User className="w-4 h-4" />
                    Company Profile
                  </button>
                  <button className={`w-full px-4 py-2.5 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'} flex items-center gap-3 transition-colors`}>
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-1`}></div>
                  <button 
                    onClick={handleLogout}
                    className={`w-full px-4 py-2.5 text-sm ${darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'} flex items-center gap-3 transition-colors`}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>

              <ModeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="flex mt-16 relative">
        {/* Enhanced Sidebar */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} h-[calc(100vh-4rem)] sticky top-16 ${darkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} border-r transition-all duration-300 overflow-hidden backdrop-blur-sm`}>
          <div className="p-6 space-y-8 h-full overflow-y-auto">
            {/* Quick Stats */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 backdrop-blur-sm">
                  <Briefcase className="w-5 h-5 mb-2 text-blue-400" />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeJobs}</p>
                  <p className="text-xs text-gray-400">Active Jobs</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 backdrop-blur-sm">
                  <Users className="w-5 h-5 mb-2 text-purple-400" />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalApplications}</p>
                  <p className="text-xs text-gray-400">Applications</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Navigation
              </h3>
              <div className="space-y-2">
                <NavItem icon={Home} label="Overview" id="overview" />
                <NavItem icon={Briefcase} label="Job Postings" id="jobs" badge={stats.activeJobs} />
                <NavItem icon={Users} label="Applications" id="applications" badge="12" />
                <NavItem icon={Star} label="Candidates" id="candidates" />
                <NavItem icon={Mail} label="Messages" id="messages" badge="3" />
                <NavItem icon={BarChart3} label="Analytics" id="analytics" />
                <NavItem icon={TrendingUp} label="Stories" id="stories" />
                <NavItem icon={Settings} label="Settings" id="settings" />
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/employer/jobs')}
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
          </div>
        </aside>

        {/* Enhanced Main Content */}
        <main className="flex-1 px-6 py-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Enhanced Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-4xl font-black mb-3 bg-gradient-to-r ${darkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-700'} bg-clip-text text-transparent`}>
                  Dashboard Overview
                </h1>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Briefcase, label: 'Active Jobs', value: stats.activeJobs, change: '+12%', color: 'blue', trend: 'up' },
                { icon: Users, label: 'Total Applications', value: stats.totalApplications, change: '45 this week', color: 'purple', trend: 'up' },
                { icon: Star, label: 'Shortlisted', value: stats.shortlisted, change: '8 ready', color: 'emerald', trend: 'up' },
                { icon: TrendingUp, label: 'Interviewed', value: stats.interviewed, change: '3 offers', color: 'amber', trend: 'up' }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className={`rounded-2xl p-6 backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                      : 'bg-white/80 border-gray-200/80 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
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
                  <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                  <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Enhanced Active Jobs Section */}
              <div className="lg:col-span-2 space-y-8">
                <div className={`rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                  darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200/80'
                }`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                        }`}>
                          <Briefcase className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Job Postings</h2>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and track your job listings</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/employer/jobs')}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-2 group"
                      >
                        View All
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {jobs.map(job => (
                      <div
                        key={job.id}
                        className={`rounded-xl p-5 transition-all duration-300 border backdrop-blur-sm group hover:shadow-lg ${
                          darkMode 
                            ? 'bg-gray-700/30 border-gray-600 hover:border-gray-500' 
                            : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
                        }`}
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
                            onClick={() => navigate(`/employer/applications?jobId=${job.id}`)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"
                          >
                            View Applications
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className={`rounded-2xl backdrop-blur-sm border p-6 ${
                  darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200/80'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                      <Clock className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
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
                <div className={`rounded-2xl backdrop-blur-sm border p-6 ${
                  darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200/80'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                      <Users className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Applications</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Latest candidate submissions</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {applications.map(app => (
                      <div
                        key={app.id}
                        className={`rounded-xl p-4 transition-all duration-300 cursor-pointer group border backdrop-blur-sm ${
                          darkMode 
                            ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500' 
                            : 'bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-gray-300'
                        }`}
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
                            onClick={() => navigate(`/employer/applications?appId=${app.id}`)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 group"
                          >
                            View
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('/employer/applications')}
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
                <div className={`rounded-2xl p-6 text-white bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-xl`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Hiring Pipeline</h3>
                      <p className="text-sm text-white/80">Track your candidate flow</p>
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
                        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                          {item.stage}
                        </span>
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg font-bold text-sm group-hover:bg-white/30 transition-all">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                    View Pipeline Analytics
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Premium Tip */}
                <div className={`rounded-2xl p-6 text-white bg-gradient-to-br from-rose-600 via-red-600 to-pink-600 shadow-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold">Pro Tip</h3>
                    </div>
                  </div>
                  <p className="text-sm text-white/90 mb-4 leading-relaxed">
                    Jobs with detailed descriptions get <span className="font-bold">2.5x more</span> quality applications. Add videos and team photos to boost engagement!
                  </p>
                  <button className="w-full py-3 bg-white/95 text-rose-600 rounded-xl font-semibold text-sm hover:bg-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                    Improve Job Posts
                    <ArrowRight className="w-4 h-4" />
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

export default EmployerDashboard;