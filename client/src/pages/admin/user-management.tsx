import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, MoreVertical, Eye, Edit, Trash2, Ban,
  CheckCircle, XCircle, Mail, Phone, MapPin, Calendar, Plus, RefreshCw, AlertTriangle,
  Shield, Activity, Clock, Zap, Crown, TrendingUp, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'Professional' | 'Employer' | 'Admin';
  createdAt: string;
  location?: string;
}

interface DisplayUser extends User {
  status: 'active' | 'suspended' | 'pending';
  stats?: {
    applications?: number;
    interviews?: number;
    jobs?: number;
    hires?: number;
  };
}

// Helper Functions
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getStatusBadge = (status: string, darkMode: boolean) => {
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

// Components
const UserCard = ({ 
  user,
  darkMode,
  onView,
  onEdit,
  onDelete
}: { 
  user: DisplayUser;
  darkMode: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
  
  return (
    <div
      className={`${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      } rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all relative group border-2`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg ${
          user.userType === 'Professional' 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
            : 'bg-gradient-to-br from-purple-500 to-pink-600'
        }`}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`text-lg font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.firstName} {user.lastName}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {user.email}
              </p>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(user.status, darkMode)}`}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </div>

          {/* Stats and Info */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                User Type
              </p>
              <p className={`text-sm font-semibold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.userType}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Joined
              </p>
              <p className={`text-sm font-semibold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          {/* User Stats */}
          {user.stats && (
            <div className="mt-4 flex flex-wrap gap-3">
              {user.userType === 'Professional' ? (
                <>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {user.stats?.applications || 0} Applications
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                  }`}>
                    {user.stats?.interviews || 0} Interviews
                  </div>
                </>
              ) : (
                <>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                  }`}>
                    {user.stats?.jobs || 0} Jobs Posted
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {user.stats?.hires || 0} Hires
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onView}
          className={`p-2 rounded-lg transition-all ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
          title="View Details"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={onEdit}
          className={`p-2 rounded-lg transition-all ${
            darkMode 
              ? 'hover:bg-blue-500/10 text-blue-400 hover:text-blue-300' 
              : 'hover:bg-blue-50 text-blue-600 hover:text-blue-700'
          }`}
          title="Edit User"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={onDelete}
          className={`p-2 rounded-lg transition-all ${
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
  );
};

// Confirmation Modal
const ConfirmationModal = ({ 
  user, 
  onConfirm, 
  onCancel, 
  darkMode 
}: { 
  user: DisplayUser; 
  onConfirm: () => void; 
  onCancel: () => void; 
  darkMode: boolean; 
}) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-3xl shadow-2xl max-w-md w-full p-8 border-2`}>
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${
          darkMode ? 'from-red-500/20 to-red-900/20' : 'from-red-100 to-red-200'
        }`}>
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete User?</h2>
        <p className={`mt-2 mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  </div>
);

  // Main Component
const UserManagement = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Professional' | 'Employer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = useState<DisplayUser | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await adminService.getUsers();
      const displayUsers: DisplayUser[] = fetchedUsers.map(user => {
        const validUserType = ['Professional', 'Employer', 'Admin'].includes(user.userType) 
          ? user.userType as 'Professional' | 'Employer' | 'Admin'
          : 'Professional';
        
        return {
          ...user,
          userType: validUserType,
          status: 'active',
          stats: validUserType === 'Professional' 
            ? { applications: 0, interviews: 0 }
            : { jobs: 0, hires: 0 }
        };
      });
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

  const handleUpdateUser = async (id: string, data: any): Promise<void> => {
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
      setUserToDelete(null);
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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`animate-pulse-slow ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      {userToDelete && (
        <ConfirmationModal 
          user={userToDelete} 
          onConfirm={() => handleDeleteUser(userToDelete.id)} 
          onCancel={() => setUserToDelete(null)} 
          darkMode={darkMode} 
        />
      )}



      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} p-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4"><AdminBackButton /></div>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  User Management
                </h1>
                <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage and monitor all users in the system
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  onClick={loadUsers}
                  className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                darkMode={darkMode}
                onView={() => setSelectedUser(user)}
                onEdit={() => handleUpdateUser(user.id, {})}
                onDelete={() => setUserToDelete(user)}
              />
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
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `
      }} />
    </>
  );
};

export default UserManagement;