import React, { useState } from 'react';
import {
  Search, MapPin, Briefcase, DollarSign, Clock, Bookmark, Heart,
  TrendingUp, Filter, ChevronDown, Star, Building2, Calendar,
  ExternalLink, ArrowRight, Zap, Target, Award, Moon, Sun,
  Users, Eye, CheckCircle, Sparkles, Crown
} from 'lucide-react';

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
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $150k',
    postedTime: '2 days ago',
    applicants: 45,
    matchPercentage: 95,
    skills: ['React', 'TypeScript', 'TailwindCSS', 'Node.js'],
    isNew: true,
    isFeatured: true
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    type: 'Remote',
    salary: '$100k - $130k',
    postedTime: '1 week ago',
    applicants: 67,
    matchPercentage: 88,
    skills: ['React', 'Python', 'PostgreSQL', 'AWS'],
    isNew: false
  },
  {
    id: '3',
    title: 'UI/UX Developer',
    company: 'DesignStudio',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$90k - $110k',
    postedTime: '3 days ago',
    applicants: 32,
    matchPercentage: 76,
    skills: ['React', 'Figma', 'CSS', 'JavaScript'],
    isNew: true
  },
  {
    id: '4',
    title: 'React Native Developer',
    company: 'MobileFirst',
    location: 'Austin, TX',
    type: 'Contract',
    salary: '$95k - $120k',
    postedTime: '5 days ago',
    applicants: 28,
    matchPercentage: 82,
    skills: ['React Native', 'TypeScript', 'Firebase'],
    isNew: false
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'CloudTech',
    location: 'Seattle, WA',
    type: 'Full-time',
    salary: '$130k - $160k',
    postedTime: '1 day ago',
    applicants: 52,
    matchPercentage: 91,
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    isNew: true,
    isFeatured: true
  },
  {
    id: '6',
    title: 'Backend Developer',
    company: 'DataFlow',
    location: 'Remote',
    type: 'Remote',
    salary: '$110k - $140k',
    postedTime: '4 days ago',
    applicants: 41,
    matchPercentage: 84,
    skills: ['Node.js', 'Python', 'MongoDB', 'Redis'],
    isNew: false
  }
];

const BrowseJobs: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || job.type.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 backdrop-blur-lg ${
        darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'
      } border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-3xl font-black ${
                darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                Browse Jobs
              </h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Discover opportunities that match your skills
              </p>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl transition-all ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
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

            <button className={`px-6 py-4 rounded-xl font-bold transition-all ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            } text-white shadow-lg`}>
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-xl ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
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
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
              {filteredJobs.length}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
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
                      onClick={() => toggleSaveJob(job.id)}
                      className={`p-2.5 border-2 rounded-lg transition-all ${
                        savedJobs.includes(job.id)
                          ? darkMode
                            ? 'border-red-500 bg-red-500/20 text-red-400'
                            : 'border-red-500 bg-red-50 text-red-600'
                          : darkMode
                          ? 'border-gray-600 hover:border-red-500 hover:bg-red-500/10 text-gray-400 hover:text-red-400'
                          : 'border-gray-200 hover:border-red-500 hover:bg-red-50 text-gray-400 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button className={`px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg flex items-center gap-2 group/btn transition-all ${
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

        {/* Empty State */}
        {filteredJobs.length === 0 && (
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
  );
};

export default BrowseJobs;