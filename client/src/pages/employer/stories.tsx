import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AdminBackButton from "@/components/AdminBackButton";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  Plus, Search, Filter, Edit, Trash2, Eye, Calendar,
  CheckCircle, Clock, XCircle, FileText, Tag, User, Mail,
  X, Save, TrendingUp, BookOpen, Sparkles
} from 'lucide-react';

interface Story {
  id: number;
  title: string;
  content: string;
  tags: string[];
  submitterName?: string;
  submitterEmail?: string;
  authorId?: string;
  approved: boolean;
  createdAt: string;
}

interface StoriesProps {
  embedded?: boolean;
}

export default function Stories({ embedded = false }: StoriesProps) {
  const { theme } = useTheme();
  const darkMode = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/stories?limit=100');
      if (!response.ok) throw new Error('Failed to fetch stories');
      const data = await response.json();
      // Filter stories by current user if they're logged in
      const userStories = user 
        ? (data.stories || data).filter((story: Story) => 
            story.authorId === user.id || 
            story.submitterEmail === user.email
          )
        : [];
      setStories(userStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast({
        title: "Error",
        description: "Failed to load stories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      const response = await apiFetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          tags: tagsArray,
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
          email: user?.email || ''
        })
      });

      if (!response.ok) throw new Error('Failed to create story');

      toast({
        title: "Success",
        description: "Story created successfully! It will be reviewed before publishing."
      });

      setFormData({ title: '', content: '', tags: '' });
      setShowCreateModal(false);
      fetchStories();
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!selectedStory) return;

    try {
      const response = await apiFetch(`/api/admin/stories/${selectedStory.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete story');

      toast({
        title: "Success",
        description: "Story deleted successfully."
      });

      setShowDeleteModal(false);
      setSelectedStory(null);
      fetchStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = 
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'approved' && story.approved) ||
      (filterStatus === 'pending' && !story.approved);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: stories.length,
    approved: stories.filter(s => s.approved).length,
    pending: stories.filter(s => !s.approved).length
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} ${embedded ? 'bg-transparent' : darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
      <div className={`${embedded ? 'w-full' : 'max-w-7xl mx-auto'} ${embedded ? 'p-2' : 'p-6'}`}>
        {/* Header */}
        <div className="mb-6">
          {!embedded && <AdminBackButton />}
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg`}>
              <BookOpen className={`w-8 h-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Stories
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Share your company's culture, values, and achievements
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Story
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Stories</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
              </div>
              <div className={`p-3 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-100'} rounded-xl`}>
                <FileText className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Published</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.approved}</p>
              </div>
              <div className={`p-3 ${darkMode ? 'bg-green-900/20' : 'bg-green-100'} rounded-xl`}>
                <CheckCircle className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Pending Review</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.pending}</p>
              </div>
              <div className={`p-3 ${darkMode ? 'bg-amber-900/20' : 'bg-amber-100'} rounded-xl`}>
                <Clock className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 mb-6`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
              <input
                type="text"
                placeholder="Search stories by title, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('approved')}
                className={filterStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Published
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                className={filterStatus === 'pending' ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending
              </Button>
            </div>
          </div>
        </Card>

        {/* Stories Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading stories...</p>
          </div>
        ) : filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <Card
                key={story.id}
                className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:border-purple-500' : 'bg-white border-gray-200 hover:border-purple-300'} transition-all cursor-pointer group`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-purple-600 transition-colors`}>
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          story.approved
                            ? darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'
                            : darkMode ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {story.approved ? (
                            <>
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 inline mr-1" />
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-3`}>
                    {truncateContent(story.content)}
                  </p>

                  {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {story.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 rounded-md text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                        >
                          <Tag className="w-3 h-3 inline mr-1" />
                          {tag}
                        </span>
                      ))}
                      {story.tags.length > 3 && (
                        <span className={`px-2 py-1 rounded-md text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          +{story.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`flex items-center justify-between pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(story.createdAt)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStory(story);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-12 text-center`}>
            <BookOpen className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {searchTerm || filterStatus !== 'all' ? 'No stories found' : 'No stories yet'}
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : "Start sharing your company's journey and achievements!"}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Story
              </Button>
            )}
          </Card>
        )}

        {/* Create Story Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <div
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Create New Story
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                    className={darkMode ? 'text-gray-400 hover:text-white' : ''}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Story Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none`}
                      placeholder="Enter a compelling title for your story"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Story Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={8}
                      className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none`}
                      placeholder="Share your company's story, achievements, culture, or values..."
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formData.content.length} characters
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none`}
                      placeholder="e.g., culture, innovation, team, success"
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Separate multiple tags with commas
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ title: '', content: '', tags: '' });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateStory}
                    disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Story
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedStory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
            <div
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full border-2`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className={`text-2xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delete Story?
                </h2>
                <p className={`text-center mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Are you sure you want to delete "{selectedStory.title}"? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedStory(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteStory}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
