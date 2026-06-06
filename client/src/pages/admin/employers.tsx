import React, { useEffect, useState } from 'react';
import AdminBackButton, { useAdminEmbedded } from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  Copy,
  Edit,
  Eye,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { adminService, type CreateCompanyData } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  adminFormDialogBodyScrollClass,
  adminFormDialogContentClass,
  adminFormDialogFooterClass,
  adminFormDialogHeaderClass,
  adminFormInputClass,
  adminFormInputWithIconClass,
  adminFormLabelClass,
  adminFormModalIconWrapClass,
  adminFormModalSectionClass,
  adminFormModalSubtitleClass,
  adminFormModalTitleClass,
  adminFormModalHeaderGradientClass,
  adminFormTextareaClass,
} from '@/components/admin/admin-form-modal-styles';

interface CompanyApiResponse {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  location?: string | null;
  industry?: string | null;
  size?: string | null;
  ownerId?: string | null;
  createdAt?: string | null;
  ownerEmail?: string | null;
  ownerFirstName?: string | null;
  ownerLastName?: string | null;
  jobPostings?: number | string | null;
  status?: string | null;
}

interface Company {
  id: string;
  name: string;
  email: string;
  ownerName: string;
  location: string;
  industry: string;
  size: string;
  description: string;
  jobPostings: number;
  employees: number;
  founded: string;
  website: string;
  status: 'approved' | 'pending' | 'rejected';
  verified: boolean;
  logo: string;
  color: string;
  createdAt: string;
  ownerId: string | null;
}

interface CompanyFormState {
  name: string;
  industry: string;
  location: string;
  website: string;
  size: string;
  description: string;
}

const EMPTY_COMPANY_FORM: CompanyFormState = {
  name: '',
  industry: '',
  location: '',
  website: '',
  size: '',
  description: '',
};

const COMPANY_COLORS = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];

const normalizeWebsite = (value: string) => {
  if (!value.trim()) return '';
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
};

const toDisplayValue = (value?: string | null, fallback = 'N/A') => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const toFoundedYear = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : String(date.getFullYear());
};

