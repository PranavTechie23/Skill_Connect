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
  List
} from 'lucide-react';

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
    // Create CSV content
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
    ].map(row => row.join(',')).join('\\n');

    // Create blob and download
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
      active: darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      paused: darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
      closed: darkMode ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-50 text-gray-700 border-gray-200'
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <AdminBackButton />
          <h1 className={`text-2xl font-bold mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Job Management
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create and manage your job postings
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm
              ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleCreateJob}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Job
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Jobs</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalJobs}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">↑ 12.5% from last month</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Jobs</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.activeJobs}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">↑ 8.3% from last month</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Applicants</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalApplicants}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">↑ 15.2% from last month</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg. Conversion</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.avgConversion}%</p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">↑ 2.1% from last month</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className={`flex items-center px-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search jobs by title, department, or skills..."
              className={`flex-1 px-3 py-2 bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <select
            className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Paused</option>
            <option>Closed</option>
          </select>

          <select
            className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Design</option>
            <option>Marketing</option>
            <option>Sales</option>
          </select>

          <select
            className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option>Newest First</option>
            <option>Oldest First</option>
          </select>

          <div className={`flex rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <button
              className={`p-2 ${viewMode === 'grid' ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''} rounded-l-lg`}
              onClick={() => setViewMode('grid')}
            >
              <Grid2X2 className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            </button>
            <button
              className={`p-2 ${viewMode === 'list' ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''} rounded-r-lg`}
              onClick={() => setViewMode('list')}
            >
              <List className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Grid/List */}
      {loading ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading jobs...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No jobs found matching your filters.
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 hover:shadow-lg transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {job.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {job.postedDate}
                    </span>
                  </div>
                </div>
                
                <div className="relative group">
                  <button className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}>
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-xl shadow-xl border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10`}>
                    <button 
                      onClick={() => handleEditJob(job.id)}
                      className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Job
                    </button>
                    <button 
                      onClick={() => handleToggleJobStatus(job.id, job.status)}
                      className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      {job.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {job.status === 'active' ? 'Pause' : 'Resume'} Job
                    </button>
                    <button 
                      onClick={() => handleDuplicateJob(job.id)}
                      className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <div className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-100'} my-2`}></div>
                    <button 
                      onClick={() => handleDeleteJob(job.id)}
                      className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm ${darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Job
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Users className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="font-semibold">{job.applications}</span> applications
                    </span>
                  </div>
                  {job.newApplications > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {job.newApplications} new
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {job.views} views
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/employer/jobs/${job.id}/applications`)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-sm flex items-center gap-2"
                >
                  View Applications
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobManagement;