import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { employerPageTitleClass } from "@/lib/employer-page-styles";
import {
  Sparkles,
  Search,
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
  Mail,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Star,
  Award,
  Loader2,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { scrollPageToTop } from "@/lib/scroll-to-top";
import AdminBackButton from "@/components/AdminBackButton";
import { Pagination } from "@/components/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  applicantDisplayName,
  canRejectApplication,
  canShortlistApplication,
  computeApplicationStats,
  employerStatusActionMessage,
  fetchApplicantProfile,
  fetchEmployerApplications,
  formatAppliedDate,
  formatSalaryRange,
  getInitials,
  mapToEmployerTabStatus,
  resolveApplicantSkills,
  resolveResumeUrl,
  updateApplicationStatus,
  type EmployerApplication,
  type EmployerTabStatus,
} from "@/lib/employer-service";
import { fetchReviewPack } from "@/lib/ai-review-service";
import { apiFetch } from "@/lib/api";

interface ApplicationsProps {
  embedded?: boolean;
}

type TabFilter = EmployerTabStatus | "all";

export default function Applications({ embedded = false }: ApplicationsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<TabFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "match">("recent");
  const [profileApp, setProfileApp] = useState<EmployerApplication | null>(null);
  const [aiReviewApp, setAiReviewApp] = useState<EmployerApplication | null>(null);
  const [outreachApp, setOutreachApp] = useState<EmployerApplication | null>(null);
  const [outreachType, setOutreachType] = useState<'interview' | 'rejection' | 'general'>('interview');
  const [outreachInstructions, setOutreachInstructions] = useState('');
  const [isDraftingOutreach, setIsDraftingOutreach] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const employerId = user?.id ?? "";

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ["employer-applications", employerId],
    queryFn: () => fetchEmployerApplications(employerId),
    enabled: !!employerId,
  });

  const { data: profileDetail, isLoading: profileLoading } = useQuery({
    queryKey: ["applicant-profile", profileApp?.applicantId],
    queryFn: () => fetchApplicantProfile(profileApp!.applicantId!),
    enabled: !!profileApp?.applicantId,
  });

  const { data: reviewPack, isLoading: reviewPackLoading } = useQuery({
    queryKey: ["ai-review-pack", aiReviewApp?.id],
    queryFn: () => fetchReviewPack(aiReviewApp!.id),
    enabled: !!aiReviewApp?.id,
  });

  const stats = useMemo(() => computeApplicationStats(applications), [applications]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateApplicationStatus(id, status),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["employer-applications", employerId] });
      toast({
        title: "Application updated",
        description: employerStatusActionMessage(variables.status),
        variant: "success",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    },
  });

  const tabs = useMemo(
    () => [
      { id: "all" as const, label: "All Applications", count: applications.length },
      { id: "new" as const, label: "New", count: applications.filter((a) => mapToEmployerTabStatus(a.status) === "new").length },
      { id: "reviewing" as const, label: "Under Review", count: applications.filter((a) => mapToEmployerTabStatus(a.status) === "reviewing").length },
      { id: "shortlisted" as const, label: "Shortlisted", count: applications.filter((a) => mapToEmployerTabStatus(a.status) === "shortlisted").length },
      { id: "interview" as const, label: "Interview", count: applications.filter((a) => mapToEmployerTabStatus(a.status) === "interview").length },
      { id: "hired" as const, label: "Hired", count: applications.filter((a) => mapToEmployerTabStatus(a.status) === "hired").length },
      { id: "rejected" as const, label: "Rejected", count: applications.filter((a) => mapToEmployerTabStatus(a.status) === "rejected").length },
    ],
    [applications],
  );

  const statCards = [
    { label: "Total Applications", value: stats.total, icon: FileText, color: "from-blue-500 to-cyan-500" },
    { label: "Under Review", value: stats.underReview, icon: Clock, color: "from-purple-500 to-pink-500" },
    { label: "Shortlisted", value: stats.shortlisted, icon: Star, color: "from-orange-500 to-red-500" },
    { label: "Hired", value: stats.hired, icon: Award, color: "from-green-500 to-emerald-500" },
  ];

  const getStatusBadge = (tab: EmployerTabStatus) => {
    const badges: Record<EmployerTabStatus, { color: string; label: string }> = {
      new: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "New Application" },
      reviewing: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Under Review" },
      shortlisted: { color: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "Shortlisted" },
      interview: { color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", label: "Interview" },
      hired: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Hired" },
      rejected: { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Rejected" },
    };
    return badges[tab];
  };

  const filteredApplications = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return applications
      .filter((app) => {
        const tab = mapToEmployerTabStatus(app.status);
        if (selectedTab !== "all" && tab !== selectedTab) return false;
        const name = applicantDisplayName(app.applicant).toLowerCase();
        const position = (app.job?.title || "").toLowerCase();
        return name.includes(term) || position.includes(term);
      })
      .sort((a, b) => {
        if (sortBy === "match") return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
      });
  }, [applications, searchTerm, selectedTab, sortBy]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedTab, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const currentApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleContact = (app: EmployerApplication) => {
    if (!app.applicantId) return;
    const path = embedded ? "/employer/dashboard?tab=messages" : "/employer/messages";
    navigate(path, { state: { peerId: app.applicantId } });
  };

  const handleViewProfile = (app: EmployerApplication) => {
    if (!app.applicantId) return;
    setProfileApp(app);
  };

  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const inputClass = isDark
    ? 'bg-slate-800/80 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:ring-violet-500/25 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0'
    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-500/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0';

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-24 ${embedded ? "" : "min-h-screen"}`}>
        <Loader2 className={`w-10 h-10 animate-spin ${isDark ? "text-blue-400" : "text-blue-600"}`} />
      </div>
    );
  }

  const profileName = profileApp ? applicantDisplayName(profileApp.applicant) : "";
  const profileUser = profileDetail?.user;
  const profileSkills = profileApp ? resolveApplicantSkills(profileApp) : [];

  return (
    <div className={`${embedded ? "min-h-full" : "min-h-screen"} ${embedded ? "bg-transparent" : isDark ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" : "bg-gray-50"}`}>
      {!embedded && (
        <div className="p-6">
          <AdminBackButton />
        </div>
      )}

      <Dialog open={!!profileApp} onOpenChange={(open) => !open && setProfileApp(null)}>
        <DialogContent className={`overflow-hidden p-0 border-0 ${isDark ? "bg-slate-900 shadow-2xl shadow-blue-900/10" : "bg-white shadow-xl"} max-w-lg rounded-2xl`}>
          {/* Header Gradient Cover */}
          <div className={`h-24 w-full bg-gradient-to-r ${isDark ? 'from-blue-600/40 to-indigo-600/40' : 'from-blue-500 to-indigo-600'} relative`}>
            {profileApp?.matchScore !== undefined && (
              <div className="absolute top-4 right-10 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-current" />
                {Math.round(profileApp.matchScore)}% Match
              </div>
            )}
          </div>
          
          <div className="px-6 pb-6 pt-0 relative">
            {/* Avatar Profile */}
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg border-4 -mt-10 mb-4 ${isDark ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-blue-600 border-white'}`}>
              {profileApp?.applicant?.profilePhoto ? (
                <img src={profileApp.applicant.profilePhoto} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <User className="w-8 h-8 opacity-50" />
              )}
            </div>

            <DialogHeader className="mb-6 text-left">
              <DialogTitle className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{profileName}</DialogTitle>
              <DialogDescription className={`text-sm font-medium flex items-center gap-1.5 mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                <Briefcase className="w-4 h-4" />
                {profileApp?.job?.title || "Candidate profile"}
              </DialogDescription>
            </DialogHeader>

            {profileLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contact Information Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profileUser?.email && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-100'}`}>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title={profileUser.email}>{profileUser.email}</span>
                    </div>
                  )}
                  {profileUser?.telephoneNumber && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-100'}`}>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{profileUser.telephoneNumber}</span>
                    </div>
                  )}
                  {(profileUser?.location || profileApp?.applicant?.location) && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl border sm:col-span-2 ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-100'}`}>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{profileUser?.location || profileApp?.applicant?.location}</span>
                    </div>
                  )}
                </div>

                {/* Bio / Headline */}
                {(profileApp?.profile?.headline || profileApp?.profile?.bio) && (
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-blue-50/50 border-blue-100'}`}>
                    {profileApp?.profile?.headline && (
                      <h4 className={`font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>{profileApp.profile.headline}</h4>
                    )}
                    {profileApp?.profile?.bio && (
                      <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>{profileApp.profile.bio}</p>
                    )}
                  </div>
                )}

                {/* Skills */}
                {profileSkills.length > 0 && (
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Skills & Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {profileSkills.map((skill) => (
                        <span
                          key={skill}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${isDark ? "bg-slate-800/80 border-slate-700 text-indigo-300" : "bg-white border-indigo-100 text-indigo-600 shadow-sm"}`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!aiReviewApp} onOpenChange={(open) => !open && setAiReviewApp(null)}>
        <DialogContent className={`overflow-hidden p-0 border-0 ${isDark ? "bg-slate-900 shadow-2xl shadow-blue-900/10" : "bg-white shadow-xl"} max-w-lg rounded-2xl`}>
          <div className={`h-24 w-full bg-gradient-to-r ${isDark ? 'from-amber-600/40 to-orange-600/40' : 'from-amber-500 to-orange-600'} relative`}>
            <div className="absolute top-4 right-10 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              AI Review
            </div>
          </div>
          
          <div className="px-6 pb-6 pt-0 relative">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg border-4 -mt-10 mb-4 ${isDark ? 'bg-slate-800 text-amber-400 border-slate-900' : 'bg-white text-amber-500 border-white'}`}>
              <Sparkles className="w-8 h-8" />
            </div>

            <DialogHeader className="mb-6 text-left">
              <DialogTitle className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{aiReviewApp ? applicantDisplayName(aiReviewApp.applicant) : ""}</DialogTitle>
              <DialogDescription className={`text-sm font-medium flex items-center gap-1.5 mt-1 ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>
                <Briefcase className="w-4 h-4" />
                {aiReviewApp?.job?.title || "Candidate Review"}
              </DialogDescription>
            </DialogHeader>

            {reviewPackLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className={`text-sm font-medium animate-pulse ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Generating insights with Gemini...</p>
              </div>
            ) : reviewPack ? (
              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                  <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    <Star className="w-4 h-4" /> Summary
                  </h4>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {reviewPack.candidateSummary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Matched Skills</h4>
                    {reviewPack.matchedSkills.length > 0 ? (
                      <ul className="space-y-1">
                        {reviewPack.matchedSkills.map((s: string, i: number) => (
                          <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No exact matches found.</p>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-red-400' : 'text-red-600'}`}>Missing Skills</h4>
                    {reviewPack.missingSkills.length > 0 ? (
                      <ul className="space-y-1">
                        {reviewPack.missingSkills.map((s: string, i: number) => (
                          <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <XCircle className="w-4 h-4 mt-0.5 text-red-400 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Candidate meets all listed requirements.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Suggested Interview Questions</h4>
                  <ul className="space-y-3">
                    {reviewPack.suggestedInterviewQuestions.map((q: string, i: number) => (
                      <li key={i} className={`p-3 rounded-lg text-sm border ${isDark ? 'bg-slate-800/80 border-slate-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                        <span className={`font-bold mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Q{i + 1}.</span> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load AI review.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!outreachApp} onOpenChange={(open) => {
        if (!open) {
          setOutreachApp(null);
          setGeneratedDraft('');
          setOutreachInstructions('');
        }
      }}>
        <DialogContent className={`overflow-hidden p-6 border-0 ${isDark ? "bg-slate-900 shadow-2xl text-white shadow-blue-900/10" : "bg-white shadow-xl text-gray-900"} max-w-lg rounded-2xl`}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              AI Outreach Draft Generator
            </DialogTitle>
            <DialogDescription className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Draft a personalized, polite message for {outreachApp ? applicantDisplayName(outreachApp.applicant) : "the applicant"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-semibold block mb-1.5">Message Type</label>
              <div className="flex gap-2">
                {(['interview', 'rejection', 'general'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOutreachType(t)}
                    className={`flex-1 py-2 px-3 text-xs font-semibold border rounded-lg capitalize transition-all cursor-pointer ${
                      outreachType === t
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isDark
                        ? 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t === 'general' ? 'general update' : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5">Custom Focus / Context (Optional)</label>
              <textarea
                value={outreachInstructions}
                onChange={(e) => setOutreachInstructions(e.target.value)}
                placeholder="e.g. Propose next Tuesday at 3 PM, highlight their React skills."
                rows={3}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-offset-0 ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-400' : 'bg-white border-gray-200 text-gray-950 placeholder-gray-400 focus:border-indigo-500'
                }`}
              />
            </div>

            {generatedDraft && (
              <div>
                <label className="text-xs font-semibold block mb-1.5">Generated Message Draft</label>
                <textarea
                  readOnly
                  value={generatedDraft}
                  rows={6}
                  className={`w-full p-3 text-xs font-mono rounded-lg border leading-relaxed ${
                    isDark ? 'bg-slate-950/80 border-slate-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOutreachApp(null)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-150 hover:bg-gray-200'}`}
            >
              Close
            </button>
            
            {generatedDraft && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedDraft);
                  toast({
                    title: "Copied to clipboard",
                    description: "You can now paste it in the chat or email.",
                  });
                }}
                className="px-4 py-2 text-sm border border-indigo-500/20 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg transition-colors cursor-pointer"
              >
                Copy
              </button>
            )}

            <button
              onClick={async () => {
                if (!outreachApp) return;
                setIsDraftingOutreach(true);
                try {
                  const res = await apiFetch('/api/ai/employer/messages/draft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      applicationId: outreachApp.id,
                      type: outreachType,
                      customInstructions: outreachInstructions.trim(),
                    }),
                    credentials: 'include',
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({ error: 'Outreach generation failed' }));
                    throw new Error(data.error || 'Request failed');
                  }
                  const result = await res.json();
                  if (result.success && result.messageDraft) {
                    setGeneratedDraft(result.messageDraft);
                    toast({
                      title: "Draft generated!",
                      description: "Outreach message is ready for review.",
                    });
                  } else {
                    throw new Error(result.error || "Failed to generate outreach");
                  }
                } catch (err: any) {
                  console.error(err);
                  toast({
                    title: "Drafting failed",
                    description: err.message || "Failed to generate outreach draft. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsDraftingOutreach(false);
                }
              }}
              disabled={isDraftingOutreach}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isDraftingOutreach ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Draft'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className={`relative ${embedded ? "w-full" : "container mx-auto max-w-7xl"} ${embedded ? "p-2" : "p-6"}`}>
        <div className="mb-6">
          <h1 className={employerPageTitleClass(isDark)}>Job Applications</h1>
          {error ? (
            <p className={`mt-1 text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>
              Failed to refresh applications.
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-200"} backdrop-blur-xl border rounded-2xl p-6`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"} text-sm mb-1`}>{stat.label}</p>
                <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className={`${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-200"} backdrop-blur-xl border rounded-2xl p-2 mb-6 flex flex-wrap gap-2`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                selectedTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25"
                  : isDark
                    ? "text-gray-400 hover:text-gray-200 hover:bg-slate-700/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedTab === tab.id ? "bg-white/20" : isDark ? "bg-slate-700/50" : "bg-gray-100"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className={`${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-200"} backdrop-blur-xl border rounded-2xl p-4 mb-6`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by candidate name or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${inputClass}`}
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recent" | "match")}
                className={`appearance-none pl-4 pr-10 py-3 rounded-xl border cursor-pointer ${inputClass}`}
              >
                <option value="recent">Most Recent</option>
                <option value="match">Best Match</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentApplications.map((app) => {
            const tabStatus = mapToEmployerTabStatus(app.status);
            const statusBadge = getStatusBadge(tabStatus);
            const name = applicantDisplayName(app.applicant);
            const skills = resolveApplicantSkills(app);
            const matchScore = app.matchScore ?? 0;
            const salary = formatSalaryRange(app.job);
            const location = app.applicant?.location || app.job?.location || "—";
            const resumeUrl = resolveResumeUrl(app.resume);
            const allowShortlist = canShortlistApplication(app.status);
            const allowReject = canRejectApplication(app.status);

            return (
              <div key={app.id} className={`${isDark ? "bg-slate-800/50 border-slate-700/50 hover:border-slate-600" : "bg-white border-gray-200 hover:border-gray-300"} backdrop-blur-xl border rounded-2xl p-5 transition-all duration-300 hover:shadow-lg group flex flex-col h-full`}>
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 text-base">
                    {name.split(' ').map(n => n[0]).join('').substring(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className={`text-base font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{name}</h3>
                      <div className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadge.color}`}>{statusBadge.label}</div>
                    </div>
                    <p className={`text-sm truncate mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{app.job?.title || "Unknown position"}</p>
                    {matchScore > 0 && (
                      <div className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${isDark ? "bg-blue-500/20 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {matchScore}% Match
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatAppliedDate(app.appliedAt)}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{location}</span>
                  {salary && salary !== "Not specified" && <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{salary}</span>}
                </div>
                
                <div className="flex-1 mb-4">
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.slice(0, 3).map((skill) => (
                        <span key={skill} className={`px-2 py-1 rounded-md text-[10px] font-medium border ${isDark ? "bg-slate-900/50 border-slate-700/50 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>{skill}</span>
                      ))}
                      {skills.length > 3 && (
                        <span className={`px-2 py-1 rounded-md text-[10px] font-medium border ${isDark ? "bg-slate-900/50 border-slate-700/50 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"}`}>+{skills.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className={`pt-4 border-t mt-auto flex flex-wrap items-center justify-between gap-3 ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                  <button type="button" onClick={() => handleViewProfile(app)} disabled={!app.applicantId} className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 hover:shadow-md transition-all disabled:opacity-50">
                    <Eye className="w-3.5 h-3.5" /> View Profile
                  </button>
                  <div className="flex gap-1.5 shrink-0">
                    <button type="button" title="AI Review" onClick={() => setAiReviewApp(app)} disabled={!app.applicantId} className={`p-2 rounded-lg font-medium border flex items-center justify-center transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300" : "bg-white border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"} disabled:opacity-50`}>
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    {allowShortlist && (
                      <button type="button" title="Shortlist" onClick={() => statusMutation.mutate({ id: app.id, status: "shortlisted" })} disabled={statusMutation.isPending} className={`p-2 rounded-lg font-medium border flex items-center justify-center transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-green-400 hover:bg-green-500/10 hover:border-green-500/30" : "bg-white border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-200"}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {allowReject && (
                      <button type="button" title="Reject" onClick={() => statusMutation.mutate({ id: app.id, status: "rejected" })} disabled={statusMutation.isPending} className={`p-2 rounded-lg font-medium border flex items-center justify-center transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/30" : "bg-white border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200"}`}>
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button type="button" title="Draft Outreach Message" onClick={() => setOutreachApp(app)} disabled={!app.applicantId} className={`p-2 rounded-lg font-medium border flex items-center justify-center transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700 hover:text-indigo-300" : "bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"} disabled:opacity-50`}>
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    {resumeUrl && (
                      <a href={resumeUrl} target="_blank" rel="noopener noreferrer" title="Resume" className={`p-2 rounded-lg font-medium border flex items-center justify-center transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700 hover:text-white" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredApplications.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            scrollPageToTop();
          }}
          itemName="applications"
        />

        {filteredApplications.length === 0 && (
          <div className={`backdrop-blur-xl border rounded-2xl p-12 text-center ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-200"}`}>
            <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-900"}`}>
              {applications.length === 0 ? "No applications yet" : "No applications match your filters"}
            </h3>
            <p className={isDark ? "text-gray-500" : "text-gray-600"}>
              {applications.length === 0
                ? "Applications appear here when candidates apply to your job postings."
                : "Try adjusting your filters or search terms."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
