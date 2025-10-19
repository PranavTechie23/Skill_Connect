import React, { useState, useEffect } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { Briefcase, Search, Plus, Edit, Trash2, MoreVertical, DollarSign, MapPin, Building2, Users, CheckCircle, XCircle, Clock, Filter, Pause, Play } from 'lucide-react';
import { adminService } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
interface Job {
  id: string;
  title: string;
  company: { name: string };
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  status: 'active' | 'pending' | 'paused' | 'closed';
  createdAt: string;
  applicationsCount: number;
}

export default function AdminJobs() {
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getJobs();
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      toast({ title: "Error", description: "Could not fetch job data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (jobId: string, status: 'active' | 'paused' | 'closed') => {
    try {
      await adminService.updateJob(jobId, { status });
      toast({ title: "Success", description: `Job status updated to ${status}.` });
      fetchJobs();
    } catch (error) {
      console.error("Failed to update job status:", error);
      toast({ title: "Error", description: "Could not update job status.", variant: "destructive" });
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', icon: CheckCircle },
      pending: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', icon: Clock },
      paused: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: Pause },
      closed: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400', icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-green-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="mr-4"><AdminBackButton /></div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-2xl shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Job Postings</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage all jobs on the platform</p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-800 transition-all shadow-lg">
              <Plus className="w-5 h-5" />
              Add Job
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
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
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-xs uppercase ${darkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-700 bg-gray-50'}`}>
                <tr>
                  <th scope="col" className="px-6 py-3">Job Title</th>
                  <th scope="col" className="px-6 py-3">Company</th>
                  <th scope="col" className="px-6 py-3">Location</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Applications</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const statusConfig = getStatusConfig(job.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={job.id} className={`border-b ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-600/50' : 'bg-white hover:bg-gray-50'}`}>
                      <th scope="row" className={`px-6 py-4 font-medium whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {job.title}
                      </th>
                      <td className="px-6 py-4">{job.company?.name || 'N/A'}</td>
                      <td className="px-6 py-4">{job.location}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{job.applicationsCount || 0}</td>
                      <td className="px-6 py-4 text-right">
                        {job.status === 'active' && <button onClick={() => handleUpdateStatus(job.id, 'paused')} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-blue-500/10 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}><Pause className="w-5 h-5" /></button>}
                        {job.status === 'paused' && <button onClick={() => handleUpdateStatus(job.id, 'active')} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-green-500/10 text-green-400' : 'hover:bg-green-50 text-green-600'}`}><Play className="w-5 h-5" /></button>}
                        <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><Edit className="w-5 h-5" /></button>
                        <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'}`}><Trash2 className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredJobs.length === 0 && (
            <div className="p-12 text-center">
              <Briefcase className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>No jobs found</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const { toast } = useToast();

const loadData = async () => {
  try {
    const jobs = await fetchJobs();
    setJobs(jobs);
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive'
    });
  }
};