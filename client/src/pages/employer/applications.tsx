import { useState } from 'react';
import { useTheme } from "@/components/theme-provider";
import { Search, Filter, Calendar, MapPin, Briefcase, DollarSign, Mail, Phone, Download, Eye, CheckCircle, XCircle, Clock, TrendingUp, FileText, Star, Award, Target, ChevronDown, ExternalLink, Linkedin, Github, Globe } from 'lucide-react';
import AdminBackButton from "@/components/AdminBackButton";

type ApplicationStatus = 'new' | 'reviewing' | 'shortlisted' | 'rejected';

interface Application {
  id: number;
  status: ApplicationStatus;
  appliedDate: string;
  [key: string]: any;
}

interface ApplicationsProps {
  embedded?: boolean;
}

export default function Applications({ embedded = false }: ApplicationsProps) {
  const [selectedTab, setSelectedTab] = useState<ApplicationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'match' | 'salary'>('recent');

  const stats = [
    { label: 'Total Applications', value: '1,247', icon: FileText, trend: '+18%', color: 'from-blue-500 to-cyan-500' },
    { label: 'Under Review', value: '156', icon: Clock, trend: '+12%', color: 'from-purple-500 to-pink-500' },
    { label: 'Shortlisted', value: '89', icon: Star, trend: '+25%', color: 'from-orange-500 to-red-500' },
    { label: 'Hired This Month', value: '23', icon: Award, trend: '+8%', color: 'from-green-500 to-emerald-500' }
  ];

  const applications = [
    {
      id: 1,
      candidateName: 'Sarah Chen',
      candidateAvatar: 'SC',
      position: 'Senior Full Stack Developer',
      appliedDate: '2024-10-12',
      experience: '7 years',
      location: 'San Francisco, CA',
      expectedSalary: '$140k - $160k',
      currentSalary: '$130k',
      noticePeriod: '2 weeks',
      status: 'new',
      matchScore: 95,
      skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker'],
      education: 'MS Computer Science, Stanford University',
      resumeUrl: '#',
      portfolioUrl: 'https://sarahchen.dev',
      linkedinUrl: '#',
      githubUrl: '#',
      coverLetter: 'I am excited to apply for the Senior Full Stack Developer position. With 7 years of experience building scalable web applications...',
      availability: 'Immediately available',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      candidateName: 'Marcus Johnson',
      candidateAvatar: 'MJ',
      position: 'DevOps Engineer',
      appliedDate: '2024-10-11',
      experience: '5 years',
      location: 'Austin, TX',
      expectedSalary: '$120k - $140k',
      currentSalary: '$110k',
      noticePeriod: '1 month',
      status: 'reviewing',
      matchScore: 88,
      skills: ['Docker', 'Kubernetes', 'Jenkins', 'Python', 'Terraform', 'AWS'],
      education: 'BS Software Engineering, UT Austin',
      resumeUrl: '#',
      linkedinUrl: '#',
      githubUrl: '#',
      coverLetter: 'With extensive experience in cloud infrastructure and automation, I believe I would be a great fit...',
      availability: 'Available in 4 weeks',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 3,
      candidateName: 'Emily Rodriguez',
      candidateAvatar: 'ER',
      position: 'UX/UI Designer',
      appliedDate: '2024-10-10',
      experience: '6 years',
      location: 'New York, NY',
      expectedSalary: '$110k - $130k',
      currentSalary: '$105k',
      noticePeriod: '2 weeks',
      status: 'shortlisted',
      matchScore: 92,
      skills: ['Figma', 'Sketch', 'User Research', 'Prototyping', 'Design Systems', 'Adobe XD'],
      education: 'BFA Design, Parsons School of Design',
      resumeUrl: '#',
      portfolioUrl: 'https://emilyrodriguez.design',
      linkedinUrl: '#',
      coverLetter: 'As a passionate UX/UI designer with a focus on user-centered design, I am thrilled about this opportunity...',
      availability: 'Immediately available',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      id: 4,
      candidateName: 'David Kim',
      candidateAvatar: 'DK',
      position: 'Data Scientist',
      appliedDate: '2024-10-09',
      experience: '4 years',
      location: 'Seattle, WA',
      expectedSalary: '$130k - $150k',
      currentSalary: '$120k',
      noticePeriod: '3 weeks',
      status: 'shortlisted',
      matchScore: 90,
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'R', 'Tableau'],
      education: 'PhD Data Science, University of Washington',
      resumeUrl: '#',
      linkedinUrl: '#',
      githubUrl: '#',
      coverLetter: 'My background in statistical modeling and machine learning makes me an ideal candidate...',
      availability: 'Available in 3 weeks',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 5,
      candidateName: 'Priya Sharma',
      candidateAvatar: 'PS',
      position: 'Product Manager',
      appliedDate: '2024-10-08',
      experience: '8 years',
      location: 'Boston, MA',
      expectedSalary: '$145k - $165k',
      currentSalary: '$135k',
      noticePeriod: '1 month',
      status: 'reviewing',
      matchScore: 87,
      skills: ['Agile', 'Product Strategy', 'Analytics', 'Leadership', 'Jira', 'Roadmapping'],
      education: 'MBA, Harvard Business School',
      resumeUrl: '#',
      linkedinUrl: '#',
      coverLetter: 'With a proven track record of launching successful products and leading cross-functional teams...',
      availability: 'Available in 4 weeks',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      id: 6,
      candidateName: 'Alex Thompson',
      candidateAvatar: 'AT',
      position: 'Backend Developer',
      appliedDate: '2024-10-07',
      experience: '6 years',
      location: 'Remote',
      expectedSalary: '$115k - $135k',
      currentSalary: '$108k',
      noticePeriod: '2 weeks',
      status: 'rejected',
      matchScore: 78,
      skills: ['Java', 'Spring Boot', 'Microservices', 'MongoDB', 'Redis', 'Kafka'],
      education: 'BS Computer Science, MIT',
      resumeUrl: '#',
      githubUrl: '#',
      coverLetter: 'I am passionate about building robust backend systems and would love to contribute to your team...',
      availability: 'Immediately available',
      gradient: 'from-amber-500 to-orange-500'
    }
  ];

  const tabs = [
    { id: 'all', label: 'All Applications', count: applications.length },
    { id: 'new', label: 'New', count: applications.filter(a => a.status === 'new').length },
    { id: 'reviewing', label: 'Under Review', count: applications.filter(a => a.status === 'reviewing').length },
    { id: 'shortlisted', label: 'Shortlisted', count: applications.filter(a => a.status === 'shortlisted').length },
    { id: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length }
  ];

  const getStatusBadge = (status: ApplicationStatus) => {
    const badges = {
      new: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'New Application' },
      reviewing: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Under Review' },
      shortlisted: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'Shortlisted' },
      rejected: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Rejected' }
    } as const;
    return badges[status] || badges.new;
  };

  const filteredApplications = applications
    .filter(app => 
      (selectedTab === 'all' || app.status === selectedTab) &&
      (app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       app.position.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      if (sortBy === 'salary') return parseInt(b.expectedSalary.replace(/[^0-9]/g, '')) - parseInt(a.expectedSalary.replace(/[^0-9]/g, ''));
      return 0;
    });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((Number(now) - Number(date)) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const { theme } = useTheme();
  const isDark =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} ${embedded ? 'bg-transparent' : isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gray-50'}`}>
      {/* Back Button */}
      {!embedded && (
        <div className="p-6">
          <AdminBackButton />
        </div>
      )}
      {/* Animated background */}
      {!embedded && (
        <div className={`fixed inset-0 overflow-hidden pointer-events-none ${isDark ? 'opacity-100' : 'opacity-30'}`}>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      )}

      <div className={`relative ${embedded ? 'w-full' : 'container mx-auto max-w-7xl'} ${embedded ? 'p-2' : 'p-6'}`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${isDark 
            ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent'
            : 'text-gray-900'
          } mb-2`}>
            Job Applications
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Review and manage applications from talented candidates</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                <div className={`relative ${
                  isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'
                } backdrop-blur-xl border rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-1`}>{stat.label}</p>
                      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                    </div>
                    <div className="flex items-center text-green-500 text-sm">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {stat.trend}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-2 mb-6 flex flex-wrap gap-2`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as ApplicationStatus | 'all')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                selectedTab === tab.id
                  ? 'bg-white/20'
                  : isDark ? 'bg-slate-700/50' : 'bg-gray-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search and Sort Bar */}
        <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-4 mb-6`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by candidate name or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 ${
                  isDark 
                    ? 'bg-slate-900/50 border-slate-700/50 text-gray-100 placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                } border rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all`}
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'match' | 'salary')}
                className={`appearance-none pl-4 pr-10 py-3 ${
                  isDark 
                    ? 'bg-slate-900/50 border-slate-700/50 text-gray-100' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                } border rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer`}
              >
                <option value="recent">Most Recent</option>
                <option value="match">Best Match</option>
                <option value="salary">Highest Salary</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const statusBadge = getStatusBadge(app.status as ApplicationStatus);
            
            return (
              <div
                key={app.id}
                className={`group ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10`}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Section - Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                          {app.candidateAvatar}
                        </div>
                        {/* Match Score Badge */}
                        <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-lg text-xs font-bold ${
                          app.matchScore >= 90 ? 'bg-green-500 text-white' :
                          app.matchScore >= 80 ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        } shadow-lg`}>
                          {app.matchScore}%
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{app.candidateName}</h3>
                            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{app.position}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                            {statusBadge.label}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Calendar className="w-4 h-4" />
                            Applied {formatDate(app.appliedDate)}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Briefcase className="w-4 h-4" />
                            {app.experience} experience
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin className="w-4 h-4" />
                            {app.location}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Clock className="w-4 h-4" />
                            Notice: {app.noticePeriod}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <DollarSign className="w-4 h-4" />
                            Expected: <span className="text-green-400 font-semibold">{app.expectedSalary}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Target className="w-4 h-4" />
                            Current: {app.currentSalary}
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {app.skills.map((skill, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded-lg text-xs ${
                              isDark 
                                ? 'bg-slate-900/50 border-slate-700/50 text-gray-300'
                                : 'bg-gray-100 border-gray-200 text-gray-600'
                            } border`}>
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Education */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-400">
                            <Award className="w-4 h-4 inline mr-1" />
                            {app.education}
                          </p>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap gap-2">
                          {app.portfolioUrl && (
                            <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" 
                               className={`flex items-center gap-1 px-3 py-1.5 ${
                                 isDark
                                   ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-700/50 text-gray-300 hover:text-blue-400'
                                   : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600 hover:text-gray-900'
                               } border rounded-lg text-xs transition-all`}>
                              <Globe className="w-3 h-3" />
                              Portfolio
                            </a>
                          )}
                          {app.linkedinUrl && (
                            <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                               className={`flex items-center gap-1 px-3 py-1.5 ${
                                 isDark
                                   ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-700/50 text-gray-300 hover:text-blue-400'
                                   : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600 hover:text-gray-900'
                               } border rounded-lg text-xs transition-all`}>
                              <Linkedin className="w-3 h-3" />
                              LinkedIn
                            </a>
                          )}
                          {app.githubUrl && (
                            <a href={app.githubUrl} target="_blank" rel="noopener noreferrer" 
                               className={`flex items-center gap-1 px-3 py-1.5 ${
                                 isDark
                                   ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-700/50 text-gray-300 hover:text-blue-400'
                                   : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600 hover:text-gray-900'
                               } border rounded-lg text-xs transition-all`}>
                              <Github className="w-3 h-3" />
                              GitHub
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cover Letter Preview */}
                    <div className={`${isDark ? 'bg-slate-900/30 border-slate-700/30' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} italic line-clamp-2`}>
                        "{app.coverLetter}"
                      </p>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="lg:w-48 flex flex-col gap-3">
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Full Profile
                    </button>
                    
                    <button className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20 hover:border-green-500/40 text-green-400'
                        : 'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300 text-green-600'
                    } border`}>
                      <CheckCircle className="w-4 h-4" />
                      Shortlist
                    </button>
                    
                    <button className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-700/50 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600'
                    } border`}>
                      <Mail className="w-4 h-4" />
                      Contact
                    </button>
                    
                    <button className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-700/50 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600'
                    } border`}>
                      <Download className="w-4 h-4" />
                      Download Resume
                    </button>
                    
                    <button className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40 text-red-400'
                        : 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300 text-red-600'
                    } border`}>
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredApplications.length === 0 && (
          <div className={`backdrop-blur-xl border rounded-2xl p-12 text-center ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>No applications found</h3>
            <p className={isDark ? 'text-gray-500' : 'text-gray-600'}>Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}