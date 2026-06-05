import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { employerPageTitleClass } from "@/lib/employer-page-styles";
import {
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
                    <button type="button" title="Message" onClick={() => handleContact(app)} disabled={!app.applicantId} className={`p-2 rounded-lg font-medium border flex items-center justify-center transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700 hover:text-white" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"} disabled:opacity-50`}>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Showing <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{Math.min(currentPage * itemsPerPage, filteredApplications.length)}</span> of <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{filteredApplications.length}</span> applications
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  scrollPageToTop();
                }}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? isDark ? 'border-slate-700/50 text-gray-600 bg-slate-800/20' : 'border-gray-200 text-gray-400 bg-gray-50'
                    : isDark ? 'border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let startPage = 1;
                  if (totalPages > 5) {
                    startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  }
                  const pageNum = startPage + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        scrollPageToTop();
                      }}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-md'
                          : isDark ? 'text-gray-400 hover:bg-slate-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  scrollPageToTop();
                }}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? isDark ? 'border-slate-700/50 text-gray-600 bg-slate-800/20' : 'border-gray-200 text-gray-400 bg-gray-50'
                    : isDark ? 'border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

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
