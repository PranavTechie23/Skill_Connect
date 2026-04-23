import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from "@/components/theme-provider";
import { apiFetch } from '@/lib/api';
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
  Eye,
  EyeOff,
  CheckCircle,
  ExternalLink,
  Heart,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  isProfilePublic: boolean;
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
    isProfilePublic: true
  });

  const [editedProfile, setEditedProfile] = useState<CompanyProfile>(profile);
  const [newTag, setNewTag] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);

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
            setProfile({
              name: companyData.name || "",
              industry: companyData.industry || "",
              size: companyData.size || "1-10 employees",
              founded: companyData.founded || "",
              website: companyData.website || "",
              description: companyData.description || "",
              location: companyData.location || "",
              contactEmail: user.email || "",
              phone: user.telephoneNumber || "",
              logo: companyData.logo || "",
              coverImage: "",
              socialLinks: {},
              tags: [],
              benefits: [],
              techStack: [],
              isProfilePublic: true
            });
            setEditedProfile({
              name: companyData.name || "",
              industry: companyData.industry || "",
              size: companyData.size || "1-10 employees",
              founded: companyData.founded || "",
              website: companyData.website || "",
              description: companyData.description || "",
              location: companyData.location || "",
              contactEmail: user.email || "",
              phone: user.telephoneNumber || "",
              logo: companyData.logo || "",
              coverImage: "",
              socialLinks: {},
              tags: [],
              benefits: [],
              techStack: [],
              isProfilePublic: true
            });
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
            setProfile({
              name: companyData.name || "",
              industry: companyData.industry || "",
              size: companyData.size || "1-10 employees",
              founded: companyData.founded || "",
              website: companyData.website || "",
              description: companyData.description || "",
              location: companyData.location || "",
              contactEmail: user.email || "",
              phone: user.telephoneNumber || "",
              logo: companyData.logo || "",
              coverImage: "",
              socialLinks: {},
              tags: [],
              benefits: [],
              techStack: [],
              isProfilePublic: true
            });
            setEditedProfile({
              name: companyData.name || "",
              industry: companyData.industry || "",
              size: companyData.size || "1-10 employees",
              founded: companyData.founded || "",
              website: companyData.website || "",
              description: companyData.description || "",
              location: companyData.location || "",
              contactEmail: user.email || "",
              phone: user.telephoneNumber || "",
              logo: companyData.logo || "",
              coverImage: "",
              socialLinks: {},
              tags: [],
              benefits: [],
              techStack: [],
              isProfilePublic: true
            });
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


  if (loading) {
    return (
      <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} flex items-center justify-center ${embedded ? 'bg-transparent' : darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} ${embedded ? 'bg-transparent' : darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gray-50'}`}>
      <div className={`${embedded ? 'w-full' : 'container mx-auto max-w-7xl'} ${embedded ? 'p-2' : 'p-6'}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {!embedded && (
              <button
                onClick={() => navigate('/employer/dashboard')}
                className={`p-2 rounded-lg transition-all duration-200 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Company Profile</h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your company information and branding
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {profile.isProfilePublic ? (
                <Eye className="w-4 h-4 text-green-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {profile.isProfilePublic ? 'Public' : 'Private'}
              </span>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
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

        {/* Cover Photo */}
        <div className="mb-6 rounded-2xl overflow-hidden shadow-xl">
          <div className="relative h-64 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
            {profile.coverImage ? (
              <img
                src={profile.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : 'text-white'}`}>
                  {profile.name || 'Company Cover Image'}
                </span>
              </div>
            )}
            {isEditing && (
              <button className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-xl transition-all duration-300 backdrop-blur-sm">
                <Upload className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Company Logo & Basic Info */}
            <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-2xl shadow-xl p-6 backdrop-blur-sm`}>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4 group">
                  {profile.logo ? (
                    <img
                      src={profile.logo}
                      alt="Company Logo"
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-blue-500 shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl border-4 border-blue-500 shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {profile.name ? profile.name.substring(0, 2).toUpperCase() : 'CO'}
                    </div>
                  )}
                  {isEditing && (
                    <button className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-300">
                      <Upload className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`text-xl font-bold ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'} border rounded-xl px-3 py-2 text-center mb-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Company Name"
                  />
                ) : (
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {profile.name || 'Your Company'}
                  </h2>
                )}
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className={`${darkMode ? 'text-blue-400 bg-gray-700 border-gray-600' : 'text-blue-600 bg-white border-gray-300'} border rounded-xl px-3 py-2 text-center w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Industry"
                  />
                ) : (
                  <p className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {profile.industry || 'Add your industry'}
                  </p>
                )}
                
                {/* Profile Visibility Toggle */}
                {isEditing && (
                  <div className="flex items-center space-x-2 mt-3">
                    <button
                      onClick={() => handleInputChange('isProfilePublic', !editedProfile.isProfilePublic)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editedProfile.isProfilePublic ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editedProfile.isProfilePublic ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {editedProfile.isProfilePublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Company Size</span>
                  {isEditing ? (
                    <select
                      value={editedProfile.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      className={`${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'} border rounded-lg px-3 py-1 text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="1-10 employees">1-10 employees</option>
                      <option value="11-50 employees">11-50 employees</option>
                      <option value="51-200 employees">51-200 employees</option>
                      <option value="201-500 employees">201-500 employees</option>
                      <option value="501-1000 employees">501-1000 employees</option>
                      <option value="1000+ employees">1000+ employees</option>
                    </select>
                  ) : (
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{profile.size}</span>
                  )}
                </div>
                {profile.founded && (
                  <div className="flex items-center justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Founded</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedProfile.founded}
                        onChange={(e) => handleInputChange('founded', e.target.value)}
                        className={`${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'} border rounded-lg px-3 py-1 w-24 text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        min="1900"
                        max="2024"
                      />
                    ) : (
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>{profile.founded}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200'} border rounded-2xl shadow-xl p-6 backdrop-blur-sm`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                <Mail className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                      className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                      className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                    onClick={() => setActiveTab(tab)}
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
                      className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                            className={`${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'} border rounded-lg px-3 py-1 text-sm w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                            className={`${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'} border rounded-lg px-3 py-1 text-sm w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                            className={`${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'} border rounded-lg px-3 py-1 text-sm w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                            className={`flex-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                            className={`flex-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
      </div>
    </div>
  );
}
