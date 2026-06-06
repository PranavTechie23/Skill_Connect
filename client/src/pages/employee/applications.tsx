import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Search,
  TrendingUp,
  BarChart3,
  Users,
  Briefcase,
  ArrowLeft,
  X,
  Sparkles,
  Filter,
  ChevronRight,
  ChevronLeft,
  Award,
  XCircle,
  Zap,
  Target,
} from "lucide-react";
import { scrollPageToTop } from "@/lib/scroll-to-top";
import type { LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import { useTheme } from "@/components/theme-provider";
import { apiFetch } from "@/lib/api";
import { fetchActivityInsights } from "@/lib/notifications-service";
import {
  normalizeApplicationStatus,
  getStatusLabel,
  DEFAULT_STATUS_EXPLANATIONS,
} from "@/lib/application-status";

interface Application {
  id: string;
  jobId: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
  job?: {
    title: string;
    company: {
      name: string;
    };
    location: string;
    jobType: string;
    salary: string;
  };
  interviewDate?: string;
}

interface ApplicationsProps {
  embedded?: boolean;
  onNavigateTab?: (tab: string) => void;
}

const APPLICATION_PIPELINE = ["applied", "reviewed", "interview", "accepted"] as const;
const PIPELINE_LABELS = ["Sent", "Review", "Interview", "Offer"] as const;

function ApplicationPipeline({
  status,
  darkMode,
  stepColor,
}: {
  status: string;
  darkMode: boolean;
  stepColor: string;
}) {
  const normalized = normalizeApplicationStatus(status);
  const isRejected = normalized === "rejected";
  const stepIndex = (() => {
    if (isRejected) return 2;
    const idx = APPLICATION_PIPELINE.indexOf(
      normalized as (typeof APPLICATION_PIPELINE)[number]
    );
    return idx >= 0 ? idx : 0;
  })();

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-1">
        {PIPELINE_LABELS.map((label, i) => {
          const active = !isRejected && i <= stepIndex;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={cn(
                  "h-1.5 w-full rounded-full transition-colors",
                  active ? stepColor : darkMode ? "bg-white/10" : "bg-gray-200"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide truncate w-full text-center",
                  active
                    ? darkMode
                      ? "text-slate-300"
                      : "text-gray-700"
                    : darkMode
                      ? "text-slate-600"
                      : "text-gray-400"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      {isRejected && (
        <p className={cn("text-xs font-medium", darkMode ? "text-rose-400" : "text-rose-600")}>
          Application closed — not selected for this role
        </p>
      )}
    </div>
  );
}

export default function Applications({ embedded = false, onNavigateTab }: ApplicationsProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const darkMode =
    typeof window !== "undefined" &&
    (theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const {
    data: applications = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Application[]>({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User ID is required");
      }

      const response = await apiFetch(`/api/applications?applicantId=${user.id}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        const errorText = contentType?.includes("application/json")
          ? JSON.stringify(await response.json())
          : await response.text();
        throw new Error(`Failed to fetch applications: ${response.status} ${errorText}`);
      }

      if (!contentType?.includes("application/json")) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const data = await response.json();

      const normalized = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (app: Record<string, unknown>) => {
          const mapped = {
            ...app,
            id: String(app.id ?? ""),
            status: normalizeApplicationStatus(app.status as string),
            appliedAt: (app.appliedAt ?? app.applied_at ?? "") as string,
            updatedAt: (app.updatedAt ?? app.updated_at ?? "") as string,
            job: (app as { job?: Application["job"] })?.job
              ? {
                  ...(app as { job: Application["job"] }).job!,
                  company:
                    (app as { job: Application["job"] }).job!.company ||
                    (app as { company?: { name: string } }).company ||
                    { name: "Unknown Company" },
                }
              : undefined,
          } as Application;

          const missingJobInfo =
            !mapped.job?.title ||
            !mapped.job?.company?.name ||
            mapped.job?.title === "Unknown Position" ||
            mapped.job?.company?.name === "Unknown Company";

          if (!missingJobInfo || !app?.jobId) return mapped;

          try {
            const jobRes = await apiFetch(`/api/jobs/${app.jobId}`, {
              headers: { Accept: "application/json" },
            });
            if (!jobRes.ok) return mapped;
            const jobData = await jobRes.json();

            return {
              ...mapped,
              job: {
                title: jobData?.title || mapped.job?.title || "Untitled Role",
                company: {
                  name:
                    jobData?.company?.name ||
                    jobData?.companyName ||
                    mapped.job?.company?.name ||
                    "Unknown Company",
                },
                location: jobData?.location || mapped.job?.location || "Location not specified",
                jobType: jobData?.jobType || mapped.job?.jobType || "Role type not specified",
                salary:
                  mapped.job?.salary ||
                  (jobData?.salaryMin && jobData?.salaryMax
                    ? `${jobData.salaryMin} - ${jobData.salaryMax}`
                    : "Salary not specified"),
              },
            } as Application;
          } catch {
            return mapped;
          }
        })
      );

      return normalized;
    },
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 2,
  });

  const getStatusConfig = (status: string) => {
    const normalized = normalizeApplicationStatus(status);
    const configs: Record<
      string,
      { color: string; icon: LucideIcon; label: string; stepColor: string }
    > = {
      applied: {
        color: darkMode
          ? "bg-sky-500/15 text-sky-300 border-sky-400/30"
          : "bg-sky-50 text-sky-700 border-sky-200",
        icon: FileText,
        label: getStatusLabel(status),
        stepColor: "bg-sky-400",
      },
      reviewed: {
        color: darkMode
          ? "bg-blue-500/15 text-blue-300 border-blue-400/30"
          : "bg-blue-50 text-blue-700 border-blue-200",
        icon: CheckCircle,
        label: getStatusLabel(status),
        stepColor: "bg-blue-400",
      },
      interview: {
        color: darkMode
          ? "bg-violet-500/15 text-violet-300 border-violet-400/30"
          : "bg-violet-50 text-violet-700 border-violet-200",
        icon: TrendingUp,
        label: getStatusLabel(status),
        stepColor: "bg-violet-400",
      },
      accepted: {
        color: darkMode
          ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
          : "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: Award,
        label: getStatusLabel(status),
        stepColor: "bg-emerald-400",
      },
      rejected: {
        color: darkMode
          ? "bg-rose-500/15 text-rose-300 border-rose-400/30"
          : "bg-rose-50 text-rose-700 border-rose-200",
        icon: XCircle,
        label: getStatusLabel(status),
        stepColor: "bg-rose-400",
      },
    };
    return configs[normalized] || configs.applied;
  };

  const glassCard = darkMode
    ? "bg-slate-900/60 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl"
    : "bg-white/90 border-white/80 shadow-lg shadow-blue-500/[0.06] backdrop-blur-md";

  const { data: insights } = useQuery({
    queryKey: ["activity-insights", user?.id, "applications"],
    queryFn: fetchActivityInsights,
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const statusExplanations = insights?.statusExplanations ?? DEFAULT_STATUS_EXPLANATIONS;

  const getStatusExplanation = (status: string) => {
    const key = normalizeApplicationStatus(status);
    return (
      statusExplanations[key] ??
      statusExplanations.applied ??
      DEFAULT_STATUS_EXPLANATIONS.applied
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const dt = new Date(dateString);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getJobTitle = (app: Application) => app.job?.title || "Untitled Role";
  const getCompanyName = (app: Application) =>
    app?.job?.company?.name || "Unknown Company";

  const filteredApplications = applications.filter((app) => {
    const query = searchQuery.trim().toLowerCase();
    const title = getJobTitle(app).toLowerCase();
    const company = getCompanyName(app).toLowerCase();
    const matchesSearch = query.length === 0 || title.includes(query) || company.includes(query);
    const matchesStatus =
      statusFilter === "all" || normalizeApplicationStatus(app.status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = applications.reduce(
    (acc, app) => {
      if (app.status) {
        acc[app.status] = (acc[app.status] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const totalApplications = applications.length;
  const inProgressCount =
    (statusCounts.reviewed || 0) + (statusCounts.interview || 0) + (statusCounts.applied || 0);
  const successRate =
    totalApplications > 0
      ? Math.round(((statusCounts.accepted || 0) / totalApplications) * 100)
      : 0;

  const pageShell = (children: ReactNode) => (
    <div
      className={cn(
        "relative transition-colors duration-300",
        embedded ? "min-h-[calc(100vh-5.5rem)] w-full" : "min-h-screen",
        !embedded && (darkMode ? "bg-[#070b14] text-slate-100" : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50")
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden",
          embedded ? "rounded-3xl" : "",
          !embedded && !darkMode ? "-z-10" : ""
        )}
        aria-hidden
      >
        {darkMode ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(1100px_460px_at_18%_-12%,rgba(56,189,248,0.12),transparent_58%),radial-gradient(900px_420px_at_88%_-8%,rgba(99,102,241,0.14),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(900px_360px_at_55%_120%,rgba(124,58,237,0.1),transparent_60%)]" />
            {embedded && (
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
            )}
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/80 to-indigo-100/60" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(99,102,241,0.14),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_30%,rgba(59,130,246,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_85%,rgba(139,92,246,0.09),transparent_50%)]" />
          </>
        )}
      </div>
      <div
        className={cn(
          "relative",
          embedded ? "w-full space-y-6 sm:space-y-7 py-1" : "max-w-7xl mx-auto px-6 py-8 space-y-8"
        )}
      >
        {children}
      </div>
    </div>
  );

  const pageHeader = (
    <div
      className={cn(
        "flex items-center justify-between",
        embedded &&
          cn(
            "rounded-2xl border px-5 py-4",
            darkMode
              ? "border-white/10 bg-slate-900/40 backdrop-blur-md"
              : "border-white/70 bg-white/75 shadow-sm backdrop-blur-md"
          )
      )}
    >
      <div className="flex items-center gap-4">
        {!embedded && (
          <button
            type="button"
            onClick={() => window.history.back()}
            className={cn(
              "p-2.5 rounded-xl border transition-all",
              darkMode
                ? "border-white/10 hover:bg-white/[0.06] text-slate-400"
                : "border-gray-200 hover:bg-gray-100 text-gray-600"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1
            className={cn(
              "text-3xl font-bold tracking-tight",
              darkMode ? "text-slate-50" : "text-gray-900"
            )}
          >
            My Applications
          </h1>
          <p className={cn("mt-1", darkMode ? "text-slate-400" : "text-gray-600")}>
            Track and manage your job applications
          </p>
        </div>
      </div>
      {!embedded && <ModeToggle />}
    </div>
  );

  if (error) {
    return pageShell(
      <>
        {pageHeader}
        <div
          className={cn(
            "rounded-3xl p-6 border",
            darkMode
              ? "border-rose-500/30 bg-rose-500/10"
              : "border-red-200 bg-red-50"
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-rose-500 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">Failed to load applications</p>
            </div>
            <p className={darkMode ? "text-rose-300" : "text-red-600"}>
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
            <button
              type="button"
              className={cn(
                "mt-2 w-fit px-4 py-2 rounded-xl font-semibold transition-all",
                darkMode
                  ? "bg-white/10 hover:bg-white/15 text-slate-100"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
              onClick={() => refetch()}
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  if (isLoading && applications.length === 0) {
    return pageShell(
      <>
        {pageHeader}
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-indigo-500 mx-auto" />
            <p className={cn("mt-4 font-medium", darkMode ? "text-slate-400" : "text-gray-600")}>
              Loading applications...
            </p>
          </div>
        </div>
      </>
    );
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
        featured: true;
      };

  const statCards: StatCardItem[] = [
    {
      label: "Total Applications",
      value: totalApplications,
      hint:
        searchQuery || statusFilter !== "all"
          ? `${filteredApplications.length} matching filters`
          : "Across all roles you've applied to",
      icon: FileText,
      accent: Zap,
      iconGradient: "from-blue-500 to-indigo-600",
      hoverBorder: "hover:border-sky-400/30",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      hint: `${statusCounts.applied || 0} sent · ${statusCounts.reviewed || 0} in review`,
      icon: Clock,
      accent: Target,
      iconGradient: "from-amber-500 to-orange-500",
      hoverBorder: "hover:border-amber-400/30",
    },
    {
      label: "Interviews",
      value: statusCounts.interview || 0,
      hint:
        (statusCounts.interview || 0) > 0 ? "Active pipeline stage" : "None scheduled yet",
      icon: Users,
      accent: TrendingUp,
      iconGradient: "from-emerald-500 to-teal-500",
      hoverBorder: "hover:border-emerald-400/30",
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      hint: `${statusCounts.accepted || 0} offer${(statusCounts.accepted || 0) === 1 ? "" : "s"} received`,
      icon: Award,
      accent: BarChart3,
      iconGradient: "from-violet-500 to-fuchsia-600",
      hoverBorder: "hover:border-violet-400/30",
    },
  ];

  return pageShell(
    <>
      {pageHeader}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const Accent = stat.accent;

          if (stat.featured) {
            return (
              <div
                key={stat.label}
                className={cn(
                  "rounded-3xl p-6 border transition-all relative overflow-hidden",
                  darkMode
                    ? "bg-gradient-to-br from-violet-600/90 via-indigo-600/85 to-blue-600/90 border-white/15 shadow-lg shadow-violet-950/40"
                    : "bg-gradient-to-br from-violet-500 to-indigo-600 border-transparent shadow-lg"
                )}
              >
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <Accent className="w-5 h-5 text-white/70" />
                  </div>
                  <p className="text-sm font-medium text-white/85 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                  <p className="text-xs font-semibold mt-2 text-white/75">{stat.hint}</p>
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
              placeholder="Search by role or company..."
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={cn(
                "w-full appearance-none pl-11 pr-10 py-3.5 rounded-xl border font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent cursor-pointer",
                darkMode
                  ? "bg-white/[0.06] border-white/10 text-slate-50 focus:bg-white/[0.08]"
                  : "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white"
              )}
            >
              <option value="all">All Status</option>
              <option value="applied">Application Sent</option>
              <option value="reviewed">Under Review</option>
              <option value="interview">Interview</option>
              <option value="accepted">Offer Received</option>
              <option value="rejected">Not Selected</option>
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

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className={cn("rounded-3xl p-12 text-center border", glassCard)}>
          <div
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4",
              darkMode ? "bg-white/[0.06] border border-white/10" : "bg-gray-100"
            )}
          >
            <FileText className={cn("w-10 h-10", darkMode ? "text-slate-500" : "text-gray-400")} />
          </div>
          <h3 className={cn("text-xl font-bold mb-2", darkMode ? "text-slate-50" : "text-gray-900")}>
            {applications.length === 0 ? "No Applications Yet" : "No Applications Found"}
          </h3>
          <p className={darkMode ? "text-slate-400" : "text-gray-600"}>
            {applications.length === 0
              ? "Start applying to jobs to track your applications here"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredApplications
              .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
              .map((application) => {
                const statusConfig = getStatusConfig(application.status);
            const StatusIcon = statusConfig.icon;
            const companyInitials = getCompanyName(application).substring(0, 2).toUpperCase();

            return (
              <button
                key={application.id}
                type="button"
                onClick={() => setSelectedApplication(application)}
                className={cn(
                  "text-left rounded-3xl border overflow-hidden transition-all duration-300 group",
                  "hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
                  darkMode
                    ? "bg-slate-900/60 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.22)] hover:border-sky-400/25 hover:shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
                    : "bg-white border-gray-100 shadow-lg hover:shadow-xl hover:border-blue-200"
                )}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600">
                      {companyInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          "text-lg font-bold line-clamp-1 transition-colors",
                          darkMode
                            ? "text-slate-50 group-hover:text-sky-300"
                            : "text-gray-900 group-hover:text-blue-600"
                        )}
                      >
                        {getJobTitle(application)}
                      </h3>
                      <p className={cn("font-medium mt-0.5", darkMode ? "text-slate-400" : "text-gray-600")}>
                        {getCompanyName(application)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {application.job?.location && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                              darkMode
                                ? "bg-white/[0.06] text-slate-400 border border-white/10"
                                : "bg-gray-50 text-gray-600 border border-gray-100"
                            )}
                          >
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {application.job.location}
                          </span>
                        )}
                        {application.job?.jobType && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                              darkMode
                                ? "bg-white/[0.06] text-slate-400 border border-white/10"
                                : "bg-gray-50 text-gray-600 border border-gray-100"
                            )}
                          >
                            <Briefcase className="w-3.5 h-3.5 shrink-0" />
                            {application.job.jobType}
                          </span>
                        )}
                        {application.job?.salary && application.job.salary !== "Salary not specified" && (
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold",
                              darkMode
                                ? "bg-sky-400/10 text-sky-300 border border-sky-400/20"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            )}
                          >
                            {application.job.salary}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-5 h-5 shrink-0 mt-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all",
                        darkMode ? "text-slate-500" : "text-gray-400"
                      )}
                    />
                  </div>

                  {application.interviewDate && (
                    <div
                      className={cn(
                        "mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium",
                        darkMode
                          ? "bg-violet-500/15 text-violet-300 border border-violet-400/25"
                          : "bg-violet-50 text-violet-700 border border-violet-100"
                      )}
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      Interview {formatDate(application.interviewDate)}
                    </div>
                  )}

                  <div
                    className={cn(
                      "mt-4 pt-4 border-t",
                      darkMode ? "border-white/10" : "border-gray-100"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold",
                          statusConfig.color
                        )}
                      >
                        <StatusIcon className="w-4 h-4 shrink-0" />
                        {statusConfig.label}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium",
                          darkMode ? "text-slate-500" : "text-gray-500"
                        )}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Applied {formatDate(application.appliedAt)}
                      </span>
                    </div>
                    <ApplicationPipeline
                      status={application.status}
                      darkMode={darkMode}
                      stepColor={statusConfig.stepColor}
                    />
                  </div>
                </div>
              </button>
            );
          })}
          </div>

          {Math.ceil(filteredApplications.length / ITEMS_PER_PAGE) > 1 && (
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
                {Array.from({ length: Math.ceil(filteredApplications.length / ITEMS_PER_PAGE) }).map(
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
                    Math.min(Math.ceil(filteredApplications.length / ITEMS_PER_PAGE), p + 1)
                  );
                  scrollPageToTop();
                }}
                disabled={currentPage === Math.ceil(filteredApplications.length / ITEMS_PER_PAGE)}
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

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={cn(
              "w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden",
              darkMode ? "bg-slate-950/95 border-white/10" : "bg-white border-gray-100"
            )}
            role="dialog"
            aria-modal="true"
          >
            <div
              className={cn(
                "flex items-center justify-between p-6 border-b",
                darkMode ? "border-white/10" : "border-gray-100"
              )}
            >
              <h3 className={cn("text-xl font-bold", darkMode ? "text-slate-50" : "text-gray-900")}>
                Application Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  darkMode
                    ? "hover:bg-white/10 text-slate-400 hover:text-slate-100"
                    : "hover:bg-gray-100 text-gray-600"
                )}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-lg">
                  {(selectedApplication.job?.company?.name ?? "??").substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn("text-lg font-bold", darkMode ? "text-slate-50" : "text-gray-900")}>
                    {selectedApplication.job?.title}
                  </h4>
                  <p className={cn("font-medium", darkMode ? "text-slate-400" : "text-gray-600")}>
                    {selectedApplication.job?.company?.name ?? "Unknown Company"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
                    {selectedApplication.job?.location && (
                      <span className={cn("flex items-center gap-1.5", darkMode ? "text-slate-500" : "text-gray-500")}>
                        <MapPin className="w-4 h-4" />
                        {selectedApplication.job.location}
                      </span>
                    )}
                    {selectedApplication.job?.jobType && (
                      <span className={cn("flex items-center gap-1.5", darkMode ? "text-slate-500" : "text-gray-500")}>
                        <Briefcase className="w-4 h-4" />
                        {selectedApplication.job.jobType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {(() => {
                const modalStatus = getStatusConfig(selectedApplication.status);
                const ModalStatusIcon = modalStatus.icon;
                return (
                  <div
                    className={cn(
                      "p-4 rounded-2xl border",
                      darkMode ? "bg-white/[0.04] border-white/10" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold shrink-0",
                            modalStatus.color
                          )}
                        >
                          <ModalStatusIcon className="w-4 h-4" />
                          {modalStatus.label}
                        </span>
                        <div>
                          <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-gray-600")}>
                            Last updated {formatDate(selectedApplication.updatedAt || "")}
                          </p>
                          <p
                            className={cn(
                              "text-xs mt-2 flex items-start gap-1.5",
                              darkMode ? "text-violet-400" : "text-violet-600"
                            )}
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            {getStatusExplanation(selectedApplication.status)}
                          </p>
                        </div>
                      </div>
                      {selectedApplication.job?.salary && (
                        <span className={cn("text-lg font-bold", darkMode ? "text-slate-50" : "text-gray-900")}>
                          {selectedApplication.job.salary}
                        </span>
                      )}
                    </div>
                    <ApplicationPipeline
                      status={selectedApplication.status}
                      darkMode={darkMode}
                      stepColor={modalStatus.stepColor}
                    />
                  </div>
                );
              })()}

              {selectedApplication.interviewDate && (
                <div
                  className={cn(
                    "p-4 rounded-2xl border",
                    darkMode
                      ? "border-violet-400/30 bg-violet-500/10"
                      : "border-purple-200 bg-purple-50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Users className={cn("w-5 h-5", darkMode ? "text-violet-400" : "text-purple-600")} />
                    <h5 className={cn("font-semibold", darkMode ? "text-violet-300" : "text-purple-600")}>
                      Interview Scheduled
                    </h5>
                  </div>
                  <p className={darkMode ? "text-slate-300" : "text-gray-700"}>
                    {formatDate(selectedApplication.interviewDate)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className={cn(
                    "flex-1 py-3 rounded-xl font-semibold transition-all",
                    darkMode
                      ? "bg-white/10 hover:bg-white/15 text-slate-100"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  )}
                >
                  View Job Posting
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApplication(null);
                    if (onNavigateTab) onNavigateTab("messages");
                    else window.location.href = "/employee/dashboard?tab=messages";
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                >
                  Contact Recruiter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
