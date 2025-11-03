import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Edit2, Save, X,
  Briefcase, GraduationCap, FileText, Calendar,
  Linkedin, Github, Globe, Plus, Award, Star,
  Download, Upload, Camera, LucideIcon, Trash2
} from 'lucide-react';
import { useTheme } from "@/components/theme-provider";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { type UpdateProfile } from '@shared/schema';

interface Education {
  id: number;
  degree: string;
  school: string;
  year: string;
  gpa: string;
}

interface FormattedExperience {
  id: number;
  title: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
}

interface ProfileData {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    avatar: string | null;
  };
  professional: {
    title: string; // Changed from headline to title to match our usage
    department?: string;
    company?: string;
    startDate?: string;
    employeeId?: string;
    skills: string[];
    level?: string;
  };
  education: Education[];
  experience: FormattedExperience[];
}

const Profile = () => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const darkMode = theme === 'dark';
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [imageHover, setImageHover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  
  // Initialize profile with user data and professional profile data
  const [profile, setProfile] = useState<ProfileData>({
    personal: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.telephoneNumber || '',
      location: user?.location || '',
      bio: user?.profile?.bio || 'No bio provided.',
      avatar: user?.profilePhoto || null
    },
    professional: {
      title: user?.profile?.headline || 'No title provided',
      department: 'Engineering', // Default value as it's not in User or Profile types
      company: user?.company?.name || 'Not specified',
      startDate: '2020-03-01', // Default value as it's not in User type
      employeeId: 'TC-8472', // Default value as it's not in User type
      skills: user?.profile?.skills || ['React', 'TypeScript', 'Node.js'],
      level: 'L5 Senior' // Default value as it's not in User type
    },
    education: [
      {
        id: 1,
        degree: 'Master of Computer Science',
        school: 'Tech University',
        year: '2016',
        gpa: '3.8'
      },
      {
        id: 2,
        degree: 'Bachelor of Engineering',
        school: 'Engineering College',
        year: '2014',
        gpa: '3.9'
      }
    ],
    experience: [
      {
        id: 1,
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        period: '2020 - Present',
        description: 'Leading frontend development team and architecting scalable solutions.',
        achievements: ['Improved performance by 40%', 'Led team of 8 developers', 'Mentored junior engineers']
      },
      {
        id: 2,
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        period: '2016 - 2020',
        description: 'Built responsive web applications using React and Redux.',
        achievements: ['Shipped 10+ major features', 'Reduced bundle size by 60%']
      }
    ]
  });

  // Update profile when user data changes
  useEffect(() => {
    if (user) {
      setProfile({
        personal: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.telephoneNumber || '',
          location: user.location || '',
          bio: user.profile?.bio || 'No bio provided.',
          avatar: user.profilePhoto || null
        },
        professional: {
          title: user.profile?.headline || 'No title provided',
          department: 'Engineering', // Default value as it's not in User or Profile types
          company: user.company?.name || 'Not specified',
          startDate: '2020-03-01', // Default value as it's not in User type
          employeeId: 'TC-8472', // Default value as it's not in User type
          skills: user.profile?.skills || ['React', 'TypeScript', 'Node.js'],
          level: 'L5 Senior' // Default value as it's not in User type
        },
        education: profile.education, // Keep existing education data
        experience: profile.experience // Keep existing experience data
      });
    }
  }, [user, profile.education, profile.experience]);

  // Handle input changes
  const handleInputChange = (section: keyof ProfileData, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Add new skill
  const addSkill = () => {
    if (newSkill.trim()) {
      setProfile(prev => ({
        ...prev,
        professional: {
          ...prev.professional,
          skills: [...prev.professional.skills, newSkill.trim()]
        }
      }));
      setNewSkill('');
    }
  };

  // Remove skill
  const removeSkill = (index: number) => {
    setProfile(prev => ({
      ...prev,
      professional: {
        ...prev.professional,
        skills: prev.professional.skills.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update professional profile
      const response = await apiFetch('/api/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headline: profile.professional.title, // Send as headline for server compatibility
          bio: profile.personal.bio,
          skills: profile.professional.skills
        } as UpdateProfile)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Update the auth context with new user data
      if (updateUser) {
        updateUser(updatedUser);
      }

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original user data
    if (user) {
      setProfile({
        personal: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.telephoneNumber || '',
          location: user.location || '',
          bio: user.profile?.bio || 'No bio provided.',
          avatar: user.profilePhoto || null
        },
        professional: {
          title: user.profile?.headline || 'No title provided',
          skills: user.profile?.skills || ['React', 'TypeScript', 'Node.js']
        },
        education: profile.education, // Keep existing education data
        experience: profile.experience // Keep existing experience data
      });
    }
    setIsEditing(false);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User, count: 7 },
    { id: 'professional', label: 'Professional', icon: Briefcase, count: 8 },
    { id: 'education', label: 'Education', icon: GraduationCap, count: profile.education.length },
    { id: 'experience', label: 'Experience', icon: FileText, count: profile.experience.length }
  ];

  const StatsCard = ({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color: string }) => (
    <div className={`p-4 rounded-2xl transition-all duration-300 hover:scale-105 ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('text-', '')}`} />
        </div>
        <div>
          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen w-screen fixed inset-0 transition-colors duration-300 overflow-y-auto ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-blue-600' : 'bg-blue-400'
        } animate-pulse`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-purple-600' : 'bg-purple-400'
        } animate-pulse delay-1000`} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className={`p-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white shadow-lg'
                  : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 shadow-lg'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className={`text-4xl font-black mb-2 bg-gradient-to-r ${
                darkMode 
                  ? 'from-blue-400 to-purple-400' 
                  : 'from-indigo-600 to-purple-600'
              } bg-clip-text text-transparent`}>
                My Profile
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your personal and professional information
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                  darkMode
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                }`}
              >
                <Edit2 className="w-5 h-5" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                    darkMode
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            {/* Profile Card */}
            <div className={`rounded-3xl shadow-2xl overflow-hidden mb-6 transform transition-all duration-300 hover:shadow-2xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`h-32 relative ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700' 
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600'
              }`}>
                <div className="absolute inset-0 bg-black bg-opacity-20" />
              </div>
              
              <div className="px-6 pb-6 -mt-16 relative">
                <div 
                  className="relative group"
                  onMouseEnter={() => setImageHover(true)}
                  onMouseLeave={() => setImageHover(false)}
                >
                  <div className={`w-32 h-32 rounded-3xl border-4 mx-auto mb-4 transition-all duration-300 ${
                    darkMode ? 'border-gray-800 bg-gray-700' : 'border-white bg-gray-200'
                  } ${imageHover ? 'scale-110' : ''} flex items-center justify-center overflow-hidden`}>
                    {profile.personal.avatar ? (
                      <img 
                        src={profile.personal.avatar} 
                        alt="Profile" 
                        className="w-full h-full rounded-3xl object-cover"
                      />
                    ) : (
                      <User className={`w-12 h-12 transition-all duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      } ${imageHover ? 'scale-110' : ''}`} />
                    )}
                    {isEditing && (
                      <div className={`absolute inset-0 bg-black bg-opacity-50 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                        imageHover ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <h2 className={`text-2xl font-black mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {profile.personal.firstName} {profile.personal.lastName}
                  </h2>
                  
                  <p className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-blue-400' : 'text-indigo-600'
                  }`}>
                    {profile.professional.title}
                  </p>
                  
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <Star className={`w-4 h-4 ${
                      darkMode ? 'text-yellow-400' : 'text-yellow-500'
                    }`} />
                    <span className={`text-sm font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Premium Member
                    </span>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <StatsCard 
                    icon={Briefcase} 
                    label="Experience" 
                    value="8 yrs" 
                    color="text-blue-500"
                  />
                  <StatsCard 
                    icon={Award} 
                    label="Projects" 
                    value="24" 
                    color="text-purple-500"
                  />
                </div>
                
                {/* Social Links */}
                <div className="flex justify-center gap-3 mb-6">
                  {[
                    { icon: Linkedin, color: 'hover:bg-blue-500', label: 'LinkedIn' },
                    { icon: Github, color: 'hover:bg-gray-700', label: 'GitHub' },
                    { icon: Globe, color: 'hover:bg-green-500', label: 'Portfolio' }
                  ].map((social, index) => (
                    <button
                      key={index}
                      className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                        darkMode 
                          ? 'bg-gray-700 text-gray-400 hover:text-white' 
                          : 'bg-gray-100 text-gray-600 hover:text-white'
                      } ${social.color}`}
                      title={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  }`}>
                    <Upload className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className={`rounded-3xl p-2 shadow-2xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 mb-2 group ${
                      isActive
                        ? darkMode
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : darkMode
                        ? 'text-gray-400 hover:bg-gray-700 hover:text-white hover:scale-105'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      }`} />
                      <span className="font-semibold">{tab.label}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-white bg-opacity-20'
                        : darkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className={`rounded-3xl shadow-2xl p-8 transform transition-all duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-2xl font-black ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Personal Information
                  </h3>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    darkMode 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {isEditing ? 'Editing Mode' : 'View Mode'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'First Name', field: 'firstName', value: profile.personal.firstName, icon: User },
                    { label: 'Last Name', field: 'lastName', value: profile.personal.lastName, icon: User },
                    { label: 'Email', field: 'email', value: profile.personal.email, icon: Mail, fullWidth: true },
                    { label: 'Phone', field: 'phone', value: profile.personal.phone, icon: Phone },
                    { label: 'Location', field: 'location', value: profile.personal.location, icon: MapPin }
                  ].map((field, index) => (
                    <div key={index} className={field.fullWidth ? 'col-span-2' : ''}>
                      <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <field.icon className="w-4 h-4" />
                        {field.label}
                      </label>
                      {isEditing ? (
                        <input
                          type={field.field === 'birthday' ? 'date' : 'text'}
                          value={field.value}
                          onChange={(e) => handleInputChange('personal', field.field, e.target.value)}
                          className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-300 ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:scale-105'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:scale-105'
                          }`}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : (
                        <p className={`px-4 py-4 rounded-xl ${
                          darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                        }`}>
                          {field.value || 'Not provided'}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  <div className="col-span-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <FileText className="w-4 h-4" />
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={profile.personal.bio}
                        onChange={(e) => handleInputChange('personal', 'bio', e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-300 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:scale-105'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:scale-105'
                        }`}
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className={`px-4 py-4 rounded-xl leading-relaxed ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'
                      }`}>
                        {profile.personal.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Professional Tab */}
            {activeTab === 'professional' && (
              <div className={`rounded-3xl shadow-2xl p-8 transform transition-all duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-2xl font-black mb-8 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Professional Information
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {[
                    { label: 'Professional Title', field: 'title', value: profile.professional.title }
                  ].map((field, index) => (
                    <div key={index}>
                      <label className={`block text-sm font-semibold mb-3 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {field.label}
                      </label>
                      {isEditing ? (
                        <input
                          type={field.field === 'startDate' ? 'date' : 'text'}
                          value={field.value}
                          onChange={(e) => handleInputChange('professional', field.field, e.target.value)}
                          className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-300 ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:scale-105'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:scale-105'
                          }`}
                        />
                      ) : (
                        <p className={`px-4 py-4 rounded-xl ${
                          darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                        }`}>
                          {field.value || 'Not provided'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Skills & Technologies
                  </label>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {profile.professional.skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span
                          className={`px-4 py-3 rounded-xl font-semibold border transition-all duration-300 hover:scale-105 ${
                            darkMode
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                              : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 hover:from-indigo-100 hover:to-purple-100'
                          }`}
                        >
                          {skill}
                        </span>
                        {isEditing && (
                          <button
                            onClick={() => removeSkill(index)}
                            className={`p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                              darkMode
                                ? 'text-red-400 hover:bg-red-500/20'
                                : 'text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="Add a new skill..."
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      />
                      <button
                        onClick={addSkill}
                        className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                          darkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className={`rounded-3xl shadow-2xl p-8 transform transition-all duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-2xl font-black mb-8 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Education
                </h3>
                
                <div className="space-y-6">
                  {profile.education.map((edu) => (
                    <div
                      key={edu.id}
                      className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                        darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-100 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className={`text-2xl p-3 rounded-xl ${
                            darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                          }`}>
                            🎓
                          </div>
                          <div>
                            <h4 className={`text-lg font-black mb-1 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {edu.degree}
                            </h4>
                            <p className={`font-semibold mb-2 ${
                              darkMode ? 'text-blue-400' : 'text-indigo-600'
                            }`}>
                              {edu.school}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl font-semibold ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {edu.year}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          GPA: <strong>{edu.gpa}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className={`rounded-3xl shadow-2xl p-8 transform transition-all duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-2xl font-black mb-8 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Work Experience
                </h3>
                
                <div className="space-y-6">
                  {profile.experience.map((exp) => (
                    <div
                      key={exp.id}
                      className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                        darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-100 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className={`text-2xl p-3 rounded-xl ${
                            darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                          }`}>
                            💼
                          </div>
                          <div>
                            <h4 className={`text-lg font-black mb-1 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {exp.title}
                            </h4>
                            <p className={`font-semibold mb-2 ${
                              darkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                              {exp.company}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl font-semibold ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {exp.period}
                        </div>
                      </div>
                      
                      <p className={`mb-4 leading-relaxed ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {exp.description}
                      </p>
                      
                      <div className="space-y-2">
                        {exp.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              darkMode ? 'bg-green-400' : 'bg-green-500'
                            }`} />
                            <span className={`text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {achievement}
                            </span>
                          </div>
                        ))}
                      </div>
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

export default Profile;