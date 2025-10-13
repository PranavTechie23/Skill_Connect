import React, { useState } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { Briefcase, Search, Plus, Edit, Trash2, MoreVertical, MapPin, Calendar, DollarSign, Users, Clock, Eye, Building2, TrendingUp, Filter, CheckCircle, XCircle, PauseCircle } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function JobPostings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const stats = [
    { label: 'Total Jobs', value: '428', change: '↑ 15 posted today', icon: Briefcase, color: 'bg-orange-500', bgLight: 'bg-orange-50' },
    { label: 'Active Postings', value: '312', change: '73% active rate', icon: CheckCircle, color: 'bg-green-500', bgLight: 'bg-green-50' },
    { label: 'Total Applications', value: '3,247', change: '↑ 89 today', icon: Users, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
    { label: 'Avg. Applications', value: '7.6', change: 'Per job posting', icon: TrendingUp, color: 'bg-purple-500', bgLight: 'bg-purple-50' }
  ];

  const jobs = [
    {
      id: 1,
      title: 'Senior Frontend Engineer',
      company: 'Admin Posted',
      logo: 'AP',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$120k - $160k',
      postedDate: '2024-09-01',
      expiryDate: '2024-12-01',
      status: 'Active',
      applications: 42,
      views: 324,
      postedBy: 'Admin Team',
      featured: true,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'Admin Posted',
      logo: 'AP',
      location: 'Remote',
      type: 'Full-time',
      salary: '$130k - $170k',
      postedDate: '2024-08-25',
      expiryDate: '2024-11-25',
      status: 'Active',
      applications: 18,
      views: 156,
      postedBy: 'Admin Team',
      featured: false,
      color: 'bg-purple-500'
    },
    {
      id: 3,
      title: 'Backend Engineer',
      company: 'Admin Posted',
      logo: 'AP',
      location: 'Los Angeles, CA',
      type: 'Full-time',
      salary: '$110k - $150k',
      postedDate: '2024-08-20',
      expiryDate: '2024-11-20',
      status: 'Active',
      applications: 27,
      views: 243,
      postedBy: 'Admin Team',
      featured: true,
      color: 'bg-indigo-500'
    },
    {
      id: 4,
      title: 'UX Designer',
      company: 'Admin Posted',
      logo: 'AP',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$90k - $120k',
      postedDate: '2024-09-05',
      expiryDate: '2024-12-05',
      status: 'Active',
      applications: 35,
      views: 287,
      postedBy: 'Admin Team',
      featured: false,
      color: 'bg-pink-500'
    },
    {
      id: 5,
      title: 'Data Scientist',
      company: 'Admin Posted',
      logo: 'AP',
      location: 'Austin, TX',
      type: 'Full-time',
      salary: '$140k - $180k',
      postedDate: '2024-08-15',
      expiryDate: '2024-11-15',
      status: 'Expired',
      applications: 12,
      views: 98,
      postedBy: 'Admin Team',
      featured: false,
      color: 'bg-teal-500'
    },
    {
      id: 6,
      title: 'DevOps Engineer',
      company: 'Admin Posted',
      logo: 'AP',
      location: 'Seattle, WA',
      type: 'Full-time',
      salary: '$125k - $165k',
      postedDate: '2024-09-03',
      expiryDate: '2024-12-03',
      status: 'Active',
      applications: 29,
      views: 201,
      postedBy: 'Admin Team',
      featured: true,
      color: 'bg-blue-500'
    },
    {
      id: 7,
      title: 'Marketing Manager',
      company: 'Admin Posted',
      logo: 'AP',
      location: 'Remote',
      type: 'Part-time',
      salary: '$80k - $100k',
      postedDate: '2024-08-28',
      expiryDate: '2024-11-28',
      status: 'Active',
      applications: 23,
      views: 189,
      postedBy: 'Admin Team',
      featured: false,
      color: 'bg-purple-500'
    },
    {
      id: 8,
      title: 'Mobile Developer',
      company: 'Admin Posted',
      logo: 'AP',
      location: 'Chicago, IL',
      type: 'Contract',
      salary: '$100k - $130k',
      postedDate: '2024-08-10',
      expiryDate: '2024-11-10',
      status: 'Paused',
      applications: 8,
      views: 67,
      postedBy: 'Admin Team',
      featured: false,
      color: 'bg-indigo-500'
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All Status' || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="mr-4"><AdminBackButton /></div>
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-4 rounded-2xl shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin Job Postings</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Create and manage jobs posted by admin team</p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg shadow-orange-900/20">
              <Plus className="w-5 h-5" />
              Post New Job
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`${darkMode ? stat.color + '/20' : stat.bgLight} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className={`w-2 h-2 rounded-full ${stat.color} animate-pulse`}></div>
              </div>
              <div>
                <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>{stat.label}</h3>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stat.value}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
          {/* Search and Filter Bar */}
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Expired</option>
                </select>
                <button className={`px-4 py-3 rounded-lg transition-colors ${
                  darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-400' : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                }`}>
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Job Cards */}
          <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {filteredJobs.map((job) => (
              <div key={job.id} className={`p-6 ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`${job.color} w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}>
                      {job.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{job.title}</h3>
                          <div className={`flex items-center gap-3 text-sm mb-3 flex-wrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {job.postedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {job.type}
                            </span>
                            {job.featured && (
                              <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'
                              }`}>
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Job Details Grid */}
                      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg p-4 mb-4 ${
                        darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                      }`}>
                        <div>
                          <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Salary Range</p>
                          <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{job.salary}</p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Applications</p>
                          <p className="font-bold text-sm text-blue-500">{job.applications} applied</p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Views</p>
                          <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{job.views} views</p>
                        </div>
                        <div>
                          <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Posted Date</p>
                          <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{job.postedDate}</p>
                        </div>
                      </div>

                      {/* Expiry Info */}
                      <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Clock className="w-4 h-4" />
                        <span>Expires on {job.expiryDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      darkMode ? (
                        job.status === 'Active' ? 'bg-green-900/30 text-green-400' :
                        job.status === 'Paused' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-gray-800 text-gray-300'
                      ) : (
                        job.status === 'Active' ? 'bg-green-100 text-green-700' :
                        job.status === 'Paused' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      )
                    }`}>
                      {job.status === 'Active' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                      {job.status === 'Paused' && <PauseCircle className="w-4 h-4 inline mr-1" />}
                      {job.status === 'Expired' && <XCircle className="w-4 h-4 inline mr-1" />}
                      {job.status}
                    </span>
                    <div className="flex gap-2">
                      <button className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                      }`}>
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                      }`}>
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
                      }`}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                      }`}>
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="p-12 text-center">
              <Briefcase className={`w-16 h-16 ${darkMode ? 'text-gray-700' : 'text-gray-300'} mx-auto mb-4`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No job postings found</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}