import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from "@/components/theme-provider";
import { apiFetch } from '@/lib/api';
import { LogoLoader } from "@/components/LogoLoader";
import {
  calculateProfileCompleteness,
  fetchPublicCompany,
  parseCulture,
} from '@/lib/company-profile';
import { employerPageTitleClass } from '@/lib/employer-page-styles';
import { CompanyProfileModal } from '@/components/company-profile-modal';
import {
  Building,
  MapPin,
  Globe,
  Users,
  Mail,
  Edit3,
  Save,
  X,
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  ExternalLink,
  Heart,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Eye,
  Sparkles,
  Briefcase,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';

interface CompanyProfile {
  name: string;
  industry: string;
  size: string;
  founded?: string;
  website: string;
  description: string;
  location: string;
  contactEmail?: string;
  phone?: string;
  logo?: string;
  coverImage?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  tags: string[];
  benefits: string[];
  techStack: string[];
}

function resolveCompanyCover(data: Record<string, unknown>): string {
  const raw = data.coverImage ?? data.cover_image;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : '';
}

function mapCompanyToProfile(companyData: Record<string, unknown>, user: { email?: string; telephoneNumber?: string }): CompanyProfile {
  const culture = parseCulture(companyData.culture);
  return {
    name: String(companyData.name || ""),
    industry: String(companyData.industry || ""),
    size: String(companyData.size || "1-10 employees"),
    founded: companyData.founded ? String(companyData.founded) : "",
    website: String(companyData.website || ""),
    description: String(companyData.description || ""),
    location: String(companyData.location || ""),
    contactEmail: user.email || "",
    phone: user.telephoneNumber || "",
    logo: companyData.logo ? String(companyData.logo) : "",
    coverImage: resolveCompanyCover(companyData),
    socialLinks: {},
    tags: culture.tags,
    benefits: culture.benefits,
    techStack: [],
  };
}

interface ProfileProps {
  embedded?: boolean;
}

export default function Profile({ embedded = false }: ProfileProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const inputClass = darkMode
    ? 'bg-slate-800/80 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:ring-violet-500/25 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0'
    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-500/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0';
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState<CompanyProfile>({
    name: "",
    industry: "",
    size: "1-10 employees",
    founded: "",
    website: "",
    description: "",
    location: "",
    contactEmail: user?.email || "",
    phone: user?.telephoneNumber || "",
    logo: "",
    coverImage: "",
    socialLinks: {},
    tags: [],
    benefits: [],
    techStack: [],
  });

  const [editedProfile, setEditedProfile] = useState<CompanyProfile>(profile);
  const [newTag, setNewTag] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showCandidatePreview, setShowCandidatePreview] = useState(false);
  const [openRoles, setOpenRoles] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const completeness = useMemo(
    () => calculateProfileCompleteness(isEditing ? editedProfile : profile),
    [isEditing, editedProfile, profile],
  );

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    fetchPublicCompany(companyId).then((data) => {
      if (!cancelled && data) setOpenRoles(data.openRoles);
    });
    return () => {
      cancelled = true;
    };
  }, [companyId, profile.coverImage, profile.description, success]);

  // Fetch company data from backend
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // First try to get company from user object
        if (user.company?.id) {
          setCompanyId(String(user.company.id));
          const companyResponse = await apiFetch(`/api/companies/${user.company.id}`, {
            credentials: 'include'
          });
          
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            const mapped = mapCompanyToProfile(companyData, user);
            setProfile(mapped);
            setEditedProfile(mapped);
            setLoading(false);
            return;
          }
        }

        // If no company in user object, try to fetch by owner
        const companiesResponse = await apiFetch(`/api/companies?ownerId=${user.id}`, {
          credentials: 'include'
        });
        
        if (companiesResponse.ok) {
          const companies = await companiesResponse.json();
          if (companies && companies.length > 0) {
            const companyData = companies[0];
            setCompanyId(String(companyData.id));
            const mapped = mapCompanyToProfile(companyData, user);
            setProfile(mapped);
            setEditedProfile(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to fetch company data:', err);
        setError('Failed to load company profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [user]);

  const handleSave = async () => {
    if (!companyId) {
      setError('Company ID not found. Please contact support.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Calculate profile completion score before saving
      const calculateProfileScore = (profile: CompanyProfile): number => {
        let totalFields = 0;
        let completedFields = 0;

        // Required fields
        if (profile.name) {
          totalFields++;
          if (profile.name.trim() !== '') completedFields++;
        }

        // Company details
        if (profile.industry) {
          totalFields++;
          if (profile.industry.trim() !== '') completedFields++;
        }
        if (profile.location) {
          totalFields++;
          if (profile.location.trim() !== '') completedFields++;
        }
        if (profile.size) {
          totalFields++;
          if (profile.size.trim() !== '') completedFields++;
        }
        if (profile.description) {
          totalFields++;
          if (profile.description.trim() !== '') completedFields++;
        }
        if (profile.website) {
          totalFields++;
          if (profile.website.trim() !== '') completedFields++;
        }
        if (profile.contactEmail) {
          totalFields++;
          if (profile.contactEmail.trim() !== '') completedFields++;
        }
        if (profile.phone) {
          totalFields++;
          if (profile.phone.trim() !== '') completedFields++;
        }
        if (profile.logo) {
          totalFields++;
          if (profile.logo.trim() !== '') completedFields++;
        }

        // Optional fields (count as bonus)
        if (profile.tags && profile.tags.length > 0) {
          totalFields++;
          completedFields++;
        }
        if (profile.benefits && profile.benefits.length > 0) {
          totalFields++;
          completedFields++;
        }

        return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
      };

      // Calculate profile score (for reference, not stored in DB)
      calculateProfileScore(editedProfile);

      // Only include fields that have values (not empty strings)
      const updateData: any = {};
      
      if (editedProfile.name && editedProfile.name.trim() !== '') {
        updateData.name = editedProfile.name.trim();
      }
      if (editedProfile.industry && editedProfile.industry.trim() !== '') {
        updateData.industry = editedProfile.industry.trim();
      }
      if (editedProfile.size && editedProfile.size.trim() !== '') {
        updateData.size = editedProfile.size.trim();
      }
      if (editedProfile.website && editedProfile.website.trim() !== '') {
        updateData.website = editedProfile.website.trim();
      }
      if (editedProfile.description && editedProfile.description.trim() !== '') {
        updateData.description = editedProfile.description.trim();
      }
      if (editedProfile.location && editedProfile.location.trim() !== '') {
        updateData.location = editedProfile.location.trim();
      }
      if (editedProfile.logo && editedProfile.logo.trim() !== '') {
        updateData.logo = editedProfile.logo.trim();
      }
      updateData.culture = {
        tags: editedProfile.tags,
        benefits: editedProfile.benefits,
      };

      // Note: profileScore is calculated on-the-fly, not stored in DB

      const response = await apiFetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update company' }));
        throw new Error(errorData.message || 'Failed to update company');
      }

      await response.json();
      
      // Update profile with saved data
      setProfile(editedProfile);
      setIsEditing(false);
      setSuccess(true);
      
      // Trigger profile score recalculation in dashboard by refreshing user data
      // This will be handled when user navigates back to dashboard
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save company profile:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  const handleInputChange = (field: keyof CompanyProfile, value: any) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !editedProfile.tags.includes(newTag.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedProfile(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !editedProfile.benefits.includes(newBenefit.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefitToRemove: string) => {
    setEditedProfile(prev => ({
      ...prev,
      benefits: prev.benefits.filter(benefit => benefit !== benefitToRemove)
    }));
  };

  const applyCoverImage = (coverImage: string) => {
    setProfile((prev) => ({ ...prev, coverImage }));
    setEditedProfile((prev) => ({ ...prev, coverImage }));
  };

  const handleCoverUpload = async (file?: File) => {
    if (!file || !companyId) return;
    const isValidType = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type);
    if (!isValidType) {
      setError("Please upload a JPG, PNG, or WEBP image for the cover photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Cover image must be 5MB or smaller.");
      return;
    }

    setCoverUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const response = await apiFetch(`/api/companies/${companyId}/cover`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to upload cover photo" }));
        throw new Error(errorData.message || "Failed to upload cover photo");
      }
      const payload = await response.json();
      const nextCover = payload?.coverImage ? String(payload.coverImage) : "";
      if (!nextCover) {
        throw new Error("Upload failed: cover image URL missing in response");
      }
      applyCoverImage(nextCover);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Cover upload failed:", err);
      setError(err instanceof Error ? err.message : "Failed to upload cover photo.");
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  const handleRemoveCover = async () => {
    if (!companyId) return;
    const currentCover = editedProfile.coverImage || profile.coverImage;
    if (!currentCover) return;

    setCoverUploading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/companies/${companyId}/cover`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to remove cover photo" }));
        throw new Error(errorData.message || "Failed to remove cover photo");
      }
      applyCoverImage("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Cover remove failed:", err);
      setError(err instanceof Error ? err.message : "Failed to remove cover photo.");
    } finally {
      setCoverUploading(false);
    }
  };

  const displayCoverImage = isEditing
    ? editedProfile.coverImage || profile.coverImage
    : profile.coverImage;

  if (loading) {
    return (
      <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} flex items-center justify-center ${embedded ? 'bg-transparent' : darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <LogoLoader size="md" className="mx-auto mb-4" />
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} ${embedded ? 'bg-transparent' : darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gray-50'}`}>
      <div className={`${embedded ? 'w-full' : 'container mx-auto max-w-7xl'} ${embedded ? 'p-2' : 'p-6'}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
          <div className="flex items-center gap-4">
            {!embedded && (
              <button
                onClick={() => navigate('/employer/dashboard')}
                className={`p-2 rounded-xl transition-all duration-200 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className={employerPageTitleClass(darkMode)}>Company Profile</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {companyId && (
              <button
                type="button"
                onClick={() => setShowCandidatePreview(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  darkMode
                    ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview as candidate
              </button>
            )}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Company profile updated successfully!</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div
          className={`mb-6 rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
            darkMode
              ? 'bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent border-indigo-500/25'
              : 'bg-gradient-to-r from-indigo-50 to-violet-50/50 border-indigo-100'
          }`}
        >
          <div className={`p-3 rounded-xl shrink-0 ${darkMode ? 'bg-indigo-500/20' : 'bg-white shadow-sm'}`}>
            <Sparkles className={`w-6 h-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Candidate visibility</p>
            <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Applicants see your company on job cards, job details, and the apply flow — not your private contact email.
              Complete your profile to build trust before they apply.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Profile strength
              </p>
              <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{completeness.score}%</p>
            </div>
            {openRoles > 0 && (
              <div
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${
                  darkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                {openRoles} open
              </div>
            )}
          </div>
        </div>

        {/* Cover + identity hero */}
        <div
          className={`mb-8 rounded-2xl overflow-hidden border shadow-2xl ${
            darkMode ? 'border-slate-700/80 shadow-black/40' : 'border-slate-200/90 shadow-slate-300/30'
          }`}
        >
          <div className="relative h-48 sm:h-56 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700">
            {displayCoverImage ? (
              <img
                src={displayCoverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold text-white/90 px-6 text-center">
                  {profile.name || 'Add a cover image candidates will recognize'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            {isEditing && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  title="Upload cover photo"
                  className="bg-black/60 hover:bg-black/80 disabled:opacity-60 text-white p-3 rounded-xl transition-all duration-300 backdrop-blur-sm"
                >
                  {coverUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </button>
                {displayCoverImage && (
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    disabled={coverUploading}
                    title="Remove cover photo"
                    className="bg-black/60 hover:bg-red-600/90 disabled:opacity-60 text-white p-3 rounded-xl transition-all duration-300 backdrop-blur-sm"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={`relative px-5 sm:px-8 pb-6 pt-0 -mt-12 sm:-mt-14 ${darkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative shrink-0 group">
                {profile.logo ? (
                  <img
                    src={profile.logo}
                    alt="Company Logo"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                    {profile.name ? profile.name.substring(0, 2).toUpperCase() : 'CO'}
                  </div>
                )}
                  {isEditing && (
                    <button
                      type="button"
                      className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`text-xl sm:text-2xl font-bold w-full rounded-xl px-3 py-2 mb-2 border ${inputClass}`}
                      placeholder="Company Name"
                    />
                  ) : (
                    <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {profile.name || 'Your Company'}
                    </h2>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className={`w-full text-sm rounded-xl px-3 py-2 border ${inputClass}`}
                      placeholder="Industry"
                    />
                  ) : (
                    <p className={`text-sm font-medium ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                      {profile.industry || 'Add your industry'}
                    </p>
                  )}
                  {!isEditing && profile.location && (
                    <p className={`text-sm mt-1 flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.location}
                    </p>
                  )}
                </div>
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div
              className={`rounded-2xl border p-5 ${
                darkMode ? 'bg-gray-800/60 border-gray-700/60' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Profile checklist
              </h3>
              <div className={`w-full rounded-full h-2 mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${completeness.score}%` }}
                />
              </div>
              <ul className="space-y-2">
                {completeness.missing.slice(0, 5).map((item) => (
                  <li key={item} className={`text-xs flex items-start gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="text-amber-500 mt-0.5">○</span>
                    {item}
                  </li>
                ))}
                {completeness.missing.length === 0 && (
                  <li className={`text-xs flex items-center gap-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Profile is strong for candidates
                  </li>
                )}
              </ul>
            </div>

            <div
              className={`rounded-2xl border p-5 ${
                darkMode ? 'bg-gray-800/60 border-gray-700/60' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-sm mb-3">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Company size</span>
                {isEditing ? (
                  <select
                    value={editedProfile.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    className={`text-sm rounded-xl px-3 py-2 border ${inputClass}`}
                  >
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-500 employees">201-500 employees</option>
                    <option value="501-1000 employees">501-1000 employees</option>
                    <option value="1000+ employees">1000+ employees</option>
                  </select>
                ) : (
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profile.size}</span>
                )}
              </div>
            </div>

            {/* Contact Information — employer only */}
            <div
              className={`rounded-2xl border p-5 ${
                darkMode ? 'bg-gray-800/60 border-gray-700/60' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                <Mail className="w-4 h-4" />
                Your contact (private)
              </h3>
              <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Not shown on public company pages. Candidates reach you via SkillConnect after applying.
              </p>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-sm border ${inputClass}`}
                    />
                  ) : (
                    <a 
                      href={`mailto:${profile.contactEmail}`}
                      className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} text-sm flex items-center group`}
                    >
                      {profile.contactEmail || 'No email'}
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
                <div>
                  <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-sm border ${inputClass}`}
                    />
                  ) : (
                    profile.phone ? (
                      <a 
                        href={`tel:${profile.phone}`}
                        className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} text-sm`}
                      >
                        {profile.phone}
                      </a>
                    ) : (
                      <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>No phone</span>
                    )
                  )}
                </div>
                <div>
                  <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editedProfile.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-sm border ${inputClass}`}
                      placeholder="https://example.com"
                    />
                  ) : (
                    profile.website ? (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} text-sm flex items-center group`}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Website
                        <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>No website</span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Navigation Tabs */}
            <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-2xl shadow-xl p-1 backdrop-blur-sm`}>
              <div className="flex space-x-1">
                {['overview', 'culture'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      scrollDashboardToTop();
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 capitalize ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white shadow-lg'
                        : darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Company Description */}
                <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-2xl shadow-xl p-6 backdrop-blur-sm`}>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                    <FileText className="w-5 h-5 mr-2" />
                    About Us
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editedProfile.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={6}
                      className={`w-full rounded-xl px-4 py-3 text-sm resize-none border ${inputClass}`}
                      placeholder="Tell us about your company mission, values, and what makes you unique..."
                    />
                  ) : (
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed text-lg`}>
                      {profile.description || 'No description yet. Add a description to tell candidates about your company.'}
                    </p>
                  )}
                </div>

                {/* Company Details */}
                <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-2xl shadow-xl p-6 backdrop-blur-sm`}>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                    Company Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`flex items-center space-x-4 p-4 ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl`}>
                      <div className={`p-3 ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg`}>
                        <Building className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Industry</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedProfile.industry}
                            onChange={(e) => handleInputChange('industry', e.target.value)}
                            className={`w-full mt-1 rounded-xl px-3 py-2 text-sm border ${inputClass}`}
                            placeholder="Industry"
                          />
                        ) : (
                          <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium mt-1`}>
                            {profile.industry || 'Not specified'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center space-x-4 p-4 ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl`}>
                      <div className={`p-3 ${darkMode ? 'bg-green-500/20' : 'bg-green-100'} rounded-lg`}>
                        <MapPin className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Location</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedProfile.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            className={`w-full mt-1 rounded-xl px-3 py-2 text-sm border ${inputClass}`}
                            placeholder="Location"
                          />
                        ) : (
                          <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium mt-1`}>
                            {profile.location || 'Not specified'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center space-x-4 p-4 ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl`}>
                      <div className={`p-3 ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-lg`}>
                        <Users className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Company Size</p>
                        {isEditing ? (
                          <select
                            value={editedProfile.size}
                            onChange={(e) => handleInputChange('size', e.target.value)}
                            className={`w-full mt-1 rounded-xl px-3 py-2 text-sm border ${inputClass}`}
                          >
                            <option value="1-10 employees">1-10 employees</option>
                            <option value="11-50 employees">11-50 employees</option>
                            <option value="51-200 employees">51-200 employees</option>
                            <option value="201-500 employees">201-500 employees</option>
                            <option value="501-1000 employees">501-1000 employees</option>
                            <option value="1000+ employees">1000+ employees</option>
                          </select>
                        ) : (
                          <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium mt-1`}>{profile.size}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'culture' && (
              <div className="space-y-6">
                {/* Tags */}
                <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-2xl shadow-xl p-6 backdrop-blur-sm`}>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Company Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editedProfile.tags.map((tag, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200'} border`}
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-2 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2 w-full">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag..."
                            className={`flex-1 rounded-xl px-3 py-2 text-sm border ${inputClass}`}
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          />
                          <button
                            onClick={addTag}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      profile.tags.length > 0 ? (
                        profile.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200'} border`}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>No tags added yet</p>
                      )
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-2xl shadow-xl p-6 backdrop-blur-sm`}>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                    <Heart className="w-5 h-5 mr-2 text-red-400" />
                    Employee Benefits
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {isEditing ? (
                      <>
                        <div className="md:col-span-2 space-y-2 mb-3">
                          {editedProfile.benefits.map((benefit, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-lg`}
                            >
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className={darkMode ? 'text-white' : 'text-gray-900'}>{benefit}</span>
                              </div>
                              <button
                                onClick={() => removeBenefit(benefit)}
                                className={`${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'} transition-colors`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                          <input
                            type="text"
                            value={newBenefit}
                            onChange={(e) => setNewBenefit(e.target.value)}
                            placeholder="Add benefit..."
                            className={`flex-1 rounded-xl px-3 py-2 text-sm border ${inputClass}`}
                            onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                          />
                          <button
                            onClick={addBenefit}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      profile.benefits.length > 0 ? (
                        profile.benefits.map((benefit, index) => (
                          <div
                            key={index}
                            className={`flex items-center space-x-3 p-3 ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-lg`}
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className={darkMode ? 'text-white' : 'text-gray-900'}>{benefit}</span>
                          </div>
                        ))
                      ) : (
                        <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>No benefits added yet</p>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <CompanyProfileModal
          companyId={companyId}
          companyName={profile.name}
          isOpen={showCandidatePreview}
          onClose={() => setShowCandidatePreview(false)}
        />
      </div>
    </div>
  );
}
