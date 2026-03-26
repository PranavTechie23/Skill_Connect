import React, { useState, useEffect } from 'react';
import { useSavedJobs } from '../../contexts/SavedJobsContext';
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Search, MapPin, Briefcase, Heart, TrendingUp, Filter, 
  ChevronDown, Star, ArrowRight, Zap, Target, Award, 
  Sparkles, Crown, X
} from 'lucide-react';

interface ApiJobResponse {
  id: number;
  title: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  skills: string[];
  createdAt: string;
  company?: {
    name: string;
  };
}

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



import { QuickApplyModal } from '../../components/quick-apply-modal';

const BrowseJobs: React.FC = () => {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(true); // Set to true to show filters by default
  const [salaryRange, setSalaryRange] = useState([150, 300]); // Adjusted for k range
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobCount, setTotalJobCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { savedJobs, addJob, removeJob, isJobSaved } = useSavedJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showQuickApply, setShowQuickApply] = useState(false);

  const toggleSaveJob = (job: Job) => {
    if (isJobSaved(job.id)) {
      removeJob(job.id);
    } else {
      addJob(job);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

useEffect(() => {
  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Add job type and search filters to query params
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        itemsPerPage: itemsPerPage.toString(),
        jobType: selectedType !== 'all' ? selectedType : '',
        search: searchQuery || '',
        minSalary: salaryRange[0].toString(),
        maxSalary: salaryRange[1].toString()
      });
      
      const response = await fetch(`/api/jobs?${queryParams}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received jobs data:', data); // Log the received data
      if (!data || !data.jobs) {
        throw new Error('Invalid jobs data received from server');
      }
      // Set the total count from the API response
      setTotalJobCount(data.totalCount || 0);
      
      setJobs(data.jobs.map((job: ApiJobResponse) => ({
        id: job.id,
        title: job.title,
        company: job.company?.name || 'Unknown Company',
        location: job.location || 'Remote',
        type: job.jobType,
        salary: job.salaryMin && job.salaryMax ? `$${job.salaryMin/1000}k - $${job.salaryMax/1000}k` : 'Competitive',
        postedTime: new Date(job.createdAt).toLocaleDateString(),
        applicants: 0, // You can add this to the API response if needed
        matchPercentage: 85, // This should be calculated on the server
        skills: Array.isArray(job.skills) ? job.skills : [],
        isNew: new Date(job.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isFeatured: false, // You can add this to the API response if needed
        isRemote: job.jobType?.toLowerCase() === 'remote'
      })));
    } catch (err) {
      console.error('Error fetching jobs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch jobs';
      console.log('Setting error state with message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  fetchJobs();
}, [currentPage, itemsPerPage, selectedType, searchQuery, salaryRange]);

const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || job.type.toLowerCase() === selectedType.toLowerCase();
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.every(skill => job.skills.includes(skill));
    
    const jobSalary = parseInt(job.salary.split('k')[0].replace('$', ''));
    const matchesSalary = jobSalary >= salaryRange[0] && jobSalary <= salaryRange[1];
    
    return matchesSearch && matchesType && matchesSkills && matchesSalary;
  });

  const allSkills = Array.from(new Set(jobs.flatMap(job => job.skills)));

  return (
    <div className={`min-h-screen w-screen fixed inset-0 transition-colors duration-300 overflow-y-auto ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 backdrop-blur-lg ${
        darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'
      } border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
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
                  {t("employee.browseJobs.title")}
                </h1>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {t("employee.browseJobs.subhead")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">

            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search jobs, companies, or keywords..."
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
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <button className={`px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-2 ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            } text-white shadow-lg`}>
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {['all', 'remote', 'full-time', 'contract'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          {showFilters && (
            <div className={`w-80 flex-shrink-0 rounded-2xl p-6 h-fit sticky top-24 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Filters
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className={`p-1 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Salary Range */}
              <div className="mb-6">
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Salary Range
                </h4>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="150"
                    max="300"
                    step="50"
                    value={salaryRange[1]}
                    onChange={(e) => setSalaryRange([salaryRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      ${salaryRange[0]}k
                    </span>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      ${salaryRange[1]}k
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Skills
                </h4>
                <div className="space-y-2">
                  {allSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                        selectedSkills.includes(skill)
                          ? darkMode
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                          : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSalaryRange([80, 160]);
                  setSelectedSkills([]);
                }}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className={`rounded-2xl p-5 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <Briefcase className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <Sparkles className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Available Jobs
                </p>
                <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalJobCount}
                </p>
              </div>

              <div className={`rounded-2xl p-5 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                    <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <Target className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  New Today
                </p>
                <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {filteredJobs.filter(j => j.isNew).length}
                </p>
              </div>

              <div className={`rounded-2xl p-5 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <Heart className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <Award className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Saved Jobs
                </p>
                <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {savedJobs.length}
                </p>
              </div>

              <div className={`rounded-2xl p-5 ${
                darkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              } shadow-lg text-white`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Star className="w-5 h-5" />
                  </div>
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-white/90">Match Rate</p>
                <p className="text-3xl font-black">85%</p>
              </div>
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`group rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border-2 overflow-hidden ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                      : 'bg-white border-gray-100 hover:border-indigo-300'
                  } ${job.isFeatured ? 'ring-2 ring-yellow-500/50' : ''}`}
                >
                  {job.isFeatured && (
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-4 py-2 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-bold">Featured Job</span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                          darkMode ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        }`}>
                          {job.company.substring(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className={`text-lg font-black transition-colors ${
                              darkMode ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-indigo-600'
                            }`}>
                              {job.title}
                            </h3>
                            {job.isNew && (
                              <span className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className={`font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {job.company}
                          </p>
                          <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4" />
                              {job.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="relative">
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
                              className="transition-all duration-1000"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a855f7" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {job.matchPercentage}%
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Match
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-4">
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

                    {/* Footer */}
                    <div className={`flex items-center justify-between pt-4 border-t ${
                      darkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <div className="flex flex-col gap-1">
                        <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {job.salary}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {job.applicants} applicants • {job.postedTime}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleSaveJob(job)}
                          className={`p-2.5 border-2 rounded-lg transition-all ${
                            isJobSaved(job.id)
                              ? darkMode
                                ? 'border-red-500 bg-red-500/20 text-red-400'
                                : 'border-red-500 bg-red-50 text-red-600'
                              : darkMode
                              ? 'border-gray-600 hover:border-red-500 hover:bg-red-500/10 text-gray-400 hover:text-red-400'
                              : 'border-gray-200 hover:border-red-500 hover:bg-red-50 text-gray-400 hover:text-red-600'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedJob(job);
                            setShowQuickApply(true);
                          }}
                          className={`px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg flex items-center gap-2 group/btn transition-all ${
                            darkMode
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/30'
                          }`}>
                          Quick Apply
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Apply Modal */}
            {selectedJob && (
              <QuickApplyModal
                isOpen={showQuickApply}
                onClose={() => {
                  setShowQuickApply(false);
                  setSelectedJob(null);
                }}
                jobId={selectedJob.id}
                jobTitle={selectedJob.title}
                companyName={selectedJob.company}
                matchPercentage={selectedJob.matchPercentage}
              />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalJobCount / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(totalJobCount / itemsPerPage)}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    currentPage >= Math.ceil(totalJobCount / itemsPerPage)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, Math.ceil(totalJobCount / itemsPerPage)))].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg font-semibold ${
                        currentPage === i + 1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {Math.ceil(totalJobCount / itemsPerPage) > 5 && (
                    <span className="text-gray-600">...</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(totalJobCount / itemsPerPage)} • {totalJobCount} total opportunities
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className={`rounded-3xl shadow-xl p-12 text-center ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Loading Jobs...
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Please wait while we fetch available positions
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className={`rounded-3xl shadow-xl p-12 text-center ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  darkMode ? 'bg-red-500/20' : 'bg-red-100'
                }`}>
                  <X className={`w-12 h-12 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
                </div>
                <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Error Loading Jobs
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className={`mt-4 px-6 py-2 rounded-lg font-semibold ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white`}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredJobs.length === 0 && (
              <div className={`rounded-3xl shadow-xl p-12 text-center ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Briefcase className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  No Jobs Found
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseJobs;