import { useState } from 'react';
import { useTheme } from "@/components/theme-provider";
import AdminBackButton from "@/components/AdminBackButton";
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Download,
  MoreHorizontal,
  Eye,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  User,
  GraduationCap,
  Briefcase,
  Award,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  match: number;
  status: 'new' | 'reviewed' | 'interview' | 'rejected' | 'hired';
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired';
  experience: string;
  education: string;
  skills: string[];
  appliedDate: string;
  lastActivity: string;
  resume: string;
  avatar: string;
  notes: string;
  rating: number;
  source: string;
}

export default function Candidates() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      position: 'Senior Frontend Developer',
      match: 92,
      status: 'interview',
      stage: 'interview',
      experience: '5 years',
      education: 'MSc Computer Science, Stanford University',
      skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'GraphQL'],
      appliedDate: '2024-01-15',
      lastActivity: '2 hours ago',
      resume: 'alex_johnson_resume.pdf',
      avatar: '/api/placeholder/100/100',
      notes: 'Strong React background, excellent communication skills. Previous experience at Google.',
      rating: 4.5,
      source: 'LinkedIn'
    },
    {
      id: '2',
      name: 'Maria Garcia',
      email: 'maria.garcia@email.com',
      phone: '+1 (555) 234-5678',
      location: 'New York, NY',
      position: 'Product Manager',
      match: 87,
      status: 'reviewed',
      stage: 'screening',
      experience: '4 years',
      education: 'MBA, Harvard Business School',
      skills: ['Product Strategy', 'Agile', 'User Research', 'Data Analysis', 'JIRA'],
      appliedDate: '2024-01-14',
      lastActivity: '1 day ago',
      resume: 'maria_garcia_resume.pdf',
      avatar: '/api/placeholder/100/100',
      notes: 'Previous experience in SaaS, strong analytical skills. MBA from Stanford.',
      rating: 4.2,
      source: 'Company Website'
    },
    {
      id: '3',
      name: 'David Kim',
      email: 'david.kim@email.com',
      phone: '+1 (555) 345-6789',
      location: 'Remote',
      position: 'DevOps Engineer',
      match: 95,
      status: 'new',
      stage: 'applied',
      experience: '6 years',
      education: 'BSc Computer Engineering, MIT',
      skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Python'],
      appliedDate: '2024-01-16',
      lastActivity: '3 hours ago',
      resume: 'david_kim_resume.pdf',
      avatar: '/api/placeholder/100/100',
      notes: 'AWS certified, strong Kubernetes experience. Open source contributor.',
      rating: 4.8,
      source: 'Indeed'
    },
    {
      id: '4',
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX',
      position: 'UX Designer',
      match: 78,
      status: 'reviewed',
      stage: 'screening',
      experience: '3 years',
      education: 'BFA Design, RISD',
      skills: ['Figma', 'User Research', 'Prototyping', 'UI/UX', 'Design Systems'],
      appliedDate: '2024-01-13',
      lastActivity: '2 days ago',
      resume: 'sarah_chen_resume.pdf',
      avatar: '/api/placeholder/100/100',
      notes: 'Portfolio shows strong visual design skills. Experience in startup environment.',
      rating: 4.0,
      source: 'Glassdoor'
    },
    {
      id: '5',
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+1 (555) 567-8901',
      location: 'Chicago, IL',
      position: 'Data Scientist',
      match: 91,
      status: 'interview',
      stage: 'interview',
      experience: '4 years',
      education: 'PhD Statistics, University of Chicago',
      skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'PyTorch', 'R'],
      appliedDate: '2024-01-12',
      lastActivity: '5 hours ago',
      resume: 'michael_brown_resume.pdf',
      avatar: '/api/placeholder/100/100',
      notes: 'Strong statistical background. Published research papers in ML conferences.',
      rating: 4.6,
      source: 'LinkedIn'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkSelect, setBulkSelect] = useState<string[]>([]);

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    const matchesStage = stageFilter === 'all' || candidate.stage === stageFilter;
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      case 'oldest':
        return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
      case 'match':
        return b.match - a.match;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: Candidate['status']) => {
    const colors = {
      new: 'bg-blue-500',
      reviewed: 'bg-yellow-500',
      interview: 'bg-purple-500',
      rejected: 'bg-red-500',
      hired: 'bg-green-500'
    };
    return colors[status];
  };

  const getStatusText = (status: Candidate['status']) => {
    const texts = {
      new: 'New',
      reviewed: 'Reviewed',
      interview: 'Interview',
      rejected: 'Rejected',
      hired: 'Hired'
    };
    return texts[status];
  };

  const getStageColor = (stage: Candidate['stage']) => {
    const colors = {
      applied: 'bg-gray-500',
      screening: 'bg-blue-500',
      interview: 'bg-purple-500',
      offer: 'bg-orange-500',
      hired: 'bg-green-500'
    };
    return colors[stage];
  };

  const updateCandidateStatus = (candidateId: string, status: Candidate['status']) => {
    setCandidates(prev => prev.map(candidate =>
      candidate.id === candidateId
        ? { ...candidate, status, lastActivity: 'Just now' }
        : candidate
    ));
  };

  const updateCandidateStage = (candidateId: string, stage: Candidate['stage']) => {
    setCandidates(prev => prev.map(candidate =>
      candidate.id === candidateId
        ? { ...candidate, stage, lastActivity: 'Just now' }
        : candidate
    ));
  };

  const toggleBulkSelect = (candidateId: string) => {
    setBulkSelect(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const selectAll = () => {
    setBulkSelect(filteredCandidates.map(candidate => candidate.id));
  };

  const clearSelection = () => {
    setBulkSelect([]);
  };

  const stats = {
    total: candidates.length,
    new: candidates.filter(c => c.status === 'new').length,
    interview: candidates.filter(c => c.status === 'interview').length,
    hired: candidates.filter(c => c.status === 'hired').length
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gray-50'}`}>
      {/* Animated background */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none ${darkMode ? 'opacity-100' : 'opacity-30'}`}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="container mx-auto p-6 max-w-7xl relative">
        {/* Back Button */}
        <div className="mb-6">
          <AdminBackButton />
        </div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Candidates</h1>
            <p className="text-gray-400 mt-2">Manage and review applicant profiles</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-300">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Candidates</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <User className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">New Applications</p>
                <p className="text-2xl font-bold text-white">{stats.new}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">In Interview</p>
                <p className="text-2xl font-bold text-white">{stats.interview}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Hired</p>
                <p className="text-2xl font-bold text-white">{stats.hired}</p>
              </div>
              <Award className="w-8 h-8 text-green-400" />
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
                placeholder="Search candidates by name, position, or skills..."
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
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Stages</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="hired">Hired</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="match">Best Match</option>
                <option value="name">Name A-Z</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors duration-300"
              >
                <Filter className="w-5 h-5" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {bulkSelect.length > 0 && (
            <div className="flex items-center justify-between mt-4 p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center space-x-3">
                <span className="text-white font-medium">
                  {bulkSelect.length} candidate{bulkSelect.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-blue-300 hover:text-white text-sm transition-colors duration-300"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <select className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                  <option>Bulk actions</option>
                  <option>Move to screening</option>
                  <option>Schedule interview</option>
                  <option>Send email</option>
                  <option>Reject candidates</option>
                </select>
                <button className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors duration-300">
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Candidates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-gray-800/80 border border-gray-700/50 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={bulkSelect.includes(candidate.id)}
                      onChange={() => toggleBulkSelect(candidate.id)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{candidate.name}</h3>
                      <p className="text-blue-400 text-sm">{candidate.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-gray-700 px-2 py-1 rounded">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white text-sm">{candidate.rating}</span>
                    </div>
                    <button className="text-gray-400 hover:text-white transition-colors duration-300">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Match Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Match Score</span>
                    <span className="text-green-400 font-medium text-sm">{candidate.match}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${candidate.match}%` }}
                    />
                  </div>
                </div>

                {/* Status and Stage */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)} text-white`}>
                    {getStatusText(candidate.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(candidate.stage)} text-white capitalize`}>
                    {candidate.stage}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-6">
                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Mail className="w-4 h-4" />
                    <span>{candidate.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>{candidate.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{candidate.location}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        +{candidate.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <div className="flex items-center space-x-1 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Applied {new Date(candidate.appliedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedCandidate(candidate)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors duration-300"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-400 transition-colors duration-300" title="Send Message">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-300" title="Reject">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-400 transition-colors duration-300" title="Approve">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCandidates.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No candidates found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedCandidate.avatar}
                    alt={selectedCandidate.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCandidate.name}</h2>
                    <p className="text-blue-400">{selectedCandidate.position}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* About */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">About</h3>
                    <p className="text-gray-300">{selectedCandidate.notes}</p>
                  </div>

                  {/* Experience & Education */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2" />
                        Experience
                      </h4>
                      <p className="text-gray-300">{selectedCandidate.experience}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2" />
                        Education
                      </h4>
                      <p className="text-gray-300">{selectedCandidate.education}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="font-semibold text-white mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-4">Quick Actions</h4>
                    <div className="space-y-2">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-300">
                        Schedule Interview
                      </button>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors duration-300">
                        Send Offer
                      </button>
                      <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors duration-300">
                        Reject Candidate
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h4 className="font-semibold text-white mb-3">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Mail className="w-4 h-4" />
                        <span>{selectedCandidate.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Phone className="w-4 h-4" />
                        <span>{selectedCandidate.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedCandidate.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resume */}
                  <div>
                    <h4 className="font-semibold text-white mb-3">Resume</h4>
                    <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors duration-300 flex items-center justify-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Download Resume</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}