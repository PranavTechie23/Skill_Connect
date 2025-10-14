import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Users, 
  Settings as SettingsIcon, 
  HelpCircle,
  Save,
  X,
  Mail,
  Phone,
  Building,
  Briefcase,
  Lock,
  Smartphone,
  Eye
} from 'lucide-react';
import AdminBackButton from "@/components/AdminBackButton";

// Type definitions
interface EmployerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
}

import { useTheme } from "@/components/theme-provider";// Main Settings Component
const EmployerSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Initial state
  const [profile, setProfile] = useState<EmployerProfile>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    company: 'Tech Solutions Inc.',
    position: 'HR Manager'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    lastPasswordChange: '2024-01-15'
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
        setSecurity(prev => ({ ...prev, twoFactorEnabled: true }));
        break;
      case 'changePassword':
        // Implement password change logic
        console.log('Changing password...');
        break;
      case 'viewSessions':
        // Implement session view logic
        console.log('Viewing active sessions...');
        break;
      default:
        break;
    }
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const handleSave = () => {
    // Here you would typically make API calls to save the settings
    console.log('Saving settings:', { profile, notifications, security });
    setHasUnsavedChanges(false);
    // Show success message
    alert('Settings saved successfully!');
  };

  // Reset changes
  const handleReset = () => {
    // Reset to original state
    setProfile({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      phone: '+1 (555) 123-4567',
      company: 'Tech Solutions Inc.',
      position: 'HR Manager'
    });
    setNotifications({
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    });
    setSecurity({
      twoFactorEnabled: false,
      lastPasswordChange: '2024-01-15'
    });
    setHasUnsavedChanges(false);
  };

  // Navigation items
  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <AdminBackButton />
        </div>
        {/* Header */}
        <header className={`flex justify-between items-center mb-8 p-6 rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}>
          <div className="flex items-center space-x-3">
            <Briefcase className={`w-8 h-8 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h1 className="text-2xl font-bold">Employer Portal</h1>
          </div>
          
          <button
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-5 h-5" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className={`lg:w-64 rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <ul className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        activeSection === item.id
                          ? isDarkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700'
                          : isDarkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Main Content */}
          <main className={`flex-1 rounded-lg shadow-lg p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center space-x-3 mb-6">
                  <User className="w-6 h-6" />
                  <span>Profile Information</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Building className="w-4 h-4 inline mr-2" />
                    Company
                  </label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => handleProfileChange('company', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Position
                  </label>
                  <input
                    type="text"
                    value={profile.position}
                    onChange={(e) => handleProfileChange('position', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center space-x-3 mb-6">
                  <Bell className="w-6 h-6" />
                  <span>Notification Preferences</span>
                </h2>

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
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle(item.id as keyof NotificationSettings)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            item.enabled
                              ? 'bg-blue-600'
                              : isDarkMode
                              ? 'bg-gray-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center space-x-3 mb-6">
                  <Shield className="w-6 h-6" />
                  <span>Security Settings</span>
                </h2>

                <div className="space-y-4">
                  {[
                    {
                      id: 'twoFactor',
                      title: 'Two-Factor Authentication',
                      description: 'Add an extra layer of security to your account',
                      icon: Shield,
                      action: 'enable2fa',
                      status: security.twoFactorEnabled ? 'Enabled' : 'Disabled'
                    },
                    {
                      id: 'password',
                      title: 'Change Password',
                      description: `Last changed ${new Date(security.lastPasswordChange).toLocaleDateString()}`,
                      icon: Lock,
                      action: 'changePassword',
                      status: 'Change'
                    },
                    {
                      id: 'sessions',
                      title: 'Active Sessions',
                      description: 'Manage your active login sessions',
                      icon: Eye,
                      action: 'viewSessions',
                      status: 'View'
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSecurityAction(item.action)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            item.id === 'twoFactor' && security.twoFactorEnabled
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : isDarkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          {item.status}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                  hasUnsavedChanges
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </button>

              <button
                onClick={handleReset}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <X className="w-5 h-5" />
                <span>Reset</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default EmployerSettings;