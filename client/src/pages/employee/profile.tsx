import React, { useState } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Edit2, Save, X,
  Briefcase, GraduationCap, Award, Users, FileText,
  Linkedin, Github, Globe, Download, Upload,
  Shield, Bell, CreditCard, LogOut, Moon, Sun
} from 'lucide-react';

const Profile = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Mock profile data
  const [profile, setProfile] = useState({
    personal: {
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@techcorp.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      birthday: '1990-05-15',
      bio: 'Senior Frontend Developer with 8+ years of experience building scalable web applications. Passionate about React, TypeScript, and user experience design.',
      avatar: null
    },
    professional: {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      company: 'TechCorp Inc.',
      startDate: '2020-03-01',
      employeeId: 'TC-8472',
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'UI/UX Design'],
      level: 'L5'
    },
    education: [
      {
        degree: 'M.S. Computer Science',
        school: 'Stanford University',
        year: '2014',
        gpa: '3.8'
      },
      {
        degree: 'B.S. Software Engineering',
        school: 'UC Berkeley',
        year: '2012',
        gpa: '3.9'
      }
    ],
    experience: [
      {
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        period: '2020 - Present',
        description: 'Lead frontend development for customer-facing applications.'
      },
      {
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        period: '2016 - 2020',
        description: 'Built responsive web applications using React and Redux.'
      }
    ]
  });

  const handleSave = () => {
    setIsEditing(false);
    // In real app, save to backend here
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data here
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'experience', label: 'Experience', icon: FileText }
  ];

  return (
    <div className={`min-h-screen w-screen fixed inset-0 transition-colors duration-300 overflow-y-auto ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
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
              My Profile
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Manage your personal and professional information
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl transition-all ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                }`}
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
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
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            {/* Profile Card */}
            <div className={`rounded-3xl shadow-xl overflow-hidden mb-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`h-24 ${
                darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
              }`} />
              
              <div className="px-6 pb-6 -mt-12">
                <div className="flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-2xl border-4 ${
                    darkMode ? 'border-gray-800 bg-gray-700' : 'border-white bg-gray-200'
                  } flex items-center justify-center mb-4`}>
                    {profile.personal.avatar ? (
                      <img 
                        src={profile.personal.avatar} 
                        alt="Profile" 
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <User className={`w-12 h-12 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    )}
                  </div>
                  
                  <h2 className={`text-xl font-black mb-1 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {profile.personal.firstName} {profile.personal.lastName}
                  </h2>
                  
                  <p className={`mb-4 ${darkMode ? 'text-blue-400' : 'text-indigo-600'} font-semibold`}>
                    {profile.professional.title}
                  </p>
                  
                  <div className={`w-full p-4 rounded-xl mb-4 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        Profile Completion
                      </span>
                      <span className={`font-bold ${
                        darkMode ? 'text-blue-400' : 'text-indigo-600'
                      }`}>
                        85%
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${
                      darkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        style={{ width: '85%' }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button className={`p-3 rounded-xl transition-all ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' 
                        : 'bg-gray-100 hover:bg-gray-200 text-indigo-600'
                    }`}>
                      <Linkedin className="w-5 h-5" />
                    </button>
                    <button className={`p-3 rounded-xl transition-all ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' 
                        : 'bg-gray-100 hover:bg-gray-200 text-indigo-600'
                    }`}>
                      <Github className="w-5 h-5" />
                    </button>
                    <button className={`p-3 rounded-xl transition-all ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' 
                        : 'bg-gray-100 hover:bg-gray-200 text-indigo-600'
                    }`}>
                      <Globe className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className={`rounded-3xl p-1 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all mb-1 ${
                      activeTab === tab.id
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : darkMode
                        ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className={`rounded-3xl shadow-xl p-8 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-xl font-black mb-6 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Personal Information
                </h3>
                
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
                        value={profile.personal.firstName}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      />
                    ) : (
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {profile.personal.firstName}
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
                        value={profile.personal.lastName}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      />
                    ) : (
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {profile.personal.lastName}
                      </p>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Email
                    </label>
                    <div className="flex items-center gap-3">
                      <Mail className={`w-5 h-5 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      {isEditing ? (
                        <input
                          type="email"
                          value={profile.personal.email}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                          }`}
                        />
                      ) : (
                        <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                          {profile.personal.email}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Phone
                    </label>
                    <div className="flex items-center gap-3">
                      <Phone className={`w-5 h-5 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profile.personal.phone}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                          }`}
                        />
                      ) : (
                        <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                          {profile.personal.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Location
                    </label>
                    <div className="flex items-center gap-3">
                      <MapPin className={`w-5 h-5 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      {isEditing ? (
                        <input
                          type="text"
                          value={profile.personal.location}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                          }`}
                        />
                      ) : (
                        <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                          {profile.personal.location}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={profile.personal.bio}
                        rows={4}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      />
                    ) : (
                      <p className={`leading-relaxed ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
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
              <div className={`rounded-3xl shadow-xl p-8 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-xl font-black mb-6 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Professional Information
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Job Title
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.professional.title}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      />
                    ) : (
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {profile.professional.title}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Department
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.professional.department}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      />
                    ) : (
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {profile.professional.department}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Employee ID
                    </label>
                    <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                      {profile.professional.employeeId}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Level
                    </label>
                    <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                      {profile.professional.level}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Skills & Technologies
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profile.professional.skills.map((skill, index) => (
                      <span
                        key={index}
                        className={`px-4 py-2 rounded-xl font-semibold border ${
                          darkMode
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                    {isEditing && (
                      <button className={`px-4 py-2 rounded-xl border-2 border-dashed ${
                        darkMode
                          ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                          : 'border-gray-300 text-gray-500 hover:border-indigo-500 hover:text-indigo-600'
                      } transition-all`}>
                        + Add Skill
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className={`rounded-3xl shadow-xl p-8 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-xl font-black mb-6 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Education
                </h3>
                
                <div className="space-y-6">
                  {profile.education.map((edu, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-2xl border-2 ${
                        darkMode ? 'border-gray-700' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
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
                        <div className={`px-3 py-1 rounded-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {edu.year}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          GPA: {edu.gpa}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {isEditing && (
                    <button className={`w-full p-6 rounded-2xl border-2 border-dashed ${
                      darkMode
                        ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                        : 'border-gray-300 text-gray-500 hover:border-indigo-500 hover:text-indigo-600'
                    } transition-all flex items-center justify-center gap-2`}>
                      <GraduationCap className="w-5 h-5" />
                      Add Education
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className={`rounded-3xl shadow-xl p-8 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-xl font-black mb-6 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Work Experience
                </h3>
                
                <div className="space-y-6">
                  {profile.experience.map((exp, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-2xl border-2 ${
                        darkMode ? 'border-gray-700' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className={`text-lg font-black mb-1 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {exp.title}
                          </h4>
                          <p className={`font-semibold mb-2 ${
                            darkMode ? 'text-blue-400' : 'text-indigo-600'
                          }`}>
                            {exp.company}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {exp.period}
                          </span>
                        </div>
                      </div>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {exp.description}
                      </p>
                    </div>
                  ))}
                  
                  {isEditing && (
                    <button className={`w-full p-6 rounded-2xl border-2 border-dashed ${
                      darkMode
                        ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                        : 'border-gray-300 text-gray-500 hover:border-indigo-500 hover:text-indigo-600'
                    } transition-all flex items-center justify-center gap-2`}>
                      <Briefcase className="w-5 h-5" />
                      Add Experience
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div> 
    </div> 
  );  
};

export default Profile;