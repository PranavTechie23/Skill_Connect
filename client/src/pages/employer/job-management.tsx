import { useState } from 'react';
import { useTheme } from "@/components/theme-provider";
import AdminBackButton from "@/components/AdminBackButton";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Pause, 
  Play,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ChevronDown,
  MoreHorizontal,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary: string;
  experience: string;
  description: string;
  requirements: string[];
  status: 'active' | 'paused' | 'draft' | 'closed';
  applicants: number;
  newApplicants: number;
  postedDate: string;
  expiryDate: string;
}

export default function JobManagement() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  const [jobs, setJobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'full-time',
      salary: '$120,000 - $150,000',
      experience: '5+ years',
      description: 'We are looking for an experienced Frontend Developer to join our growing team. You will be responsible for building responsive web applications using modern technologies.',
      requirements: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', '5+ years experience'],
      status: 'active',
      applicants: 24,
      newApplicants: 5,
      postedDate: '2024-01-15',
      expiryDate: '2024-02-15'
    },
    {
      id: '2',
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote',
      type: 'full-time',
      salary: '$100,000 - $130,000',
      experience: '3+ years',
      description: 'Lead product development initiatives and work with cross-functional teams to deliver amazing user experiences.',
      requirements: ['Product Management', 'Agile', 'User Research', 'Data Analysis'],
      status: 'active',
      applicants: 18,
      newApplicants: 3,
      postedDate: '2024-01-10',
      expiryDate: '2024-02-10'
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'New York, NY',
      type: 'full-time',
      salary: '$110,000 - $140,000',
      experience: '4+ years',
      description: 'Manage cloud infrastructure and implement CI/CD pipelines for our development teams.',
      requirements: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
      status: 'paused',
      applicants: 12,
      newApplicants: 0,
      postedDate: '2024-01-05',
      expiryDate: '2024-02-05'
    },
    {
      id: '4',
      title: 'UX Designer',
      department: 'Design',
      location: 'Austin, TX',
      type: 'full-time',
      salary: '$90,000 - $120,000',
      experience: '3+ years',
      description: 'Create beautiful and intuitive user experiences for our web and mobile applications.',
      requirements: ['Figma', 'User Research', 'Prototyping', 'UI/UX Design'],
      status: 'draft',
      applicants: 0,
      newApplicants: 0,
      postedDate: '2024-01-18',
      expiryDate: '2024-02-18'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const toggleJobStatus = (jobId: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        const newStatus = job.status === 'active' ? 'paused' : 'active';
        return { ...job, status: newStatus };
      }
      return job;
    }));
  };

  const deleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    setShowDeleteModal(null);
  };

  const getStatusColor = (status: Job['status']) => {
    const colors = {
      active: 'bg-green-500',
      paused: 'bg-yellow-500',
      draft: 'bg-blue-500',
      closed: 'bg-red-500'
    };
    return colors[status];
  };

  const getStatusText = (status: Job['status']) => {
    const texts = {
      active: 'Active',
      paused: 'Paused',
      draft: 'Draft',
      closed: 'Closed'
    };
    return texts[status];
  };

  const stats = {
    total: jobs.length,
    active: jobs.filter(job => job.status === 'active').length,
    paused: jobs.filter(job => job.status === 'paused').length,
    draft: jobs.filter(job => job.status === 'draft').length,
    totalApplicants: jobs.reduce((sum, job) => sum + job.applicants, 0),
    newApplicants: jobs.reduce((sum, job) => sum + job.newApplicants, 0)
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Back Button */}
        <div className="mb-6">
          <AdminBackButton />
        </div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Job Management</h1>
            <p className="text-gray-400 mt-2">Create and manage your job postings</p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300">
            <Plus className="w-5 h-5" />
            <span>Create Job</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Jobs</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Jobs</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Paused Jobs</p>
                <p className="text-2xl font-bold text-white">{stats.paused}</p>
              </div>
              <Pause className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Applicants</p>
                <p className="text-2xl font-bold text-white">{stats.totalApplicants}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">New Applicants</p>
                <p className="text-2xl font-bold text-white">{stats.newApplicants}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg shadow-lg p-6 backdrop-blur-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs by title or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>

              {/* View Toggle */}
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md transition-colors duration-300 ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-md transition-colors duration-300 ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-6'}>
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-gray-800/80 border border-gray-700/50 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
                    <p className="text-blue-400 text-sm">{job.department}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)} text-white`}>
                      {getStatusText(job.status)}
                    </span>
                    <button className="text-gray-400 hover:text-white transition-colors duration-300">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span className="capitalize">{job.type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>{job.applicants} applicants</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6">
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{job.description}</p>
                
                {/* Requirements */}
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Requirements:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.slice(0, 3).map((req, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                      >
                        {req}
                      </span>
                    ))}
                    {job.requirements.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        +{job.requirements.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                    </div>
                    {job.newApplicants > 0 && (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                        {job.newApplicants} new
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors duration-300">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-400 transition-colors duration-300">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleJobStatus(job.id)}
                      className="p-2 text-gray-400 hover:text-yellow-400 transition-colors duration-300"
                    >
                      {job.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(job.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No jobs found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300">
              Create Your First Job
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Delete Job</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this job posting? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteJob(showDeleteModal)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}