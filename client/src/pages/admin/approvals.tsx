import React, { useState, useEffect } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import {
  AlertCircle, Building2, Briefcase, CheckCircle, XCircle, Clock,
  Eye, Mail, MapPin, Calendar, User, Shield, Star, DollarSign,
  Users, FileText, ExternalLink, Filter, Search, ChevronDown,
  ThumbsUp, ThumbsDown, MessageSquare, Info, Zap, Award, Crown
} from 'lucide-react';
import { adminService } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';

interface PendingItem {
  id: string;
  type: 'employer' | 'job' | 'application';
  title: string;
  subtitle: string;
  submittedBy: string;
  submittedDate: string;
  status: 'pending';
  priority: 'high' | 'medium' | 'low';
  details: any;
}

const AdminApprovals: React.FC = () => {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'employer' | 'job'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const { toast } = useToast();

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await adminService.getApprovals();
      setPendingItems(data);
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
      toast({ title: "Error", description: "Could not fetch pending approvals.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const filteredItems = pendingItems.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const employerCount = pendingItems.filter(i => i.type === 'employer').length;
  const jobCount = pendingItems.filter(i => i.type === 'job').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-rose-600';
      case 'medium': return 'from-amber-500 to-orange-600';
      case 'low': return 'from-blue-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const handleUpdateApproval = async (itemId: string, status: 'approved' | 'rejected') => {
    try {
      await adminService.updateApproval(itemId, status);
      toast({ title: "Success", description: `Item has been ${status}.` });
      fetchApprovals(); // Refresh list
      if (selectedItem?.id === itemId) setSelectedItem(null);
    } catch (error) {
      console.error(`Failed to ${status} item:`, error);
      toast({ title: "Error", description: `Could not update item status.`, variant: "destructive" });
    }
  };

  return (
    <div className={`min-h-screen p-8 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4"><AdminBackButton /></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/50 animate-pulse-slow">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Pending Approvals
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Review and approve pending submissions</p>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-2xl shadow-orange-500/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-semibold mb-2">Total Pending Items</p>
                <p className="text-5xl font-black">{pendingItems.length}</p>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2">
                    <Building2 className="w-10 h-10" />
                  </div>
                  <p className="text-3xl font-black">{employerCount}</p>
                  <p className="text-sm text-white/90">Employers</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2">
                    <Briefcase className="w-10 h-10" />
                  </div>
                  <p className="text-3xl font-black">{jobCount}</p>
                  <p className="text-sm text-white/90">Job Postings</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 mb-8 border-2`}>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by company name, job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl focus:border-amber-500 outline-none transition-all font-medium ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                } border-2`}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({pendingItems.length})
              </button>
              <button
                onClick={() => setFilter('employer')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filter === 'employer'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Employers ({employerCount})
              </button>
              <button
                onClick={() => setFilter('job')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filter === 'job'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Jobs ({jobCount})
              </button>
            </div>
          </div>
        </div>

        {/* Pending Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border-2 overflow-hidden ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-amber-500/50' 
                  : 'bg-white border-gray-100 hover:border-amber-300'
              }`}
            >
              {/* Priority Banner */}
              <div className={`h-2 bg-gradient-to-r ${getPriorityColor(item.priority)}`}></div>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${
                      item.type === 'employer'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {item.type === 'employer' ? (
                        <Building2 className="w-8 h-8" />
                      ) : (
                        <Briefcase className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          darkMode ? (
                            item.type === 'employer'
                              ? 'bg-purple-900/30 text-purple-400'
                              : 'bg-blue-900/30 text-blue-400'
                          ) : (
                            item.type === 'employer'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          )
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.subtitle}</p>
                      <div className={`flex items-center gap-3 mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {item.submittedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {item.submittedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                    item.priority === 'high'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : (item.priority || 'low') === 'medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {(item.priority || 'low').toUpperCase()}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {item.type === 'employer' ? (
                    <>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Company Size</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.companySize || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Industry</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.industry || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl col-span-2 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                        <p className={`text-sm font-bold flex items-center gap-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          <MapPin className="w-4 h-4" />
                          {item.details?.location || 'N/A'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Salary</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.salary || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.type || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.location || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Experience</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.experience || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className={`flex gap-3 pt-4 border-t-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleUpdateApproval(item.id, 'rejected')}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border-2 ${
                      darkMode
                        ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border-red-900/50'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleUpdateApproval(item.id, 'approved')}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/30"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className={`rounded-3xl shadow-xl p-12 text-center border-2 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              darkMode
                ? 'bg-gradient-to-br from-gray-700 to-gray-600'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
            }`}>
              <CheckCircle className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Clear!</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No pending approvals matching your filters.</p>
          </div>
        )}

        {/* Detail Modal (if item selected) */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8">
            <div className={`rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Review Details</h2>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className={`p-2 rounded-xl transition-all ${
                      darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className={`text-sm font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SUBMISSION TYPE</p>
                    <span className={`inline-block px-4 py-2 rounded-xl font-bold ${
                      darkMode ? (
                        selectedItem.type === 'employer'
                          ? 'bg-purple-900/30 text-purple-400'
                          : 'bg-blue-900/30 text-blue-400'
                      ) : (
                        selectedItem.type === 'employer'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      )
                    }`}>
                      {selectedItem.type.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <p className={`text-sm font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>TITLE</p>
                    <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.title}</p>
                  </div>

                  <div>
                    <p className={`text-sm font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SUBMITTED BY</p>
                    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.submittedBy}</p>
                  </div>

                  <div>
                    <p className={`text-sm font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>DETAILS</p>
                    <div className={`rounded-2xl p-6 space-y-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      {Object.entries(selectedItem.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className={`font-semibold capitalize ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={() => {
                        handleUpdateApproval(selectedItem.id, 'rejected');
                        setSelectedItem(null);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all border-2 ${
                        darkMode
                          ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border-red-900/50'
                          : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                      }`}
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateApproval(selectedItem.id, 'approved');
                        setSelectedItem(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/30"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
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

export default AdminApprovals;