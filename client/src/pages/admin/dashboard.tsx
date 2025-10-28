import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield, Users, Building2, Briefcase, TrendingUp, Activity, Settings, IndianRupee,
  LogOut, Moon, Sun, Menu, X, Search, MoreVertical, Eye, Edit, Link as LinkIcon,
  Trash2, CheckCircle, XCircle, AlertCircle, Clock, Mail, Phone,
  Calendar, BarChart3, FileText, UserCheck, Pause, Play, Ban, ChevronDown, ArrowRight, Zap, Target, Award, MessageSquare, Bell, Home, DollarSign, TrendingDown
} from 'lucide-react';
import { adminService, type UpdateUserData } from '@/lib/admin-service';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
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
      setRecentUsers((usersData || []).slice(0, 5));
    } catch (error) {
      console.error("Failed to reload users", error);
      toast({ title: "Error", description: "Could not refresh user list.", variant: "destructive" });
    }
  };

  const loadJobs = async () => {
    try {
      const jobsData = await adminService.getJobs();
      setRecentJobs((jobsData || []).slice(0, 5));
    } catch (error) {
      console.error("Failed to reload jobs", error);
      toast({ title: "Error", description: "Could not refresh job list.", variant: "destructive" });
    }
  };

  const handleViewUser = async (user: any) => {
    try {
      // Fetch complete user details from backend
      const userDetails = await adminService.getUserById(user.id);
      setSelectedUser(userDetails);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      toast({ title: "Error", description: "Failed to load user details.", variant: "destructive" });
    }
  };

  const handleEditUser = (user: any) => {
    setUserToEdit(user);
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
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    }
  };

  const handleViewJob = async (job: any) => {
    try {
      // Fetch complete job details from backend
      const jobDetails = await adminService.getJobById(job.id);
      setSelectedJob(jobDetails);
    } catch (error) {
      console.error("Failed to fetch job details:", error);
      toast({ title: "Error", description: "Failed to load job details.", variant: "destructive" });
    }
  };

  const handleToggleJobStatus = async (job: any) => {
    try {
      const newStatus = job.status === 'active' ? 'paused' : 'active';
      await adminService.updateJobStatus(job.id, newStatus);
      toast({ title: "Success", description: `Job ${newStatus === 'active' ? 'activated' : 'paused'} successfully.` });
      loadJobs();
    } catch (error) {
      console.error("Failed to update job status:", error);
      toast({ title: "Error", description: "Failed to update job status.", variant: "destructive" });
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
        const [statsData, usersData, jobsData, activityData, approvalsData] = await Promise.all([
          adminService.getStats(),
          adminService.getUsers(), // Assuming this gets recent users
          adminService.getJobs(), // Assuming this gets recent jobs
          adminService.getAnalytics('7d').then(d => d.recentActivities || []), // Example for recent activity
          adminService.getApprovals() // Fetch pending approvals
        ]);
        const pendingApprovalsCount = approvalsData?.length || 0;

        // Process data for Recent Activity feed
        const newUsersActivity = (usersData || [])
          .slice(0, 2)
          .map(user => ({
            type: 'user',
            action: `New user registered: ${user.firstName} ${user.lastName}`,
            user: user.email,
            time: new Date(user.createdAt).toLocaleDateString(),
            id: `user-${user.id}`
          }));

        const newJobsActivity = (jobsData || [])
          .slice(0, 2)
          .map((job: any) => ({
            type: 'job',
            action: `New job posted: ${job.title}`,
            user: job.company?.name || 'N/A',
            time: new Date(job.createdAt).toLocaleDateString(),
            id: `job-${job.id}`
          }));

        const combinedActivity = [...newUsersActivity, ...newJobsActivity].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        setStats({ ...(statsData || {}), pendingApprovals: pendingApprovalsCount });
        setRecentUsers((usersData || []).slice(0, 5));
        setRecentJobs((jobsData || []).slice(0, 5));
        setRecentActivity(combinedActivity.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync activeTab with route when location changes (keeps sidebar highlighted)
  React.useEffect(() => {
    const path = location.pathname.split('/admin/')[1] || 'dashboard';
    setActiveTab(path);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout failed:', e);
    }
    navigate('/login', { replace: true });
  };

  const NavItem = ({ icon: Icon, label, id, badge }: any) => (
    <button
      onClick={() => {
        setActiveTab(id);
        const to = id === 'dashboard' ? '/admin' : `/admin/${id}`;
        navigate(to);
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
        activeTab === id
          ? darkMode
            ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 shadow-lg shadow-red-500/10'
            : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 shadow-md'
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
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${
          darkMode ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' : 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

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
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Top Navbar */}
        <nav className={`${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'} border-b fixed top-0 left-0 right-0 z-50 backdrop-blur-xl`}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2.5 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-300 hover:shadow-lg' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-red-500/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    <Shield className="w-6 h-6 relative z-10" />
                  </div>
                  <div>
                    <h1 className={`text-xl font-bold bg-gradient-to-r ${darkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-700'} bg-clip-text text-transparent`}>
                      Admin Control Panel
                    </h1>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      SkillConnect Management System
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTheme(darkMode ? 'light' : 'dark')}
                  className={`p-2.5 rounded-xl transition-all shadow-md ${darkMode ? 'bg-gradient-to-br from-gray-700 to-gray-600 text-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:shadow-lg'}`}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="relative">
                  <button onClick={() => { generateNotifications(); setShowNotifications(s => !s); setShowMessages(false); }} className={`relative p-2.5 rounded-xl transition-all shadow-md ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && notifications.length > 0 && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border py-2 z-40 transition-all animate-in ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</span>
                          <button onClick={() => setNotifications([])} className={`text-xs font-medium px-3 py-1 rounded-lg ${darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}>Clear All</button>
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
                  <button onClick={() => { generateMessages(); setShowMessages(s => !s); setShowNotifications(false); }} className={`relative p-2.5 rounded-xl transition-all shadow-md ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <MessageSquare className="w-5 h-5" />
                    {messagesList.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {messagesList.length}
                      </span>
                    )}
                  </button>

                  {showMessages && messagesList.length > 0 && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border py-2 z-40 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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

                <div className="relative group">
                  <button className={`flex items-center gap-2 p-2 pr-3 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    <div className="w-9 h-9 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {admin.avatar}
                    </div>
                    <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>

                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
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

        <div className="flex pt-20">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r ${
            darkMode ? 'bg-gray-800/50 border-gray-700/50 backdrop-blur-xl' : 'bg-white/80 border-gray-200 backdrop-blur-xl'
          }`}>
            <div className="p-6 space-y-6 h-[calc(100vh-5rem)] overflow-y-auto">
              {/* Quick Stats */}
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  System Overview
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer ${darkMode ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30' : 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200'}`}>
                    <Users className={`w-6 h-6 mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalUsers || 0}
                    </p>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                  </div>
                  <div className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer ${darkMode ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'}`}>
                    <Briefcase className={`w-6 h-6 mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.activeJobs || 0}
                    </p>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Jobs</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Navigation
                </h3>
                <div className="space-y-1.5">
                  <NavItem icon={Home} label="Dashboard" id="dashboard" />
                  <NavItem icon={Users} label="User Management" id="users" badge={stats.newUsersThisWeek} />
                  <NavItem icon={Building2} label="Companies" id="companies" />
                  <NavItem icon={UserCheck} label="Employees" id="employees" />
                  <NavItem icon={Briefcase} label="Job Postings" id="jobs" badge={stats.newJobsThisWeek} />
                  <NavItem icon={FileText} label="Applications" id="applications" />
                  <NavItem icon={AlertCircle} label="Approvals" id="approvals" badge={stats.pendingApprovals} />
                  <NavItem icon={BarChart3} label="Analytics" id="analytics" />
                  <NavItem icon={Settings} label="System Settings" id="settings" />
                </div>
              </div>

              {/* System Status */}
              <div className={`p-5 rounded-2xl shadow-xl relative overflow-hidden ${
                darkMode ? 'bg-gradient-to-br from-emerald-600 to-green-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'
              } text-white`}>
                <div className="absolute inset-0 bg-white/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5" />
                    <h3 className="font-bold text-lg">System Status</h3>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Server</span>
                      <span className="flex items-center gap-1.5 font-semibold">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Database</span>
                      <span className="flex items-center gap-1.5 font-semibold">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">API</span>
                      <span className="flex items-center gap-1.5 font-semibold">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                        Running
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className={`flex-1 p-8 overflow-auto h-[calc(100vh-5rem)] transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
            <div className="max-w-[1600px] mx-auto space-y-8">
              {/* Header with Welcome Message */}
              <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h1 className={`text-3xl font-bold mb-2 bg-gradient-to-r ${darkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-700'} bg-clip-text text-transparent`}>
                      Welcome back, {admin.name}! 👋
                    </h1>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Monitor and manage all platform activities from your control center
                    </p>
                  </div>
                  <div className={`px-6 py-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <Calendar className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <div>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards - Enhanced */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className={`rounded-2xl border p-6 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <Zap className="w-5 h-5 text-blue-500 opacity-50" />
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Users
                    </p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalUsers || 0}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-500">
                        +{stats.newUsersThisWeek || 0} this week
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-6 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:border-green-500' : 'bg-white border-gray-200 hover:border-green-300'
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
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-500">
                        +5 this month
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-6 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:border-amber-500' : 'bg-white border-gray-200 hover:border-amber-300'
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
                      Active Jobs
                    </p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.activeJobs || 0}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-500">
                        +{stats.newJobsThisWeek || 0} new
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-6 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:border-red-500' : 'bg-white border-gray-200 hover:border-red-300'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <Bell className="w-5 h-5 text-red-500 opacity-50" />
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Pending Approvals
                    </p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.pendingApprovals || 0}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-500">
                        Needs attention
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Users */}
                <div className={`rounded-2xl border p-6 xl:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Recent Users
                    </h2>
                    <button 
                      onClick={() => navigate('/admin/users')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
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
                      
                      return (
                        <div key={user.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-lg ${
                          darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold shadow-lg ${
                              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                            }`}>
                              {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                            </div>
                            <div>
                              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {user.firstName} {user.lastName}
                              </h3>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {user.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                              statusConfig.color
                            }`}>
                              <StatusIcon className="w-3 h-3" />
                              {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleViewUser(user)}
                                className={`p-2 rounded-lg transition-all ${
                                  darkMode 
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditUser(user)}
                                className={`p-2 rounded-lg transition-all ${
                                  darkMode 
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUserClick(user)}
                                className={`p-2 rounded-lg transition-all ${
                                  darkMode 
                                    ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' 
                                    : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity & Quick Actions */}
                <div className="space-y-8">
                  {/* Recent Activity */}
                  <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Recent Activity
                    </h2>
                    
                    <div className="space-y-4">
                      {recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                            activity.type === 'user' 
                              ? 'bg-blue-500/20 text-blue-500' 
                              : activity.type === 'job'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-purple-500/20 text-purple-500'
                          }`}>
                            {activity.type === 'user' && <Users className="w-4 h-4" />}
                            {activity.type === 'job' && <Briefcase className="w-4 h-4" />}
                            {activity.type === 'application' && <FileText className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {activity.action}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {activity.user}
                              </span>
                              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                •
                              </span>
                              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {activity.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Quick Actions
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => navigate('/admin/users')}
                        className={`p-4 rounded-xl border transition-all hover:shadow-lg flex flex-col items-center gap-2 ${
                          darkMode 
                            ? 'border-gray-700 hover:bg-gray-700/50 text-gray-300' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Users className="w-6 h-6" />
                        <span className="text-sm font-medium">Add User</span>
                      </button>
                      
                      <button 
                        onClick={() => navigate('/admin/jobs')}
                        className={`p-4 rounded-xl border transition-all hover:shadow-lg flex flex-col items-center gap-2 ${
                          darkMode 
                            ? 'border-gray-700 hover:bg-gray-700/50 text-gray-300' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Briefcase className="w-6 h-6" />
                        <span className="text-sm font-medium">Post Job</span>
                      </button>
                      
                      <button 
                        onClick={() => navigate('/admin/analytics')}
                        className={`p-4 rounded-xl border transition-all hover:shadow-lg flex flex-col items-center gap-2 ${
                          darkMode 
                            ? 'border-gray-700 hover:bg-gray-700/50 text-gray-300' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <BarChart3 className="w-6 h-6" />
                        <span className="text-sm font-medium">Reports</span>
                      </button>
                      
                      <button 
                        onClick={() => navigate('/admin/settings')}
                        className={`p-4 rounded-xl border transition-all hover:shadow-lg flex flex-col items-center gap-2 ${
                          darkMode 
                            ? 'border-gray-700 hover:bg-gray-700/50 text-gray-300' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Settings className="w-6 h-6" />
                        <span className="text-sm font-medium">Settings</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Jobs Table */}
              <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Recent Job Postings
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className={`relative ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 placeholder-gray-500 text-white focus:border-red-500' 
                            : 'bg-gray-50 border-gray-300 placeholder-gray-400 text-gray-900 focus:border-red-500'
                        }`}
                      />
                    </div>
                    
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className={`px-4 py-2.5 rounded-xl border text-sm transition-all ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' 
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                      }`}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
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
                                    jobStatus === 'active' 
                                      ? 'text-amber-500 hover:bg-amber-500/10' 
                                      : 'text-emerald-500 hover:bg-emerald-500/10'
                                  }`}
                                >
                                  {jobStatus === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Job Detail Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-8">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto`}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Job Details</h2>
                  <button onClick={() => setSelectedJob(null)} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600`}>
                      {selectedJob.company?.name?.substring(0, 2).toUpperCase() || 'NA'}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedJob.title}</h3>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{selectedJob.company?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex gap-4 pt-4">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-8">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto`}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Profile</h2>
                  <button onClick={() => setSelectedUser(null)} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ${selectedUser.userType === 'Professional' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
                      {selectedUser.firstName.substring(0, 1).toUpperCase()}{selectedUser.lastName.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.firstName} {selectedUser.lastName}</h3>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-8">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto`}>
              <form onSubmit={handleUpdateUser} className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit User</h2>
                  <button type="button" onClick={() => setUserToEdit(null)} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex gap-4 pt-4">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-3xl shadow-2xl max-w-md w-full p-8 border-2`}>
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
    </ErrorBoundary>
  );
};

export default AdminDashboard;