import { useState, useEffect, useMemo, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Edit2, Save, X,
  Briefcase, GraduationCap, FileText,
  Linkedin, Github, Globe, Plus, Award,
  Download, Camera, Trash2, Upload,
  ChevronRight, Share2, CheckCircle2, AlertCircle, Lightbulb,
} from 'lucide-react';
import { useTheme } from "@/components/theme-provider";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, withSkipGlobalLoader } from '@/lib/api';
import { cn } from '@/lib/utils';
import { type UpdateMeProfile } from '@shared/schema';
import { getProfileResume } from '@/lib/employee-resume';

interface Education {
  id: number;
  degree: string;
  school: string;
  year: string;
  gpa: string;
}

interface FormattedExperience {
  id: number;
  title: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
}

interface ProfileData {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    avatar: string | null;
  };
  professional: {
    title: string; // Changed from headline to title to match our usage
    department?: string;
    company?: string;
    startDate?: string;
    employeeId?: string;
    skills: string[];
    level?: string;
  };
  education: Education[];
  experience: FormattedExperience[];
}

interface SmartSuggestion {
  section: string;
  title: string;
  detail: string;
}

interface ProfileProps {
  embedded?: boolean;
}

const Profile = ({ embedded = false }: ProfileProps) => {
  const { theme } = useTheme();
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const glassCard = darkMode
    ? 'bg-slate-900/60 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl'
    : 'bg-white/95 border-gray-100 shadow-lg';

  const fieldInputClass = cn(
    'w-full h-12 px-4 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0',
    darkMode
      ? 'bg-slate-800/80 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:ring-violet-500/25'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-500/20'
  );

  const fieldViewClass = cn(
    'h-12 px-4 rounded-xl flex items-center text-sm',
    darkMode ? 'bg-slate-800/50 text-slate-200 border border-white/5' : 'bg-gray-50 text-gray-900 border border-gray-100'
  );

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [imageHover, setImageHover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [coachExpanded, setCoachExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const profileResume = useMemo(() => getProfileResume(user?.profile ?? null), [user?.profile]);

  type IncompleteItem = { section: string; label: string };
  
  // Initialize profile with user data and professional profile data
  const [profile, setProfile] = useState<ProfileData>({
    personal: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.telephoneNumber || '',
      location: user?.location || '',
      bio: user?.profile?.bio || '',
      avatar: user?.profilePhoto || null
    },
    professional: {
      title: user?.profile?.headline || '',
      department: (user as any)?.department || '', 
      company: user?.company?.name || '',
      startDate: (user as any)?.startDate || '', 
      employeeId: (user as any)?.employeeId || '', 
      skills: user?.profile?.skills || [],
      level: (user as any)?.level || ''
    },
    education: (user?.profile as any)?.education || [],
    experience: (user?.profile as any)?.experience || []
  });

  // Update profile when user data changes
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        personal: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.telephoneNumber || '',
          location: user.location || '',
          // Do not overwrite local edits when /api/auth/me omits profile payload.
          bio: user.profile?.bio ?? prev.personal.bio,
          avatar: user.profilePhoto ?? prev.personal.avatar
        },
        professional: {
          title: user.profile?.headline ?? prev.professional.title,
          department: (user as any)?.department || '',
          company: user.company?.name || '',
          startDate: (user as any)?.startDate || '',
          employeeId: (user as any)?.employeeId || '',
          skills: user.profile?.skills?.length ? user.profile.skills : prev.professional.skills,
          level: (user as any)?.level || ''
        },
        education: prev.education,
        experience: prev.experience
      }));
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (section: keyof ProfileData, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Add new skill
  const addSkill = () => {
    if (newSkill.trim()) {
      setProfile(prev => ({
        ...prev,
        professional: {
          ...prev.professional,
          skills: [...prev.professional.skills, newSkill.trim()]
        }
      }));
      setNewSkill('');
    }
  };

  // Remove skill
  const removeSkill = (index: number) => {
    setProfile(prev => ({
      ...prev,
      professional: {
        ...prev.professional,
        skills: prev.professional.skills.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(
        '/api/me/profile',
        withSkipGlobalLoader({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: profile.personal.firstName.trim(),
            lastName: profile.personal.lastName.trim(),
            email: profile.personal.email.trim(),
            location: profile.personal.location.trim(),
            telephoneNumber: profile.personal.phone.trim(),
            headline: profile.professional.title,
            bio: profile.personal.bio,
            skills: profile.professional.skills,
            experience: profile.experience,
            education: profile.education,
          } satisfies UpdateMeProfile),
        })
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'Failed to update profile');
      }

      const payload = await response.json();
      const savedUser = payload?.user;
      const savedProfile = payload?.profile;

      if (user) {
        setUser({
          ...user,
          ...(savedUser || {}),
          profile: savedProfile
            ? { ...(user.profile || {}), ...savedProfile }
            : user.profile,
        });
      }

      if (savedUser || savedProfile) {
        setProfile((prev) => ({
          ...prev,
          personal: {
            ...prev.personal,
            firstName: savedUser?.firstName ?? prev.personal.firstName,
            lastName: savedUser?.lastName ?? prev.personal.lastName,
            email: savedUser?.email ?? prev.personal.email,
            phone: savedUser?.telephoneNumber ?? prev.personal.phone,
            location: savedUser?.location ?? prev.personal.location,
            bio: savedProfile?.bio ?? prev.personal.bio,
          },
          professional: {
            ...prev.professional,
            title: savedProfile?.headline ?? prev.professional.title,
            skills: savedProfile?.skills?.length ? savedProfile.skills : prev.professional.skills,
          },
        }));
      }

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file?: File) => {
    if (!file) return;
    const isValidType = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type);
    if (!isValidType) {
      toast({
        title: "Invalid image",
        description: "Please upload JPG, PNG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Maximum file size is 5MB.",
        variant: "destructive",
      });
      return;
    }
    setPhotoUploading(true);
    try {
      // Use the dedicated authenticated upload endpoint to avoid ID/session mismatches.
      const formData = new FormData();
      formData.append("photo", file);

      const response = await apiFetch(
        "/api/me/profile-photo",
        withSkipGlobalLoader({
          method: "POST",
          body: formData,
        })
      );
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Upload failed";
        try {
          const parsed = errorText ? JSON.parse(errorText) : null;
          errorMessage = parsed?.message || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }
      const payloadText = await response.text();
      let payload: any = null;
      try {
        payload = payloadText ? JSON.parse(payloadText) : null;
      } catch {
        throw new Error("Upload failed: invalid server response");
      }
      const updatedUser = payload?.user ?? null;
      const nextPhoto = payload?.profilePhoto || updatedUser?.profilePhoto || null;
      if (!nextPhoto) {
        throw new Error("Upload failed: image URL missing in response");
      }

      setProfile((prev) => ({
        ...prev,
        personal: { ...prev.personal, avatar: nextPhoto },
      }));

      if (updatedUser) setUser(updatedUser);

      toast({
        title: "Photo updated",
        description: "Your profile photo is now visible across the platform.",
        variant: "default",
      });
    } catch (error) {
      console.error("Photo upload failed:", error);
      const message = error instanceof Error ? error.message : "Could not upload profile photo. Please try again.";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleResumeUpload = async (file?: File) => {
    if (!file) return;
    const ext = file.name.toLowerCase();
    const valid =
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type) ||
      ext.endsWith('.pdf') ||
      ext.endsWith('.doc') ||
      ext.endsWith('.docx');
    if (!valid) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF or Word document.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum resume size is 10MB.',
        variant: 'destructive',
      });
      return;
    }
    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await apiFetch(
        '/api/me/resume',
        withSkipGlobalLoader({
          method: 'POST',
          body: formData,
        })
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }
      const payload = await response.json();
      if (user && payload.profile) {
        setUser({
          ...user,
          profile: { ...user.profile, ...payload.profile, resumeUrl: payload.resumeUrl, resumeName: payload.resumeName },
        });
      }
      toast({
        title: 'Resume saved',
        description: 'Your resume will be offered when you apply to jobs.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Could not upload resume.',
        variant: 'destructive',
      });
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  };

  const handleRemoveResume = async () => {
    if (!profileResume.resumeUrl) return;
    setResumeUploading(true);
    try {
      const response = await apiFetch(
        '/api/me/resume',
        withSkipGlobalLoader({ method: 'DELETE' })
      );
      if (!response.ok) {
        throw new Error('Failed to remove resume');
      }
      if (user) {
        setUser({
          ...user,
          profile: user.profile
            ? { ...user.profile, resumeUrl: null, resumeName: null, resume_url: null, resume_name: null }
            : null,
        });
      }
      toast({ title: 'Resume removed', description: 'Your saved resume has been deleted.' });
    } catch (error) {
      toast({
        title: 'Remove failed',
        description: error instanceof Error ? error.message : 'Could not remove resume.',
        variant: 'destructive',
      });
    } finally {
      setResumeUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile.personal.avatar) return;
    setPhotoUploading(true);
    try {
      const response = await apiFetch(
        "/api/me/profile-photo",
        withSkipGlobalLoader({ method: "DELETE" })
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to remove profile photo");
      }

      setProfile((prev) => ({
        ...prev,
        personal: { ...prev.personal, avatar: null },
      }));

      if (user) {
        setUser({ ...user, profilePhoto: undefined });
      }

      toast({
        title: "Photo removed",
        description: "Your profile photo has been removed successfully.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not remove profile photo.";
      toast({
        title: "Remove failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original user data
    if (user) {
      setProfile({
        personal: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.telephoneNumber || '',
          location: user.location || '',
          bio: user.profile?.bio || '',
          avatar: user.profilePhoto || null
        },
        professional: {
          title: user.profile?.headline || '',
          department: (user as any)?.department || '',
          company: user.company?.name || '',
          startDate: (user as any)?.startDate || '',
          employeeId: (user as any)?.employeeId || '',
          skills: user.profile?.skills || [],
          level: (user as any)?.level || ''
        },
        education: profile.education, // Keep existing education data
        experience: profile.experience // Keep existing experience data
      });
    }
    setIsEditing(false);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User, count: 7 },
    { id: 'professional', label: 'Professional', icon: Briefcase, count: 8 },
    { id: 'resume', label: 'Resume', icon: FileText, count: profileResume.resumeUrl ? 1 : 0 },
    { id: 'education', label: 'Education', icon: GraduationCap, count: profile.education.length },
    { id: 'experience', label: 'Experience', icon: Award, count: profile.experience.length }
  ];
  const tabOrder = tabs.map((tab) => tab.id);
  const activeTabIndex = tabOrder.indexOf(activeTab);
  const canGoPrev = activeTabIndex > 0;
  const canGoNext = activeTabIndex < tabOrder.length - 1;
  const nextTabLabel = canGoNext ? tabs[activeTabIndex + 1].label : "";
  const prevTabLabel = canGoPrev ? tabs[activeTabIndex - 1].label : "";

  const smartSuggestions = useMemo<SmartSuggestion[]>(() => {
    const suggestions: SmartSuggestion[] = [];
    const title = profile.professional.title?.trim() || "";
    const skills = profile.professional.skills || [];
    const location = profile.personal.location?.trim() || "";
    const bio = profile.personal.bio?.trim() || "";
    const firstName = profile.personal.firstName?.trim() || "you";

    const roleSkillSuggestions: Record<string, string[]> = {
      frontend: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
      backend: ["Node.js", "Express", "PostgreSQL", "REST APIs"],
      full: ["React", "Node.js", "TypeScript", "System Design"],
      data: ["Python", "SQL", "Machine Learning", "Pandas"],
      devops: ["Docker", "Kubernetes", "CI/CD", "AWS"],
      ui: ["Figma", "UX Research", "Design Systems", "Accessibility"],
      default: ["Communication", "Problem Solving", "Team Collaboration", "Git"],
    };

    const roleKey = title.toLowerCase();
    const matchedRole =
      roleKey.includes("frontend") ? "frontend" :
      roleKey.includes("backend") ? "backend" :
      roleKey.includes("full") ? "full" :
      roleKey.includes("data") ? "data" :
      roleKey.includes("devops") ? "devops" :
      roleKey.includes("ui") || roleKey.includes("ux") ? "ui" :
      "default";

    if (!title || title === "No title provided") {
      suggestions.push({
        section: "professional",
        title: "Set a strong headline",
        detail: `Try: "${skills[0] ? `${skills[0]} Specialist` : "Professional"} | Open to impactful opportunities".`,
      });
    }

    if (skills.length < 5) {
      const recommended = roleSkillSuggestions[matchedRole]
        .filter((s) => !skills.some((x) => x.toLowerCase() === s.toLowerCase()))
        .slice(0, 3);
      suggestions.push({
        section: "professional",
        title: "Add high-value skills",
        detail: `For your profile, add: ${recommended.join(", ") || "domain-relevant technical + soft skills"}.`,
      });
    }

    if (!location) {
      suggestions.push({
        section: "personal",
        title: "Add your location",
        detail: "Location improves local + hybrid job matching and recruiter discovery.",
      });
    }

    if (bio.length < 80 || bio === "No bio provided.") {
      suggestions.push({
        section: "personal",
        title: "Improve your bio for better conversion",
        detail: `Write 2-3 lines: role, years of experience, top skills, and one measurable result (e.g., reduced load time by 35%).`,
      });
    }

    if (!profile.education.length) {
      suggestions.push({
        section: "education",
        title: "Add education details",
        detail: "Profiles with education history are trusted more by recruiters.",
      });
    }

    if (!profile.experience.length) {
      suggestions.push({
        section: "experience",
        title: "Add at least one experience entry",
        detail: "Even internships/freelance work can boost shortlist chances.",
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        section: "professional",
        title: `Great profile, ${firstName}!`,
        detail: "Next step: tailor skills for target roles and keep your profile updated weekly.",
      });
    }

    return suggestions.slice(0, 4);
  }, [profile]);

  const completionChecks: IncompleteItem[] = [];
  if (!profile.personal.firstName?.trim()) completionChecks.push({ section: 'personal', label: 'Add first name' });
  if (!profile.personal.lastName?.trim()) completionChecks.push({ section: 'personal', label: 'Add last name' });
  if (!profile.personal.email?.trim()) completionChecks.push({ section: 'personal', label: 'Add email address' });
  if (!profile.personal.phone?.trim()) completionChecks.push({ section: 'personal', label: 'Add phone number' });
  if (!profile.personal.location?.trim()) completionChecks.push({ section: 'personal', label: 'Add current location' });
  if (!profile.personal.bio || profile.personal.bio === 'No bio provided.' || profile.personal.bio.trim().length < 40) {
    completionChecks.push({ section: 'personal', label: 'Write a short bio (40+ chars)' });
  }
  if (!profile.professional.title || profile.professional.title === 'No title provided') {
    completionChecks.push({ section: 'professional', label: 'Add professional title' });
  }
  if (!profile.professional.skills?.length) completionChecks.push({ section: 'professional', label: 'Add at least one skill' });
  if (!profile.education?.length) completionChecks.push({ section: 'education', label: 'Add education details' });
  if (!profile.experience?.length) completionChecks.push({ section: 'experience', label: 'Add work experience' });
  if (!profileResume.resumeUrl) completionChecks.push({ section: 'resume', label: 'Upload your resume' });

  const totalChecklistItems = 11;
  const completedItems = totalChecklistItems - completionChecks.length;
  const profileCompletion = Math.max(0, Math.min(100, Math.round((completedItems / totalChecklistItems) * 100)));
  const nextMissing = completionChecks[0];

  const initials = `${profile.personal.firstName?.[0] || ''}${profile.personal.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const profileStats = useMemo(
    () => [
      {
        icon: Briefcase,
        value: profile.experience.length > 0 ? String(profile.experience.length) : '—',
        label: profile.experience.length === 1 ? 'Role' : 'Roles',
      },
      {
        icon: Award,
        value: profile.professional.skills.length > 0 ? String(profile.professional.skills.length) : '—',
        label: profile.professional.skills.length === 1 ? 'Skill' : 'Skills',
      },
    ],
    [profile.experience.length, profile.professional.skills.length]
  );

  const visibleSuggestions = coachExpanded ? smartSuggestions : smartSuggestions.slice(0, 2);
  const hasMoreSuggestions = smartSuggestions.length > 2;

  const jumpToIncomplete = () => {
    if (!nextMissing) return;
    setActiveTab(nextMissing.section);
    setIsEditing(true);
  };

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen w-screen fixed inset-0'} transition-colors duration-300 overflow-y-auto ${
      embedded
        ? 'bg-transparent'
        : darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-blue-600' : 'bg-blue-400'
        } animate-pulse`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-purple-600' : 'bg-purple-400'
        } animate-pulse delay-1000`} />
      </div>

      <div className={`${embedded ? 'w-full' : 'max-w-7xl mx-auto'} relative z-10 ${embedded ? 'px-2 py-3' : 'px-6 py-8'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {!embedded && (
              <button
                onClick={() => window.history.back()}
                className={`p-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  darkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white shadow-lg'
                    : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 shadow-lg'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <div>
              <h1 className={`text-4xl font-black mb-2 bg-gradient-to-r ${
                darkMode 
                  ? 'from-blue-400 to-purple-400' 
                  : 'from-indigo-600 to-purple-600'
              } bg-clip-text text-transparent`}>
                My Profile
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your personal and professional information
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                  darkMode
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                }`}
              >
                <Edit2 className="w-5 h-5" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                    darkMode
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile completion — compact strip */}
        <div className={cn('mb-5 rounded-2xl border px-4 py-3.5', glassCard)}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-3 shrink-0">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold tabular-nums',
                  darkMode ? 'bg-violet-500/15 text-violet-200' : 'bg-indigo-50 text-indigo-700'
                )}
              >
                {profileCompletion}%
              </div>
              <div>
                <p className={cn('text-sm font-semibold', darkMode ? 'text-white' : 'text-gray-900')}>
                  Profile completion
                </p>
                <p className={cn('text-xs mt-0.5', darkMode ? 'text-slate-400' : 'text-gray-500')}>
                  {completionChecks.length === 0
                    ? 'Ready for recruiters'
                    : `${completionChecks.length} item${completionChecks.length > 1 ? 's' : ''} remaining`}
                </p>
              </div>
            </div>

            <div className="flex-1 min-w-[180px] max-w-md">
              <div className={cn('h-1.5 w-full rounded-full overflow-hidden', darkMode ? 'bg-white/10' : 'bg-gray-200')}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              {nextMissing && (
                <p className={cn('text-xs mt-1.5 truncate', darkMode ? 'text-slate-400' : 'text-gray-500')}>
                  Next: <span className="font-medium">{nextMissing.label}</span>
                </p>
              )}
            </div>

            {completionChecks.length > 0 && (
              <button
                type="button"
                onClick={jumpToIncomplete}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                  darkMode
                    ? 'bg-violet-600/90 hover:bg-violet-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                )}
              >
                Complete
              </button>
            )}
          </div>
        </div>

        {/* Profile tips */}
        <div className={cn('mb-6 rounded-2xl border px-4 py-3.5', glassCard)}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Lightbulb className={cn('w-4 h-4 shrink-0', darkMode ? 'text-violet-400' : 'text-indigo-600')} />
              <h3 className={cn('text-sm font-semibold truncate', darkMode ? 'text-white' : 'text-gray-900')}>
                Profile tips
              </h3>
            </div>
            {hasMoreSuggestions && (
              <button
                type="button"
                onClick={() => setCoachExpanded((v) => !v)}
                className={cn(
                  'text-xs font-medium shrink-0 transition-colors',
                  darkMode ? 'text-violet-300 hover:text-violet-200' : 'text-indigo-600 hover:text-indigo-800'
                )}
              >
                {coachExpanded ? 'Show less' : `+${smartSuggestions.length - 2} more`}
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {visibleSuggestions.map((tip, index) => (
              <li key={`${tip.title}-${index}`}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(tip.section);
                    setIsEditing(true);
                  }}
                  className={cn(
                    'w-full text-left rounded-xl px-3 py-2.5 border transition-colors',
                    darkMode
                      ? 'border-white/5 bg-white/[0.02] hover:border-violet-500/30 hover:bg-white/[0.04]'
                      : 'border-gray-100 bg-gray-50/80 hover:border-indigo-200 hover:bg-white'
                  )}
                >
                  <p className={cn('text-sm font-medium', darkMode ? 'text-slate-200' : 'text-gray-900')}>
                    {tip.title}
                  </p>
                  <p className={cn('text-xs mt-0.5 line-clamp-2', darkMode ? 'text-slate-500' : 'text-gray-600')}>
                    {tip.detail}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            {/* Profile Card */}
            <div className={cn('relative mb-6 rounded-2xl border overflow-hidden', glassCard)}>
              <div className="relative h-28 overflow-hidden">
                <div className={cn('absolute inset-0 bg-gradient-to-br', darkMode ? 'from-indigo-950 via-violet-950 to-slate-950' : 'from-indigo-600 via-violet-600 to-fuchsia-600')} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
              </div>
              <div className="px-6 pb-6 -mt-14 relative">
                <div 
                  className="relative group"
                  onMouseEnter={() => setImageHover(true)}
                  onMouseLeave={() => setImageHover(false)}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                  />
                  <div className="relative mx-auto mb-3 w-[7.25rem] h-[7.25rem]">
                    <div
                      className={cn(
                        'absolute -inset-[3px] rounded-[22px] bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 transition-opacity duration-300',
                        imageHover ? 'opacity-100' : 'opacity-75'
                      )}
                    />
                    <div
                      className={cn(
                        'relative flex h-full w-full items-center justify-center overflow-hidden rounded-[20px] border-2 transition-transform duration-300',
                        darkMode ? 'border-slate-900 bg-slate-800' : 'border-white bg-slate-100',
                        imageHover && 'scale-[1.02]'
                      )}
                    >
                      {profile.personal.avatar ? (
                        <button
                          type="button"
                          onClick={() => !isEditing && setIsPhotoPreviewOpen(true)}
                          className="h-full w-full"
                          aria-label="Open profile photo preview"
                        >
                          <img
                            src={profile.personal.avatar}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ) : (
                        <span
                          className={cn(
                            'text-2xl font-black tracking-tight',
                            darkMode ? 'text-violet-200' : 'text-indigo-700'
                          )}
                        >
                          {initials}
                        </span>
                      )}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={photoUploading}
                          className={cn(
                            'absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 transition-opacity duration-300',
                            imageHover ? 'opacity-100' : 'opacity-0',
                            'disabled:cursor-not-allowed'
                          )}
                        >
                          {photoUploading ? (
                            <span className="text-xs font-semibold text-white">Uploading…</span>
                          ) : (
                            <>
                              <Camera className="h-6 w-6 text-white" />
                              <span className="text-[10px] font-semibold text-white/90">Change photo</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={cn('text-center text-[11px] mb-4', darkMode ? 'text-slate-500' : 'text-gray-400')}>
                    {isEditing ? 'JPG, PNG or WEBP · max 5MB' : 'Tap photo to preview'}
                  </p>
                  {isEditing && profile.personal.avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={photoUploading}
                      className={`mx-auto -mt-1 mb-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        darkMode
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Photo
                    </button>
                  )}
                </div>
                
                <div className="text-center mb-5">
                  <h2 className={cn('text-xl font-black tracking-tight mb-1', darkMode ? 'text-white' : 'text-gray-900')}>
                    {profile.personal.firstName} {profile.personal.lastName}
                  </h2>
                  <p className={cn('text-sm font-medium', darkMode ? 'text-violet-300/90' : 'text-indigo-600')}>
                    {profile.professional.title || 'Add your professional title'}
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="flex gap-2 mb-5">
                  {profileStats.map((stat) => (
                    <div
                      key={stat.label}
                      className={cn(
                        'flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border backdrop-blur-sm',
                        darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg', darkMode ? 'bg-white/5' : 'bg-white shadow-sm')}>
                        <stat.icon className={cn('w-4 h-4', darkMode ? 'text-white/80' : 'text-indigo-600')} />
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-sm font-black leading-tight', darkMode ? 'text-white' : 'text-gray-900')}>{stat.value}</p>
                        <p className={cn('text-[10px] font-semibold uppercase tracking-wide', darkMode ? 'text-slate-400' : 'text-gray-500')}>{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Completion Checklist */}
                <div className={cn('mb-5 p-4 rounded-2xl border', darkMode ? 'border-white/10 bg-white/5' : 'border-indigo-100/80 bg-indigo-50/40')}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={cn('text-xs font-bold uppercase tracking-wider', darkMode ? 'text-slate-300' : 'text-gray-700')}>
                      Quick Checklist
                    </p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', darkMode ? 'bg-violet-500/20 text-violet-300' : 'bg-indigo-100 text-indigo-700')}>
                      {profileCompletion}%
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
                    {(completionChecks.length ? completionChecks : [{ section: 'done', label: 'Profile complete — ready to apply' }]).map((item, idx) => {
                      const done = item.section === 'done';
                      return (
                        <button
                          key={`${item.label}-${idx}`}
                          type="button"
                          onClick={() => {
                            if (done) return;
                            setActiveTab(item.section);
                            setIsEditing(true);
                          }}
                          className={cn(
                            'w-full text-left flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-xl transition-colors',
                            darkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-white text-gray-700',
                            done && 'cursor-default'
                          )}
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                          )}
                          <span className="leading-snug">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Social Links */}
                <div className="flex justify-center gap-2.5 mb-5">
                  {[
                    { icon: Linkedin, hover: 'hover:border-blue-400/50 hover:text-blue-400', label: 'LinkedIn' },
                    { icon: Github, hover: 'hover:border-slate-400/50 hover:text-slate-200', label: 'GitHub' },
                    { icon: Globe, hover: 'hover:border-emerald-400/50 hover:text-emerald-400', label: 'Portfolio' },
                  ].map((social, index) => (
                    <button
                      key={index}
                      type="button"
                      className={cn(
                        'p-2.5 rounded-xl border transition-all duration-300 hover:scale-105',
                        darkMode ? 'border-white/10 bg-white/5 text-slate-400' : 'border-gray-200 bg-white text-gray-500 shadow-sm',
                        social.hover
                      )}
                      title={social.label}
                    >
                      <social.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 hover:scale-[1.02]',
                      darkMode
                        ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 shadow-sm'
                    )}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] shadow-lg',
                      darkMode
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
                    )}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className={cn('rounded-3xl p-8 border min-h-[450px]', glassCard)}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-2xl font-black ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Personal Information
                    </h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Keep contact details accurate so recruiters can reach you quickly.
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    darkMode 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {isEditing ? 'Editing Mode' : 'View Mode'}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { label: 'First Name', field: 'firstName', value: profile.personal.firstName, icon: User },
                    { label: 'Last Name', field: 'lastName', value: profile.personal.lastName, icon: User },
                    { label: 'Email', field: 'email', value: profile.personal.email, icon: Mail, fullWidth: true },
                    { label: 'Phone', field: 'phone', value: profile.personal.phone, icon: Phone },
                    { label: 'Location', field: 'location', value: profile.personal.location, icon: MapPin }
                  ].map((field, index) => (
                    <div key={index} className={field.fullWidth ? 'col-span-2' : ''}>
                      <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <field.icon className="w-4 h-4" />
                        {field.label}
                      </label>
                      {isEditing ? (
                        <input
                          type={field.field === 'birthday' ? 'date' : 'text'}
                          value={field.value}
                          onChange={(e) => handleInputChange('personal', field.field, e.target.value)}
                          className={fieldInputClass}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : (
                        <p className={fieldViewClass}>
                          {field.value || 'Not provided'}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  <div className="col-span-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <FileText className="w-4 h-4" />
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={profile.personal.bio}
                        onChange={(e) => handleInputChange('personal', 'bio', e.target.value)}
                        rows={4}
                        className={cn(fieldInputClass, 'h-auto min-h-[7rem] py-3 resize-y')}
                        placeholder="Describe your role, years of experience, top skills, and one measurable achievement (e.g. improved load time by 35%)."
                      />
                    ) : (
                      <p
                        className={cn(
                          fieldViewClass,
                          'h-auto min-h-[7rem] py-3 items-start leading-relaxed',
                          !profile.personal.bio?.trim() && (darkMode ? 'text-slate-500 italic' : 'text-gray-400 italic')
                        )}
                      >
                        {profile.personal.bio?.trim()
                          ? profile.personal.bio
                          : 'Add a short bio so employers understand your strengths and experience.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Professional Tab */}
            {activeTab === 'professional' && (
              <div className={cn('rounded-3xl p-8 border min-h-[450px]', glassCard)}>
                <div className="mb-8">
                  <h3 className={`text-2xl font-black ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Professional Information
                  </h3>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Add a clear title and skills so your profile appears in more relevant searches.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  {[
                    { label: 'Professional Title', field: 'title', value: profile.professional.title }
                  ].map((field, index) => (
                    <div key={index}>
                      <label className={`block text-sm font-semibold mb-3 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {field.label}
                      </label>
                      {isEditing ? (
                        <input
                          type={field.field === 'startDate' ? 'date' : 'text'}
                          value={field.value}
                          onChange={(e) => handleInputChange('professional', field.field, e.target.value)}
                          className={fieldInputClass}
                          placeholder={field.field === 'title' ? 'Enter your professional title' : ''}
                        />
                      ) : (
                        <p className={fieldViewClass}>
                          {field.value || 'Not provided'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Skills & Technologies
                  </label>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {profile.professional.skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span
                          className={`px-4 py-3 rounded-xl font-semibold border transition-all duration-300 hover:scale-105 ${
                            darkMode
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                              : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 hover:from-indigo-100 hover:to-purple-100'
                          }`}
                        >
                          {skill}
                        </span>
                        {isEditing && (
                          <button
                            onClick={() => removeSkill(index)}
                            className={`p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                              darkMode
                                ? 'text-red-400 hover:bg-red-500/20'
                                : 'text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="Add a new skill..."
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
                        }`}
                      />
                      <button
                        onClick={addSkill}
                        className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                          darkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <div className={cn('rounded-3xl p-8 border min-h-[450px]', glassCard)}>
                <div className="mb-8">
                  <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Resume
                  </h3>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Save one resume on your profile. When you apply, your details and resume are pre-filled for you to review before submitting.
                  </p>
                </div>

                {profileResume.resumeUrl ? (
                  <div className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border',
                    darkMode ? 'border-white/10 bg-slate-800/50' : 'border-gray-100 bg-gray-50'
                  )}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'p-3 rounded-xl',
                        darkMode ? 'bg-violet-500/20 text-violet-300' : 'bg-indigo-100 text-indigo-600'
                      )}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {profileResume.resumeName || 'Resume'}
                        </p>
                        <a
                          href={profileResume.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline"
                        >
                          Preview file
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={profileResume.resumeUrl}
                        download
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border',
                          darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-100'
                        )}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                      <button
                        type="button"
                        disabled={resumeUploading}
                        onClick={() => resumeInputRef.current?.click()}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm',
                          darkMode ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        )}
                      >
                        <Upload className="w-4 h-4" />
                        Replace
                      </button>
                      <button
                        type="button"
                        disabled={resumeUploading}
                        onClick={handleRemoveResume}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm',
                          darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'p-8 rounded-2xl border-2 border-dashed text-center',
                      darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <FileText className={cn('w-12 h-12 mx-auto mb-4', darkMode ? 'text-gray-500' : 'text-gray-400')} />
                    <p className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      No resume uploaded yet
                    </p>
                    <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      PDF or Word, up to 10MB. Used to speed up job applications.
                    </p>
                    <button
                      type="button"
                      disabled={resumeUploading}
                      onClick={() => resumeInputRef.current?.click()}
                      className={cn(
                        'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white',
                        darkMode ? 'bg-violet-600 hover:bg-violet-700' : 'bg-indigo-600 hover:bg-indigo-700'
                      )}
                    >
                      {resumeUploading ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Upload resume
                        </>
                      )}
                    </button>
                  </div>
                )}

                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => handleResumeUpload(e.target.files?.[0])}
                />
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className={cn('rounded-3xl p-8 border min-h-[450px]', glassCard)}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className={`text-2xl font-black ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Education
                    </h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your strongest education details build trust with employers.
                    </p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => setProfile(prev => ({
                        ...prev,
                        education: [...prev.education, { id: Date.now(), degree: '', school: '', year: '', gpa: '' }]
                      }))}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                      + Add Education
                    </button>
                  )}
                </div>
                
                <div className="space-y-6">
                  {profile.education.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-2xl border-gray-300 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-gray-400">No education added yet.</p>
                    </div>
                  ) : profile.education.map((edu, index) => (
                    <div
                      key={edu.id}
                      className={`p-6 rounded-2xl border transition-all duration-300 ${
                        darkMode ? 'border-gray-700 hover:border-blue-500/70' : 'border-gray-100 hover:border-indigo-200'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <h4 className="font-bold">Education Entry</h4>
                            <button 
                              onClick={() => setProfile(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }))}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              placeholder="Degree"
                              value={edu.degree}
                              onChange={(e) => {
                                const newEdu = [...profile.education];
                                newEdu[index].degree = e.target.value;
                                setProfile({ ...profile, education: newEdu });
                              }}
                              className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            />
                            <input 
                              type="text" 
                              placeholder="School"
                              value={edu.school}
                              onChange={(e) => {
                                const newEdu = [...profile.education];
                                newEdu[index].school = e.target.value;
                                setProfile({ ...profile, education: newEdu });
                              }}
                              className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            />
                            <input 
                              type="text" 
                              placeholder="Year (e.g. 2020 - 2024)"
                              value={edu.year}
                              onChange={(e) => {
                                const newEdu = [...profile.education];
                                newEdu[index].year = e.target.value;
                                setProfile({ ...profile, education: newEdu });
                              }}
                              className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            />
                            <input 
                              type="text" 
                              placeholder="GPA"
                              value={edu.gpa}
                              onChange={(e) => {
                                const newEdu = [...profile.education];
                                newEdu[index].gpa = e.target.value;
                                setProfile({ ...profile, education: newEdu });
                              }}
                              className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className={`text-2xl p-3 rounded-xl ${
                                darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                              }`}>
                                🎓
                              </div>
                              <div>
                                <h4 className={`text-lg font-black mb-1 ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {edu.degree}
                                </h4>
                                <p className={`font-semibold mb-2 ${
                                  darkMode ? 'text-blue-400' : 'text-indigo-600'
                                }`}>
                                  {edu.school}
                                </p>
                              </div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl font-semibold ${
                              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {edu.year}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className={`text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              GPA: <strong>{edu.gpa}</strong>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className={cn('rounded-3xl p-8 border min-h-[450px]', glassCard)}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className={`text-2xl font-black ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Work Experience
                    </h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Focus on impact and outcomes to increase interview chances.
                    </p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => setProfile(prev => ({
                        ...prev,
                        experience: [...prev.experience, { id: Date.now(), title: '', company: '', period: '', description: '', achievements: [] }]
                      }))}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
                    >
                      + Add Experience
                    </button>
                  )}
                </div>
                
                <div className="space-y-6">
                  {profile.experience.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-2xl border-gray-300 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-gray-400">No work experience added yet.</p>
                    </div>
                  ) : profile.experience.map((exp, index) => (
                    <div
                      key={exp.id}
                      className={`p-6 rounded-2xl border transition-all duration-300 ${
                        darkMode ? 'border-gray-700 hover:border-purple-500/70' : 'border-gray-100 hover:border-purple-200'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <h4 className="font-bold">Experience Entry</h4>
                            <button 
                              onClick={() => setProfile(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }))}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              placeholder="Job Title"
                              value={exp.title}
                              onChange={(e) => {
                                const newExp = [...profile.experience];
                                newExp[index].title = e.target.value;
                                setProfile({ ...profile, experience: newExp });
                              }}
                              className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            />
                            <input 
                              type="text" 
                              placeholder="Company"
                              value={exp.company}
                              onChange={(e) => {
                                const newExp = [...profile.experience];
                                newExp[index].company = e.target.value;
                                setProfile({ ...profile, experience: newExp });
                              }}
                              className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            />
                            <input 
                              type="text" 
                              placeholder="Period (e.g. 2021 - Present)"
                              value={exp.period}
                              onChange={(e) => {
                                const newExp = [...profile.experience];
                                newExp[index].period = e.target.value;
                                setProfile({ ...profile, experience: newExp });
                              }}
                              className={`col-span-2 w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            />
                            <textarea 
                              placeholder="Description"
                              value={exp.description}
                              onChange={(e) => {
                                const newExp = [...profile.experience];
                                newExp[index].description = e.target.value;
                                setProfile({ ...profile, experience: newExp });
                              }}
                              className={`col-span-2 w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                              rows={2}
                            />
                            <div className="col-span-2">
                              <label className="block text-sm font-semibold mb-2">Achievements (one per line)</label>
                              <textarea 
                                placeholder="Increased revenue by 20%&#10;Led a team of 5 developers"
                                value={exp.achievements.join('\n')}
                                onChange={(e) => {
                                  const newExp = [...profile.experience];
                                  newExp[index].achievements = e.target.value.split('\n');
                                  setProfile({ ...profile, experience: newExp });
                                }}
                                className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className={`text-2xl p-3 rounded-xl ${
                                darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                              }`}>
                                💼
                              </div>
                              <div>
                                <h4 className={`text-lg font-black mb-1 ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {exp.title}
                                </h4>
                                <p className={`font-semibold mb-2 ${
                                  darkMode ? 'text-purple-400' : 'text-purple-600'
                                }`}>
                                  {exp.company}
                                </p>
                              </div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl font-semibold ${
                              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {exp.period}
                            </div>
                          </div>
                          
                          <p className={`mb-4 leading-relaxed ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {exp.description}
                          </p>
                          
                          <div className="space-y-2">
                            {exp.achievements.filter(Boolean).map((achievement, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  darkMode ? 'bg-green-400' : 'bg-green-500'
                                }`} />
                                <span className={`text-sm ${
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {achievement}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={cn('mt-6 rounded-2xl border px-4 py-4', glassCard)}>
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {tabs.map((tab, i) => (
                  <div
                    key={tab.id}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === activeTabIndex
                        ? 'w-8 bg-gradient-to-r from-indigo-500 to-violet-500'
                        : i < activeTabIndex
                          ? cn('w-2', darkMode ? 'bg-violet-400/70' : 'bg-indigo-400')
                          : cn('w-2', darkMode ? 'bg-white/15' : 'bg-gray-200')
                    )}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => canGoPrev && setActiveTab(tabOrder[activeTabIndex - 1])}
                disabled={!canGoPrev}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                  canGoPrev
                    ? darkMode
                      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    : 'border-transparent opacity-40 cursor-not-allowed text-gray-500'
                )}
              >
                {canGoPrev ? `Previous: ${prevTabLabel}` : 'Previous'}
              </button>

              <p className={cn('text-xs sm:text-sm font-medium', darkMode ? 'text-slate-400' : 'text-gray-500')}>
                Step <span className={cn('font-bold', darkMode ? 'text-white' : 'text-gray-900')}>{activeTabIndex + 1}</span> of {tabs.length}
              </p>

              <button
                type="button"
                onClick={() => canGoNext && setActiveTab(tabOrder[activeTabIndex + 1])}
                disabled={!canGoNext}
                className={cn(
                  'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
                  canGoNext
                    ? cn(
                        'text-white shadow-lg hover:scale-[1.02]',
                        darkMode
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
                      )
                    : 'bg-transparent opacity-40 cursor-not-allowed text-gray-500'
                )}
              >
                {canGoNext ? (
                  <>
                    Next: {nextTabLabel}
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  'Completed'
                )}
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPhotoPreviewOpen && profile.personal.avatar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={() => setIsPhotoPreviewOpen(false)}
        >
          <div
            className="relative max-h-[85vh] max-w-[85vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPhotoPreviewOpen(false)}
              className="absolute -right-3 -top-3 rounded-full bg-white/95 p-1.5 text-gray-800 shadow-lg"
              aria-label="Close image preview"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={profile.personal.avatar}
              alt="Profile preview"
              className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );  
};

export default Profile;
