import { useState, useEffect } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import {
  Users, Search, MoreVertical, Eye, Edit, Trash2, Ban,
  CheckCircle, XCircle, Mail, Phone, MapPin, Calendar, Plus,
  Shield, Activity, Clock, Zap, Crown, TrendingUp
} from 'lucide-react';
import { adminService, type User, type CreateUserData, type UpdateUserData } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';

type DisplayUser = User & {
  status: 'active' | 'suspended' | 'pending';
  stats?: {
    applications?: number;
    interviews?: number;
    jobs?: number;
    hires?: number;
  };
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const UserManagement = (): JSX.Element => {
  // use global theme provider so toggling here applies across the app
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Professional' | 'Employer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await adminService.getUsers();
      const displayUsers: DisplayUser[] = fetchedUsers.map(user => ({
        ...user,
        status: user.userType === 'admin' ? 'active' : 'active', // TODO: Add proper status field
        stats: user.userType === 'Professional' 
          ? { applications: 0, interviews: 0 }
          : { jobs: 0, hires: 0 }
      }));
      setUsers(displayUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: CreateUserData): Promise<void> => {
    try {
      await adminService.createUser(data);
      toast({
        title: 'Success',
        description: 'User created successfully'
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateUser = async (id: string, data: UpdateUserData): Promise<void> => {
    try {
      await adminService.updateUser(id, data);
      toast({
        title: 'Success',
        description: 'User updated successfully'
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (id: string): Promise<void> => {
    try {
      await adminService.deleteUser(id);
      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || user.userType === filterType;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingUsers = users.filter(u => u.status === 'pending').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;

  const getStatusBadge = (status: string) => {
    const configs = {
      active: darkMode 
        ? 'bg-green-500/20 text-green-400 border-green-500/20' 
        : 'bg-green-100 text-green-700 border-green-200',
      pending: darkMode
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/20'
        : 'bg-amber-100 text-amber-700 border-amber-200',
      suspended: darkMode
        ? 'bg-red-500/20 text-red-400 border-red-500/20'
        : 'bg-red-100 text-red-700 border-red-200'
    };
    return configs[status as keyof typeof configs] || configs.active;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`animate-pulse-slow ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4"><AdminBackButton /></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'}`}>
                User Management
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage all platform users and their accounts</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <Zap className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Total Users</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalUsers}</p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Active</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeUsers}</p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <Activity className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Pending</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pendingUsers}</p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg">
                  <Ban className="w-6 h-6 text-white" />
                </div>
                <Shield className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Suspended</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{suspendedUsers}</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 mb-8 border-2`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                } border-2 rounded-xl focus:border-blue-500 outline-none transition-all font-medium`}
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('Professional')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filterType === 'Professional'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Professionals
              </button>
              <button
                onClick={() => setFilterType('Employer')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filterType === 'Employer'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Employers
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className={`px-6 py-4 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              } border-2 rounded-xl font-semibold cursor-pointer focus:border-blue-500 outline-none`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                onClick={() => handleCreateUser({
                  email: 'test@example.com',
                  password: 'password123',
                  firstName: 'Test',
                  lastName: 'User',
                  userType: 'Professional',
                })}
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`group ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                  : 'bg-white border-gray-100 hover:border-blue-300'
              } rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border-2 overflow-hidden`}
            >
              <div className="p-6">
                {/* User Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${
                      user.userType === 'Professional'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : 'bg-gradient-to-br from-purple-500 to-pink-600'
                    }`}>
                      {user.firstName.substring(0, 1).toUpperCase()}{user.lastName.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.firstName} {user.lastName}
                        </h3>
                        {user.userType === 'Employer' && (
                          <Crown className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.userType === 'Professional'
                            ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                            : darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {user.userType}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusBadge(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </div>
                      <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </p>
                        {user.telephoneNumber && (
                          <p className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {user.telephoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative group/menu">
                    <button className={`p-2 rounded-lg transition-all ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}>
                      <MoreVertical className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </button>
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border-2 py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                          darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button 
                        onClick={() => handleUpdateUser(user.id, {
                          // Example update
                          title: 'Updated Title'
                        })}
                        className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                          darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        Edit User
                      </button>
                      <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                        darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}>
                        <Mail className="w-4 h-4" />
                        Send Email
                      </button>
                      <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} my-2`}></div>
                      {user.status === 'active' ? (
                        <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                          darkMode ? 'hover:bg-amber-500/10 text-amber-400' : 'hover:bg-amber-50 text-amber-600'
                        }`}>
                          <Ban className="w-4 h-4" />
                          Suspend User
                        </button>
                      ) : (
                        <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                          darkMode ? 'hover:bg-emerald-500/10 text-emerald-400' : 'hover:bg-green-50 text-green-600'
                        }`}>
                          <CheckCircle className="w-4 h-4" />
                          Activate User
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                          darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete User
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-3 mb-4">
                  {user.location && (
                    <div className={`flex items-center justify-between p-3 rounded-xl ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-2`}>
                        <MapPin className="w-4 h-4" />
                        Location
                      </span>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.location}</span>
                    </div>
                  )}
                  <div className={`flex items-center justify-between p-3 rounded-xl ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-2`}>
                      <Calendar className="w-4 h-4" />
                      Joined
                    </span>
                    <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                {/* Stats */}
                {user.stats && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {user.userType === 'Professional' ? (
                      <>
                        <div className={`p-4 rounded-2xl border-2 ${
                          darkMode 
                            ? 'bg-blue-500/10 border-blue-500/20' 
                            : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                        }`}>
                          <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Applications</p>
                          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.stats.applications}</p>
                        </div>
                        <div className={`p-4 rounded-2xl border-2 ${
                          darkMode 
                            ? 'bg-emerald-500/10 border-emerald-500/20' 
                            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                        }`}>
                          <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-emerald-400' : 'text-green-600'}`}>Interviews</p>
                          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.stats.interviews}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`p-4 rounded-2xl border-2 ${
                          darkMode 
                            ? 'bg-purple-500/10 border-purple-500/20' 
                            : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                        }`}>
                          <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Job Postings</p>
                          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.stats.jobs}</p>
                        </div>
                        <div className={`p-4 rounded-2xl border-2 ${
                          darkMode 
                            ? 'bg-orange-500/10 border-orange-500/20' 
                            : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
                        }`}>
                          <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Hires Made</p>
                          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.stats.hires}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className={`flex gap-2 pt-4 border-t-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    <Eye className="w-5 h-5" />
                    View Profile
                  </button>
                  <button 
                    onClick={() => handleUpdateUser(user.id, {
                      // Example update
                      title: 'Updated Title'
                    })}
                    className={`flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className={`flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all ${
                      darkMode
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className={`${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          } rounded-3xl shadow-xl p-12 text-center border-2`}>
            <div className={`w-24 h-24 ${
              darkMode ? 'bg-gradient-to-br from-gray-700 to-gray-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'
            } rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Users className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Users Found</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8">
            <div className={`${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
            } rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto`}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Profile</h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className={`p-2 rounded-xl transition-all ${
                      darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ${
                      selectedUser.userType === 'Professional'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : 'bg-gradient-to-br from-purple-500 to-pink-600'
                    }`}>
                      {selectedUser.firstName.substring(0, 1).toUpperCase()}{selectedUser.lastName.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
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
                      <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} capitalize`}>{selectedUser.status}</p>
                    </div>
                    {selectedUser.location && (
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>LOCATION</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.location}</p>
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>JOINED</p>
                      <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>

                  {selectedUser.stats && (
                    <div className={`p-6 rounded-2xl border-2 ${
                      darkMode
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                    }`}>
                      <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedUser.stats).map(([key, value]) => (
                          <div key={key}>
                            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} capitalize`}>{key}</p>
                            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setSelectedUser(null);
                        handleUpdateUser(selectedUser.id, {
                          // Example update
                          title: 'Updated Title'
                        });
                      }}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                      Edit User
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedUser(null);
                        handleDeleteUser(selectedUser.id);
                      }}
                      className={`px-6 py-4 rounded-xl font-bold transition-all border-2 ${
                        darkMode
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;