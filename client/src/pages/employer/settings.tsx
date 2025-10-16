import React, { useState } from 'react';
import { useTheme } from "@/components/theme-provider";
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Users, 
  Settings, 
  HelpCircle,
  Save,
  X,
  Mail,
  Phone,
  Building,
  Briefcase,
  Lock,
  Smartphone,
  Eye,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Sparkles,
  Star,
  Crown,
  Rocket,
  Target,
  TrendingUp,
  ShieldCheck,
  KeyRound,
  LogOut,
  Globe,
  Palette,
  Clock,
  Download,
  Upload,
  Heart,
  ThumbsUp,
  Award,
  BadgeCheck,
  Lightbulb,
  Coffee,
  HeartHandshake,
  Monitor,
  MoreVertical,
  Plus
} from 'lucide-react';

// Type definitions
interface EmployerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  avatar: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  candidateUpdates: boolean;
  weeklyDigest: boolean;
  securityAlerts: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  activeSessions: number;
  loginAlerts: boolean;
}

// Main Settings Component
const EmployerSettings: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);

  // Initial state
  const [profile, setProfile] = useState<EmployerProfile>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    company: 'Tech Solutions Inc.',
    position: 'HR Manager',
    avatar: '/api/placeholder/150/150'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    jobAlerts: true,
    candidateUpdates: true,
    weeklyDigest: false,
    securityAlerts: true
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    lastPasswordChange: '2024-01-15',
    activeSessions: 3,
    loginAlerts: true
  });

  // Handle profile changes
  const handleProfileChange = (field: keyof EmployerProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle notification toggles
  const handleNotificationToggle = (field: keyof NotificationSettings) => {
    setNotifications(prev => ({ 
      ...prev, 
      [field]: !prev[field] 
    }));
    setHasUnsavedChanges(true);
  };

  // Handle security actions
  const handleSecurityAction = (action: string) => {
    switch (action) {
      case 'enable2fa':
        setSecurity(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
        setHasUnsavedChanges(true);
        break;
      case 'changePassword':
        console.log('Changing password...');
        break;
      case 'viewSessions':
        console.log('Viewing active sessions...');
        break;
      case 'toggleLoginAlerts':
        setSecurity(prev => ({ ...prev, loginAlerts: !prev.loginAlerts }));
        setHasUnsavedChanges(true);
        break;
      default:
        break;
    }
  };

  // Save all changes
  const handleSave = () => {
    console.log('Saving settings:', { profile, notifications, security });
    setHasUnsavedChanges(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Reset changes
  const handleReset = () => {
    setProfile({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      phone: '+1 (555) 123-4567',
      company: 'Tech Solutions Inc.',
      position: 'HR Manager',
      avatar: '/api/placeholder/150/150'
    });
    setNotifications({
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      jobAlerts: true,
      candidateUpdates: true,
      weeklyDigest: false,
      securityAlerts: true
    });
    setSecurity({
      twoFactorEnabled: false,
      lastPasswordChange: '2024-01-15',
      activeSessions: 3,
      loginAlerts: true
    });
    setHasUnsavedChanges(false);
  };

  // Enhanced Navigation items with better icons
  const navItems = [
    { id: 'profile', label: 'Profile', icon: User, color: 'from-blue-500 to-cyan-500', description: 'Personal & company info' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-purple-500 to-pink-500', description: 'Alerts & preferences' },
    { id: 'security', label: 'Security', icon: ShieldCheck, color: 'from-green-500 to-emerald-500', description: 'Privacy & protection' },
    { id: 'billing', label: 'Billing', icon: Crown, color: 'from-yellow-500 to-amber-500', description: 'Plans & payments' },
    { id: 'team', label: 'Team', icon: Users, color: 'from-indigo-500 to-purple-500', description: 'Members & permissions' },
    { id: 'preferences', label: 'Preferences', icon: Palette, color: 'from-pink-500 to-rose-500', description: 'Customize experience' },
    { id: 'help', label: 'Help & Support', icon: HeartHandshake, color: 'from-orange-500 to-red-500', description: 'Help center & contact' },
  ];

  const inputClasses = `w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
    isDarkMode
      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'
  }`;


  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 text-gray-900'
    }`}>
      {/* Enhanced Animated background */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none ${isDarkMode ? 'opacity-100' : 'opacity-40'}`}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Enhanced Success Toast */}
      {showSaveSuccess && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl ${
            isDarkMode 
              ? 'bg-gray-800/80 border-green-500/50 text-white' 
              : 'bg-white/80 border-green-500/50 text-gray-900'
          }`}>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <span className="font-medium">Settings saved successfully!</span>
              <p className="text-sm opacity-80">Your changes have been applied</p>
            </div>
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        {/* Enhanced Back Button */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 backdrop-blur-sm border ${
              isDarkMode
                ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white border-gray-700 hover:border-gray-600'
                : 'bg-white/80 hover:bg-white text-gray-900 border-gray-200 hover:border-gray-300'
            }`}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>

        {/* Enhanced Header */}
        <header className={`flex flex-col items-center justify-center mb-8 p-8 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-2xl shadow-blue-500/10' 
            : 'bg-white/80 border-gray-200/50 shadow-xl'
        }`}>
          <div className="flex items-center space-x-4 mb-4">
            <div className={`p-4 rounded-2xl ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30' 
                : 'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg'
            }`}>
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Employer Portal
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your account settings and preferences
              </p>
            </div>
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/50 animate-pulse">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span>
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar Navigation */}
          <nav className={`lg:w-80 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700/50 shadow-2xl shadow-purple-500/10' 
              : 'bg-white/80 border-gray-200/50 shadow-xl'
          }`}>
            <div className="p-6 border-b border-gray-700/50 dark:border-gray-600/50">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Settings Menu</span>
              </h2>
            </div>
            <ul className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`group w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-300 ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg scale-105`
                          : isDarkMode
                          ? 'hover:bg-gray-700/50 hover:translate-x-2 text-gray-300'
                          : 'hover:bg-gray-100 hover:translate-x-2 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          isActive 
                            ? 'bg-white/20' 
                            : isDarkMode 
                              ? 'bg-gray-700/50 group-hover:bg-gray-600/50' 
                              : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className={`text-xs ${
                            isActive ? 'text-white/80' : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                      {isActive ? (
                        <ArrowRight className="w-4 h-4 animate-pulse" />
                      ) : (
                        <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            
            {/* Sidebar Footer */}
            <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className={`p-3 rounded-xl text-center ${
                isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Pro Plan</span>
                </div>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                  All features unlocked
                </p>
              </div>
            </div>
          </nav>

          {/* Enhanced Main Content */}
          <main className={`flex-1 rounded-2xl backdrop-blur-xl border transition-all duration-300 p-8 ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700/50 shadow-2xl shadow-cyan-500/10' 
              : 'bg-white/80 border-gray-200/50 shadow-xl'
          }`}>
            {/* Enhanced Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl ${
                      isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      <User className={`w-7 h-7 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Profile Information</h2>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Manage your personal and company details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className={`p-3 rounded-xl transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600' 
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}>
                      <Upload className="w-5 h-5" />
                    </button>
                    <button className={`p-3 rounded-xl transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600' 
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}>
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Avatar Section */}
                <div className={`p-6 rounded-xl border-2 ${
                  isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-blue-50'
                }`}>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <img
                        src={profile.avatar}
                        alt="Profile"
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-blue-500/30"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 rounded-full">
                        <Star className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {profile.position} at {profile.company}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                        }`}>
                          <BadgeCheck className="w-3 h-3 inline mr-1" />
                          Verified
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                        }`}>
                          <Crown className="w-3 h-3 inline mr-1" />
                          Pro Plan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'First Name', field: 'firstName', icon: User },
                    { label: 'Last Name', field: 'lastName', icon: User },
                    { label: 'Email Address', field: 'email', icon: Mail },
                    { label: 'Phone Number', field: 'phone', icon: Phone },
                    { label: 'Company', field: 'company', icon: Building },
                    { label: 'Position', field: 'position', icon: Briefcase },
                  ].map(({ label, field, icon: Icon }) => (
                    <div key={field} className="group">
                      <label className={`flex items-center text-sm font-medium mb-3 transition-colors ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
                      </label>
                      <input
                        type="text"
                        value={profile[field as keyof EmployerProfile]}
                        onChange={(e) => handleProfileChange(field as keyof EmployerProfile, e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <Bell className={`w-7 h-7 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Notification Preferences</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Choose how you want to be notified
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      id: 'emailNotifications',
                      title: 'Email Notifications',
                      description: 'Receive email updates about new applicants and platform updates',
                      icon: Mail,
                      enabled: notifications.emailNotifications
                    },
                    {
                      id: 'smsNotifications',
                      title: 'SMS Notifications',
                      description: 'Receive text messages for urgent updates',
                      icon: Smartphone,
                      enabled: notifications.smsNotifications
                    },
                    {
                      id: 'pushNotifications',
                      title: 'Push Notifications',
                      description: 'Receive browser notifications for new activity',
                      icon: Bell,
                      enabled: notifications.pushNotifications
                    },
                    {
                      id: 'jobAlerts',
                      title: 'Job Alerts',
                      description: 'Get notified about similar job market trends',
                      icon: Target,
                      enabled: notifications.jobAlerts
                    },
                    {
                      id: 'candidateUpdates',
                      title: 'Candidate Updates',
                      description: 'Updates when candidates progress through stages',
                      icon: User,
                      enabled: notifications.candidateUpdates
                    },
                    {
                      id: 'securityAlerts',
                      title: 'Security Alerts',
                      description: 'Important security and privacy notifications',
                      icon: Shield,
                      enabled: notifications.securityAlerts
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`group flex items-center justify-between p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                          isDarkMode 
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-700/30' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-purple-500/20 group-hover:bg-purple-500/30' 
                              : 'bg-purple-100 group-hover:bg-purple-200'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle(item.id as keyof NotificationSettings)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                            item.enabled
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/50'
                              : isDarkMode
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${
                              item.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Enhanced Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                    <ShieldCheck className={`w-7 h-7 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Security Settings</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Protect your account and data
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      id: 'twoFactor',
                      title: 'Two-Factor Authentication',
                      description: 'Add an extra layer of security to your account',
                      icon: KeyRound,
                      action: 'enable2fa',
                      status: security.twoFactorEnabled ? 'Enabled' : 'Enable',
                      badge: security.twoFactorEnabled ? '🛡️ Secure' : '⚠️ Recommended'
                    },
                    {
                      id: 'password',
                      title: 'Change Password',
                      description: `Last changed ${new Date(security.lastPasswordChange).toLocaleDateString()}`,
                      icon: Lock,
                      action: 'changePassword',
                      status: 'Change Now',
                      badge: '🔒 Strong'
                    },
                    {
                      id: 'sessions',
                      title: 'Active Sessions',
                      description: `${security.activeSessions} active sessions. Manage your login sessions`,
                      icon: LogOut,
                      action: 'viewSessions',
                      status: 'Manage',
                      badge: '👥 Active'
                    },
                    {
                      id: 'loginAlerts',
                      title: 'Login Alerts',
                      description: 'Get notified of new sign-ins from unrecognized devices',
                      icon: Bell,
                      action: 'toggleLoginAlerts',
                      status: security.loginAlerts ? 'Enabled' : 'Enable',
                      badge: '🔔 On'
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`group flex items-center justify-between p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                          isDarkMode 
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-700/30' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-green-500/20 group-hover:bg-green-500/30' 
                              : 'bg-green-100 group-hover:bg-green-200'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="font-semibold text-lg">{item.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSecurityAction(item.action)}
                          className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                            item.id === 'twoFactor' && security.twoFactorEnabled
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:scale-105'
                              : isDarkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-white hover:scale-105'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:scale-105'
                          }`}
                        >
                          {item.status}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Security Tips */}
                <div className={`p-6 rounded-xl border-2 ${
                  isDarkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <Lightbulb className="w-6 h-6 text-blue-500" />
                    <h3 className="text-lg font-semibold">Security Tips</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Use a strong, unique password</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <KeyRound className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Enable two-factor authentication</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Regularly review active sessions</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Bell className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Enable login alerts for new devices</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Section */}
            {activeSection === 'billing' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'
                  }`}>
                    <Crown className={`w-7 h-7 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Billing & Subscription</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Manage your subscription and payment methods
                    </p>
                  </div>
                </div>

                {/* Current Plan */}
                <div className={`p-6 rounded-xl border-2 ${
                  isDarkMode ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Crown className="w-6 h-6 text-yellow-500" />
                      <h3 className="text-lg font-semibold">Pro Plan</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                    }`}>
                      Active
                    </span>
                  </div>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    $49/month • Billed monthly • Next billing: March 15, 2024
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Job Postings</p>
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Unlimited</p>
                    </div>
                    <div>
                      <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Applications</p>
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Unlimited</p>
                    </div>
                    <div>
                      <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Team Members</p>
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Up to 10</p>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className={`p-6 rounded-xl border-2 ${
                  isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-white'
                }`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Payment Methods</span>
                  </h3>
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between p-4 rounded-xl ${
                      isDarkMode ? 'bg-gray-600/30' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">VISA</span>
                        </div>
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expires 12/25</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                      }`}>
                        Default
                      </span>
                    </div>
                    <button className={`w-full p-3 rounded-xl border-2 border-dashed transition-all duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300' 
                        : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700'
                    }`}>
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Payment Method
                    </button>
                  </div>
                </div>

                {/* Billing History */}
                <div className={`p-6 rounded-xl border-2 ${
                  isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-white'
                }`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Billing History</span>
                  </h3>
                  <div className="space-y-3">
                    {[
                      { date: 'Feb 15, 2024', amount: '$49.00', status: 'Paid', invoice: 'INV-2024-02-001' },
                      { date: 'Jan 15, 2024', amount: '$49.00', status: 'Paid', invoice: 'INV-2024-01-001' },
                      { date: 'Dec 15, 2023', amount: '$49.00', status: 'Paid', invoice: 'INV-2023-12-001' }
                    ].map((invoice, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-xl ${
                        isDarkMode ? 'bg-gray-600/30' : 'bg-gray-50'
                      }`}>
                        <div>
                          <p className="font-medium">{invoice.date}</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {invoice.invoice}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{invoice.amount}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className={`mt-4 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}>
                    View All Invoices
                  </button>
                </div>
              </div>
            )}

            {/* Team Section */}
            {activeSection === 'team' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'
                  }`}>
                    <Users className={`w-7 h-7 ${
                      isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Team Management</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Manage your team members and their permissions
                    </p>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-indigo-200 bg-indigo-50'
                  }`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <Users className="w-6 h-6 text-indigo-500" />
                      <h3 className="font-semibold">Total Members</h3>
                    </div>
                    <p className="text-3xl font-bold">8</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      of 10 slots used
                    </p>
                  </div>
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-green-500/30 bg-green-500/10' : 'border-green-200 bg-green-50'
                  }`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <Shield className="w-6 h-6 text-green-500" />
                      <h3 className="font-semibold">Admins</h3>
                    </div>
                    <p className="text-3xl font-bold">3</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Full access
                    </p>
                  </div>
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-6 h-6 text-blue-500" />
                      <h3 className="font-semibold">Members</h3>
                    </div>
                    <p className="text-3xl font-bold">5</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Limited access
                    </p>
                  </div>
                </div>

                {/* Team Members */}
                <div className={`p-6 rounded-xl border-2 ${
                  isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    <button className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}>
                      <Plus className="w-4 h-4 inline mr-2" />
                      Invite Member
                    </button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'John Doe', email: 'john@company.com', role: 'Admin', status: 'Active', avatar: 'JD' },
                      { name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Admin', status: 'Active', avatar: 'SW' },
                      { name: 'Mike Johnson', email: 'mike@company.com', role: 'Member', status: 'Active', avatar: 'MJ' },
                      { name: 'Emily Davis', email: 'emily@company.com', role: 'Member', status: 'Pending', avatar: 'ED' }
                    ].map((member, index) => (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${
                        isDarkMode ? 'bg-gray-600/30' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            member.role === 'Admin' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                          }`}>
                            {member.avatar}
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.role === 'Admin' 
                              ? isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                              : isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {member.role}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.status === 'Active'
                              ? isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                              : isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {member.status}
                          </span>
                          <button className={`p-2 rounded-lg transition-all duration-300 ${
                            isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                          }`}>
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-pink-500/20' : 'bg-pink-100'
                  }`}>
                    <Palette className={`w-7 h-7 ${
                      isDarkMode ? 'text-pink-400' : 'text-pink-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Preferences</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Customize your application experience
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Display Preferences */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-white'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Monitor className="w-5 h-5" />
                      <span>Display Preferences</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Language</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Choose your preferred language
                          </p>
                        </div>
                        <select className={`px-3 py-2 rounded-lg border transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}>
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Timezone</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Set your local timezone
                          </p>
                        </div>
                        <select className={`px-3 py-2 rounded-lg border transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}>
                          <option>Pacific Time (PT)</option>
                          <option>Eastern Time (ET)</option>
                          <option>Central Time (CT)</option>
                          <option>Mountain Time (MT)</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Date Format</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            How dates are displayed
                          </p>
                        </div>
                        <select className={`px-3 py-2 rounded-lg border transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}>
                          <option>MM/DD/YYYY</option>
                          <option>DD/MM/YYYY</option>
                          <option>YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-white'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Notification Preferences</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Digest</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Daily summary of activities
                          </p>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          true ? (isDarkMode ? 'bg-green-500' : 'bg-green-600') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            true ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Sound Notifications</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Play sounds for new notifications
                          </p>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          false ? (isDarkMode ? 'bg-green-500' : 'bg-green-600') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            false ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Desktop Notifications</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Show browser notifications
                          </p>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          true ? (isDarkMode ? 'bg-green-500' : 'bg-green-600') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            true ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data & Privacy */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-white'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Data & Privacy</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Auto-save Drafts</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Automatically save form data
                          </p>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          true ? (isDarkMode ? 'bg-green-500' : 'bg-green-600') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            true ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Analytics Tracking</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Help improve our service
                          </p>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          true ? (isDarkMode ? 'bg-green-500' : 'bg-green-600') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            true ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Marketing Emails</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Receive product updates and tips
                          </p>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          false ? (isDarkMode ? 'bg-green-500' : 'bg-green-600') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            false ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-white'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Keyboard Shortcuts</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Create new job
                        </span>
                        <kbd className={`px-2 py-1 rounded text-xs font-mono ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          Ctrl + N
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Search jobs
                        </span>
                        <kbd className={`px-2 py-1 rounded text-xs font-mono ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          Ctrl + K
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Open settings
                        </span>
                        <kbd className={`px-2 py-1 rounded text-xs font-mono ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          Ctrl + ,
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Help & Support Section */}
            {activeSection === 'help' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                  }`}>
                    <HeartHandshake className={`w-7 h-7 ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Help & Support</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Get help and support when you need it
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Quick Help */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-orange-500/30 bg-orange-500/10' : 'border-orange-200 bg-orange-50'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5" />
                      <span>Quick Help</span>
                    </h3>
                    <div className="space-y-3">
                      <button className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-white hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Plus className="w-5 h-5 text-orange-500" />
                          <span>How to create a new job posting</span>
                        </div>
                      </button>
                      <button className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-white hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Users className="w-5 h-5 text-orange-500" />
                          <span>Managing team members and permissions</span>
                        </div>
                      </button>
                      <button className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-white hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-orange-500" />
                          <span>Billing and subscription management</span>
                        </div>
                      </button>
                      <button className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-white hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Shield className="w-5 h-5 text-orange-500" />
                          <span>Account security and privacy settings</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Contact Support */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-white'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Mail className="w-5 h-5" />
                      <span>Contact Support</span>
                    </h3>
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl ${
                        isDarkMode ? 'bg-gray-600/30' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3 mb-2">
                          <Mail className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">Email Support</span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          support@skillconnect.com
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Average response time: 2 hours
                        </p>
                      </div>
                      <div className={`p-4 rounded-xl ${
                        isDarkMode ? 'bg-gray-600/30' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3 mb-2">
                          <Phone className="w-5 h-5 text-green-500" />
                          <span className="font-medium">Phone Support</span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          +1 (555) 123-4567
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Mon-Fri 9AM-6PM PST
                        </p>
                      </div>
                      <div className={`p-4 rounded-xl ${
                        isDarkMode ? 'bg-gray-600/30' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3 mb-2">
                          <Globe className="w-5 h-5 text-purple-500" />
                          <span className="font-medium">Live Chat</span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Available 24/7 for Pro users
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Click the chat icon in the bottom right
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resources */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-white'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Award className="w-5 h-5" />
                      <span>Resources</span>
                    </h3>
                    <div className="space-y-3">
                      <button className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-600/30 hover:bg-gray-500/30' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Download className="w-5 h-5 text-blue-500" />
                          <span>User Guide & Documentation</span>
                        </div>
                      </button>
                      <button className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-600/30 hover:bg-gray-500/30' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Heart className="w-5 h-5 text-red-500" />
                          <span>Video Tutorials</span>
                        </div>
                      </button>
                      <button className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-600/30 hover:bg-gray-500/30' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Users className="w-5 h-5 text-green-500" />
                          <span>Community Forum</span>
                        </div>
                      </button>
                      <button className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-600/30 hover:bg-gray-500/30' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <ThumbsUp className="w-5 h-5 text-yellow-500" />
                          <span>Feature Requests</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'border-green-500/30 bg-green-500/10' : 'border-green-200 bg-green-50'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>System Status</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">All Systems Operational</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">Online</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Response Time</span>
                        <span className="text-xs text-green-600">142ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Uptime (30 days)</span>
                        <span className="text-xs text-green-600">99.9%</span>
                      </div>
                    </div>
                    <button className={`w-full mt-4 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30'
                        : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300'
                    }`}>
                      View Status Page
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Action Buttons */}
            {(activeSection === 'profile' || activeSection === 'notifications' || activeSection === 'security') && (
              <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className={`group flex items-center justify-center space-x-3 px-8 py-4 rounded-xl transition-all duration-300 font-medium ${
                    hasUnsavedChanges
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:scale-105'
                      : isDarkMode
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Save Changes</span>
                  {hasUnsavedChanges && <Sparkles className="w-4 h-4 animate-pulse" />}
                </button>

                <button
                  onClick={handleReset}
                  className={`group flex items-center justify-center space-x-3 px-8 py-4 rounded-xl transition-all duration-300 font-medium hover:scale-105 ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Reset Changes</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default EmployerSettings;
