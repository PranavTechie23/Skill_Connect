import { useState, useEffect } from 'react';
import { Search, Eye, Check, X, Trash2, Mail, Calendar, RefreshCw, Plus, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import AdminBackButton from '../../components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';

// API base URL - using the correct backend server port
const API_BASE_URL = 'http://localhost:5003';

const SuccessStoriesAdmin = () => {
  const { theme: currentTheme } = useTheme();
  const darkMode = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  interface Story {
    id: number;
    name: string;
    email: string;
    title: string;
    story: string;
    tags: string;
    type: 'employee' | 'employer' | string;
    date: string;
    status: 'pending' | 'approved' | 'rejected' | string;
    initials: string;
  }

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/stories`);
        if (!response.ok) {
          throw new Error('Failed to fetch stories');
        }
        const data = await response.json();
        
        // Transform the data to match our Story interface
        const transformedStories = data.map((story: any) => {
          // Safely parse the date
          let date;
          try {
            date = story.createdAt ? new Date(story.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          } catch (e) {
            console.warn('Invalid date format for story:', story.id);
            date = new Date().toISOString().split('T')[0];
          }

          return {
            id: story.id,
            name: story.submitterName || story.authorName || 'Anonymous',
            email: story.submitterEmail || story.authorEmail || '',
            title: story.title,
            story: story.content,
            tags: Array.isArray(story.tags) ? story.tags.join(', ') : story.tags || '',
            type: story.type || 'employee',
            date: date,
            status: story.approved ? 'approved' : (story.rejected ? 'rejected' : 'pending'),
            initials: (story.submitterName || story.authorName || 'A').split(' ').map((n: string) => n[0]).join('')
          };
        });

        setStories(transformedStories);
      } catch (err) {
        console.error('Error fetching stories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStory, setNewStory] = useState({
    name: '',
    email: '',
    title: '',
    story: '',
    tags: '',
    type: 'employee'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve story');
      }

      setStories(stories.map(story => 
        story.id === id ? { ...story, status: 'approved' } : story
      ));
    } catch (err) {
      console.error('Error approving story:', err);
      alert('Failed to approve story. Please try again.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reject story');
      }

      setStories(stories.map(story => 
        story.id === id ? { ...story, status: 'rejected' } : story
      ));
    } catch (err) {
      console.error('Error rejecting story:', err);
      alert('Failed to reject story. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/stories/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete story');
        }

        setStories(stories.filter(story => story.id !== id));
        if (selectedStory?.id === id) setSelectedStory(null);
      } catch (err) {
        console.error('Error deleting story:', err);
        alert('Failed to delete story. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          submitterName: newStory.name,
          submitterEmail: newStory.email,
          title: newStory.title,
          content: newStory.story,
          tags: newStory.tags.split(',').map(tag => tag.trim()),
          type: newStory.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to create story');
      }

      const createdStory = await response.json();
      
      // Add the new story to the list with proper formatting
      const formattedStory: Story = {
        id: createdStory.id,
        name: createdStory.submitterName,
        email: createdStory.submitterEmail,
        title: createdStory.title,
        story: createdStory.content,
        tags: Array.isArray(createdStory.tags) ? createdStory.tags.join(', ') : '',
        type: createdStory.type,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        initials: createdStory.submitterName.split(' ').map((n: string) => n[0]).join('')
      };

      setStories([formattedStory, ...stories]);
      setShowAddModal(false);
      setNewStory({
        name: '',
        email: '',
        title: '',
        story: '',
        tags: '',
        type: 'employee'
      });
    } catch (err) {
      console.error('Error creating story:', err);
      alert('Failed to create story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesStatus = filterStatus === 'all' || story.status === filterStatus;
    const matchesType = filterType === 'all' || story.type === filterType;
    const matchesSearch = story.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          story.story.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const stats = {
    total: stories.length,
    pending: stories.filter(s => s.status === 'pending').length,
    approved: stories.filter(s => s.status === 'approved').length,
    rejected: stories.filter(s => s.status === 'rejected').length
  };

  const theme = {
    bg: darkMode ? 'bg-[#1a1d2e]' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-[#22263a]' : 'bg-white',
    cardBorder: darkMode ? 'border-[#2d3348]' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-500' : 'text-gray-500',
    inputBg: darkMode ? 'bg-[#2d3348]' : 'bg-white',
    inputBorder: darkMode ? 'border-[#3d4358]' : 'border-gray-300',
    hover: darkMode ? 'hover:bg-[#2d3348]' : 'hover:bg-gray-50',
    selected: darkMode ? 'bg-[#2d3348]' : 'bg-blue-50',
    selectedBorder: darkMode ? 'border-[#4f46e5]' : 'border-blue-500'
  };

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      {/* Header */}
      <div className={`${theme.cardBg} border-b ${theme.cardBorder}`}>
        <div className="max-w-[1600px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="mr-4"><AdminBackButton /></div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${theme.text}`}>Success Stories</h1>
                  <p className={theme.textSecondary}>Manage and review community success stories</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAddModal(true)}
                className={`px-4 py-2.5 bg-[#4f46e5] text-white rounded-xl font-medium hover:bg-[#4338ca] transition flex items-center gap-2`}
              >
                <Plus size={18} />
                Add Story
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <TrendingUp size={20} className="text-blue-500" />
            </div>
            <div className={`text-sm ${theme.textSecondary} mb-1`}>Total Stories</div>
            <div className={`text-3xl font-bold ${theme.text}`}>{stats.total}</div>
          </div>

          <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-orange-500" />
              </div>
              <Clock size={20} className="text-orange-500" />
            </div>
            <div className={`text-sm ${theme.textSecondary} mb-1`}>Pending Review</div>
            <div className={`text-3xl font-bold ${theme.text}`}>{stats.pending}</div>
          </div>

          <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <div className={`text-sm ${theme.textSecondary} mb-1`}>Approved</div>
            <div className={`text-3xl font-bold ${theme.text}`}>{stats.approved}</div>
          </div>

          <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <XCircle size={24} className="text-red-500" />
              </div>
            </div>
            <div className={`text-sm ${theme.textSecondary} mb-1`}>Rejected</div>
            <div className={`text-3xl font-bold ${theme.text}`}>{stats.rejected}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} mb-6 p-5`}>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme.textMuted}`} size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition`}
              />
            </div>
            <div className="flex gap-3">
              <button className={`px-5 py-3 ${filterType === 'all' ? 'bg-[#4f46e5] text-white' : theme.inputBg + ' ' + theme.text} border ${theme.inputBorder} rounded-xl font-medium transition`}
                onClick={() => setFilterType('all')}>
                All
              </button>
              <button className={`px-5 py-3 ${filterType === 'employee' ? 'bg-[#4f46e5] text-white' : theme.inputBg + ' ' + theme.text} border ${theme.inputBorder} rounded-xl font-medium transition`}
                onClick={() => setFilterType('employee')}>
                Professionals
              </button>
              <button className={`px-5 py-3 ${filterType === 'employer' ? 'bg-[#4f46e5] text-white' : theme.inputBg + ' ' + theme.text} border ${theme.inputBorder} rounded-xl font-medium transition`}
                onClick={() => setFilterType('employer')}>
                Employers
              </button>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-5 py-3 ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl font-medium transition cursor-pointer`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className={`px-4 py-3 ${theme.inputBg} border ${theme.inputBorder} rounded-xl ${theme.hover} transition`}>
                <RefreshCw size={20} className={theme.textSecondary} />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-12 text-center`}>
            <div className="flex items-center justify-center gap-2">
              <div className={`animate-spin ${theme.textMuted}`}>
                <RefreshCw size={24} />
              </div>
              <span className={theme.textSecondary}>Loading stories...</span>
            </div>
          </div>
        ) : error ? (
          <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-12 text-center`}>
            <XCircle className="mx-auto text-red-500 mb-4" size={48} />
            <p className={theme.textSecondary}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#4f46e5] text-white rounded-xl font-medium hover:bg-[#4338ca] transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* Stories Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStories.map(story => (
            <div
              key={story.id}
              className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-6 cursor-pointer transition ${
                selectedStory?.id === story.id ? 'ring-2 ring-[#4f46e5]' : ''
              }`}
              onClick={() => setSelectedStory(story)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{story.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`font-semibold ${theme.text} truncate`}>{story.name}</h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg flex-shrink-0 ${
                      story.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                      story.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      story.type === 'employer' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {story.type}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${theme.textSecondary}`}>
                    <Mail size={14} />
                    <span className="truncate">{story.email}</span>
                  </div>
                </div>
              </div>

              <h4 className={`font-semibold ${theme.text} mb-2`}>{story.title}</h4>
              <p className={`text-sm ${theme.textSecondary} line-clamp-2 mb-4`}>{story.story}</p>

              <div className={`flex items-center justify-between pt-4 border-t ${theme.cardBorder}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1 text-xs ${theme.textMuted}`}>
                    <Calendar size={14} />
                    <span>{story.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {story.status === 'pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(story.id);
                        }}
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(story.id);
                        }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(story.id);
                    }}
                    className={`p-2 ${theme.inputBg} ${theme.hover} rounded-lg transition`}
                  >
                    <Trash2 size={16} className={theme.textSecondary} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredStories.length === 0 && (
            <div className={`col-span-2 ${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-12 text-center`}>
              <Eye size={48} className={`mx-auto ${theme.textMuted} mb-4`} />
              <p className={theme.textSecondary}>No stories found matching your filters.</p>
            </div>
          )}
        </div>
        )}
        

        {/* Detail Modal */}
        {selectedStory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedStory(null)}>
            <div className={`${theme.cardBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-6 border-b ${theme.cardBorder} flex items-center justify-between`}>
                <h2 className={`text-xl font-bold ${theme.text}`}>Story Details</h2>
                <button onClick={() => setSelectedStory(null)} className={`p-2 ${theme.hover} rounded-lg transition`}>
                  <X size={20} className={theme.textSecondary} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">{selectedStory.initials}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-xl font-bold ${theme.text}`}>{selectedStory.name}</h3>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                        selectedStory.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                        selectedStory.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {selectedStory.status.charAt(0).toUpperCase() + selectedStory.status.slice(1)}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                      <Mail size={16} />
                      <a href={`mailto:${selectedStory.email}`} className="hover:text-[#4f46e5]">{selectedStory.email}</a>
                    </div>
                  </div>
                </div>

                <h4 className={`text-lg font-semibold ${theme.text} mb-4`}>{selectedStory.title}</h4>
                
                <div className={`${theme.inputBg} rounded-xl p-4 mb-4`}>
                  <p className={`${theme.text} leading-relaxed whitespace-pre-wrap`}>{selectedStory.story}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedStory.tags.split(',').map((tag, i) => (
                    <span key={i} className={`px-3 py-1 ${theme.inputBg} ${theme.textSecondary} text-sm rounded-lg`}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>

                <div className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                  <Calendar size={16} />
                  <span>Submitted on {selectedStory.date}</span>
                </div>
              </div>

              <div className={`p-6 border-t ${theme.cardBorder} flex gap-3`}>
                {selectedStory.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedStory.id);
                        setSelectedStory(null);
                      }}
                      className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      Approve Story
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedStory.id);
                        setSelectedStory(null);
                      }}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      Reject Story
                    </button>
                  </>
                )}
                {selectedStory.status === 'approved' && (
                  <button
                    onClick={() => {
                      handleReject(selectedStory.id);
                      setSelectedStory(null);
                    }}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Revoke Approval
                  </button>
                )}
                {selectedStory.status === 'rejected' && (
                  <button
                    onClick={() => {
                      handleApprove(selectedStory.id);
                      setSelectedStory(null);
                    }}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Approve Story
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedStory.id)}
                  className={`px-6 py-3 ${theme.inputBg} border ${theme.cardBorder} ${theme.hover} rounded-xl font-medium transition flex items-center gap-2`}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Story Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
            <div className={`${theme.cardBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-6 border-b ${theme.cardBorder} flex items-center justify-between`}>
                <h2 className={`text-xl font-bold ${theme.text}`}>Add New Success Story</h2>
                <button onClick={() => setShowAddModal(false)} className={`p-2 ${theme.hover} rounded-lg transition`}>
                  <X size={20} className={theme.textSecondary} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className={`block text-sm font-medium ${theme.text} mb-1`}>Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={newStory.name}
                      onChange={(e) => setNewStory({ ...newStory, name: e.target.value })}
                      className={`w-full px-4 py-3 ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition`}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium ${theme.text} mb-1`}>Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={newStory.email}
                      onChange={(e) => setNewStory({ ...newStory, email: e.target.value })}
                      className={`w-full px-4 py-3 ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition`}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label htmlFor="title" className={`block text-sm font-medium ${theme.text} mb-1`}>Story Title *</label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={newStory.title}
                      onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                      className={`w-full px-4 py-3 ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition`}
                      placeholder="Enter a title for your success story"
                    />
                  </div>

                  <div>
                    <label htmlFor="story" className={`block text-sm font-medium ${theme.text} mb-1`}>Your Story *</label>
                    <textarea
                      id="story"
                      required
                      value={newStory.story}
                      onChange={(e) => setNewStory({ ...newStory, story: e.target.value })}
                      rows={6}
                      className={`w-full px-4 py-3 ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition`}
                      placeholder="Share your success story..."
                    />
                  </div>

                  <div>
                    <label htmlFor="tags" className={`block text-sm font-medium ${theme.text} mb-1`}>Tags</label>
                    <input
                      type="text"
                      id="tags"
                      value={newStory.tags}
                      onChange={(e) => setNewStory({ ...newStory, tags: e.target.value })}
                      className={`w-full px-4 py-3 ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition`}
                      placeholder="Enter tags separated by commas (e.g., career, growth, learning)"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className={`block text-sm font-medium ${theme.text} mb-1`}>Story Type *</label>
                    <select
                      id="type"
                      required
                      value={newStory.type}
                      onChange={(e) => setNewStory({ ...newStory, type: e.target.value })}
                      className={`w-full px-4 py-3 ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition cursor-pointer`}
                    >
                      <option value="employee">Professional</option>
                      <option value="employer">Employer</option>
                    </select>
                  </div>
                </div>
              </form>

              <div className={`p-6 border-t ${theme.cardBorder} flex gap-3`}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 py-3 ${theme.inputBg} border ${theme.cardBorder} ${theme.hover} rounded-xl font-medium transition`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl font-medium transition flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin">
                        <RefreshCw size={18} />
                      </div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Create Story
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessStoriesAdmin;