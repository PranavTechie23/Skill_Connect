import { useState, useEffect, useRef } from 'react';
import {
  Users, Search, Eye, Edit, Trash2, Ban,
  CheckCircle, Plus, RefreshCw, AlertTriangle,
  Shield, Activity, Clock, Zap, TrendingUp, X, Save, Loader2,
  ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService, type UserAccountStatus } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import AdminBackButton, { useAdminEmbedded } from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import {
  adminFormInputClass,
  adminFormLabelClass,
  adminFormModalBodyScrollClass,
  adminFormModalCancelBtnClass,
  adminFormModalCloseBtnClass,
  adminFormModalFooterClass,
  adminFormModalFormClass,
  adminFormModalHeaderClass,
  adminFormModalHeaderGradientClass,
  adminFormModalIconWrapClass,
  adminFormModalOverlayClass,
  adminFormModalPanelClass,
  adminFormModalSectionClass,
  adminFormModalSubmitBtnClass,
  adminFormModalSubtitleClass,
  adminFormModalTitleClass,
} from '@/components/admin/admin-form-modal-styles';

// Types
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  userType?: string;
  user_type?: string;
  title?: string;
  designation?: string;
  createdAt?: string;
  created_at?: string;
  location?: string;
  profile?: {
    headline?: string | null;
    title?: string | null;
  };
}

interface DisplayUser extends User {
  status: UserAccountStatus;
  accountStatus?: UserAccountStatus;
  stats?: {
    applications?: number;
    interviews?: number;
    jobs?: number;
    hires?: number;
  };
}

type ApiUserType = 'Professional' | 'Employer' | 'admin';

const normalizeUserTypeForDisplay = (userType: string | undefined | null): ApiUserType => {
  if (!userType) return 'Professional';
  const normalized = userType.trim().toLowerCase();
  if (normalized === 'employer') return 'Employer';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'professional' || normalized === 'job_seeker') return 'Professional';
  if (userType === 'Employer' || userType === 'Professional' || userType === 'admin') return userType;
  return 'Professional';
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

// Helper Functions
const formatDate = (date: string | undefined | null) => {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
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
  // Get firstName and lastName from both camelCase and snake_case
  const firstName = user.firstName || (user as any).first_name || '';
  const lastName = user.lastName || (user as any).last_name || '';
  
  // Get initials - use first letter of firstName and lastName, or fallback to email
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
    } else if (firstName) {
      return `${firstName[0].toUpperCase()}${firstName[1]?.toUpperCase() || ''}`;
    } else if (lastName) {
      return `${lastName[0].toUpperCase()}${lastName[1]?.toUpperCase() || ''}`;
    } else if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };
  
  const initials = getInitials();
  
  // Get full name
  const fullName = firstName && lastName 
    ? `${firstName} ${lastName}`.trim()
    : firstName || lastName || user.email || 'Unknown User';
  
  // Get designation/title - prefer title, then profile.headline, then profile.title
  const designation = (user as any).title || 
                      (user as any).designation || 
                      (user as any).profile?.headline || 
                      (user as any).profile?.title || 
                      user.userType || 
                      'N/A';
  
  // Get createdAt from both formats
  const createdAt = user.createdAt || (user as any).created_at;
  
  return (
    <div
      className={`${
        darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'
      } rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all relative group border-2`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg ${
          (user.userType === 'Professional' || (user as any).user_type === 'Professional') 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
            : 'bg-gradient-to-br from-purple-500 to-pink-600'
        }`}>
          {initials || 'U'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {fullName}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                {user.email}
              </p>
            </div>
          </div>

          {/* Stats and Info */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Designation
              </p>
              <p className={`text-sm font-semibold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'} truncate`} title={designation}>
                {designation}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Joined
              </p>
              <p className={`text-sm font-semibold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(createdAt)}
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

          {/* Status Badge and Action Buttons - Moved to bottom */}
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${getStatusBadge(user.status, darkMode)}`}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
            <div className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  );
};

