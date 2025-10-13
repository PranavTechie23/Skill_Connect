import React, { useState, useEffect } from 'react';
import {
  Heart, MapPin, Briefcase, Clock, DollarSign, Building2,
  ExternalLink, Trash2, Filter, Search, TrendingUp,
  Bookmark, BookmarkCheck, Moon, Sun, Users, Eye
} from 'lucide-react';

// Define the Job interface
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  postedTime: string;
  applicants: number;
  matchPercentage: number;
  skills: string[];
  isNew: boolean;
  isFeatured?: boolean;
  isRemote?: boolean;
}

// localStorage utility functions
const savedJobsUtils = {
  getSavedJobs: (): Job[] => {
    try {
      const saved = localStorage.getItem('savedJobs');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      return [];
    }
  },

  saveJob: (job: Job): void => {
    try {
      const savedJobs = savedJobsUtils.getSavedJobs();
      
      if (!savedJobs.find((savedJob: Job) => savedJob.id === job.id)) {
        savedJobs.push(job);
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
        window.dispatchEvent(new Event('savedJobsUpdated'));
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  },

  removeSavedJob: (jobId: string): void => {
    try {
      const savedJobs = savedJobsUtils.getSavedJobs();
      const updatedJobs = savedJobs.filter((job: Job) => job.id !== jobId);
      
      localStorage.setItem('savedJobs', JSON.stringify(updatedJobs));
      window.dispatchEvent(new Event('savedJobsUpdated'));
    } catch (error) {
      console.error('Error removing saved job:', error);
    }
  },

  isJobSaved: (jobId: string): boolean => {
    try {
      const savedJobs = savedJobsUtils.getSavedJobs();
      return savedJobs.some((job: Job) => job.id === jobId);
    } catch (error) {
      console.error('Error checking saved job:', error);
      return false;
    }
  }
};

const SavedJobs: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load saved jobs from localStorage on component mount
  useEffect(() => {
    const loadSavedJobs = () => {
      try {
        const saved = savedJobsUtils.getSavedJobs();
        setSavedJobs(saved);
      } catch (error) {
        console.error('Error loading saved jobs:', error);
      }
    };

    loadSavedJobs();

    // Listen for storage events to sync across tabs
    const handleStorageChange = () => {
      loadSavedJobs();
    };

    window.addEventListener('savedJobsUpdated', handleStorageChange);
    return () => window.removeEventListener('savedJobsUpdated', handleStorageChange);
  }, []);

  // Remove job from saved list
  const removeSavedJob = (jobId: string) => {
    savedJobsUtils.removeSavedJob(jobId);
    // The useEffect will automatically update the state due to the event listener
  };

  // Clear all saved jobs
  const clearAllSavedJobs = () => {
    setSavedJobs([]);
    localStorage.setItem('savedJobs', JSON.stringify([]));
    window.dispatchEvent(new Event('savedJobsUpdated'));
  };

  // Filter jobs based on search and type
  const filteredJobs = savedJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || job.type.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  // Group jobs by company for organized view
  const jobsByCompany = filteredJobs.reduce((acc, job) => {
    if (!acc[job.company]) {
      acc[job.company] = [];
    }
    acc[job.company].push(job);
    return acc;
  }, {} as Record<string, Job[]>);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
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
                Saved Jobs
              </h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Your curated list of job opportunities
              </p>
            </div>
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
            
            {savedJobs.length > 0 && (
              <button
                onClick={clearAllSavedJobs}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  darkMode
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    : 'bg-red-50 hover:bg-red-100 text-red-600'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`rounded-2xl p-5 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <BookmarkCheck className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <TrendingUp className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Saved
            </p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {savedJobs.length}
            </p>
          </div>

          <div className={`rounded-2xl p-5 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-green-500/20' : 'bg-green-100'
              }`}>
                <Building2 className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <Users className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Companies
            </p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {Object.keys(jobsByCompany).length}
            </p>
          </div>

          <div className={`rounded-2xl p-5 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
              }`}>
                <Eye className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <Clock className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Recently Added
            </p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {savedJobs.filter(job => job.postedTime.includes('hour') || job.postedTime.includes('day')).length}
            </p>
          </div>

          <div className={`rounded-2xl p-5 ${
            darkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          } shadow-lg text-white`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Heart className="w-5 h-5" />
              </div>
              <Bookmark className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white/90">Match Rate</p>
            <p className="text-3xl font-black">
              {savedJobs.length > 0 
                ? Math.round(savedJobs.reduce((acc, job) => acc + job.matchPercentage, 0) / savedJobs.length)
                : 0}%
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`rounded-2xl p-6 mb-8 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search saved jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all font-medium ${
                  darkMode
                    ? 'bg-gray-700 border-2 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                }`}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex gap-3">
              {['all', 'full-time', 'remote', 'contract'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedType === type
                      ? darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-indigo-600 text-white'
                      : darkMode
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Saved Jobs Content */}
        {savedJobs.length === 0 ? (
          /* Empty State */
          <div className={`rounded-3xl shadow-xl p-12 text-center ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Bookmark className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-2xl font-black mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              No Saved Jobs Yet
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Start browsing jobs and click the heart icon to save them for later
            </p>
            <button
              onClick={() => window.location.href = '/browse-jobs'}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
              }`}
            >
              Browse Jobs
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          /* No Results State */
          <div className={`rounded-3xl shadow-xl p-12 text-center ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Search className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-2xl font-black mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              No Jobs Found
            </h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          /* Jobs List */
          <div className="space-y-6">
            {Object.entries(jobsByCompany).map(([company, companyJobs]) => (
              <div key={company} className={`rounded-3xl overflow-hidden ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                {/* Company Header */}
                <div className={`p-6 border-b ${
                  darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                        darkMode ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      }`}>
                        {company.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className={`text-lg font-black ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {company}
                        </h3>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {companyJobs.length} saved job{companyJobs.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        companyJobs.forEach(job => removeSavedJob(job.id));
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        darkMode
                          ? 'hover:bg-red-500/20 text-red-400'
                          : 'hover:bg-red-50 text-red-600'
                      }`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Company Jobs */}
                <div className="p-6 space-y-4">
                  {companyJobs.map(job => (
                    <div
                      key={job.id}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        darkMode
                          ? 'border-gray-700 hover:border-blue-500'
                          : 'border-gray-100 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <h4 className={`text-lg font-black ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {job.title}
                            </h4>
                            {job.isNew && (
                              <span className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                                NEW
                              </span>
                            )}
                          </div>
                          
                          <div className={`flex items-center gap-4 text-sm mb-3 ${
                            darkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4" />
                              {job.type}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {job.postedTime}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {job.skills.map(skill => (
                              <span key={skill} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                                darkMode
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200'
                              }`}>
                                {skill}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className={`text-lg font-bold ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {job.salary}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {job.applicants} applicants
                              </span>
                              <div className={`w-16 h-16 relative ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                <svg className="w-16 h-16 transform -rotate-90">
                                  <circle
                                    cx="32" cy="32" r="28"
                                    stroke={darkMode ? '#374151' : '#e5e7eb'}
                                    strokeWidth="4" fill="none"
                                  />
                                  <circle
                                    cx="32" cy="32" r="28"
                                    stroke={darkMode ? '#3b82f6' : 'url(#gradient)'}
                                    strokeWidth="4" fill="none"
                                    strokeDasharray={`${job.matchPercentage * 1.76} 176`}
                                    strokeLinecap="round"
                                  />
                                  <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#6366f1" />
                                      <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold">
                                    {job.matchPercentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => removeSavedJob(job.id)}
                            className={`p-3 border-2 rounded-xl transition-all ${
                              darkMode
                                ? 'border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <Heart className="w-5 h-5 fill-current" />
                          </button>
                          <button className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                            darkMode
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                          }`}>
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;