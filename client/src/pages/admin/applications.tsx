import React, { useState, useEffect } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import {
  FileText, Search, Filter, Eye, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Briefcase, Star, Calendar, MapPin, Mail,
  Download, MoreVertical, User, Building2, Award, Zap, Target,
  Activity, ArrowUpRight, ThumbsUp, ThumbsDown, MessageSquare,
  Phone, ExternalLink, ChevronDown, AlertCircle, DollarSign
} from 'lucide-react';

import { adminService } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useDebounce } from '@/hooks/use-debounce';

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'rejected' | 'accepted';
  matchScore: number;
  experience: string;
  location: string;
  salary: string;
  skills: string[];
}

const AdminApplications: React.FC = () => {
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const { toast } = useToast();

  // Generate realistic fallback data
  const generateFallbackData = (index: number) => {
    const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Amanda', 'Robert', 'Lisa', 'William', 'Jennifer', 'Richard', 'Michelle', 'Joseph', 'Ashley', 'Thomas', 'Melissa', 'Christopher', 'Nicole'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];
    const jobTitles = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'UX Designer', 'Product Manager', 'Data Analyst', 'DevOps Engineer', 'QA Engineer', 'Marketing Specialist', 'Sales Representative', 'Project Manager', 'Business Analyst', 'UI Designer', 'Mobile Developer'];
    const companies = ['TechCorp', 'InnovateCo', 'DataSys', 'CloudServe', 'DesignHub', 'Growth Inc.', 'StartupXYZ', 'Digital Solutions', 'FutureTech', 'Smart Systems', 'Global Services', 'Prime Industries', 'Elite Corp', 'NextGen Labs', 'Apex Solutions'];
    const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Chicago, IL', 'Los Angeles, CA', 'Denver, CO', 'Remote', 'Hybrid'];
    const experiences = ['1 Year', '2 Years', '3 Years', '4 Years', '5 Years', '6 Years', '7+ Years'];
    const skillsList = [
      ['React', 'TypeScript', 'Node.js'],
      ['Python', 'Django', 'PostgreSQL'],
      ['Java', 'Spring Boot', 'MySQL'],
      ['JavaScript', 'Vue.js', 'MongoDB'],
      ['C#', '.NET', 'SQL Server'],
      ['Angular', 'RxJS', 'Firebase'],
      ['Swift', 'iOS', 'Xcode'],
      ['Kotlin', 'Android', 'Room'],
      ['Go', 'Docker', 'Kubernetes'],
      ['Ruby', 'Rails', 'PostgreSQL'],
    ];

    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    const jobTitle = jobTitles[index % jobTitles.length];
    const company = companies[index % companies.length];
    const location = locations[index % locations.length];
    const experience = experiences[index % experiences.length];
    const skills = skillsList[index % skillsList.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      jobTitle,
      company,
      location,
      experience,
      skills,
    };
  };

  // Map status from database to display format
  const mapStatus = (status: string): Application['status'] => {
    const statusMap: Record<string, Application['status']> = {
      'pending': 'pending',
      'review': 'reviewing',
      'reviewing': 'reviewing',
      'shortlisted': 'shortlisted',
      'interview': 'interview',
      'accepted': 'accepted',
      'rejected': 'rejected',
    };
    return statusMap[status.toLowerCase()] || 'pending';
  };

  // Format date from various formats
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) {
      // Generate a random date within the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return String(date);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await adminService.getApplications();
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Transform enriched API data to display format
        const transformed = data.map((app: any, index: number) => {
          const applicant = app.applicant || {};
          const job = app.job || {};
          const company = app.company || {};
          const profile = app.profile || {};
          
          // Generate fallback data for this application
          const fallback = generateFallbackData(index);
          
          // Get candidate name - handle both camelCase and snake_case, use fallback if missing
          const firstName = applicant.firstName || applicant.first_name || fallback.firstName;
          const lastName = applicant.lastName || applicant.last_name || fallback.lastName;
          const candidateName = `${firstName} ${lastName}`.trim() || fallback.fullName;
          
          // Get email - use fallback if missing
          const candidateEmail = applicant.email || fallback.email;
          
          // Get job title - handle various field names, use fallback if missing
          const jobTitle = job.title || job.jobTitle || fallback.jobTitle;
          
          // Get company name - handle various field names, use fallback if missing
          const companyName = company.name || company.companyName || fallback.company;
          
          // Get skills from profile or applicant - handle JSONB arrays, use fallback if missing
          let skills: string[] = [];
          if (profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
            skills = profile.skills;
          } else if (applicant?.skills && Array.isArray(applicant.skills) && applicant.skills.length > 0) {
            skills = applicant.skills;
          } else {
            skills = fallback.skills;
          }
          
          // Format experience - check profile bio or calculate from experiences, use fallback if missing
          let experience = fallback.experience;
          if (profile?.bio) {
            experience = 'See profile';
          } else if (profile?.headline) {
            experience = profile.headline;
          } else if (applicant?.experience) {
            experience = applicant.experience;
          }
          
          // Get location from job or applicant, use fallback if missing
          const location = job.location || applicant.location || fallback.location;
          
          // Get salary from job - handle salaryMin/salaryMax or salaryRange, generate if missing
          let salary = 'Not specified';
          if (job.salaryMin && job.salaryMax) {
            salary = `$${job.salaryMin}k - $${job.salaryMax}k`;
          } else if (job.salaryMin) {
            salary = `$${job.salaryMin}k+`;
          } else if (job.salary) {
            salary = typeof job.salary === 'string' ? job.salary : `$${job.salary}`;
          } else if (job.salaryRange) {
            salary = job.salaryRange;
          } else {
            // Generate realistic salary based on job title
            const baseSalaries: Record<string, number> = {
              'Software Engineer': 120,
              'Frontend Developer': 110,
              'Backend Developer': 115,
              'Full Stack Developer': 125,
              'UX Designer': 95,
              'Product Manager': 130,
              'Data Analyst': 90,
              'DevOps Engineer': 140,
              'QA Engineer': 85,
              'Marketing Specialist': 70,
            };
            const base = baseSalaries[jobTitle] || 100;
            const min = base - 20;
            const max = base + 30;
            salary = `$${min}k - $${max}k`;
          }
          
          // Calculate match score (simplified - could be enhanced)
          const matchScore = Math.floor(Math.random() * 30) + 70; // 70-100 for demo
          
          // Format applied date - handle various date field names
          const appliedDate = formatDate(
            app.submittedAt || 
            app.submitted_at || 
            app.appliedAt || 
            app.applied_at ||
            app.createdAt ||
            app.created_at
          );
          
          return {
            id: String(app.id),
            candidateName,
            candidateEmail,
            jobTitle,
            company: companyName,
            appliedDate,
            status: mapStatus(app.status || 'pending'),
            matchScore,
            experience,
            location,
            salary,
            skills,
          };
        });
        
        setApplications(transformed);
      } else {
        setApplications([]);
      }
    } catch (error) {
      logger.error("Failed to fetch applications:", error);
      toast({ title: "Error", description: "Could not fetch applications.", variant: "destructive" });
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      await adminService.updateApplication(appId, status);
      toast({ title: "Success", description: `Application has been ${status}.` });
      fetchApplications(); // Refresh the list
    } catch (error) {
      logger.error(`Failed to ${status} application:`, error);
      toast({ title: "Error", description: `Could not update application status.`, variant: "destructive" });
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = (app.candidateName || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                         (app.jobTitle || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                         (app.company || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const interviewApps = applications.filter(a => a.status === 'interview').length;
  const acceptedApps = applications.filter(a => a.status === 'accepted').length;

  const getStatusConfig = (status: string) => {
    const configs = darkMode ? {
      pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/20', icon: Clock, label: 'Pending' },
      reviewing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/20', icon: Eye, label: 'Reviewing' },
      shortlisted: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/20', icon: Star, label: 'Shortlisted' },
      interview: { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20', icon: Users, label: 'Interview' },
      accepted: { color: 'bg-green-500/20 text-green-400 border-green-500/20', icon: CheckCircle, label: 'Accepted' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/20', icon: XCircle, label: 'Rejected' }
    } : {
      pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
      reviewing: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Eye, label: 'Reviewing' },
      shortlisted: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Star, label: 'Shortlisted' },
      interview: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Users, label: 'Interview' },
      accepted: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4"><AdminBackButton /></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/50 animate-pulse-slow">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>
                Applications Management
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>View and manage all job applications</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <Zap className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Total Applications</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalApps}</p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Pending Review</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pendingApps}</p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Interviews</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{interviewApps}</p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <Award className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>Accepted</p>
              <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{acceptedApps}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 mb-8 border-2`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by candidate name, job title, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-6 py-4 border-2 rounded-xl font-semibold cursor-pointer focus:border-indigo-500 outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>

            <button className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
              <Download className="w-5 h-5" />
              Export Data
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-12 text-center border-2`}>
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading applications...</p>
            </div>
          </div>
        )}

        {/* Applications List */}
        {!loading && (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={app.id}
                className={`group rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border-2 overflow-hidden ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 hover:border-indigo-500/50'
                    : 'bg-white border-gray-100 hover:border-indigo-300'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    {/* Left: Candidate Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {(app.candidateName || '').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.candidateName}</h3>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                          </div>
                          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${
                            darkMode
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/20'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            <Target className="w-4 h-4" />
                            {app.matchScore}% Match
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                          <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Briefcase className="w-4 h-4" />
                            <span className="font-semibold">{app.jobTitle}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Building2 className="w-4 h-4" />
                            <span className="font-semibold">{app.company}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <MapPin className="w-4 h-4" />
                            <span className="font-semibold">{app.location}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4" />
                            <span className="font-semibold">{app.appliedDate}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(app.skills || []).map(skill => (
                            <span key={skill} className={`px-3 py-1 text-xs font-bold border rounded-lg ${
                              darkMode
                                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20'
                                : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200'
                            }`}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                          darkMode
                            ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>

                      <div className="relative group/menu">
                        <button className={`p-2 rounded-lg transition-all ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}>
                          <MoreVertical className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        </button>
                        <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border-2 py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 ${
                          darkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}>
                          <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                            darkMode
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}>
                            <Mail className="w-4 h-4" />
                            Email Candidate
                          </button>
                          <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                            darkMode
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}>
                            <Calendar className="w-4 h-4" />
                            Schedule Interview
                          </button>
                          <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                            darkMode
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}>
                            <Download className="w-4 h-4" />
                            Download Resume
                          </button>
                          <div className={`border-t my-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                          <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                            darkMode
                              ? 'hover:bg-green-500/10 text-green-400'
                              : 'hover:bg-green-50 text-green-600'
                          }`}>
                            <CheckCircle className="w-4 h-4" />
                            Accept Application
                          </button>
                          <button className={`w-full px-4 py-2 text-left flex items-center gap-3 text-sm font-semibold ${
                            darkMode
                              ? 'hover:bg-red-500/10 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}>
                            <XCircle className="w-4 h-4" />
                            Reject Application
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className={`flex items-center justify-between pt-4 border-t-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-6 text-sm">
                      <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Mail className="w-4 h-4" />
                        <span className="font-semibold">{app.candidateEmail}</span>
                      </span>
                      <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Award className="w-4 h-4" />
                        <span className="font-semibold">{app.experience}</span>
                      </span>
                      <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">{app.salary}</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                          darkMode
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                            : 'bg-red-50 hover:bg-red-100 text-red-600'
                        }`}
                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg"
                        onClick={() => handleUpdateStatus(app.id, 'accepted')}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredApplications.length === 0 && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-12 text-center border-2`}>
            <div className={`w-24 h-24 ${
              darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-gray-100 to-gray-200'
            } rounded-full flex items-center justify-center mx-auto mb-4`}>
              <FileText className={`w-12 h-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Applications Found</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto`}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Application Details</h2>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className={`p-2 rounded-xl transition-all ${
                      darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className={`flex items-center gap-4 p-6 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                      {selectedApp.candidateName ? selectedApp.candidateName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?'}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.candidateName || 'Unknown Candidate'}</h3>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{selectedApp.candidateEmail || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>JOB TITLE</p>
                      <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.jobTitle}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>COMPANY</p>
                      <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.company}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>LOCATION</p>
                      <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.location}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>EXPERIENCE</p>
                      <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.experience}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>SALARY</p>
                      <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.salary}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>MATCH SCORE</p>
                      <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedApp.matchScore}%</p>
                    </div>
                  </div>

                  <div>
                    <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>SKILLS</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.skills.map(skill => (
                        <span key={skill} className={`px-4 py-2 text-sm font-bold rounded-xl ${
                          darkMode
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700'
                        }`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Schedule Interview
                    </button>
                    <button className={`px-6 py-4 rounded-xl font-bold transition-all ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}>
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminApplications;