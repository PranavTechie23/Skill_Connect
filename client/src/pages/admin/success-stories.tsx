import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Check, X, Trash2, Mail, Calendar, RefreshCw, Plus, TrendingUp, Clock, CheckCircle, XCircle, BookOpen, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminBackButton, { useAdminEmbedded } from '../../components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { apiFetch } from '../../lib/api';
import { useToast } from '@/hooks/use-toast';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import { Pagination } from '@/components/Pagination';
import {
  adminFormDialogBodyScrollClass,
  adminFormModalCancelBtnClass,
  adminFormModalCloseBtnClass,
  adminFormModalFooterClass,
  adminFormModalFormClass,
  adminFormModalHeaderClass,
  adminFormModalHeaderGradientClass,
  adminFormModalIconWrapClass,
  adminFormModalOverlayClass,
  adminFormModalPanelClass,
  adminFormModalSectionClass,
  adminFormModalSubmitBtnClass,
  adminFormModalSubtitleClass,
  adminFormModalTitleClass,
  adminFormInputClass,
  adminFormLabelClass,
  adminFormTextareaClass,
} from '@/components/admin/admin-form-modal-styles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StoryAudience = 'employee' | 'employer';

/** Maps DB/user labels (Professional, employee, etc.) to filter tab values. */
function normalizeStoryType(raw?: string | null): StoryAudience {
  const value = String(raw ?? '').toLowerCase().trim();
  if (value === 'employer') return 'employer';
  return 'employee';
}

const getStoryAuthorName = (story: any): string => {
  const authorFullName = story.author
    ? `${story.author.firstName || ''} ${story.author.lastName || ''}`.trim()
    : '';
  return (
    authorFullName ||
    story.submitterName ||
    story.submitter_name ||
    story.name ||
    story.submitterEmail ||
    story.submitter_email ||
    'Unknown User'
  );
};

