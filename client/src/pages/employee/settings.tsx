import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Settings, User, Shield, Bell, LogOut,
  Save, X, Eye, EyeOff, Mail, Smartphone,
  Palette, Download, Trash2, Lock, AlertTriangle,
  Check, Monitor, Smartphone as PhoneIcon, CheckCircle2, Loader2
} from 'lucide-react';
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from 'react-router-dom';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { UpdateMeProfile } from "@shared/schema";

interface SettingsPageProps {
  embedded?: boolean;
}

const SettingsPage = ({ embedded = false }: SettingsPageProps) => {
  const { theme, setTheme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const darkMode = typeof window !== 'undefined' && (
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('account');

  const selectSection = (sectionId: string) => {
    setActiveSection(sectionId);
    scrollDashboardToTop();
  };
  const [isEditing, setIsEditing] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const settingsStorageKey = user?.id ? `employee-settings:${user.id}` : 'employee-settings:guest';
  const resolveAppearanceTheme = () => (theme === 'system' ? 'auto' : theme);

  // Real user data from auth context
  const [settings, setSettings] = useState({
    account: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.telephoneNumber || '',
      language: 'English',
      timezone: 'Pacific Time (PT)'
    },
    security: {
      twoFactorAuth: true,
      loginAlerts: true,
      passwordLastChanged: '2024-01-15',
      activeSessions: 3
    },
    notifications: {
      email: {
        jobAlerts: true,
        applicationUpdates: true,
        messages: false,
        newsletter: true
      },
      push: {
        jobAlerts: false,
        applicationUpdates: true,
        messages: true
      }
    },
    appearance: {
      theme: resolveAppearanceTheme(),
      fontSize: 'medium',
      density: 'comfortable'
    },
    preferences: {
      jobAlerts: true,
      autoSave: true,
      showProfile: true,
      remoteOnly: false,
      aiEnabled: true
    }
  });

  // Update settings when user data changes
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        account: {
          ...prev.account,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.telephoneNumber || '',
        },
        preferences: {
          ...prev.preferences,
          aiEnabled: !((user as any)?.privacySettings?.aiOptOut)
        }
      }));
    }
  }, [user]);

  // Load persisted UI preferences (not account identity — that comes from auth/DB).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(settingsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const { account: _account, ...uiPreferences } = parsed;
        setSettings((prev) => ({ ...prev, ...uiPreferences }));
        if (uiPreferences?.appearance) {
          applyAppearancePreferences(uiPreferences.appearance);
        }
      }
      const savedAt = localStorage.getItem(`${settingsStorageKey}:savedAt`);
      if (savedAt) setLastSavedAt(savedAt);
    } catch (error) {
      console.warn('Failed to load saved employee settings', error);
    }
  }, [settingsStorageKey]);

  const sections: { id: string; label: string; icon: any; color: 'blue' | 'green' | 'purple' | 'pink' | 'orange' }[] = [
    { id: 'account', label: 'Account', icon: User, color: 'blue' },
    { id: 'security', label: 'Security', icon: Shield, color: 'green' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'purple' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: 'pink' },
    { id: 'preferences', label: 'Preferences', icon: Settings, color: 'orange' }
  ];

  const handleSave = async () => {
    if (!isEditing || isSaving) return;
    setIsSaving(true);
    try {
      const payload: UpdateMeProfile = {
        firstName: settings.account.firstName.trim(),
        lastName: settings.account.lastName.trim(),
        email: settings.account.email.trim(),
        telephoneNumber: settings.account.phone.trim(),
        privacySettings: { aiOptOut: !settings.preferences.aiEnabled },
      };
      await updateUser(payload);
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await queryClient.invalidateQueries({ queryKey: ['messages'] });

      const selectedTheme = settings.appearance.theme;
      if (selectedTheme === 'auto') {
        setTheme('system');
      } else {
        setTheme(selectedTheme as 'light' | 'dark');
      }
      applyAppearancePreferences(settings.appearance);

      const { account: _account, ...uiPreferences } = settings;
      try {
        localStorage.setItem(settingsStorageKey, JSON.stringify(uiPreferences));
      } catch (error) {
        console.warn('Failed to persist employee settings', error);
      }

      const savedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem(`${settingsStorageKey}:savedAt`, savedAt);
      setIsEditing(false);
      setLastSavedAt(savedAt);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2800);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Save failed',
        description: 'Could not update your account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setSettings((prev) => ({
        ...prev,
        account: {
          ...prev.account,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.telephoneNumber || '',
        },
      }));
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (e) {
      console.warn('Logout failed:', e);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/me/export');
      if (!response.ok) throw new Error('Failed to export data');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Export successful',
        description: 'Your data has been successfully exported.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Could not export your data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Password is required.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const response = await fetch('/api/me/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg = (body as { message?: string }).message;
        if (response.status === 401) {
          setDeleteError(msg || 'Incorrect password. Please try again.');
        } else {
          setDeleteError(msg || 'Failed to delete account. Please try again.');
        }
        return;
      }
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Delete account failed:', error);
      setDeleteError('An unexpected error occurred. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setDeletePassword('');
    setDeleteError('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeletePassword('');
    setDeleteError('');
  };

  const getColorClasses = (color: 'blue' | 'green' | 'purple' | 'pink' | 'orange', isDark: boolean) => {
    const colors = {
      blue: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600',
      green: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600',
      purple: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600',
      pink: isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600',
      orange: isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
    };
    return colors[color];
  };

  const updateAccount = (field: keyof typeof settings.account, value: string) => {
    if (!isEditing) return;
    setSettings(prev => ({ ...prev, account: { ...prev.account, [field]: value } }));
  };

  const updateAppearance = (field: keyof typeof settings.appearance, value: string) => {
    if (!isEditing) return;
    setSettings(prev => ({ ...prev, appearance: { ...prev.appearance, [field]: value } }));
  };

  const applyAppearancePreferences = (appearance: { theme: string; fontSize: string; density: string }) => {
    const root = document.documentElement;
    root.setAttribute('data-font-size', appearance.fontSize || 'medium');
    root.setAttribute('data-ui-density', appearance.density || 'comfortable');
  };

  const toggleSecurity = (field: keyof typeof settings.security) => {
    if (!isEditing) return;
    setSettings(prev => ({ ...prev, security: { ...prev.security, [field]: !prev.security[field] } }));
  };

  const toggleNotification = (channel: 'email' | 'push', key: string) => {
    if (!isEditing) return;
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [channel]: {
          ...prev.notifications[channel],
          [key]: !prev.notifications[channel][key as keyof typeof prev.notifications[typeof channel]],
        },
      },
    }));
  };

  const togglePreference = (key: keyof typeof settings.preferences) => {
    if (!isEditing) return;
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: !prev.preferences[key] },
    }));
  };

  const enabledPreferences = Object.values(settings.preferences).filter(Boolean).length;
  const enabledEmailNotifs = Object.values(settings.notifications.email).filter(Boolean).length;
  const enabledPushNotifs = Object.values(settings.notifications.push).filter(Boolean).length;
  const profileStrength = Math.min(100, 58 + enabledPreferences * 8 + enabledEmailNotifs * 2 + (settings.security.twoFactorAuth ? 12 : 0));

  // Keep selected appearance theme synced when global theme changes externally.
  useEffect(() => {
    const appearanceTheme = theme === 'system' ? 'auto' : theme;
    setSettings((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: appearanceTheme,
      },
    }));
  }, [theme]);

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen w-screen fixed inset-0'} transition-colors duration-500 ${
      embedded ? 'bg-transparent' : darkMode ? 'bg-[#0B0F19] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]' : 'bg-slate-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]'
    } overflow-y-auto`}>
      <div className={`${embedded ? 'w-full' : 'max-w-7xl mx-auto'} ${embedded ? 'px-2 py-3' : 'px-6 py-8'} relative z-10`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {!embedded && (
              <button
                onClick={() => window.history.back()}
                className={`p-2 rounded-xl transition-all ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <div>
              <h1 className={`text-3xl font-black ${
                darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                {t("employee.settings.title")}
              </h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Manage your account preferences and security
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                Edit Settings
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>



        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-80 flex-shrink-0">
            <div className={`rounded-[2rem] p-3 border transition-all duration-500 ${
              darkMode 
                ? 'bg-gray-800/40 backdrop-blur-2xl border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]' 
                : 'bg-white/70 backdrop-blur-2xl border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
            }`}>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => selectSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all mb-1 ${
                      activeSection === section.id
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : darkMode
                        ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeSection === section.id 
                        ? 'bg-white/20' 
                        : getColorClasses(section.color, darkMode)
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {section.label}
                  </button>
                );
              })}
              
              {/* Danger Zone */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <button 
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${
                  darkMode
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                }`}>
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-red-500/20' : 'bg-red-100'
                  }`}>
                    <LogOut className="w-5 h-5" />
                  </div>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Account Settings */}
            {activeSection === 'account' && (
              <div className={`rounded-[2rem] shadow-2xl p-8 border relative overflow-hidden transition-all duration-500 ${
                darkMode 
                  ? 'bg-gray-800/40 backdrop-blur-2xl border-white/10' 
                  : 'bg-white/70 backdrop-blur-2xl border-white/40'
              }`}>
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl ${
                    darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <User className={`w-6 h-6 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Account Settings
                    </h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Manage your personal information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={settings.account.firstName}
                        onChange={(e) => updateAccount('firstName', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      />
                    ) : (
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {settings.account.firstName}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={settings.account.lastName}
                        onChange={(e) => updateAccount('lastName', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      />
                    ) : (
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {settings.account.lastName}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Email Address
                    </label>
                    <div className="flex items-center gap-3">
                      <Mail className={`w-5 h-5 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      {isEditing ? (
                        <input
                          type="email"
                          value={settings.account.email}
                          onChange={(e) => updateAccount('email', e.target.value)}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                          }`}
                        />
                      ) : (
                        <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                          {settings.account.email}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Phone Number
                    </label>
                    <div className="flex items-center gap-3">
                      <Smartphone className={`w-5 h-5 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      {isEditing ? (
                        <input
                          type="tel"
                          value={settings.account.phone}
                          onChange={(e) => updateAccount('phone', e.target.value)}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                          }`}
                        />
                      ) : (
                        <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                          {settings.account.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Language
                    </label>
                    {isEditing ? (
                      <select
                        value={settings.account.language}
                        onChange={(e) => updateAccount('language', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    ) : (
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {settings.account.language}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Timezone
                    </label>
                    {isEditing ? (
                      <select
                        value={settings.account.timezone}
                        onChange={(e) => updateAccount('timezone', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      >
                        <option>Pacific Time (PT)</option>
                        <option>Eastern Time (ET)</option>
                        <option>Central Time (CT)</option>
                        <option>Mountain Time (MT)</option>
                      </select>
                    ) : (
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {settings.account.timezone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Data Management */}
                <div className={`mt-8 p-6 rounded-2xl border-2 ${
                  darkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <h4 className={`font-black mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Data Management
                  </h4>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleExportData}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}>
                      <Download className="w-4 h-4" />
                      Export Data
                    </button>
                    <button 
                      onClick={openDeleteModal}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                      darkMode
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        : 'bg-red-50 hover:bg-red-100 text-red-600'
                    }`}>
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>

                {/* Delete Account Modal */}
                {showDeleteModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeDeleteModal}>
                    <div
                      className={`relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border ${
                        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="h-2 bg-gradient-to-r from-red-500 to-rose-600" />
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-5">
                          <div className={`p-3 rounded-xl shrink-0 ${
                            darkMode ? 'bg-red-500/10' : 'bg-red-100'
                          }`}>
                            <AlertTriangle className="w-7 h-7 text-red-500" />
                          </div>
                          <div>
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              Delete Your Account
                            </h3>
                            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              This is a permanent and irreversible action.
                            </p>
                          </div>
                          <button
                            onClick={closeDeleteModal}
                            className={`ml-auto p-2 rounded-lg transition-colors ${
                              darkMode ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {deleteStep === 1 && (
                          <>
                            <div className={`p-4 rounded-xl mb-5 border ${
                              darkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-100'
                            }`}>
                              <p className={`text-sm font-semibold mb-3 ${
                                darkMode ? 'text-red-400' : 'text-red-600'
                              }`}>
                                By deleting your account, the following will happen:
                              </p>
                              <ul className={`text-sm space-y-2.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-500 font-bold mt-0.5">•</span>
                                  All your personal information will be permanently anonymized.
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-500 font-bold mt-0.5">•</span>
                                  Your profile, skills, and professional details will be erased.
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-500 font-bold mt-0.5">•</span>
                                  All job applications and their history will be lost.
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-500 font-bold mt-0.5">•</span>
                                  Your messages and conversations will no longer be accessible.
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-500 font-bold mt-0.5">•</span>
                                  This action <strong>cannot be undone</strong> — there is no recovery.
                                </li>
                              </ul>
                            </div>

                            <p className={`text-sm mb-5 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              We recommend exporting your data before proceeding.
                            </p>

                            <div className="flex gap-3">
                              <button
                                onClick={closeDeleteModal}
                                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                                  darkMode
                                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => setDeleteStep(2)}
                                className="flex-1 px-4 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-500/20"
                              >
                                I understand, continue
                              </button>
                            </div>
                          </>
                        )}

                        {deleteStep === 2 && (
                          <>
                            <p className={`text-sm mb-4 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Please enter your account password to confirm the deletion.
                            </p>

                            <div className="relative mb-4">
                              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${
                                darkMode ? 'text-gray-500' : 'text-gray-400'
                              }`} />
                              <input
                                type={showDeletePassword ? 'text' : 'password'}
                                value={deletePassword}
                                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                placeholder="Enter your password"
                                className={`w-full pl-11 pr-12 py-3.5 rounded-xl border-2 transition-all focus:ring-2 focus:outline-none ${
                                  deleteError
                                    ? darkMode
                                      ? 'border-red-500 bg-red-500/5 text-white focus:ring-red-500'
                                      : 'border-red-500 bg-red-50 text-gray-900 focus:ring-red-500'
                                    : darkMode
                                      ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-red-500'
                                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500'
                                }`}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && deletePassword.trim()) handleDeleteAccount();
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowDeletePassword(!showDeletePassword)}
                                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
                                  darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                {showDeletePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>

                            {deleteError && (
                              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm font-medium ${
                                darkMode
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-red-50 text-red-600 border border-red-100'
                              }`}>
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {deleteError}
                              </div>
                            )}

                            <div className="flex gap-3">
                              <button
                                onClick={() => { setDeleteStep(1); setDeleteError(''); setDeletePassword(''); }}
                                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                                  darkMode
                                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                                }`}
                              >
                                Back
                              </button>
                              <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading || !deletePassword.trim()}
                                className="flex-1 px-4 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {deleteLoading ? (
                                  <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4" />
                                    Permanently Delete
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className={`rounded-[2rem] shadow-2xl p-8 border relative overflow-hidden transition-all duration-500 ${
                darkMode 
                  ? 'bg-gray-800/40 backdrop-blur-2xl border-white/10' 
                  : 'bg-white/70 backdrop-blur-2xl border-white/40'
              }`}>
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl ${
                    darkMode ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                    <Shield className={`w-6 h-6 ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Security Settings
                    </h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Protect your account and data
                    </p>
                  </div>
                </div>

                {/* Password Change */}
                <div className={`p-6 rounded-2xl border-2 mb-6 ${
                  darkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <h4 className={`font-black mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Change Password
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                          }`}
                        />
                        <button
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                          }`}
                        />
                        <button
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    }`}>
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Security Features */}
                <div className="grid grid-cols-2 gap-6">
                  <div className={`p-6 rounded-2xl border-2 ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Two-Factor Authentication
                      </h4>
                      <button
                        onClick={() => toggleSecurity('twoFactorAuth')}
                        className={`w-12 h-6 rounded-full transition-all ${
                        settings.security.twoFactorAuth
                          ? darkMode ? 'bg-green-500' : 'bg-green-600'
                          : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                          settings.security.twoFactorAuth ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Add an extra layer of security to your account
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border-2 ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Login Alerts
                      </h4>
                      <button
                        onClick={() => toggleSecurity('loginAlerts')}
                        className={`w-12 h-6 rounded-full transition-all ${
                        settings.security.loginAlerts
                          ? darkMode ? 'bg-green-500' : 'bg-green-600'
                          : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                          settings.security.loginAlerts ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Get notified of new sign-ins
                    </p>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className={`mt-6 p-6 rounded-2xl border-2 ${
                  darkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <h4 className={`font-black mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Active Sessions
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">Chrome on Windows</p>
                          <p className="text-gray-400 text-sm">San Francisco, CA • Current</p>
                        </div>
                      </div>
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <PhoneIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">Safari on iPhone</p>
                          <p className="text-gray-400 text-sm">New York, NY • 2 hours ago</p>
                        </div>
                      </div>
                      <button className="text-red-400 hover:text-red-300">
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div className={`rounded-3xl shadow-xl p-8 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl ${
                    darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <Bell className={`w-6 h-6 ${
                      darkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Notification Settings
                    </h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Choose what notifications you receive
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Email Notifications */}
                  <div className={`p-6 rounded-2xl border-2 ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <h4 className={`font-black mb-4 flex items-center gap-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <Mail className="w-5 h-5" />
                      Email Notifications
                    </h4>
                    
                    <div className="space-y-4">
                      {Object.entries(settings.notifications.email).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {key.split(/(?=[A-Z])/).join(' ')}
                          </span>
                          <button
                            onClick={() => toggleNotification('email', key)}
                            className={`w-12 h-6 rounded-full transition-all ${
                            value
                              ? darkMode ? 'bg-green-500' : 'bg-green-600'
                              : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}>
                            <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                              value ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className={`p-6 rounded-2xl border-2 ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <h4 className={`font-black mb-4 flex items-center gap-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <Bell className="w-5 h-5" />
                      Push Notifications
                    </h4>
                    
                    <div className="space-y-4">
                      {Object.entries(settings.notifications.push).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {key.split(/(?=[A-Z])/).join(' ')}
                          </span>
                          <button
                            onClick={() => toggleNotification('push', key)}
                            className={`w-12 h-6 rounded-full transition-all ${
                            value
                              ? darkMode ? 'bg-green-500' : 'bg-green-600'
                              : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}>
                            <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                              value ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div className={`rounded-3xl shadow-xl p-8 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl ${
                    darkMode ? 'bg-pink-500/20' : 'bg-pink-100'
                  }`}>
                    <Palette className={`w-6 h-6 ${
                      darkMode ? 'text-pink-400' : 'text-pink-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Appearance
                    </h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Customize how the app looks
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* Theme Selection */}
                  <div className={`p-6 rounded-2xl border-2 ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <h4 className={`font-semibold mb-4 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Theme
                    </h4>
                    <div className="space-y-3">
                      {['light', 'dark', 'auto'].map(theme => (
                        <button
                          key={theme}
                          onClick={() => updateAppearance('theme', theme)}
                          disabled={!isEditing}
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            settings.appearance.theme === theme
                              ? darkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-indigo-600 text-white'
                              : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-55 disabled:cursor-not-allowed`}
                        >
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className={`p-6 rounded-2xl border-2 ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <h4 className={`font-semibold mb-4 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Font Size
                    </h4>
                    <div className="space-y-3">
                      {['small', 'medium', 'large'].map(size => (
                        <button
                          key={size}
                          onClick={() => updateAppearance('fontSize', size)}
                          disabled={!isEditing}
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            settings.appearance.fontSize === size
                              ? darkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-indigo-600 text-white'
                              : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-55 disabled:cursor-not-allowed`}
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Density */}
                  <div className={`p-6 rounded-2xl border-2 ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <h4 className={`font-semibold mb-4 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Density
                    </h4>
                    <div className="space-y-3">
                      {['compact', 'comfortable', 'spacious'].map(density => (
                        <button
                          key={density}
                          onClick={() => updateAppearance('density', density)}
                          disabled={!isEditing}
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            settings.appearance.density === density
                              ? darkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-indigo-600 text-white'
                              : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-55 disabled:cursor-not-allowed`}
                        >
                          {density.charAt(0).toUpperCase() + density.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Settings */}
            {activeSection === 'preferences' && (
              <div className={`rounded-3xl shadow-xl p-8 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl ${
                    darkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                  }`}>
                    <Settings className={`w-6 h-6 ${
                      darkMode ? 'text-orange-400' : 'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Preferences
                    </h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Customize your application experience
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(settings.preferences).map(([key, value]) => (
                    <div key={key} className={`p-6 rounded-2xl border-2 ${
                      darkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className={`font-semibold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {key.split(/(?=[A-Z])/).join(' ')}
                        </h4>
                        <button
                          onClick={() => togglePreference(key as keyof typeof settings.preferences)}
                          disabled={!isEditing}
                          className={`w-12 h-6 rounded-full transition-all ${
                          value
                            ? darkMode ? 'bg-green-500' : 'bg-green-600'
                            : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}>
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            value ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      <p className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {key === 'jobAlerts' && 'Receive notifications for new job matches'}
                        {key === 'autoSave' && 'Automatically save applications in progress'}
                        {key === 'showProfile' && 'Make your profile visible to employers'}
                        {key === 'remoteOnly' && 'Only show remote job opportunities'}
                        {key === 'aiEnabled' && 'Allow AI to process your data for tailored coaching and recommendations'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSavedToast && (
        <div className="fixed bottom-5 right-5 z-[70]">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
            darkMode
              ? 'bg-emerald-900/85 border-emerald-700 text-emerald-100'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Changes saved</p>
              <p className="text-xs opacity-90">Your settings are updated successfully.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;