// View User Modal
const ViewUserModal = ({ 
  user, 
  onClose, 
  darkMode 
}: { 
  user: DisplayUser; 
  onClose: () => void; 
  darkMode: boolean; 
}) => {
  const firstName = user.firstName || (user as any).first_name || '';
  const lastName = user.lastName || (user as any).last_name || '';
  const fullName = firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || user.email || 'Unknown User';
  const designation = (user as any).title || (user as any).designation || (user as any).profile?.headline || user.userType || 'N/A';
  const createdAt = user.createdAt || (user as any).created_at;
  const location = user.location || 'N/A';
  const userType = user.userType || (user as any).user_type || 'N/A';
  
  const getInitials = () => {
    if (firstName && lastName) return `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
    if (firstName) return `${firstName[0].toUpperCase()}${firstName[1]?.toUpperCase() || ''}`;
    if (lastName) return `${lastName[0].toUpperCase()}${lastName[1]?.toUpperCase() || ''}`;
    if (user.email) return user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white'} rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Details</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="space-y-6">
            {/* Avatar and Name */}
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg ${
                userType === 'Professional' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'
              }`}>
                {getInitials()}
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fullName}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Designation</p>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{designation}</p>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>User Type</p>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userType}</p>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Status</p>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(user.status, darkMode)}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Location</p>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{location}</p>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Joined</p>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(createdAt)}</p>
              </div>
            </div>

            {/* Stats */}
            {user.stats && (
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>Statistics</p>
                <div className="flex flex-wrap gap-3">
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
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add User Modal
const AddUserModal = ({ 
  onSave, 
  onCancel, 
  darkMode 
}: { 
  onSave: (data: any) => Promise<void>; 
  onCancel: () => void; 
  darkMode: boolean; 
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    title: '',
    location: '',
    telephoneNumber: '',
    userType: 'Professional' as 'Professional' | 'Employer' | 'admin',
    skills: [] as string[]
  });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const labelClass = adminFormLabelClass(darkMode);
  const inputClass = adminFormInputClass(darkMode);

  return (
    <div className={adminFormModalOverlayClass(darkMode)} onClick={onCancel}>
      <div 
        className={adminFormModalPanelClass(darkMode)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`relative overflow-hidden border-b px-8 py-7 ${
          darkMode ? 'border-white/10 bg-slate-900/40' : 'border-violet-200/70 bg-white/75'
        }`}>
          <div className={`pointer-events-none absolute inset-0 ${
            darkMode
              ? 'bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.78))]'
              : 'bg-[radial-gradient(circle_at_top_left,rgba(192,132,252,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.1),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.92))]'
          }`} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-[0_18px_45px_rgba(139,92,246,0.45)] ring-1 ring-white/20">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight">Add New User</h2>
                <p className={`mt-2 text-base font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Create a new platform account with role, contact, and skill details.
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className={`grid h-10 w-10 place-items-center rounded-xl transition-all ${
                darkMode ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-150px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 px-8 py-7">
            <div className={`rounded-[1.5rem] border p-6 ${
              darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(148,163,184,0.12)]'
            }`}>
              <div className="mb-6">
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${darkMode ? 'text-violet-200/80' : 'text-violet-700/80'}`}>
                  User Details
                </p>
                <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Keep the information accurate and easy to review.
                </p>
              </div>
              <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>
                  Designation (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Pune, India"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>
                  User Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({ ...formData, userType: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="Professional">Professional</option>
                  <option value="Employer">Employer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.telephoneNumber}
                  onChange={(e) => setFormData({ ...formData, telephoneNumber: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., +91 9876543210"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Skills (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className={inputClass}
                  placeholder="Type a skill and press Enter"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-8 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                      darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== index) })}
                    >
                      <X className="w-3 h-3 hover:scale-125 transition-transform" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
              </div>
            </div>

            <div className={`${adminFormModalFooterClass(darkMode)} flex-col-reverse sm:flex-row`}>
              <button type="button" onClick={onCancel} className={adminFormModalCancelBtnClass(darkMode)}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`${adminFormModalSubmitBtnClass()} flex items-center justify-center gap-2 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit User Modal
const EditUserModal = ({ 
  user, 
  onSave, 
  onCancel, 
  darkMode 
}: { 
  user: DisplayUser; 
  onSave: (data: any) => Promise<void>; 
  onCancel: () => void; 
  darkMode: boolean; 
}) => {
  const readAccountStatus = (source: DisplayUser): UserAccountStatus => {
    const raw = source.accountStatus ?? source.status ?? (source as { account_status?: string }).account_status;
    const normalized = String(raw ?? 'active').toLowerCase();
    if (normalized === 'flagged' || normalized === 'suspended' || normalized === 'pending') {
      return normalized;
    }
    return 'active';
  };

  const buildFormData = (source: DisplayUser) => ({
    firstName: source.firstName || (source as any).first_name || '',
    lastName: source.lastName || (source as any).last_name || '',
    email: source.email || '',
    title:
      (source as any).title ||
      (source as any).designation ||
      (source as any).profile?.headline ||
      '',
    location: source.location || '',
    userType: normalizeUserTypeForDisplay(source.userType || (source as any).user_type),
    accountStatus: readAccountStatus(source),
  });

  const [formData, setFormData] = useState(() => buildFormData(user));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(buildFormData(user));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const labelClass = adminFormLabelClass(darkMode);
  const inputClass = adminFormInputClass(darkMode);

  return (
    <div className={adminFormModalOverlayClass(darkMode)} onClick={onCancel}>
      <div 
        className={adminFormModalPanelClass(darkMode)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`relative overflow-hidden border-b px-8 py-7 ${
          darkMode ? 'border-white/10 bg-slate-900/40' : 'border-violet-200/70 bg-white/75'
        }`}>
          <div className={`pointer-events-none absolute inset-0 ${
            darkMode
              ? 'bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.78))]'
              : 'bg-[radial-gradient(circle_at_top_left,rgba(192,132,252,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.1),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.92))]'
          }`} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 text-white shadow-[0_18px_45px_rgba(99,102,241,0.45)] ring-1 ring-white/20">
                <Edit className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight">Edit User</h2>
                <p className={`mt-2 text-base font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Update the user's profile information, roles, and status.
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className={`grid h-10 w-10 place-items-center rounded-xl transition-all ${
                darkMode ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-150px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 px-8 py-7">
            <div className={`rounded-[1.5rem] border p-6 ${
              darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(148,163,184,0.12)]'
            }`}>
              <div className="mb-6">
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${darkMode ? 'text-violet-200/80' : 'text-violet-700/80'}`}>
                  Profile & Role
                </p>
                <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Manage identifying details and account status.
                </p>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Designation/Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={inputClass}
                    placeholder="e.g., Software Engineer, HR Manager"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={inputClass}
                    placeholder="e.g., Pune, India"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>
                      Account status
                    </label>
                    <select
                      value={formData.accountStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accountStatus: e.target.value as UserAccountStatus,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending review</option>
                      <option value="flagged">Flagged (AI / moderation)</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <p className={`mt-1.5 text-[11px] font-medium ${darkMode ? 'text-red-400/80' : 'text-red-500/80'}`}>
                      Flagged/suspended users cannot sign in.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>
                      User Type
                    </label>
                    <select
                      value={formData.userType}
                      onChange={(e) => setFormData({ ...formData, userType: e.target.value as ApiUserType })}
                      className={inputClass}
                    >
                      <option value="Professional">Professional</option>
                      <option value="Employer">Employer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${adminFormModalFooterClass(darkMode)} flex-col-reverse sm:flex-row mt-6 pt-6`}>
              <button type="button" onClick={onCancel} className={adminFormModalCancelBtnClass(darkMode)}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`${adminFormModalSubmitBtnClass()} flex items-center justify-center gap-2`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
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
    <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white'} rounded-3xl shadow-2xl max-w-md w-full p-8 border-2`}>
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${
          darkMode ? 'from-red-500/20 to-red-900/20' : 'from-red-100 to-red-200'
        }`}>
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete User?</h2>
        <p className={`mt-2 mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Are you sure you want to delete <strong>{
            (user.firstName || (user as any).first_name) && (user.lastName || (user as any).last_name)
              ? `${user.firstName || (user as any).first_name} ${user.lastName || (user as any).last_name}`
              : user.email || 'this user'
          }</strong>? This action cannot be undone.
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

type UserManagementProps = {
  quickActionIntent?: string | null;
  onQuickActionConsumed?: () => void;
};

  // Main Component
const UserManagement = ({ quickActionIntent = null, onQuickActionConsumed }: UserManagementProps = {}) => {
  const { theme } = useTheme();
  const { embedded } = useAdminEmbedded();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
   const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<DisplayUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<DisplayUser | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Professional' | 'Employer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | UserAccountStatus>('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (quickActionIntent !== 'add-user') return;
    setShowAddUser(true);
    onQuickActionConsumed?.();
  }, [quickActionIntent, onQuickActionConsumed]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await adminService.getUsers();
      console.log('📊 Fetched users:', fetchedUsers.length);
      if (fetchedUsers.length > 0) {
        console.log('🔍 Sample user:', {
          id: fetchedUsers[0].id,
          email: fetchedUsers[0].email,
          firstName: fetchedUsers[0].firstName,
          lastName: fetchedUsers[0].lastName,
          first_name: (fetchedUsers[0] as any).first_name,
          last_name: (fetchedUsers[0] as any).last_name,
          title: (fetchedUsers[0] as any).title,
          designation: (fetchedUsers[0] as any).designation,
          createdAt: fetchedUsers[0].createdAt,
          created_at: (fetchedUsers[0] as any).created_at,
          profile: (fetchedUsers[0] as any).profile
        });
      }
      
      const displayUsers: DisplayUser[] = fetchedUsers.map(user => {
        // Map both camelCase and snake_case fields
        const firstName = user.firstName || (user as any).first_name || '';
        const lastName = user.lastName || (user as any).last_name || '';
        const createdAt = user.createdAt || (user as any).created_at;
        const validUserType = normalizeUserTypeForDisplay(user.userType || (user as any).user_type);
        
        const accountStatus = (user.accountStatus ??
          user.status ??
          (user as { account_status?: string }).account_status ??
          'active') as UserAccountStatus;

        return {
          ...user,
          firstName: firstName,
          lastName: lastName,
          userType: validUserType,
          createdAt: createdAt,
          accountStatus,
          status: accountStatus,
          stats: validUserType === 'Professional' 
            ? { applications: 0, interviews: 0 }
            : { jobs: 0, hires: 0 }
        };
      });
      setUsers(displayUsers);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      if (!error?.message?.includes("401")) {
        toast({
          title: 'Error',
          description: 'Failed to load users. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

   const handleAddUser = async (data: any): Promise<void> => {
    try {
      await adminService.createUser(data);
      toast({
        title: 'Success',
        description: 'User created successfully',
        variant: 'success',
      });
      setShowAddUser(false);
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to create user. Please check if the email already exists.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdateUser = async (data: any): Promise<void> => {
    if (!userToEdit) return;

    try {
      await adminService.updateUser(userToEdit.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        title: data.title?.trim() || undefined,
        location: data.location,
        userType: normalizeUserTypeForDisplay(data.userType),
        accountStatus: data.accountStatus,
      });

      toast({
        title: 'Success',
        description: 'User updated successfully',
        variant: 'success',
      });
      setUserToEdit(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        title: 'Update failed',
        description: getErrorMessage(error, 'Failed to update user. Please try again.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    try {
      await adminService.deleteUser(userId);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
        variant: 'success',
      });
      loadUsers();
      setUserToDelete(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to delete user. Please try again.'),
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const firstName = user.firstName || (user as any).first_name || '';
    const lastName = user.lastName || (user as any).last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || user.email;
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || user.userType === filterType;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollDashboardToTop();
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingUsers = users.filter(u => u.status === 'pending').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const flaggedUsers = users.filter(u => u.status === 'flagged').length;

  const skeletonTone = darkMode ? 'bg-gray-700' : 'bg-gray-200';
  const statLabels = ['Total Users', 'Active', 'Pending', 'Suspended', 'Flagged'];

  return (
    <>
      {/* View User Modal */}
      {selectedUser && (
        <ViewUserModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          darkMode={darkMode} 
        />
      )}

      {/* Edit User Modal */}
      {userToEdit && (
        <EditUserModal 
          user={userToEdit} 
          onSave={handleUpdateUser}
          onCancel={() => setUserToEdit(null)} 
          darkMode={darkMode} 
        />
      )}

       {/* Delete Confirmation Modal */}
      {userToDelete && (
        <ConfirmationModal 
          user={userToDelete} 
          onConfirm={() => handleDeleteUser(userToDelete.id)} 
          onCancel={() => setUserToDelete(null)} 
          darkMode={darkMode} 
        />
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <AddUserModal 
          onSave={handleAddUser}
          onCancel={() => setShowAddUser(false)}
          darkMode={darkMode}
        />
      )}



      <div className={`${embedded ? '' : `min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} p-8`}`}>
        <div className={`${embedded ? 'space-y-8' : 'max-w-7xl mx-auto'}`}>
          {/* Header */}
          <div className={`${embedded ? 'mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-5' : 'mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6'}`}>
            <div>
              <div className="mb-4"><AdminBackButton /></div>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white font-black' : 'text-gray-900 font-black'}`}>
                    User Management
                  </h1>
                  <p className={`mt-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Manage and monitor all users in the system
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/25 transform hover:-translate-y-1 transition-all md:mb-1"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>

          {/* Stats Cards — Responsive 2-col/3-col/5-col flow */}
          <div className="mb-8" aria-busy={loading}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 [&>div]:min-w-0">
            {loading
              ? statLabels.map((label, index) => (
                  <div
                    key={index}
                    className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-4 md:p-5 lg:p-6 shadow-lg border-2 min-w-0`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className={`h-12 w-12 rounded-2xl ${skeletonTone}`} />
                      <Skeleton className={`h-5 w-5 rounded-full ${skeletonTone}`} />
                    </div>
                    <Skeleton className={`h-4 w-24 mb-3 ${skeletonTone}`} />
                    <Skeleton className={`h-10 w-16 ${skeletonTone}`} />
                    <span className="sr-only">Loading {label}</span>
                  </div>
                ))
              : (
                <>
            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-4 md:p-5 lg:p-6 shadow-lg border-2 hover:shadow-xl transition-all min-w-0`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <Zap className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Total Users</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalUsers}</p>
            </div>

            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-4 md:p-5 lg:p-6 shadow-lg border-2 hover:shadow-xl transition-all min-w-0`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Active</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeUsers}</p>
            </div>

            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-4 md:p-5 lg:p-6 shadow-lg border-2 hover:shadow-xl transition-all min-w-0`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <Activity className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Pending</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pendingUsers}</p>
            </div>

            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-4 md:p-5 lg:p-6 shadow-lg border-2 hover:shadow-xl transition-all min-w-0`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg">
                  <Ban className="w-6 h-6 text-white" />
                </div>
                <Shield className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Suspended</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{suspendedUsers}</p>
            </div>

            <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-4 md:p-5 lg:p-6 shadow-lg border-2 hover:shadow-xl transition-all min-w-0`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <Shield className={`w-5 h-5 ${darkMode ? 'text-violet-400' : 'text-violet-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Flagged</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{flaggedUsers}</p>
            </div>
                </>
              )}
            </div>
          </div>

          {/* Filters & Search */}
          <div data-floating-menu="true" className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 mb-8 border-2`}>
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
                <div className="relative shrink-0 z-10" ref={statusDropdownRef}>
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className={`px-6 py-4 flex items-center justify-between min-w-[160px] ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    } border-2 rounded-xl font-semibold cursor-pointer transition-all hover:shadow-md`}
                  >
                    <span className="capitalize">{filterStatus === 'all' ? 'All Status' : filterStatus}</span>
                    <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {statusDropdownOpen && (
                    <div className={`absolute top-full right-0 mt-2 w-full min-w-[160px] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 border-2 ${
                      darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'
                    }`}>
                      <div className="py-1">
                        {['all', 'active', 'pending', 'flagged', 'suspended'].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setFilterStatus(status as typeof filterStatus);
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${
                              filterStatus === status 
                                ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-700')
                                : (darkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-50')
                            }`}
                          >
                            {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

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
          {loading ? (
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              aria-live="polite"
              aria-busy="true"
              role="status"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`${
                    darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'
                  } rounded-3xl p-6 shadow-lg border-2`}
                >
                  <div className="flex items-start gap-4">
                    <Skeleton className={`h-16 w-16 shrink-0 rounded-2xl ${skeletonTone}`} />
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="space-y-2">
                        <Skeleton className={`h-5 w-3/4 max-w-xs ${skeletonTone}`} />
                        <Skeleton className={`h-4 w-1/2 max-w-[220px] ${skeletonTone}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className={`h-16 w-full rounded-xl ${skeletonTone}`} />
                        <Skeleton className={`h-16 w-full rounded-xl ${skeletonTone}`} />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Skeleton className={`h-7 w-28 rounded-lg ${skeletonTone}`} />
                        <Skeleton className={`h-7 w-24 rounded-lg ${skeletonTone}`} />
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Skeleton className={`h-7 w-20 rounded-full ${skeletonTone}`} />
                        <div className="flex gap-2">
                          <Skeleton className={`h-9 w-9 rounded-lg ${skeletonTone}`} />
                          <Skeleton className={`h-9 w-9 rounded-lg ${skeletonTone}`} />
                          <Skeleton className={`h-9 w-9 rounded-lg ${skeletonTone}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <p className={`col-span-full flex items-center justify-center gap-2 pb-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading users...
              </p>
              <span className="sr-only">Loading user list</span>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                darkMode={darkMode}
                onView={() => setSelectedUser(user)}
                onEdit={() => setUserToEdit(user)}
                onDelete={() => setUserToDelete(user)}
              />
            ))}
          </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className={`mt-8 ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 border-2`}>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Showing <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{filteredUsers.length}</span> users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      currentPage === 1
                        ? (darkMode ? 'bg-gray-700/50 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600 hover:shadow-md' : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700')
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="items-center gap-1.5 hidden sm:flex">
                    {(() => {
                      const getVisiblePages = (current: number, total: number) => {
                        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
                        if (current <= 3) return [1, 2, 3, 4, '...', total];
                        if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
                        return [1, '...', current - 1, current, current + 1, '...', total];
                      };
                      return getVisiblePages(currentPage, totalPages).map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className={`px-2 font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>…</span>
                        ) : (
                          <button
                            key={`page-${page}`}
                            onClick={() => handlePageChange(page as number)}
                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                                : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300')
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ));
                    })()}
                  </div>
                  {/* Mobile page indicator */}
                  <span className={`sm:hidden text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      currentPage === totalPages
                        ? (darkMode ? 'bg-gray-700/50 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600 hover:shadow-md' : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700')
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredUsers.length === 0 && (
            <div className={`${
              darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'
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

    </>
  );
};

export default UserManagement;


