import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useSavedJobs } from "@/contexts/SavedJobsContext";
import type { Job } from "@/pages/employee/savedJobsUtils";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import {
  Heart,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Trash2,
  Search,
  Bookmark,
  BookmarkCheck,
  Users,
  Sparkles,
  Target,
  Filter,
  ChevronRight,
  ChevronLeft,
  Zap,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { scrollPageToTop } from "@/lib/scroll-to-top";

interface SavedJobsProps {
  embedded?: boolean;
  onNavigateTab?: (tab: string) => void;
}

type StatCardItem =
  | {
      label: string;
      value: string | number;
      hint: string;
      icon: LucideIcon;
      accent: LucideIcon;
      iconGradient: string;
      hoverBorder: string;
      featured?: false;
    }
  | {
      label: string;
      value: string | number;
      hint: string;
      icon: LucideIcon;
      accent: LucideIcon;
      iconGradient?: string;
      hoverBorder?: string;
      featured: true;
    };

function isRecentlyPosted(postedTime: string): boolean {
  const t = postedTime.toLowerCase();
  return t.includes("hour") || t.includes("day") || t.includes("recent");
}

function SavedJobCard({
  job,
  darkMode,
  onRemove,
}: {
  job: Job;
  darkMode: boolean;
  onRemove: (id: string) => void;
}) {
  const companyInitials = job.company.substring(0, 2).toUpperCase();
  const skills = job.skills ?? [];

  return (
    <article
      className={cn(
        "rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5",
        darkMode
          ? "bg-slate-900/60 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.22)] hover:border-sky-400/25"
          : "bg-white border-gray-100 shadow-lg hover:shadow-xl hover:border-blue-200"
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600">
            {companyInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={cn(
                      "text-lg font-bold line-clamp-2",
                      darkMode ? "text-slate-50" : "text-gray-900"
                    )}
                  >
                    {job.title}
                  </h3>
                  {job.isNew && (
                    <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      New
                    </span>
                  )}
                </div>
                <p className={cn("mt-0.5 text-sm font-medium", darkMode ? "text-slate-400" : "text-gray-600")}>
                  {job.company}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                  darkMode
                    ? "bg-white/[0.06] text-slate-400 border border-white/10"
                    : "bg-gray-50 text-gray-600 border border-gray-100"
                )}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {job.location}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                  darkMode
                    ? "bg-white/[0.06] text-slate-400 border border-white/10"
                    : "bg-gray-50 text-gray-600 border border-gray-100"
                )}
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                {job.type}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                  darkMode
                    ? "bg-white/[0.06] text-slate-400 border border-white/10"
                    : "bg-gray-50 text-gray-600 border border-gray-100"
                )}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {job.postedTime}
              </span>
              {job.salary && job.salary !== "—" && (
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold",
                    darkMode
                      ? "bg-sky-400/10 text-sky-300 border border-sky-400/20"
                      : "bg-blue-50 text-blue-700 border border-blue-100"
                  )}
                >
                  {job.salary}
                </span>
              )}
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-lg border",
                      darkMode
                        ? "bg-sky-400/10 text-sky-300 border-sky-400/20"
                        : "bg-indigo-50 text-indigo-700 border-indigo-100"
                    )}
                  >
                    {skill}
                  </span>
                ))}
                {skills.length > 5 && (
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-lg border",
                      darkMode
                        ? "bg-white/[0.05] text-slate-400 border-white/10"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    )}
                  >
                    +{skills.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "mt-5 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
            darkMode ? "border-white/10" : "border-gray-100"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
                darkMode
                  ? "bg-sky-400/10 text-sky-300 border border-sky-400/25"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              )}
            >
              <Target className="w-3.5 h-3.5" />
              {job.matchPercentage}% match
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                darkMode
                  ? "bg-white/[0.06] text-slate-400 border border-white/10"
                  : "bg-gray-50 text-gray-600 border border-gray-100"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              {job.applicants} applicant{job.applicants === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => onRemove(job.id)}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl border transition-all",
                darkMode
                  ? "border-white/10 bg-white/[0.04] text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
                  : "border-gray-200 bg-gray-50 text-rose-500 hover:bg-rose-50 hover:border-rose-200"
              )}
              title="Unsave job"
              aria-label="Unsave job"
            >
              <Heart className="w-4 h-4 fill-current" />
            </button>
            <button
              type="button"
              className={cn(
                "h-10 px-5 rounded-xl text-sm font-bold transition-all",
                darkMode
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20"
              )}
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SavedJobs({ embedded = false, onNavigateTab }: SavedJobsProps) {
  const { theme } = useTheme();
  const darkMode =
    typeof window !== "undefined" &&
    (theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));

  const { savedJobs, removeJob, clearAllJobs } = useSavedJobs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const glassCard = darkMode
    ? "bg-slate-900/60 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl"
    : "bg-white border-gray-100 shadow-lg";

  const filteredJobs = savedJobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();
    const skills = job.skills ?? [];
    const matchesSearch =
      query.length === 0 ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      skills.some((skill) => skill.toLowerCase().includes(query));
    const matchesType = selectedType === "all" || job.type.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const companyCount = new Set(savedJobs.map((j) => j.company)).size;
  const recentCount = savedJobs.filter((job) => isRecentlyPosted(job.postedTime ?? "")).length;
  const avgMatch =
    savedJobs.length > 0
      ? Math.round(savedJobs.reduce((acc, job) => acc + (job.matchPercentage || 0), 0) / savedJobs.length)
      : 0;

  const browseJobs = () => {
    if (onNavigateTab) onNavigateTab("browse");
    else window.location.href = "/employee/dashboard?tab=browse";
  };

  const statCards: StatCardItem[] = [
    {
      label: "Total Saved",
      value: savedJobs.length,
      hint:
        searchQuery || selectedType !== "all"
          ? `${filteredJobs.length} matching filters`
          : "Roles bookmarked for later",
      icon: BookmarkCheck,
      accent: Sparkles,
      iconGradient: "from-blue-500 to-indigo-600",
      hoverBorder: "hover:border-sky-400/30",
    },
    {
      label: "Companies",
      value: companyCount,
      hint:
        companyCount > 0
          ? `${companyCount} unique employer${companyCount === 1 ? "" : "s"}`
          : "Save jobs to track employers",
      icon: Building2,
      accent: Users,
      iconGradient: "from-emerald-500 to-teal-500",
      hoverBorder: "hover:border-emerald-400/30",
    },
    {
      label: "Recently Added",
      value: recentCount,
      hint:
        recentCount > 0
          ? "Posted within the last few days"
          : "No fresh listings in your list",
      icon: Clock,
      accent: Zap,
      iconGradient: "from-amber-500 to-orange-500",
      hoverBorder: "hover:border-amber-400/30",
    },
    {
      label: "Match Rate",
      value: `${avgMatch}%`,
      hint:
        savedJobs.length > 0 ? "Average fit across saved roles" : "Save jobs to see your average",
      icon: Target,
      accent: BarChart3,
      featured: true,
    },
  ];

  const pageHeader = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {!embedded && (
          <button
            type="button"
            onClick={() => window.history.back()}
            className={cn(
              "p-2 rounded-xl transition-all shrink-0",
              darkMode ? "hover:bg-white/10 text-slate-400" : "hover:bg-gray-100 text-gray-600"
            )}
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <h1
            className={cn(
              "text-3xl font-black tracking-tight",
              darkMode ? "text-slate-50" : "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            )}
          >
            Saved Jobs
          </h1>
          <p className={cn("text-sm mt-0.5", darkMode ? "text-slate-400" : "text-gray-600")}>
            Your curated list of job opportunities
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {savedJobs.length > 0 && (
          <button
            type="button"
            onClick={clearAllJobs}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border transition-all text-sm",
              darkMode
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            )}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
        {!embedded && <ModeToggle />}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        embedded ? "min-h-full" : "min-h-screen",
        "transition-colors duration-300",
        embedded ? "bg-transparent" : darkMode ? "bg-[#070b14] text-slate-100" : "bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"
      )}
    >
      {!embedded && darkMode && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(1100px_460px_at_18%_-12%,rgba(56,189,248,0.12),transparent_58%),radial-gradient(900px_420px_at_88%_-8%,rgba(99,102,241,0.14),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_360px_at_55%_120%,rgba(124,58,237,0.1),transparent_60%)]" />
        </div>
      )}
      <div className={embedded ? "w-full space-y-8" : "max-w-7xl mx-auto px-6 py-8 space-y-8"}>
        {pageHeader}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const Accent = stat.accent;

            if (stat.featured) {
              return (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-3xl p-6 border transition-all relative overflow-hidden group",
                    darkMode
                      ? "bg-slate-900/60 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl hover:bg-slate-900/75 hover:border-fuchsia-400/30"
                      : "bg-white border-gray-100 shadow-lg hover:border-fuchsia-200"
                  )}
                >
                  <div
                    className={cn(
                      "absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl",
                      darkMode ? "bg-fuchsia-500/20" : "bg-fuchsia-100"
                    )}
                  />
                  <div
                    className={cn(
                      "absolute -left-8 -bottom-8 w-28 h-28 rounded-full blur-2xl",
                      darkMode ? "bg-violet-500/15" : "bg-violet-100/90"
                    )}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={cn(
                          "p-3 rounded-xl shadow-lg transition-transform group-hover:scale-105",
                          darkMode
                            ? "bg-gradient-to-br from-rose-500/85 to-violet-500/85 ring-1 ring-white/20"
                            : "bg-gradient-to-br from-rose-500 to-violet-600"
                        )}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Accent className={cn("w-5 h-5", darkMode ? "text-fuchsia-300/80" : "text-fuchsia-500/80")} />
                    </div>
                    <p className={cn("text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-gray-600")}>
                      {stat.label}
                    </p>
                    <p className={cn("text-3xl font-bold tracking-tight", darkMode ? "text-slate-50" : "text-gray-900")}>
                      {stat.value}
                    </p>
                    <p className={cn("text-xs font-semibold mt-2", darkMode ? "text-slate-400" : "text-gray-500")}>
                      {stat.hint}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={stat.label}
                className={cn(
                  "rounded-3xl p-6 border transition-all group",
                  glassCard,
                  stat.hoverBorder,
                  darkMode && "hover:bg-slate-900/75"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "p-3 bg-gradient-to-br rounded-xl shadow-lg group-hover:scale-110 transition-transform",
                      stat.iconGradient
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Accent className={cn("w-5 h-5", darkMode ? "text-slate-500" : "text-gray-400")} />
                </div>
                <p className={cn("text-sm font-medium mb-1", darkMode ? "text-slate-400" : "text-gray-600")}>
                  {stat.label}
                </p>
                <p className={cn("text-3xl font-bold tracking-tight", darkMode ? "text-slate-50" : "text-gray-900")}>
                  {stat.value}
                </p>
                <p className={cn("text-xs font-semibold mt-2", darkMode ? "text-slate-500" : "text-gray-500")}>
                  {stat.hint}
                </p>
              </div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className={cn("rounded-3xl border p-5 sm:p-6", glassCard)}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5",
                  darkMode ? "text-slate-500" : "text-gray-400"
                )}
              />
              <input
                type="text"
                placeholder="Search saved jobs by title, company, or skill..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "w-full pl-12 pr-4 py-3.5 rounded-xl border font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent",
                  darkMode
                    ? "bg-white/[0.06] border-white/10 text-slate-50 placeholder-slate-500 focus:bg-white/[0.08]"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white"
                )}
              />
            </div>
            <div className="relative sm:min-w-[200px]">
              <Filter
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none",
                  darkMode ? "text-slate-500" : "text-gray-400"
                )}
              />
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "w-full appearance-none pl-11 pr-10 py-3.5 rounded-xl border font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent cursor-pointer",
                  darkMode
                    ? "bg-white/[0.06] border-white/10 text-slate-50 focus:bg-white/[0.08]"
                    : "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white"
                )}
              >
                <option value="all">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="remote">Remote</option>
                <option value="contract">Contract</option>
              </select>
              <ChevronRight
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 pointer-events-none",
                  darkMode ? "text-slate-500" : "text-gray-400"
                )}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {savedJobs.length === 0 ? (
          <div className={cn("rounded-3xl p-12 text-center border", glassCard)}>
            <div
              className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4",
                darkMode ? "bg-white/[0.06] border border-white/10" : "bg-gray-100"
              )}
            >
              <Bookmark className={cn("w-10 h-10", darkMode ? "text-slate-500" : "text-gray-400")} />
            </div>
            <h3 className={cn("text-xl font-bold mb-2", darkMode ? "text-slate-50" : "text-gray-900")}>
              No Saved Jobs Yet
            </h3>
            <p className={cn("mb-6 max-w-md mx-auto", darkMode ? "text-slate-400" : "text-gray-600")}>
              Start browsing jobs and tap the heart icon to save them for later
            </p>
            <button
              type="button"
              onClick={browseJobs}
              className={cn(
                "px-6 py-3 rounded-xl font-semibold transition-all",
                darkMode
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              )}
            >
              Browse Jobs
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className={cn("rounded-3xl p-12 text-center border", glassCard)}>
            <div
              className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4",
                darkMode ? "bg-white/[0.06] border border-white/10" : "bg-gray-100"
              )}
            >
              <Search className={cn("w-10 h-10", darkMode ? "text-slate-500" : "text-gray-400")} />
            </div>
            <h3 className={cn("text-xl font-bold mb-2", darkMode ? "text-slate-50" : "text-gray-900")}>
              No Jobs Found
            </h3>
            <p className={darkMode ? "text-slate-400" : "text-gray-600"}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredJobs
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((job) => (
                  <SavedJobCard key={job.id} job={job} darkMode={darkMode} onRemove={removeJob} />
                ))}
            </div>

            {Math.ceil(filteredJobs.length / ITEMS_PER_PAGE) > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    scrollPageToTop();
                  }}
                  disabled={currentPage === 1}
                  className={cn(
                    "p-2 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    darkMode
                      ? "bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/10"
                      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm"
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(filteredJobs.length / ITEMS_PER_PAGE) }).map(
                    (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCurrentPage(i + 1);
                          scrollPageToTop();
                        }}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all",
                          currentPage === i + 1
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                            : darkMode
                              ? "hover:bg-white/[0.06] text-slate-400 hover:text-slate-200"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        )}
                      >
                        {i + 1}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(filteredJobs.length / ITEMS_PER_PAGE), p + 1)
                    );
                    scrollPageToTop();
                  }}
                  disabled={currentPage === Math.ceil(filteredJobs.length / ITEMS_PER_PAGE)}
                  className={cn(
                    "p-2 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    darkMode
                      ? "bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/10"
                      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm"
                  )}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
