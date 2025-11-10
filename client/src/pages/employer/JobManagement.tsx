import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from "@/components/theme-provider";
import AdminBackButton from '@/components/AdminBackButton';
import { jobsApi } from '@/lib/api';
import {
  Search,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Eye,
  MoreVertical,
  Edit,
  Pause,
  Play,
  Copy,
  Trash2,
  ArrowRight,
  Download,
  Plus,
  Grid2X2,
  List,
  TrendingUp,
  Briefcase,
  Filter,
  X,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  postedDate: string;
  applications: number;
  newApplications: number;
  status: 'active' | 'paused' | 'closed';
  views: number;
  conversion: number;
}

const JobManagement: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [sortOrder, setSortOrder] = useState('Newest First');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsApi.getJobs();
      setJobs(response.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Title', 'Department', 'Location', 'Type', 'Salary', 'Posted Date', 'Applications', 'Status', 'Views', 'Conversion'];
    const csvContent = [
      headers,
      ...jobs.map(job => [
        job.title,
        job.department,
        job.location,
        job.type,
        job.salary,
        job.postedDate,
        job.applications,
        job.status,
        job.views,
        `${job.conversion}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `job_postings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateJob = () => {
    navigate('/employer/jobs/create');
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await jobsApi.deleteJob(jobId);
        setJobs(jobs.filter(job => job.id !== jobId));
      } catch (error) {
        console.error('Failed to delete job:', error);
      }
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await jobsApi.updateJobStatus(jobId, newStatus as 'active' | 'paused');
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus as 'active' | 'paused' } : job
      ));
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const handleEditJob = (jobId: string) => {
    navigate(`/employer/jobs/${jobId}/edit`);
  };

  const handleDuplicateJob = async (jobId: string) => {
    const jobToDuplicate = jobs.find(job => job.id === jobId);
    if (!jobToDuplicate) return;

    try {
      const { id, ...jobData } = jobToDuplicate;
      const response = await jobsApi.createJob({
        ...jobData,
        title: `${jobData.title} (Copy)`,
        status: 'paused'
      });
      setJobs([...jobs, response]);
    } catch (error) {
      console.error('Failed to duplicate job:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
      paused: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      closed: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || job.status === statusFilter.toLowerCase();
    const matchesDepartment = departmentFilter === 'All Departments' || job.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  }).sort((a, b) => {
    if (sortOrder === 'Newest First') {
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    } else {
      return new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime();
    }
  });

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
    totalApplicants: jobs.reduce((acc, j) => acc + j.applications, 0),
    avgConversion: Math.round(jobs.reduce((acc, j) => acc + j.conversion, 0) / jobs.length || 0)
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50'}`}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4QjVDRjYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEzIDAgNiAyLjY4NiA2IDZzLTIuNjg3IDYtNiA2LTYtMi42ODYtNi02IDIuNjg3LTYgNi02ek0yNCAzOGMzLjMxMyAwIDYgMi42ODYgNiA2cy0yLjY4NyA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ny02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <AdminBackButton />
          <div className="flex items-center justify-between mt-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h1 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Job Management
                </h1>
              </div>
              <p className={`ml-16 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
                Create and manage your job postings
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm shadow-lg transition-all
                  ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'}`}
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateJob}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-sm flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Create Job
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={cardVariants} whileHover={{ y: -5 }}>
            <div className={`${darkMode ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' : 'bg-white/80 backdrop-blur-sm border-gray-200'} rounded-2xl border p-6 shadow-xl hover:shadow-2xl transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +12.5%
                </span>
              </div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Jobs</p>
              <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalJobs}</p>
            </div>
          </motion.div>

          <motion.div variants={cardVariants} whileHover={{ y: -5 }}>
            <div className={`${darkMode ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' : 'bg-white/80 backdrop-blur-sm border-gray-200'} rounded-2xl border p-6 shadow-xl hover:shadow-2xl transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +8.3%
                </span>
              </div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Active Jobs</p>
              <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeJobs}</p>
            </div>
          </motion.div>

          <motion.div variants={cardVariants} whileHover={{ y: -5 }}>
            <div className={`${darkMode ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' : 'bg-white/80 backdrop-blur-sm border-gray-200'} rounded-2xl border p-6 shadow-xl hover:shadow-2xl transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +15.2%
                </span>
              </div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Applicants</p>
              <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalApplicants}</p>
            </div>
          </motion.div>

          <motion.div variants={cardVariants} whileHover={{ y: -5 }}>
            <div className={`${darkMode ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' : 'bg-white/80 backdrop-blur-sm border-gray-200'} rounded-2xl border p-6 shadow-xl hover:shadow-2xl transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +2.1%
                </span>
              </div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Avg. Conversion</p>
              <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.avgConversion}%</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${darkMode ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' : 'bg-white/80 backdrop-blur-sm border-gray-200'} rounded-2xl border p-6 shadow-xl mb-6`}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className={`flex items-center px-4 py-3 rounded-xl border-2 transition-all ${darkMode ? 'bg-gray-900/50 border-gray-700 focus-within:border-purple-500' : 'bg-gray-50 border-gray-200 focus-within:border-purple-500'}`}>
                <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search jobs by title, department, or skills..."
                  className={`flex-1 px-3 py-1 bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-gray-700 rounded">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl border-2 font-semibold flex items-center gap-2 transition-all ${
                  showFilters 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent' 
                    : darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-300 hover:border-purple-500' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-500'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              <div className={`flex rounded-xl border-2 overflow-hidden ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <button
                  className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid2X2 className="w-5 h-5" />
                </button>
                <button
                  className={`p-3 transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
                  <div>
                    <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-all ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-300 focus:border-purple-500' : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-purple-500'}`}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option>All Status</option>
                      <option>Active</option>
                      <option>Paused</option>
                      <option>Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Department</label>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-all ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-300 focus:border-purple-500' : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-purple-500'}`}
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                    >
                      <option>All Departments</option>
                      <option>Engineering</option>
                      <option>Design</option>
                      <option>Marketing</option>
                      <option>Sales</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sort By</label>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-all ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-300 focus:border-purple-500' : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-purple-500'}`}
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option>Newest First</option>
                      <option>Oldest First</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Jobs Grid/List */}
        {loading ? (
          <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-lg font-semibold">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-20 ${darkMode ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-xl`}
          >
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <p className={`text-xl font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>No jobs found</p>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Try adjusting your filters or create a new job posting</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
          >
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                variants={cardVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`${darkMode ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' : 'bg-white/80 backdrop-blur-sm border-gray-200'} border-2 rounded-2xl p-6 hover:shadow-2xl transition-all group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all`}>
                        {job.title}
                      </h3>
                    </div>
                    <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(job.status)} shadow-lg`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="relative group/menu">
                    <button className={`p-2.5 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl transition-all`}>
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <div className={`absolute right-0 mt-2 w-52 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl border-2 py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20`}>
                      <button 
                        onClick={() => handleEditJob(job.id)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 font-semibold ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-50 text-gray-700'} transition-all`}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Job
                      </button>
                      <button 
                        onClick={() => handleToggleJobStatus(job.id, job.status)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 font-semibold ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-50 text-gray-700'} transition-all`}
                      >
                        {job.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {job.status === 'active' ? 'Pause' : 'Resume'} Job
                      </button>
                      <button 
                        onClick={() => handleDuplicateJob(job.id)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 font-semibold ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-50 text-gray-700'} transition-all`}
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <div className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'} my-2`}></div>
                      <button 
                        onClick={() => handleDeleteJob(job.id)}
                                             className={`w-full px-4 py-3 text-left flex items-center gap-3 font-semibold text-red-500 hover:bg-red-500/10 transition-all`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Job
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <MapPin className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{job.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <DollarSign className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{job.salary}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Calendar className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{job.postedDate}</span>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} mb-6`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`text-sm font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Applications</span>
                    </div>
                    <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{job.applications}</p>
                    {job.newApplications > 0 && (
                      <span className="inline-block px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full mt-1">
                        +{job.newApplications} new
                      </span>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={`text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Views</span>
                    </div>
                    <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{job.views}</p>
                    <span className={`text-xs font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{job.conversion}% conversion</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{job.department} • {job.type}</span>
                  <button 
                    onClick={() => navigate(`/employer/jobs/${job.id}/applications`)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all group/btn ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    View Applicants
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedJobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-2xl shadow-2xl p-4 z-50`}
            >
              <div className="flex items-center gap-6">
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      selectedJobs.forEach(jobId => {
                        const job = jobs.find(j => j.id === jobId);
                        if (job) handleToggleJobStatus(jobId, job.status);
                      });
                      setSelectedJobs([]);
                    }}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                      darkMode 
                        ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    <Pause className="w-4 h-4" />
                    Toggle Status
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedJobs.length} job${selectedJobs.length !== 1 ? 's' : ''}?`)) {
                        selectedJobs.forEach(jobId => handleDeleteJob(jobId));
                        setSelectedJobs([]);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                      darkMode 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button 
                    onClick={() => setSelectedJobs([])}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JobManagement;