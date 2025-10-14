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
  Bell
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
    name: 'SkillConnect',
    logo: 'SC',
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
    // Map sidebar ids to employer routes
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
    <div className={`min-h-screen w-screen transition-colors duration-300 fixed inset-0 ${darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gray-50'} overflow-x-hidden`}>
      {/* Animated background */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none ${darkMode ? 'opacity-100' : 'opacity-30'}`}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      {/* Employer Dashboard Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-900/80 backdrop-blur-sm border-gray-800' : 'bg-white/80 backdrop-blur-sm border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                  SC
                </div>
                <h1 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} font-['Poppins']`}>
                  SkillConnect
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button className={`relative p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                  <Mail className="w-5 h-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-gray-50 dark:ring-gray-900"></span>
                </button>
                
                <button className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                  <Bell className="w-5 h-5" />
                </button>
              </div>

              <div className="ml-3 relative group">
                <button className={`flex items-center max-w-xs rounded-lg text-sm p-2 gap-2 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  <div className="h-8 w-8 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                    TC
                  </div>
                  <div className="hidden md:block text-left">
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>TechCorp Inc.</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Employer</p>
                  </div>
                  <ChevronDown className={`hidden md:block w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>

                <div className={`absolute right-0 mt-2 w-56 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border`}>
                  <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{company.plan} Plan</p>
                  </div>
                  <button className={`w-full px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'} flex items-center gap-2`}>
                    <User className="w-4 h-4" />
                    Company Profile
                  </button>
                  <button className={`w-full px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'} flex items-center gap-2`}>
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button 
                      onClick={handleLogout}
                      className={`w-full px-4 py-2 text-sm ${darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'} flex items-center gap-2`}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              <ModeToggle />
            </div>
          </div>
        </div>
      </div>

  <div className="flex mt-16 relative">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} h-[calc(100vh-4rem)] sticky top-16 ${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border-r transition-all duration-300 overflow-hidden backdrop-blur-sm`}>
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            {/* Quick Stats */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Briefcase className="w-5 h-5 mb-1 text-blue-400" />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.activeJobs}</p>
                  <p className="text-xs text-gray-400">Active Jobs</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Users className="w-5 h-5 mb-1 text-purple-400" />
                  <p className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.totalApplications}</p>
                  <p className="text-xs text-gray-400">Applications</p>
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
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Quick Actions
              </h3>
              <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg">
                <Plus className="w-5 h-5" />
                Post New Job
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-6 overflow-y-auto min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Dashboard Overview
              </h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Manage your job postings and track applications
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 hover:shadow-xl transition-all group`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Jobs</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeJobs}</p>
                <p className="text-xs text-emerald-600 font-semibold mt-2">↑ 12% this month</p>
              </div>

              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 hover:shadow-xl transition-all group`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Applications</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalApplications}</p>
                <p className="text-xs text-blue-600 font-semibold mt-2">45 this week</p>
              </div>

              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 hover:shadow-xl transition-all group`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <Award className="w-5 h-5 text-emerald-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shortlisted</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.shortlisted}</p>
                <p className="text-xs text-emerald-600 font-semibold mt-2">8 ready to interview</p>
              </div>

              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 hover:shadow-xl transition-all group`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <CheckCircle className="w-5 h-5 text-amber-500" />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Interviewed</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.interviewed}</p>
                <p className="text-xs text-amber-600 font-semibold mt-2">3 offers pending</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Active Jobs */}
              <div className="lg:col-span-2">
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg`}>
                        <Briefcase className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Job Postings</h2>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-2 group">
                      View All
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {jobs.map(job => (
                      <div
                        key={job.id}
                        className={`${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-5 hover:shadow-lg transition-all group`}
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
                            <button className={`p-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg transition-colors`}>
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-xl border py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10`}>
                              <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                                <Edit className="w-4 h-4" />
                                Edit Job
                              </button>
                              <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                                {job.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {job.status === 'active' ? 'Pause' : 'Resume'} Job
                              </button>
                              <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} my-2`}></div>
                              <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>
                                <Trash2 className="w-4 h-4" />
                                Delete Job
                              </button>
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
                          
                          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-sm flex items-center gap-2">
                            View Applications
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar - Recent Applications & Quick Actions */}
              <div className="space-y-6">
                {/* Recent Applications */}
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-lg`}>
                      <Users className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Applications</h3>
                  </div>

                  <div className="space-y-4">
                    {applications.map(app => (
                      <div
                        key={app.id}
                        className={`${darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} border rounded-xl p-4 transition-all cursor-pointer group`}
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
                          <div className={`text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                            {app.matchScore}%
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {app.skills.slice(0, 2).map(skill => (
                            <span
                              key={skill}
                              className={`text-xs px-2 py-1 rounded-md ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-700'}`}
                            >
                              {skill}
                            </span>
                          ))}
                          {app.skills.length > 2 && (
                            <span className={`text-xs px-2 py-1 rounded-md ${darkMode ? 'bg-gray-600 text-gray-400' : 'bg-white text-gray-500'}`}>
                              +{app.skills.length - 2}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(app.status)}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                          <button className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1">
                            View
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className={`w-full mt-4 py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2`}>
                    View All Applications
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Hiring Pipeline */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} rounded-2xl p-6 text-white`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5" />
                    <h3 className="text-lg font-bold">Hiring Pipeline</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/90">New Applications</span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-bold text-sm">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/90">Under Review</span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-bold text-sm">18</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/90">Shortlisted</span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-bold text-sm">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/90">Interview</span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-bold text-sm">8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/90">Offer Extended</span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-bold text-sm">3</span>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                    View Pipeline
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'} rounded-lg`}>
                      <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>This Week</h3>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'} border`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Applications Received</span>
                        <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>45</p>
                      <p className={`text-xs ${darkMode ? 'text-emerald-400' : 'text-emerald-600'} font-semibold mt-1`}>↑ 23% vs last week</p>
                    </div>

                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Interviews Scheduled</span>
                        <Calendar className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>8</p>
                      <p className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'} font-semibold mt-1`}>3 today, 5 upcoming</p>
                    </div>

                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'} border`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>Avg. Time to Hire</span>
                        <Clock className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                      </div>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>18 days</p>
                      <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'} font-semibold mt-1`}>↓ 3 days improvement</p>
                    </div>
                  </div>
                </div>

                {/* Premium Tip */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-rose-600 to-pink-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'} rounded-2xl p-6 text-white mt-6`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold">Pro Tip</h3>
                    </div>
                  </div>
                  <p className="text-sm text-white/90 mb-4 leading-relaxed">
                    Jobs with detailed descriptions get <span className="font-bold">2.5x more</span> quality applications!
                  </p>
                  <button className="w-full py-2.5 bg-white/95 text-rose-600 rounded-xl font-semibold text-sm hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg">
                    Improve Job Posts
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'} rounded-lg`}>
                  <Clock className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Users className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      New application received
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sarah Johnson applied for Senior Frontend Developer
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>2 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Interview scheduled
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Michael Chen - Product Designer position
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <Star className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Candidate shortlisted
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Emily Rodriguez added to shortlist
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>3 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                    <Briefcase className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Job posting published
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Senior Frontend Developer is now live
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>2 days ago</p>
                  </div>
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