import React, { useState, useEffect, useRef } from 'react';
import AdminBackButton, { useAdminEmbedded } from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { Building2, Search, Plus, Edit, Trash2, MapPin, CheckCircle, XCircle, Clock, ExternalLink, ChevronLeft, ChevronRight, RefreshCw, Ban, ShieldOff, MoreHorizontal, ChevronDown } from 'lucide-react';
import { adminService, type CreateCompanyData, type CompanyModerationStatus } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import AddCompanyModal from '@/pages/admin/AddCompanyModal';
import EditCompanyModal from '@/pages/admin/EditCompanyModal';
import DeleteCompanyModal from '@/pages/admin/DeleteCompanyModal';
import type { UpdateCompanyData } from '@/lib/admin-service';

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  website: string;
  size: string;
  status: CompanyModerationStatus;
  createdAt: string;
  logo?: string;
}

/** Company management panel (also mounted from admin dashboard tab `companies`). */
export default function AdminCompanies() {
  const { theme } = useTheme();
  const { embedded } = useAdminEmbedded();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | CompanyModerationStatus>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const actionsDropdownRef = useRef<HTMLDivElement | null>(null);
  const [filterIndustry, setFilterIndustry] = useState('All Industries');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
        setActionsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      toast({ title: "Error", description: "Could not fetch company data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleUpdateStatus = async (companyId: string, status: CompanyModerationStatus) => {
    try {
      await adminService.updateCompany(companyId, { status });
      toast({ title: "Success", description: `Company marked as ${status}.`, variant: 'success' });
      setActionsDropdownOpen(false);
      fetchCompanies();
    } catch (error) {
      console.error("Failed to update company status:", error);
      toast({ title: "Error", description: "Could not update company status.", variant: "destructive" });
    }
  };

  const handleAddCompany = async (data: CreateCompanyData): Promise<void> => {
    try {
      await adminService.createCompany(data);
      toast({
        title: 'Success',
        description: 'Company created successfully.',
        variant: 'success',
      });
      setShowAddCompany(false);
      await fetchCompanies();
    } catch (error) {
      console.error('Failed to create company:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to create company. Please try again.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleEditCompany = async (id: string, data: UpdateCompanyData): Promise<void> => {
    try {
      await adminService.updateCompany(id, data);
      toast({
        title: 'Success',
        description: 'Company updated successfully.',
        variant: 'success',
      });
      setCompanyToEdit(null);
      await fetchCompanies();
    } catch (error) {
      console.error('Failed to update company:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to update company. Please try again.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteCompany = async (id: string, reason: string): Promise<void> => {
    try {
      await adminService.deleteCompany(id, reason);
      toast({
        title: 'Success',
        description: 'Company deleted successfully.',
        variant: 'success',
      });
      setCompanyToDelete(null);
      if (selectedCompanyId === id) setSelectedCompanyId(null);
      await fetchCompanies();
    } catch (error) {
      console.error('Failed to delete company:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to delete company. Please try again.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || company.status === filterStatus;
    const matchesIndustry = filterIndustry === 'All Industries' || company.industry === filterIndustry;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueIndustries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean))).sort();
  const selectedCompany = selectedCompanyId
    ? companies.find((c) => c.id === selectedCompanyId) ?? null
    : null;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterIndustry]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollDashboardToTop();
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      approved: { color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', icon: CheckCircle },
      pending: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', icon: Clock },
      rejected: { color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: XCircle },
      suspended: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', icon: ShieldOff },
      blocked: { color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400', icon: Ban },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const quickStatusActions: { status: CompanyModerationStatus; label: string; icon: typeof CheckCircle }[] = [
    { status: 'approved', label: 'Approve', icon: CheckCircle },
    { status: 'pending', label: 'Mark Pending', icon: Clock },
    { status: 'suspended', label: 'Suspend', icon: ShieldOff },
    { status: 'blocked', label: 'Block', icon: Ban },
    { status: 'rejected', label: 'Reject', icon: XCircle },
  ];

  const stats = {
    total: companies.length,
    approved: companies.filter((c) => c.status === 'approved').length,
    pending: companies.filter((c) => c.status === 'pending').length,
    rejected: companies.filter((c) => c.status === 'rejected').length,
    suspended: companies.filter((c) => c.status === 'suspended').length,
    blocked: companies.filter((c) => c.status === 'blocked').length,
  };

  return (
    <>
      <AddCompanyModal
        isOpen={showAddCompany}
        onClose={() => setShowAddCompany(false)}
        onSubmit={handleAddCompany}
        darkMode={darkMode}
      />
      <EditCompanyModal
        isOpen={companyToEdit !== null}
        onClose={() => setCompanyToEdit(null)}
        onSubmit={handleEditCompany}
        darkMode={darkMode}
        company={companyToEdit}
      />
      <DeleteCompanyModal
        isOpen={companyToDelete !== null}
        onClose={() => setCompanyToDelete(null)}
        onSubmit={handleDeleteCompany}
        darkMode={darkMode}
        company={companyToDelete}
      />
    <div className={`${embedded ? '' : `min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} p-8`}`}>
      <div className={`${embedded ? 'space-y-6' : 'max-w-7xl mx-auto'}`}>
        <div className={`${embedded ? 'mb-6' : 'mb-8'}`}>
          <div className="mb-4"><AdminBackButton /></div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/40">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-4xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'}`}>Companies Management</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage and verify company accounts</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCompany(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-800 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Company
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
            {loading ? (
              Array(6).fill(0).map((_, idx) => (
                <div key={idx} className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 animate-pulse`}>
                  <div className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-gray-700 mb-4"></div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))
            ) : (
              [
                { label: 'Total Companies', value: stats.total, icon: Building2, accent: 'from-purple-500 to-indigo-600' },
                { label: 'Approved', value: stats.approved, icon: CheckCircle, accent: 'from-green-500 to-emerald-600' },
                { label: 'Pending', value: stats.pending, icon: Clock, accent: 'from-amber-500 to-orange-600' },
                { label: 'Rejected', value: stats.rejected, icon: XCircle, accent: 'from-red-500 to-rose-600' },
                { label: 'Suspended', value: stats.suspended, icon: ShieldOff, accent: 'from-orange-500 to-amber-600' },
                { label: 'Blocked', value: stats.blocked, icon: Ban, accent: 'from-rose-600 to-red-700' },
              ].map((stat) => (
                <div key={stat.label} className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.accent} shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold mb-1`}>{stat.label}</p>
                  <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div data-floating-menu="true" className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-xl border-2 w-full`}>
          {/* Search and Filter Bar */}
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search companies by name, industry, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-11 pr-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {/* Status Filter Dropdown */}
                <div className="relative shrink-0 z-10" ref={statusDropdownRef}>
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className={`px-5 py-4 flex items-center justify-between min-w-[150px] ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    } border-2 rounded-xl font-bold text-sm cursor-pointer transition-all hover:shadow-md`}
                  >
                    <span className="capitalize">{filterStatus === 'all' ? 'All Status' : filterStatus}</span>
                    <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {statusDropdownOpen && (
                    <div className={`absolute top-full right-0 mt-2 w-full min-w-[160px] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 border-2 ${
                      darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'
                    }`}>
                      <div className="py-1">
                        {[
                          { key: 'all' as const, label: 'All Status' },
                          { key: 'approved' as const, label: 'Approved' },
                          { key: 'pending' as const, label: 'Pending' },
                          { key: 'rejected' as const, label: 'Rejected' },
                          { key: 'suspended' as const, label: 'Suspended' },
                          { key: 'blocked' as const, label: 'Blocked' },
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            onClick={() => {
                              setFilterStatus(btn.key);
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${
                              filterStatus === btn.key 
                                ? (darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-700')
                                : (darkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-50')
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Company status actions — select a card first */}
                <div className="relative shrink-0 z-20" ref={actionsDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedCompany) {
                        toast({
                          title: 'Select a company',
                          description: 'Click a company card below, then choose an action here.',
                        });
                        return;
                      }
                      setActionsDropdownOpen((v) => !v);
                      setStatusDropdownOpen(false);
                    }}
                    className={`px-5 py-4 flex items-center gap-2 min-w-[200px] border-2 rounded-xl font-bold text-sm transition-all ${
                      selectedCompany
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent hover:shadow-lg hover:shadow-purple-500/25'
                        : darkMode
                          ? 'bg-gray-700/60 border-gray-600 text-gray-400 cursor-pointer'
                          : 'bg-gray-100 border-gray-200 text-gray-400 cursor-pointer'
                    }`}
                  >
                    <MoreHorizontal className="w-5 h-5 shrink-0" />
                    <span className="truncate flex-1 text-left">
                      {selectedCompany ? selectedCompany.name : 'Quick Actions'}
                    </span>
                    <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${actionsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {actionsDropdownOpen && selectedCompany && (
                    <div
                      data-floating-menu
                      className={`absolute top-full right-0 mt-2 w-64 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 border-2 ${
                        darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'
                      }`}
                    >
                      <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Set status
                        </p>
                        <p className={`text-sm font-bold truncate mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedCompany.name}
                        </p>
                      </div>
                      <div className="py-1">
                        {quickStatusActions.map((action) => {
                          const Icon = action.icon;
                          const isActive = selectedCompany.status === action.status;
                          return (
                            <button
                              key={action.status}
                              type="button"
                              disabled={isActive}
                              onClick={() => handleUpdateStatus(selectedCompany.id, action.status)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left transition-colors ${
                                isActive
                                  ? darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700'
                                  : darkMode ? 'text-gray-200 hover:bg-gray-700/60' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              {action.label}
                              {isActive && <CheckCircle className="w-4 h-4 ml-auto shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Industry Filter */}
                <select
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className={`px-5 py-3 border-2 rounded-xl font-semibold text-sm cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="All Industries">All Industries</option>
                  {uniqueIndustries.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>

                {/* Refresh */}
                <button
                  onClick={fetchCompanies}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Companies List */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>No companies found</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <>
              {selectedCompany && (
                <div className={`mx-6 mt-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
                  darkMode ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'bg-purple-50 text-purple-800 border border-purple-100'
                }`}>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{selectedCompany.name}</strong> selected — use <strong>Quick Actions</strong> above to change status
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCompanyId(null)}
                    className={`ml-auto text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'}`}
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {paginatedCompanies.map((company) => {
                const statusConfig = getStatusConfig(company.status);
                const StatusIcon = statusConfig.icon;
                const isSelected = selectedCompanyId === company.id;
                return (
                  <div
                    key={company.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCompanyId(company.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCompanyId(company.id); }}
                    className={`border rounded-xl p-6 transition-all flex flex-col cursor-pointer ${
                      isSelected
                        ? darkMode
                          ? 'border-purple-500 ring-2 ring-purple-500/40 bg-purple-500/5'
                          : 'border-purple-500 ring-2 ring-purple-200 bg-purple-50/50'
                        : darkMode
                          ? 'border-gray-700 hover:border-purple-500/50 bg-gray-800/50'
                          : 'border-gray-200 hover:border-purple-300 bg-white'
                    } hover:shadow-lg`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</h3>
                            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusConfig.color}`}>
                              <StatusIcon className="w-4 h-4" />
                              {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="font-semibold truncate">{company.industry || 'N/A'}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="font-semibold truncate">{company.location || 'N/A'}</span>
                            </div>
                          </div>

                          <div className={`rounded-2xl p-4 mb-4 ${darkMode ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="min-w-0">
                                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Website</p>
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`text-sm font-semibold flex items-center gap-1 min-w-0 ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}
                                >
                                  <span className="truncate">{company.website || 'N/A'}</span> <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              </div>
                              <div>
                                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Company Size</p>
                                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.size || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Bottom Bar */}
                    <div className={`mt-auto flex items-center justify-between gap-4 rounded-xl border p-2 pl-4 ${
                      darkMode ? 'border-gray-600 bg-gray-700/40' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Joined {new Date(company.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCompanyToEdit(company); }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCompanyToDelete(company); }}
                          title="Delete"
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Showing <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.min(currentPage * itemsPerPage, filteredCompanies.length)}</span> of <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{filteredCompanies.length}</span> companies
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      currentPage === 1
                        ? (darkMode ? 'bg-gray-700/50 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600 hover:shadow-md' : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700')
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="items-center gap-1.5 hidden sm:flex">
                    {(() => {
                      const getVisiblePages = (current: number, total: number) => {
                        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
                        if (current <= 3) return [1, 2, 3, 4, '...', total];
                        if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
                        return [1, '...', current - 1, current, current + 1, '...', total];
                      };
                      return getVisiblePages(currentPage, totalPages).map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className={`px-2 font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>…</span>
                        ) : (
                          <button
                            key={`page-${page}`}
                            onClick={() => handlePageChange(page as number)}
                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-105'
                                : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300')
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ));
                    })()}
                  </div>
                  {/* Mobile page indicator */}
                  <span className={`sm:hidden text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      currentPage === totalPages
                        ? (darkMode ? 'bg-gray-700/50 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600 hover:shadow-md' : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700')
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}