const SuccessStoriesAdmin = () => {
  const { theme: currentTheme } = useTheme();
  const { embedded } = useAdminEmbedded();
  const { toast } = useToast();
  const darkMode = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  interface Story {
    id: number;
    name: string;
    email: string;
    title: string;
    story: string;
    tags: string;
    type: StoryAudience;
    date: string;
    status: 'pending' | 'approved' | 'rejected' | string;
    initials: string;
  }

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const fetchStories = useCallback(async (silent = false) => {
    try {
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const response = await apiFetch(`/api/admin/stories`, { credentials: 'include' });
      if (!response.ok) {
        let detail = '';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const json = await response.json();
            if (json?.debug) {
              detail = `Debug: ${JSON.stringify(json.debug)}`;
            } else {
              detail = (json?.message || json?.error || JSON.stringify(json)) as string;
            }
          } else {
            detail = await response.text();
          }
        } catch {
          // ignore body parsing errors
        }
        throw new Error(`Failed to fetch stories (${response.status}): ${detail || response.statusText}`);
      }
      const data = await response.json();

      const transformedStories = Array.isArray(data) ? data.map((story: any) => {
        let date;
        try {
          date = story.createdAt ? new Date(story.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        } catch {
          date = new Date().toISOString().split('T')[0];
        }

        const authorName = getStoryAuthorName(story);

        return {
          id: story.id,
          name: authorName,
          email: story.submitterEmail || story.submitter_email || '',
          title: story.title,
          story: story.content,
          tags: Array.isArray(story.tags) ? story.tags.join(', ') : '',
          type: normalizeStoryType(story.authorUserType ?? story.author_user_type),
          date,
          status: story.approved ? 'approved' : 'pending',
          initials: authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        };
      }) : [];

      setStories(transformedStories);
    } catch (err: any) {
      console.error('Error fetching stories:', err);
      if (!err?.message?.includes("401")) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stories');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const storiesPerPage = 9;
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
      const response = await apiFetch(`/api/admin/stories/${id}/approve`, {
        method: 'POST',
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
      const response = await apiFetch(`/api/admin/stories/${id}/reject`, {
        method: 'POST',
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

  const requestDelete = (story: Story, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStoryToDelete(story);
  };

  const confirmDelete = async () => {
    if (!storyToDelete) return;

    const { id, title } = storyToDelete;
    setDeleteLoadingId(id);
    try {
      const response = await apiFetch(`/api/admin/stories/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete story');

      setStories((prev) => prev.filter((story) => story.id !== id));
      if (selectedStory?.id === id) setSelectedStory(null);
      setStoryToDelete(null);

      toast({
        title: 'Story deleted',
        description: `"${title.length > 48 ? title.slice(0, 48) + '…' : title}" was removed successfully.`,
        variant: 'success',
      });
    } catch (err) {
      console.error('Error deleting story:', err);
      toast({
        title: 'Delete failed',
        description: 'Could not remove this story. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiFetch(`/api/stories`, {
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
          tags: newStory.tags.split(',').map(tag => tag.trim())
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
        type: normalizeStoryType(createdStory.authorUserType ?? newStory.type),
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

  const totalPages = Math.max(1, Math.ceil(filteredStories.length / storiesPerPage));
  const paginatedStories = filteredStories.slice((currentPage - 1) * storiesPerPage, currentPage * storiesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollDashboardToTop();
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType]);

  const stats = {
    total: stories.length,
    pending: stories.filter(s => s.status === 'pending').length,
    approved: stories.filter(s => s.status === 'approved').length,
    rejected: stories.filter(s => s.status === 'rejected').length
  };

  const theme = {
    bg: darkMode ? 'bg-[#0f1117]' : 'bg-slate-50',
    cardBg: darkMode ? 'bg-[#161b28]/90 backdrop-blur-sm' : 'bg-white',
    cardBorder: darkMode ? 'border-white/[0.06]' : 'border-slate-200/80',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    textSecondary: darkMode ? 'text-slate-400' : 'text-slate-600',
    textMuted: darkMode ? 'text-slate-500' : 'text-slate-500',
    inputBg: darkMode ? 'bg-[#1c2233]' : 'bg-slate-50',
    inputBorder: darkMode ? 'border-white/[0.08]' : 'border-slate-200',
    hover: darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50',
    accent: 'from-violet-600 to-fuchsia-500',
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25',
    approved: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25',
    rejected: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25',
  };

  return (
    <div className={`${embedded ? '' : `min-h-screen ${theme.bg}`}`}>
      {/* Header */}
      <div className={`${embedded ? 'mb-6' : `${theme.cardBg} border-b ${theme.cardBorder}`}`}>
        <div className={`${embedded ? '' : 'max-w-[1600px] mx-auto px-6 py-5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="mr-4"><AdminBackButton /></div>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.accent} flex items-center justify-center shadow-lg shadow-violet-500/20`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${theme.text}`}>Success Stories</h1>
                  <p className={`text-sm mt-0.5 ${theme.textSecondary}`}>Manage and review community success stories</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${theme.accent} shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:brightness-110 transition-all`}
              >
                <Plus size={18} />
                Add Story
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`${embedded ? '' : 'max-w-[1600px] mx-auto px-6 py-6'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${theme.cardBg} rounded-3xl border-2 ${theme.cardBorder} p-6 shadow-lg`}>
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

          <div className={`${theme.cardBg} rounded-3xl border-2 ${theme.cardBorder} p-6 shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-orange-500" />
              </div>
              <Clock size={20} className="text-orange-500" />
            </div>
            <div className={`text-sm ${theme.textSecondary} mb-1`}>Pending Review</div>
            <div className={`text-3xl font-bold ${theme.text}`}>{stats.pending}</div>
          </div>

          <div className={`${theme.cardBg} rounded-3xl border-2 ${theme.cardBorder} p-6 shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <div className={`text-sm ${theme.textSecondary} mb-1`}>Approved</div>
            <div className={`text-3xl font-bold ${theme.text}`}>{stats.approved}</div>
          </div>

          <div className={`${theme.cardBg} rounded-3xl border-2 ${theme.cardBorder} p-6 shadow-lg`}>
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
        <div className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} mb-8 p-4 sm:p-5`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={18} />
              <input
                type="text"
                placeholder="Search by name, title, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 text-sm ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className={`inline-flex p-1 rounded-xl border ${theme.inputBorder} ${theme.inputBg}`}>
                {(['all', 'employee', 'employer'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                      filterType === type
                        ? `bg-gradient-to-r ${theme.accent} text-white shadow-sm`
                        : theme.textSecondary
                    }`}
                  >
                    {type === 'all' ? 'All' : type === 'employee' ? 'Professionals' : 'Employers'}
                  </button>
                ))}
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className={`w-[140px] px-4 py-2.5 text-sm h-auto ${theme.inputBg} ${theme.text} border ${theme.inputBorder} rounded-xl focus:ring-2 focus:ring-violet-500/40 border-slate-200`}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className={`${theme.cardBg} ${theme.cardBorder} rounded-xl shadow-lg`}>
                  <SelectItem value="all" className={`rounded-lg cursor-pointer ${theme.text} ${theme.hover}`}>All Status</SelectItem>
                  <SelectItem value="pending" className={`rounded-lg cursor-pointer ${theme.text} ${theme.hover}`}>Pending</SelectItem>
                  <SelectItem value="approved" className={`rounded-lg cursor-pointer ${theme.text} ${theme.hover}`}>Approved</SelectItem>
                  <SelectItem value="rejected" className={`rounded-lg cursor-pointer ${theme.text} ${theme.hover}`}>Rejected</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => fetchStories(true)}
                disabled={isRefreshing}
                title="Refresh"
                className={`p-2.5 border ${theme.inputBorder} rounded-xl ${theme.hover} transition disabled:opacity-50`}
              >
                <RefreshCw size={18} className={`${theme.textSecondary} ${isRefreshing ? 'animate-spin' : ''}`} />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedStories.map(story => (
            <article
              key={story.id}
              className={`group ${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-5 cursor-pointer transition-all duration-200 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 ${
                selectedStory?.id === story.id ? 'ring-2 ring-violet-500/50 border-violet-500/30' : ''
              }`}
              onClick={() => setSelectedStory(story)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${theme.accent} flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/20`}>
                  <span className="text-white font-semibold text-xs">{story.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`font-semibold ${theme.text} truncate`}>{story.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md flex-shrink-0 ${statusStyles[story.status] || statusStyles.pending}`}>
                      {story.status}
                    </span>
                  </div>
                  {story.email ? (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${theme.textMuted}`}>
                      <Mail size={12} />
                      <span className="truncate">{story.email}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <h4 className={`font-semibold text-sm leading-snug ${theme.text} mb-2 line-clamp-2`}>{story.title.replace(/\s*-\s*[^\s@]+@[^\s@]+\.[^\s@]+$/, '')}</h4>
              <p className={`text-xs leading-relaxed ${theme.textSecondary} line-clamp-3 mb-4`}>{story.story}</p>

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
                    onClick={(e) => requestDelete(story, e)}
                    title="Delete story"
                    className="p-2.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {filteredStories.length === 0 && (
            <div className={`col-span-full ${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-12 text-center`}>
              <Eye size={48} className={`mx-auto ${theme.textMuted} mb-4`} />
              <p className={theme.textSecondary}>No stories found matching your filters.</p>
            </div>
          )}
        </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStories.length}
          itemsPerPage={storiesPerPage}
          onPageChange={handlePageChange}
          itemName="stories"
        />
        

        {/* Detail Modal */}
        {selectedStory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setSelectedStory(null)}>
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
                  onClick={() => requestDelete(selectedStory)}
                  className="px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
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
          <div className={adminFormModalOverlayClass()} onClick={() => setShowAddModal(false)}>
            <div className={adminFormModalPanelClass(darkMode)} onClick={(e) => e.stopPropagation()}>
              <div className={adminFormModalHeaderClass(darkMode)}>
                <div className={adminFormModalHeaderGradientClass(darkMode)} aria-hidden />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-start gap-5">
                    <div className={adminFormModalIconWrapClass()}>
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className={adminFormModalTitleClass(darkMode)}>Add New Success Story</h2>
                      <p className={adminFormModalSubtitleClass(darkMode)}>
                        Share a new success story for review and publication.
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowAddModal(false)} className={adminFormModalCloseBtnClass(darkMode)}>
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className={adminFormModalFormClass()}>
                <div className={adminFormModalSectionClass(darkMode)}>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="name" className={adminFormLabelClass(darkMode)}>Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={newStory.name}
                      onChange={(e) => setNewStory({ ...newStory, name: e.target.value })}
                      className={adminFormInputClass(darkMode)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className={adminFormLabelClass(darkMode)}>Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={newStory.email}
                      onChange={(e) => setNewStory({ ...newStory, email: e.target.value })}
                      className={adminFormInputClass(darkMode)}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label htmlFor="title" className={adminFormLabelClass(darkMode)}>Story Title *</label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={newStory.title}
                      onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                      className={adminFormInputClass(darkMode)}
                      placeholder="Enter a title for your success story"
                    />
                  </div>

                  <div>
                    <label htmlFor="story" className={adminFormLabelClass(darkMode)}>Your Story *</label>
                    <textarea
                      id="story"
                      required
                      value={newStory.story}
                      onChange={(e) => setNewStory({ ...newStory, story: e.target.value })}
                      rows={4}
                      className={adminFormTextareaClass(darkMode)}
                      placeholder="Share your success story..."
                    />
                  </div>

                  <div>
                    <label htmlFor="tags" className={adminFormLabelClass(darkMode)}>Tags</label>
                    <input
                      type="text"
                      id="tags"
                      value={newStory.tags}
                      onChange={(e) => setNewStory({ ...newStory, tags: e.target.value })}
                      className={adminFormInputClass(darkMode)}
                      placeholder="Enter tags separated by commas (e.g., career, growth, learning)"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className={adminFormLabelClass(darkMode)}>Story Type *</label>
                    <select
                      id="type"
                      required
                      value={newStory.type}
                      onChange={(e) => setNewStory({ ...newStory, type: e.target.value })}
                      className={adminFormInputClass(darkMode, 'cursor-pointer')}
                    >
                      <option value="employee">Professional</option>
                      <option value="employer">Employer</option>
                    </select>
                  </div>
                </div>
                </div>

                <div className={adminFormModalFooterClass(darkMode)}>
                <button type="button" onClick={() => setShowAddModal(false)} className={adminFormModalCancelBtnClass(darkMode)}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`${adminFormModalSubmitBtnClass()} flex items-center justify-center gap-2`}
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
              </form>
            </div>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!storyToDelete}
        onOpenChange={(open) => {
          if (!open && !deleteLoadingId) setStoryToDelete(null);
        }}
      >
        <AlertDialogContent className={darkMode ? 'bg-[#1a1f2e] border-white/10 text-slate-100 sm:max-w-md' : 'sm:max-w-md'}>
          <AlertDialogHeader className="items-center sm:items-start text-center sm:text-left">
            <div className="mx-auto sm:mx-0 mb-2 w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center ring-1 ring-rose-500/25">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <AlertDialogTitle className="text-lg">Delete success story?</AlertDialogTitle>
            <AlertDialogDescription className={darkMode ? 'text-slate-400' : ''}>
              {storyToDelete ? (
                <>
                  <span className="font-medium text-foreground/90">&ldquo;{storyToDelete.title}&rdquo;</span>
                  {' '}will be permanently removed. This cannot be undone.
                </>
              ) : (
                'This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={!!deleteLoadingId} className={darkMode ? 'border-white/10 bg-transparent hover:bg-white/5' : ''}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={!!deleteLoadingId}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600 text-white gap-2"
            >
              {deleteLoadingId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete story
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuccessStoriesAdmin;
