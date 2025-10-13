import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Building,
  Eye,
  Search,
  Filter,
  ChevronDown,
  TrendingUp,
  BarChart3,
  Users,
  Briefcase,
  Moon,
  Sun,
  ArrowLeft,
  MoreHorizontal,
  Download,
  ExternalLink
} from "lucide-react";
import { useState } from "react";

interface Application {
  id: string;
  jobId: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'interview';
  appliedAt: string;
  updatedAt: string;
  job: {
    title: string;
    company: {
      name: string;
    };
    location: string;
    jobType: string;
    salary: string;
  };
  interviewDate?: string;
}

export default function Applications() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const { 
    data: applications = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<Application[]>({
    queryKey: ['applications', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.error('No user ID available');
        throw new Error('User ID is required');
      }

      console.log('Fetching applications for user:', user.id);
      const response = await fetch(`/api/applications?applicantId=${user.id}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        const errorText = contentType?.includes('application/json') 
          ? JSON.stringify(await response.json())
          : await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch applications: ${response.status} ${errorText}`);
      }

      if (!contentType?.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const data = await response.json();
      console.log('Fetched applications:', data);
      return data as Application[];
    },
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 2
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'reviewed':
        return <Eye className="h-5 w-5 text-blue-500" />;
      case 'interview':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'reviewed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'interview':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Offer Received';
      case 'rejected':
        return 'Not Selected';
      case 'reviewed':
        return 'Under Review';
      case 'interview':
        return 'Interview Stage';
      default:
        return 'Application Sent';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.job.company.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalApplications = applications.length;

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className={`p-2 rounded-xl transition-all ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              <div>
                <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  My Applications
                </h1>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Track your job application status
                </p>
              </div>
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

          <div className={`rounded-3xl p-6 border-2 ${
            darkMode ? 'border-red-500/30 bg-red-500/10' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex flex-col gap-3">
              <div className={`flex items-center gap-3 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                <AlertCircle className="h-5 w-5" />
                <p className="font-semibold">Failed to load applications</p>
              </div>
              <p className={darkMode ? 'text-red-300' : 'text-red-600'}>
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
              <button 
                className={`mt-2 w-fit px-4 py-2 rounded-xl font-semibold transition-all ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => refetch()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className={`p-2 rounded-xl transition-all ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              <div>
                <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  My Applications
                </h1>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Track your job application status
                </p>
              </div>
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

          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className={`animate-spin rounded-full h-32 w-32 border-b-2 ${
                darkMode ? 'border-blue-500' : 'border-blue-600'
              } mx-auto`}></div>
              <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading applications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <div>
              <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
                My Applications
              </h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Track and manage your job applications
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
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <FileText className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <TrendingUp className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Applications
            </p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {totalApplications}
            </p>
          </div>

          <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <BarChart3 className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              In Progress
            </p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {statusCounts.reviewed + statusCounts.interview + statusCounts.pending || 0}
            </p>
          </div>

          <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <Users className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <Eye className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Interviews
            </p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {statusCounts.interview || 0}
            </p>
          </div>

          <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'} shadow-lg text-white`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Briefcase className="w-5 h-5" />
              </div>
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white/90">Success Rate</p>
            <p className="text-3xl font-black">
              {totalApplications > 0 ? Math.round(((statusCounts.accepted || 0) / totalApplications) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`rounded-2xl p-6 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all font-medium ${
                  darkMode
                    ? 'bg-gray-700 border-2 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                }`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-4 py-4 rounded-xl border-2 outline-none transition-all font-medium ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
              }`}
            >
              <option value="all">All Status</option>
              <option value="pending">Application Sent</option>
              <option value="reviewed">Under Review</option>
              <option value="interview">Interview</option>
              <option value="accepted">Offer Received</option>
              <option value="rejected">Not Selected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className={`rounded-3xl shadow-xl p-12 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <FileText className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {applications.length === 0 ? 'No Applications Yet' : 'No Applications Found'}
            </h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              {applications.length === 0 
                ? 'Start applying to jobs to track your applications here' 
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className={`rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 overflow-hidden cursor-pointer group ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                    : 'bg-white border-gray-100 hover:border-blue-300'
                }`}
                onClick={() => setSelectedApplication(application)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        darkMode ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {application.job.company.name.substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-black transition-colors mb-1 ${
                          darkMode ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'
                        }`}>
                          {application.job.title}
                        </h3>
                        <p className={`font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {application.job.company.name}
                        </p>
                        <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {application.job.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" />
                            {application.job.jobType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        <span className="text-sm font-semibold">{getStatusText(application.status)}</span>
                      </div>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Applied {formatDate(application.appliedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {application.job.salary}
                    </span>
                    {application.interviewDate && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                      }`}>
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          Interview: {formatDate(application.interviewDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`w-full max-w-2xl rounded-3xl shadow-2xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Application Details
                </h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className={`p-2 rounded-xl ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Job Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
                    darkMode ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    {selectedApplication.job.company.name.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedApplication.job.title}
                    </h4>
                    <p className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedApplication.job.company.name}
                    </p>
                    <div className={`flex items-center gap-4 text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {selectedApplication.job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {selectedApplication.job.jobType}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Applied {formatDate(selectedApplication.appliedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-700">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(selectedApplication.status)}
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {getStatusText(selectedApplication.status)}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Last updated {formatDate(selectedApplication.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedApplication.job.salary}
                  </span>
                </div>

                {/* Interview Info */}
                {selectedApplication.interviewDate && (
                  <div className={`p-4 rounded-2xl border-2 ${
                    darkMode ? 'border-purple-500/30 bg-purple-500/10' : 'border-purple-200 bg-purple-50'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Users className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <h5 className={`font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        Interview Scheduled
                      </h5>
                    </div>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {formatDate(selectedApplication.interviewDate)}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                    View Job Posting
                  </button>
                  <button className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  }`}>
                    Contact Recruiter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}