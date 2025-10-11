import React, { useState } from 'react';
import {
  Shield, Users, Building2, Briefcase, TrendingUp, Activity, 
  LogOut, Search, Eye, Edit, Trash2, CheckCircle, XCircle, 
  AlertCircle, Clock, Mail, Calendar, Download, BarChart3,
  UserCheck, Ban, ChevronRight, Zap, Sparkles, Crown, Rocket,
  Star, MessageSquare, Bell, Home, Settings, Filter, ArrowUpRight
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
    lastActive: '2 hours ago'
  },
  {
    id: '2',
    name: 'TechCorp Inc.',
    email: 'hr@techcorp.com',
    type: 'employer',
    status: 'active',
    joinDate: '2024-01-10',
    lastActive: '1 day ago'
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    type: 'employee',
    status: 'pending',
    joinDate: '2024-01-20',
    lastActive: '5 minutes ago'
  },
  {
    id: '4',
    name: 'StartupXYZ',
    email: 'contact@startupxyz.com',
    type: 'employer',
    status: 'active',
    joinDate: '2024-01-18',
    lastActive: '3 hours ago'
  }
];

const AdminDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Top Navigation */}
      <nav className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse-slow">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Admin Control
                </h1>
                <p className="text-xs text-gray-500 font-medium">Local Skills Job Board</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button className="relative p-3 hover:bg-purple-50 rounded-xl transition-all group">
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              <button className="relative p-3 hover:bg-purple-50 rounded-xl transition-all group">
                <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                <span className="absolute top-1.5 right-1.5 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  5
                </span>
              </button>

              <div className="w-px h-8 bg-gray-200"></div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl px-4 py-2 shadow-lg shadow-purple-500/30 cursor-pointer hover:shadow-xl transition-all group">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold">
                  AD
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Admin User</p>
                  <p className="text-white/80 text-xs">Super Admin</p>
                </div>
                <LogOut className="w-4 h-4 text-white/80 group-hover:text-white transition-colors ml-2" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl p-8 text-white shadow-2xl shadow-purple-500/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 animate-bounce" />
              <h2 className="text-3xl font-black">Welcome Back, Admin! 👋</h2>
            </div>
            <p className="text-white/90 text-lg mb-6">
              You have {mockStats.pendingApprovals} pending approvals and {mockStats.newUsersToday} new users today!
            </p>
            <div className="flex gap-3">
              <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg">
                <Rocket className="w-5 h-5" />
                Review Approvals
              </button>
              <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all">
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="group bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-purple-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm font-bold">
                  <TrendingUp className="w-4 h-4" />
                  +{mockStats.newUsersToday}
                </div>
              </div>
              <p className="text-gray-500 text-sm font-semibold mb-1">Total Users</p>
              <p className="text-4xl font-black text-gray-900 mb-2">{mockStats.totalUsers.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full" style={{width: '75%'}}></div>
                </div>
                <span className="font-semibold">75%</span>
              </div>
            </div>
          </div>

          {/* Employers */}
          <div className="group bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-pink-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/50 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
              </div>
              <p className="text-gray-500 text-sm font-semibold mb-1">Employers</p>
              <p className="text-4xl font-black text-gray-900 mb-2">{mockStats.totalEmployers}</p>
              <p className="text-xs text-pink-600 font-bold">
                {Math.round((mockStats.totalEmployers / mockStats.totalUsers) * 100)}% of total users
              </p>
            </div>
          </div>

          {/* Employees */}
          <div className="group bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-blue-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <Star className="w-5 h-5 text-yellow-500 animate-spin-slow" />
              </div>
              <p className="text-gray-500 text-sm font-semibold mb-1">Employees</p>
              <p className="text-4xl font-black text-gray-900 mb-2">{mockStats.totalEmployees}</p>
              <p className="text-xs text-blue-600 font-bold">
                {Math.round((mockStats.totalEmployees / mockStats.totalUsers) * 100)}% of total users
              </p>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="group bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-orange-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/50 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-orange-600 text-sm font-bold">
                  <Zap className="w-4 h-4" />
                  +{mockStats.newJobsToday}
                </div>
              </div>
              <p className="text-gray-500 text-sm font-semibold mb-1">Active Jobs</p>
              <p className="text-4xl font-black text-gray-900 mb-2">{mockStats.activeJobs}</p>
              <p className="text-xs text-orange-600 font-bold">Posted today: {mockStats.newJobsToday}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">User Management</h3>
                  <p className="text-gray-500 text-sm">Manage all platform users</p>
                </div>
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-500 rounded-xl outline-none transition-all font-medium"
                  />
                </div>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-500 rounded-xl outline-none font-semibold cursor-pointer"
                >
                  <option value="all">All Users</option>
                  <option value="employee">Employees</option>
                  <option value="employer">Employers</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Users Grid */}
              <div className="space-y-4">
                {mockUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="group bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
                    style={{animationDelay: `${index * 100}ms`}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${
                          user.type === 'employee' 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                            : 'bg-gradient-to-br from-purple-500 to-pink-600'
                        }`}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 text-lg">{user.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              user.type === 'employee'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {user.type}
                            </span>
                            {user.status === 'pending' && (
                              <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold animate-pulse">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">{user.email}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            Joined {user.joinDate} • Active {user.lastActive}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.status === 'active' && (
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Active</span>
                          </div>
                        )}
                        <button className="p-2 hover:bg-purple-50 rounded-lg transition-all group-hover:scale-110">
                          <Eye className="w-5 h-5 text-gray-400 hover:text-purple-600" />
                        </button>
                        <button className="p-2 hover:bg-purple-50 rounded-lg transition-all group-hover:scale-110">
                          <Edit className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-all group-hover:scale-110">
                          <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-2xl font-bold text-gray-700 transition-all flex items-center justify-center gap-2 group">
                View All Users
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Approvals */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-2xl shadow-orange-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl animate-pulse">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black">Pending Actions</h3>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">New Employers</span>
                      <span className="bg-white text-orange-600 text-sm font-black px-3 py-1 rounded-full">3</span>
                    </div>
                    <p className="text-white/80 text-sm">Awaiting verification</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">Job Postings</span>
                      <span className="bg-white text-orange-600 text-sm font-black px-3 py-1 rounded-full">5</span>
                    </div>
                    <p className="text-white/80 text-sm">Content review needed</p>
                  </div>
                </div>
                <button className="w-full bg-white text-orange-600 py-3 rounded-xl font-black hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2">
                  Review Now
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Success Rate</span>
                    <span className="text-sm font-black text-gray-900">89%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full shadow-lg" style={{width: '89%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">User Satisfaction</span>
                    <span className="text-sm font-black text-gray-900">94%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full shadow-lg" style={{width: '94%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Platform Growth</span>
                    <span className="text-sm font-black text-gray-900">76%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full shadow-lg" style={{width: '76%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-2xl shadow-green-500/50">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 animate-pulse" />
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <span className="font-bold">Server</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <span className="font-bold">Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <span className="font-bold">API</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold">Running</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;