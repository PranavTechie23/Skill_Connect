import React, { useState, useEffect } from 'react';
import AdminBackButton, { useAdminEmbedded } from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { Building2, Search, Plus, Edit, Trash2, MapPin, CheckCircle, XCircle, Clock, ExternalLink, ChevronLeft, ChevronRight, RefreshCw, Ban, ShieldOff } from 'lucide-react';
import { adminService, type CreateCompanyData, type CompanyModerationStatus } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import AddCompanyModal from '@/pages/admin/AddCompanyModal';
import EditCompanyModal from '@/pages/admin/EditCompanyModal';
import DeleteCompanyModal from '@/pages/admin/DeleteCompanyModal';
import { Pagination } from '@/components/Pagination';
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
  const [filterIndustry, setFilterIndustry] = useState('All Industries');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const { toast } = useToast();

  const selectInputClass = `px-4 py-2.5 border-2 rounded-2xl text-sm font-bold cursor-pointer focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ${
    darkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-white hover:border-gray-300'
  }`;

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
          <div className={`p-5 sm:p-6 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
              <div className="relative w-full xl:w-1/2 shrink-0">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search companies by name, industry, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-11 py-3 ${
                    darkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white'
                  } border-2 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-medium`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                      darkMode ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                    }`}
                    aria-label="Clear search"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 w-full xl:w-1/2 xl:justify-end">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | CompanyModerationStatus)}
                    className={`${selectInputClass} min-w-[140px] flex-1 sm:flex-none`}
                    aria-label="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                    <option value="blocked">Blocked</option>
                  </select>

                  {/* Industry Filter */}
                  <select
                    value={filterIndustry}
                    onChange={(e) => setFilterIndustry(e.target.value)}
                    className={`${selectInputClass} min-w-[140px] flex-1 sm:flex-none`}
                    aria-label="Filter by industry"
                  >
                    <option value="All Industries">All Industries</option>
                    {uniqueIndustries.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={fetchCompanies}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 sm:flex-none ${
                    darkMode ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border-2 border-white/10' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                  }`}
                  title="Refresh list"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {paginatedCompanies.map((company) => {
                const statusConfig = getStatusConfig(company.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div
                    key={company.id}
                    className={`border rounded-xl p-6 transition-all flex flex-col ${
                      darkMode
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCompanies.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            itemName="companies"
          />
        </div>
      </div>
    </div>
    </>
  );
}