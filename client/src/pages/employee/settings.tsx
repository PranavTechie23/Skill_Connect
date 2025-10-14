import { useState } from 'react';
import {
  Settings, User, Shield, Bell, LogOut,
  Save, X, Eye, EyeOff, Mail, Smartphone,
  Palette, Download, Trash2,
  Check, Monitor, Smartphone as PhoneIcon
} from 'lucide-react';
import { useTheme } from "@/components/theme-provider";

const SettingsPage = () => {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [activeSection, setActiveSection] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Mock settings data
  const [settings, setSettings] = useState({
    account: {
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@techcorp.com',
      phone: '+1 (555) 123-4567',
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
      theme: 'dark',
      fontSize: 'medium',
      density: 'comfortable'
    },
    preferences: {
      jobAlerts: true,
      autoSave: true,
      showProfile: true,
      remoteOnly: false
    }
  });

  const sections: { id: string; label: string; icon: any; color: 'blue' | 'green' | 'purple' | 'pink' | 'orange' }[] = [
    { id: 'account', label: 'Account', icon: User, color: 'blue' },
    { id: 'security', label: 'Security', icon: Shield, color: 'green' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'purple' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: 'pink' },
    { id: 'preferences', label: 'Preferences', icon: Settings, color: 'orange' }
  ];

  const handleSave = () => {
    setIsEditing(false);
    // In real app, save to backend here
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data here
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

  return (
    <div className={`min-h-screen w-screen fixed inset-0 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    } overflow-y-auto`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
            <div>
              <h1 className={`text-3xl font-black ${
                darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                Settings
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
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                Edit Settings
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-80 flex-shrink-0">
            <div className={`rounded-3xl p-1 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
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
                <button className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${
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
              <div className={`rounded-3xl shadow-xl p-8 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
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
                  
                  <div className="col-span-2">
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
                  
                  <div className="col-span-2">
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
                    <button className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}>
                      <Download className="w-4 h-4" />
                      Export Data
                    </button>
                    <button className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                      darkMode
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        : 'bg-red-50 hover:bg-red-100 text-red-600'
                    }`}>
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className={`rounded-3xl shadow-xl p-8 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
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
                      <div className={`w-12 h-6 rounded-full transition-all ${
                        settings.security.twoFactorAuth
                          ? darkMode ? 'bg-green-500' : 'bg-green-600'
                          : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                          settings.security.twoFactorAuth ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </div>
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
                      <div className={`w-12 h-6 rounded-full transition-all ${
                        settings.security.loginAlerts
                          ? darkMode ? 'bg-green-500' : 'bg-green-600'
                          : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                          settings.security.loginAlerts ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </div>
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
                          <div className={`w-12 h-6 rounded-full transition-all ${
                            value
                              ? darkMode ? 'bg-green-500' : 'bg-green-600'
                              : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}>
                            <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                              value ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                          </div>
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
                          <div className={`w-12 h-6 rounded-full transition-all ${
                            value
                              ? darkMode ? 'bg-green-500' : 'bg-green-600'
                              : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}>
                            <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                              value ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                          </div>
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
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            settings.appearance.theme === theme
                              ? darkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-indigo-600 text-white'
                              : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
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
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            settings.appearance.fontSize === size
                              ? darkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-indigo-600 text-white'
                              : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
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
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            settings.appearance.density === density
                              ? darkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-indigo-600 text-white'
                              : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
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
                        <div className={`w-12 h-6 rounded-full transition-all ${
                          value
                            ? darkMode ? 'bg-green-500' : 'bg-green-600'
                            : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                            value ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                      <p className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {key === 'jobAlerts' && 'Receive notifications for new job matches'}
                        {key === 'autoSave' && 'Automatically save applications in progress'}
                        {key === 'showProfile' && 'Make your profile visible to employers'}
                        {key === 'remoteOnly' && 'Only show remote job opportunities'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;