const toCompanyInitials = (name: string) => {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

const toStatus = (status?: string | null, ownerId?: string | null): Company['status'] => {
  if (status === 'rejected') return 'rejected';
  if (status === 'approved') return 'approved';
  if (status === 'pending') return 'pending';
  return ownerId ? 'approved' : 'pending';
};

const toJobPostingsCount = (company: CompanyApiResponse): number => {
  const raw =
    company.jobPostings ??
    (company as CompanyApiResponse & { job_postings?: number | string | null }).job_postings;
  if (raw == null) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapCompany = (company: CompanyApiResponse, index: number): Company => {
  const status = toStatus(company.status, company.ownerId);
  const ownerName = [company.ownerFirstName, company.ownerLastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return {
    id: String(company.id),
    name: toDisplayValue(company.name, 'Unnamed Company'),
    email: toDisplayValue(company.ownerEmail, 'Not assigned'),
    ownerName: ownerName || 'Unassigned owner',
    location: toDisplayValue(company.location),
    industry: toDisplayValue(company.industry),
    size: toDisplayValue(company.size),
    description: toDisplayValue(company.description, 'No company description provided yet.'),
    jobPostings: toJobPostingsCount(company),
    employees: 0,
    founded: toFoundedYear(company.createdAt),
    website: toDisplayValue(company.website),
    status,
    verified: status === 'approved',
    logo: toCompanyInitials(company.name || ''),
    color: COMPANY_COLORS[index % COMPANY_COLORS.length],
    createdAt: company.createdAt || '',
    ownerId: company.ownerId || null,
  };
};

export default function CompaniesManagement() {
  const { embedded } = useAdminEmbedded();
  const { theme } = useTheme();
  const { toast } = useToast();
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('All Industries');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(EMPTY_COMPANY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCompanies();
      const normalizedCompanies = Array.isArray(data)
        ? data.map((company: CompanyApiResponse, index: number) => mapCompany(company, index))
        : [];
      setCompanies(normalizedCompanies);
    } catch (error: any) {
      console.error('Failed to fetch companies:', error);
      if (!error?.message?.includes("401")) {
        toast({ title: 'Error', description: 'Could not fetch company data.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const resetCompanyForm = () => {
    setCompanyForm(EMPTY_COMPANY_FORM);
    setEditingCompany(null);
    setFormError(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = event.target;
    setCompanyForm((current) => ({ ...current, [id]: value }));
  };

  const openCreateCompanyDialog = () => {
    resetCompanyForm();
    setIsFormOpen(true);
  };

  const openEditCompanyDialog = (company: Company) => {
    setEditingCompany(company);
    setCompanyForm({
      name: company.name === 'Unnamed Company' ? '' : company.name,
      industry: company.industry === 'N/A' ? '' : company.industry,
      location: company.location === 'N/A' ? '' : company.location,
      website: company.website === 'N/A' ? '' : company.website,
      size: company.size === 'N/A' ? '' : company.size,
      description: company.description === 'No company description provided yet.' ? '' : company.description,
    });
    setFormError(null);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  const openCompanyDetails = (company: Company) => {
    setSelectedCompany(company);
    setIsDetailsOpen(true);
  };

  const buildCompanyPayload = (): CreateCompanyData | null => {
    const name = companyForm.name.trim();
    if (!name) {
      setFormError('Company name is required.');
      return null;
    }

    const normalizedWebsite = normalizeWebsite(companyForm.website);
    if (companyForm.website.trim() && !normalizedWebsite) {
      setFormError('Please enter a valid website URL.');
      return null;
    }

    setFormError(null);

    return {
      name,
      industry: companyForm.industry.trim() || undefined,
      location: companyForm.location.trim() || undefined,
      website: normalizedWebsite || undefined,
      size: companyForm.size.trim() || undefined,
      description: companyForm.description.trim() || undefined,
    };
  };

  const handleSaveCompany = async () => {
    const payload = buildCompanyPayload();
    if (!payload) return;

    setFormLoading(true);
    try {
      if (editingCompany) {
        await adminService.updateCompany(editingCompany.id, payload);
        toast({ title: 'Success', description: 'Company updated successfully.' });
      } else {
        await adminService.createCompany(payload);
        toast({ title: 'Success', description: 'Company added successfully.' });
      }

      setIsFormOpen(false);
      resetCompanyForm();
      await fetchCompanies();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Failed to save company:', message);
      setFormError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    setDeleteLoadingId(companyToDelete.id);
    try {
      await adminService.deleteCompany(companyToDelete.id);
      toast({ title: 'Success', description: 'Company deleted successfully.' });
      if (selectedCompany?.id === companyToDelete.id) {
        setSelectedCompany(null);
        setIsDetailsOpen(false);
      }
      setCompanyToDelete(null);
      await fetchCompanies();
    } catch (error) {
      console.error('Failed to delete company:', error);
      toast({ title: 'Error', description: 'Failed to delete company.', variant: 'destructive' });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleCopyToClipboard = async (value: string, label: string) => {
    if (!value || value === 'N/A' || value === 'Not assigned') {
      toast({ title: 'Nothing to copy', description: `${label} is not available yet.` });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Copied', description: `${label} copied to clipboard.` });
    } catch (error) {
      console.error(`Failed to copy ${label}:`, error);
      toast({ title: 'Error', description: `Could not copy ${label}.`, variant: 'destructive' });
    }
  };

  const handleOpenWebsite = (company: Company) => {
    const website = company.website === 'N/A' ? '' : company.website;
    const normalizedWebsite = normalizeWebsite(website);

    if (!normalizedWebsite) {
      toast({ title: 'Website unavailable', description: 'This company does not have a valid website yet.' });
      return;
    }

    window.open(normalizedWebsite, '_blank', 'noopener,noreferrer');
  };

  const filteredCompanies = companies.filter((company) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      company.name.toLowerCase().includes(query) ||
      company.location.toLowerCase().includes(query) ||
      company.industry.toLowerCase().includes(query);
    const matchesFilter = filterIndustry === 'All Industries' || company.industry === filterIndustry;
    return matchesSearch && matchesFilter;
  });

  const industryOptions = [
    'All Industries',
    ...Array.from(new Set(companies.map((company) => company.industry).filter((industry) => industry !== 'N/A'))).sort(),
  ];

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((company) => company.status === 'approved').length;
  const totalJobPostings = companies.reduce((sum, company) => sum + company.jobPostings, 0);

  const stats = [
    { label: 'Total Companies', value: totalCompanies.toLocaleString(), change: 'All registered companies', icon: Building2, color: 'bg-purple-500', bgLight: 'bg-purple-50' },
    { label: 'Active Companies', value: activeCompanies.toLocaleString(), change: `${totalCompanies > 0 ? Math.round((activeCompanies / totalCompanies) * 100) : 0}% active`, icon: Users, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
    { label: 'Linked Job Posts', value: totalJobPostings.toLocaleString(), change: 'Attached to company profiles', icon: Briefcase, color: 'bg-orange-500', bgLight: 'bg-orange-50' },
    { label: 'Total Employees', value: 'N/A', change: 'Across all companies', icon: TrendingUp, color: 'bg-green-500', bgLight: 'bg-green-50' },
  ];

  return (
    <div className={`${embedded ? '' : `min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}`}>
      <div className={`${embedded ? 'mb-6' : `${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'} border-b`}`}>
        <div className={`${embedded ? 'px-0 py-0' : 'max-w-7xl mx-auto px-6 py-6'}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="mr-4">
                <AdminBackButton />
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Companies Management</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage and monitor registered companies</p>
              </div>
            </div>
            <button
              onClick={openCreateCompanyDialog}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-900/20"
            >
              <Plus className="w-5 h-5" />
              Add Company
            </button>
          </div>
        </div>
      </div>

      <div className={`${embedded ? 'w-full px-0 py-0' : 'max-w-7xl mx-auto px-6 py-8'}`}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`${darkMode ? stat.color + '/20' : stat.bgLight} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className={`w-2 h-2 rounded-full ${stat.color} animate-pulse`}></div>
              </div>
              <div>
                <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>{stat.label}</h3>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stat.value}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-lg border-2`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search companies by name, location, or industry..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <select
                value={filterIndustry}
                onChange={(event) => setFilterIndustry(event.target.value)}
                className={`px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none cursor-pointer ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {industryOptions.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <Building2 className={`w-16 h-16 ${darkMode ? 'text-gray-700' : 'text-gray-300'} mx-auto mb-4 animate-pulse`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading companies...</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredCompanies.map((company) => {
                  const isDeleting = deleteLoadingId === company.id;
                  const statusClasses = darkMode
                    ? company.status === 'approved'
                      ? 'bg-green-500/20 text-green-400 border-green-500/20'
                      : company.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                      : 'bg-red-500/20 text-red-400 border-red-500/20'
                    : company.status === 'approved'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : company.status === 'pending'
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-red-100 text-red-700 border-red-200';

                  return (
                    <div
                      key={company.id}
                      className={`${
                        darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'
                      } rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all relative group border-2`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div
                            className={`${company.color} w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0`}
                          >
                            {company.logo}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{company.name}</h3>
                              {company.verified && <Award className="w-5 h-5 text-blue-500" aria-label="Verified Company" />}
                            </div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold flex items-center gap-2`}>
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{company.email}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${statusClasses}`}>{company.status}</span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                            darkMode ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          {company.industry}
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                            darkMode ? 'bg-slate-500/10 text-slate-200 border-white/10' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          {company.size}
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                            darkMode ? 'bg-slate-500/10 text-slate-200 border-white/10' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {company.location}
                        </span>
                      </div>

                      <div className={`mt-4 grid grid-cols-3 gap-4 rounded-lg p-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Job Posts</p>
                          <p className="font-black text-purple-500">{company.jobPostings}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Employees</p>
                          <p className={`font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.employees}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Founded</p>
                          <p className={`font-semibold text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.founded}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => openCompanyDetails(company)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg transition-colors text-sm font-medium ${
                            darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => openEditCompanyDialog(company)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                          title="Edit company"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCompanyToDelete(company)}
                          disabled={isDeleting}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'
                          } ${isDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title="Delete company"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                              title="More actions"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openCompanyDetails(company)}>
                              <Eye className="w-4 h-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openEditCompanyDialog(company)}>
                              <Edit className="w-4 h-4" />
                              Edit company
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleOpenWebsite(company)} disabled={company.website === 'N/A'}>
                              <ExternalLink className="w-4 h-4" />
                              Open website
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleCopyToClipboard(company.id, 'Company ID')}>
                              <Copy className="w-4 h-4" />
                              Copy company ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleCopyToClipboard(company.email, 'Contact email')}>
                              <Mail className="w-4 h-4" />
                              Copy contact email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCompanies.length === 0 && (
                <div className="p-12 text-center">
                  <Building2 className={`w-16 h-16 ${darkMode ? 'text-gray-700' : 'text-gray-300'} mx-auto mb-4`} />
                  <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No companies found</p>
                  <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!formLoading && !open) {
            resetCompanyForm();
          }
          setIsFormOpen(open);
        }}
      >
        <DialogContent className={adminFormDialogContentClass(darkMode)}>
          <DialogHeader className={adminFormDialogHeaderClass(darkMode)}>
            <div className={adminFormModalHeaderGradientClass(darkMode)} aria-hidden />
            <div className="relative flex items-start gap-5 pr-10">
              <div className={adminFormModalIconWrapClass()}>
                <Building2 className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <DialogTitle className={adminFormModalTitleClass(darkMode)}>
                  {editingCompany ? 'Edit Company' : 'Add New Company'}
                </DialogTitle>
                <DialogDescription className={adminFormModalSubtitleClass(darkMode)}>
                  {editingCompany
                    ? 'Update the core company details below.'
                    : 'Add the essential company details in a clean, simple profile.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveCompany();
            }}
            className={`grid gap-4 ${adminFormDialogBodyScrollClass()} px-8 py-5`}
          >
            {formError && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  darkMode ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {formError}
              </div>
            )}

            <div className={adminFormModalSectionClass(darkMode)}>
              <div className="mb-3">
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${darkMode ? 'text-violet-200/80' : 'text-violet-700/80'}`}>
                  Company Details
                </p>
                <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Keep it concise and clear.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="name" className={adminFormLabelClass(darkMode)}>
                    Company Name
                  </Label>
                  <Input
                    id="name"
                    value={companyForm.name}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    className={adminFormInputClass(darkMode, 'shadow-none')}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="industry" className={adminFormLabelClass(darkMode)}>
                      Industry
                    </Label>
                    <Input
                      id="industry"
                      value={companyForm.industry}
                      onChange={handleInputChange}
                      placeholder="Technology"
                      className={adminFormInputClass(darkMode, 'shadow-none')}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="size" className={adminFormLabelClass(darkMode)}>
                      Company Size
                    </Label>
                    <Input
                      id="size"
                      value={companyForm.size}
                      onChange={handleInputChange}
                      placeholder="e.g. 50-200"
                      className={adminFormInputClass(darkMode, 'shadow-none')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="location" className={adminFormLabelClass(darkMode)}>
                      Location
                    </Label>
                    <div className="relative">
                      <MapPin className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                      <Input
                        id="location"
                        value={companyForm.location}
                        onChange={handleInputChange}
                        placeholder="Mumbai, Pune"
                        className={adminFormInputWithIconClass(darkMode, 'shadow-none')}
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="website" className={adminFormLabelClass(darkMode)}>
                      Website
                    </Label>
                    <div className="relative">
                      <Globe className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                      <Input
                        id="website"
                        value={companyForm.website}
                        onChange={handleInputChange}
                        placeholder="company.com"
                        className={adminFormInputWithIconClass(darkMode, 'shadow-none')}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="description" className={adminFormLabelClass(darkMode)}>
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={companyForm.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Write a short description about the company."
                    className={adminFormTextareaClass(darkMode, 'shadow-none')}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className={adminFormDialogFooterClass(darkMode)}>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetCompanyForm();
                }}
                className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold transition-all sm:w-auto ${
                  darkMode
                    ? 'bg-white/8 text-slate-200 hover:bg-white/12'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-all sm:w-auto ${
                  formLoading
                    ? 'cursor-not-allowed bg-violet-400/70'
                    : 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 shadow-[0_18px_40px_rgba(139,92,246,0.38)] hover:translate-y-[-1px] hover:shadow-[0_22px_50px_rgba(139,92,246,0.45)]'
                }`}
              >
                {formLoading ? (editingCompany ? 'Saving...' : 'Adding...') : editingCompany ? 'Save Changes' : 'Save Company'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) setSelectedCompany(null);
        }}
      >
        <DialogContent className={`sm:max-w-[720px] ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)] text-white' : 'bg-white'}`}>
          {selectedCompany && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className={`${selectedCompany.color} w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                    {selectedCompany.logo}
                  </span>
                  <span>{selectedCompany.name}</span>
                </DialogTitle>
                <DialogDescription>Review company profile details and quick actions.</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Owner</p>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCompany.ownerName}</p>
                    <p className={`text-sm mt-1 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Mail className="w-4 h-4" />
                      {selectedCompany.email}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                    <p className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <MapPin className="w-4 h-4" />
                      {selectedCompany.location}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Industry & Size</p>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCompany.industry}</p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedCompany.size}</p>
                  </div>
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Joined</p>
                    <p className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Calendar className="w-4 h-4" />
                      {selectedCompany.createdAt ? new Date(selectedCompany.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                  <p className={`text-xs uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</p>
                  <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{selectedCompany.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Job Posts</p>
                    <p className="text-2xl font-bold text-purple-500">{selectedCompany.jobPostings}</p>
                  </div>
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                    <p className={`text-2xl font-bold capitalize ${selectedCompany.status === 'approved' ? 'text-emerald-500' : selectedCompany.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                      {selectedCompany.status}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Company ID</p>
                    <p className={`text-sm font-semibold break-all ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCompany.id}</p>
                  </div>
                </div>

                <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                  <p className={`text-xs uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Website</p>
                  <button
                    onClick={() => handleOpenWebsite(selectedCompany)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      darkMode ? 'text-purple-300 hover:text-purple-200' : 'text-purple-700 hover:text-purple-800'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    {selectedCompany.website}
                    {selectedCompany.website !== 'N/A' && <ExternalLink className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(selectedCompany.id, 'Company ID')}
                  className={`px-4 py-2 rounded-md transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Copy ID
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenWebsite(selectedCompany)}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Open Website
                </button>
                <button
                  type="button"
                  onClick={() => openEditCompanyDialog(selectedCompany)}
                  className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                >
                  Edit Company
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!companyToDelete}
        onOpenChange={(open) => {
          if (!open && !deleteLoadingId) {
            setCompanyToDelete(null);
          }
        }}
      >
        <AlertDialogContent className={darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)] text-white' : 'bg-white'}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete company?</AlertDialogTitle>
            <AlertDialogDescription>
              {companyToDelete
                ? `This will permanently remove ${companyToDelete.name} and any dependent job records. This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deleteLoadingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDeleteCompany();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteLoadingId ? 'Deleting...' : 'Delete Company'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


