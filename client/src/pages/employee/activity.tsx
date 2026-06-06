import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import {
  Sparkles,
  Bell,
  Briefcase,
  MessageSquare,
  ChevronRight,
  Loader2,
  FileText,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  fetchActivityInsights,
  markNotificationRead,
  markAllNotificationsRead,
  formatRelativeTime,
  type AppNotification,
} from "@/lib/notifications-service";
import { apiFetch } from "@/lib/api";

interface ActivityPageProps {
  embedded?: boolean;
  onNavigateTab?: (tab: string) => void;
}

const pipelineCards = [
  { key: "applied", label: "Applied", icon: FileText, accent: "#6366f1", bg: "from-indigo-500/20 to-indigo-600/10", dot: "bg-indigo-400" },
  { key: "inReview", label: "In Review", icon: Clock, accent: "#a855f7", bg: "from-purple-500/20 to-purple-600/10", dot: "bg-purple-400" },
  { key: "interview", label: "Interview", icon: Users, accent: "#f59e0b", bg: "from-amber-500/20 to-amber-600/10", dot: "bg-amber-400" },
  { key: "offer", label: "Offer", icon: CheckCircle2, accent: "#10b981", bg: "from-emerald-500/20 to-emerald-600/10", dot: "bg-emerald-400" },
  { key: "rejected", label: "Closed", icon: XCircle, accent: "#f43f5e", bg: "from-rose-500/20 to-rose-600/10", dot: "bg-rose-400" },
] as const;

const statusConfig: Record<string, { dark: string; light: string }> = {
  interview: { dark: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30", light: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  interviewing: { dark: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30", light: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  accepted: { dark: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30", light: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  offer: { dark: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30", light: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  rejected: { dark: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30", light: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

function notificationIcon(type: string) {
  if (type === "new_message") return MessageSquare;
  if (type === "application_status") return Briefcase;
  return Bell;
}

export default function ActivityPage({ embedded = false, onNavigateTab }: ActivityPageProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const darkMode =
    typeof window !== "undefined" &&
    (theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["activity-insights", user?.id],
    queryFn: fetchActivityInsights,
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const { data: notifications = [], isLoading: feedLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: fetchNotifications,
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", user?.id, "activity"],
    queryFn: async () => {
      const res = await apiFetch(`/api/applications?applicantId=${user?.id}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
  });

  const handleMarkRead = async (n: AppNotification) => {
    if (n.isRead) return;
    await markNotificationRead(n.id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
  };

  const goTo = (tab: string) => {
    if (onNavigateTab) onNavigateTab(tab);
    else window.location.href = `/employee/dashboard?tab=${tab}`;
  };

  const pipeline = insights?.pipeline ?? {
    applied: 0, inReview: 0, interview: 0, offer: 0, rejected: 0, total: 0,
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  /* ─── Shared section header ─── */
  const SectionHeader = ({
    icon: Icon,
    iconColor,
    label,
    badge,
    action,
  }: {
    icon: React.ElementType;
    iconColor: string;
    label: string;
    badge?: number;
    action?: { label: string; onClick: () => void };
  }) => (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            darkMode ? "bg-white/8" : "bg-slate-100"
          )}
        >
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        <h2 className={cn("text-[15px] font-bold tracking-[-0.01em]", darkMode ? "text-white" : "text-slate-900")}>
          {label}
        </h2>
        {badge !== undefined && badge > 0 && (
          <span className="h-5 min-w-5 px-1.5 rounded-full text-[11px] font-bold bg-indigo-500 text-white flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "text-xs font-semibold flex items-center gap-1 transition-colors",
            darkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"
          )}
        >
          {action.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        embedded ? "w-full" : "min-h-screen",
        darkMode ? "text-gray-100" : "text-gray-900"
      )}
    >
      <div
        className={cn(
          embedded ? "space-y-7" : "max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-7"
        )}
      >

        {/* ═══════════════════════════════════════════════════════
            HERO CARD
        ═══════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "relative overflow-hidden rounded-[24px]",
            darkMode
              ? "bg-[#0e0f1a] ring-1 ring-white/[0.08] shadow-2xl shadow-black/60"
              : "bg-white ring-1 ring-slate-200/80 shadow-[0_4px_40px_rgba(15,23,42,0.08)]"
          )}
        >
          {/* Background mesh */}
          {darkMode ? (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_-10%,rgba(99,102,241,0.18),transparent)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(139,92,246,0.10),transparent)]" />
              {/* Subtle grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-20%,rgba(99,102,241,0.07),transparent)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_0%_80%,rgba(139,92,246,0.05),transparent)]" />
            </>
          )}

          <div className="relative p-6 sm:p-8">
            {/* Top row */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
              <div>
                {/* Pill badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase mb-3",
                    darkMode
                      ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25"
                      : "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  AI-Powered
                  {insights?.aiPowered && (
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse",
                        darkMode ? "bg-emerald-400" : "bg-emerald-500"
                      )}
                    />
                  )}
                </div>

                <h1
                  className={cn(
                    "text-2xl sm:text-[28px] font-black tracking-[-0.03em] leading-[1.15]",
                    darkMode ? "text-white" : "text-slate-900"
                  )}
                >
                  Activity Hub
                </h1>
                <p
                  className={cn(
                    "mt-1.5 text-sm max-w-xs",
                    darkMode ? "text-white/50" : "text-slate-500"
                  )}
                >
                  Pipeline, updates, and next steps — unified.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goTo("applications")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[13px] font-semibold transition-all",
                    darkMode
                      ? "bg-white/8 hover:bg-white/12 text-white/80 ring-1 ring-white/10"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                  )}
                >
                  Applications
                </button>
                <button
                  type="button"
                  onClick={() => goTo("messages")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[13px] font-semibold transition-all",
                    darkMode
                      ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25"
                  )}
                >
                  Messages
                </button>
              </div>
            </div>

            {/* Insights card */}
            <div
              className={cn(
                "rounded-2xl p-5",
                darkMode
                  ? "bg-white/[0.04] ring-1 ring-white/[0.07]"
                  : "bg-slate-50/80 ring-1 ring-slate-200/60"
              )}
            >
              {insightsLoading ? (
                <div
                  className={cn(
                    "flex items-center gap-3 text-sm",
                    darkMode ? "text-white/50" : "text-slate-500"
                  )}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating personalized insights…
                </div>
              ) : (
                <div className="space-y-4">
                  <p
                    className={cn(
                      "text-xl sm:text-2xl font-bold tracking-[-0.02em] leading-snug",
                      darkMode ? "text-white" : "text-slate-800"
                    )}
                  >
                    {insights?.summary}
                  </p>

                  {/* Next step strip */}
                  <div
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl",
                      darkMode
                        ? "bg-indigo-500/10 ring-1 ring-indigo-500/20"
                        : "bg-white ring-1 ring-indigo-100 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          darkMode ? "bg-amber-500/15" : "bg-amber-50"
                        )}
                      >
                        <Zap className={cn("w-4 h-4", darkMode ? "text-amber-400" : "text-amber-500")} />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest mb-0.5",
                            darkMode ? "text-indigo-400" : "text-indigo-400"
                          )}
                        >
                          Next Step
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            darkMode ? "text-white/90" : "text-slate-800"
                          )}
                        >
                          {insights?.nextStep}
                        </p>
                      </div>
                    </div>
                    {insights && insights.profileCompletion < 80 && (
                      <button
                        type="button"
                        onClick={() => goTo("profile")}
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-xl transition-all",
                          darkMode
                            ? "bg-white/8 hover:bg-white/14 text-white ring-1 ring-white/10"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        )}
                      >
                        Profile {insights.profileCompletion}%
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Tips */}
                  {insights?.tips && insights.tips.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insights.tips.map((tip, i) => (
                        <div
                          key={i}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3.5 py-1.5 transition-colors",
                            darkMode
                              ? "text-white/60 bg-white/5 ring-1 ring-white/8 hover:bg-white/8"
                              : "text-slate-600 bg-white ring-1 ring-slate-200 shadow-sm hover:ring-slate-300"
                          )}
                        >
                          <Sparkles className={cn("w-3 h-3 shrink-0", darkMode ? "text-indigo-400" : "text-indigo-400")} />
                          {tip}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PIPELINE
        ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            icon={TrendingUp}
            iconColor="text-indigo-500"
            label="Pipeline"
            action={{ label: `${pipeline.total} total`, onClick: () => goTo("applications") }}
          />

          <div
            className={cn(
              "grid grid-cols-5 rounded-[20px] overflow-hidden ring-1",
              darkMode
                ? "bg-[#0e0f1a] ring-white/[0.08] shadow-xl shadow-black/40"
                : "bg-white ring-slate-200/80 shadow-[0_2px_20px_rgba(15,23,42,0.06)]"
            )}
          >
            {pipelineCards.map(({ key, label, icon: Icon, accent, bg, dot }, idx) => {
              const val = pipeline[key as keyof typeof pipeline] ?? 0;
              const isLast = idx === pipelineCards.length - 1;
              return (
                <div
                  key={key}
                  className={cn(
                    "relative group flex flex-col items-center py-6 px-2 transition-all duration-200",
                    !isLast && (darkMode ? "border-r border-white/[0.06]" : "border-r border-slate-100"),
                    darkMode ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/80"
                  )}
                >
                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                  />

                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 bg-gradient-to-br",
                      bg
                    )}
                  >
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                  </div>

                  <p
                    className={cn(
                      "text-[28px] font-black tabular-nums leading-none tracking-tight",
                      darkMode ? "text-white" : "text-slate-900"
                    )}
                  >
                    {val}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
                    <p
                      className={cn(
                        "text-[11px] font-semibold text-center leading-tight",
                        darkMode ? "text-white/40" : "text-slate-400"
                      )}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            ACTIVE APPLICATIONS
        ═══════════════════════════════════════════════════════ */}
        {applications.length > 0 && (
          <section>
            <SectionHeader
              icon={FileText}
              iconColor="text-sky-500"
              label="Active Applications"
              action={{ label: "View all", onClick: () => goTo("applications") }}
            />
            <div className="space-y-2">
              {applications.slice(0, 5).map((app: Record<string, unknown>) => {
                const status = String(app.status || "applied").toLowerCase();
                const job = app.job as Record<string, unknown> | undefined;
                const company = app.company as Record<string, unknown> | undefined;
                const title = (job?.title as string) || "Role";
                const companyName =
                  ((job?.company as Record<string, unknown>)?.name as string) ||
                  (company?.name as string) ||
                  "Company";
                const sc = statusConfig[status] ?? {
                  dark: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30",
                  light: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
                };

                return (
                  <button
                    key={String(app.id)}
                    type="button"
                    onClick={() => goTo("applications")}
                    className={cn(
                      "w-full text-left rounded-2xl p-4 flex items-center justify-between gap-3 transition-all group ring-1",
                      darkMode
                        ? "bg-[#0e0f1a]/80 ring-white/[0.07] hover:ring-indigo-500/30 hover:bg-white/[0.03]"
                        : "bg-white ring-slate-200/80 hover:ring-indigo-200 shadow-[0_1px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.08)]"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={cn(
                          "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                          darkMode ? "bg-white/6 ring-1 ring-white/8" : "bg-slate-50 ring-1 ring-slate-100"
                        )}
                      >
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "font-semibold text-sm truncate",
                            darkMode ? "text-white" : "text-slate-900"
                          )}
                        >
                          {title}
                        </p>
                        <p
                          className={cn(
                            "text-xs truncate mt-0.5",
                            darkMode ? "text-white/40" : "text-slate-400"
                          )}
                        >
                          {companyName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize",
                          darkMode ? sc.dark : sc.light
                        )}
                      >
                        {status}
                      </span>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 transition-transform group-hover:translate-x-0.5",
                          darkMode ? "text-white/25" : "text-slate-300"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════
            ACTIVITY FEED
        ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            icon={Bell}
            iconColor="text-blue-500"
            label="Activity Feed"
            badge={unreadCount}
            action={
              notifications.some((n) => !n.isRead)
                ? { label: "Mark all read", onClick: handleMarkAllRead }
                : undefined
            }
          />

          {feedLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-[72px] rounded-2xl animate-pulse",
                    darkMode ? "bg-white/[0.04]" : "bg-slate-100/80"
                  )}
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div
              className={cn(
                "rounded-2xl ring-1 ring-dashed py-14 flex flex-col items-center text-center",
                darkMode ? "ring-white/[0.08] bg-white/[0.02]" : "ring-slate-200 bg-slate-50/50"
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
                  darkMode ? "bg-white/6 ring-1 ring-white/8" : "bg-slate-100"
                )}
              >
                <Bell className={cn("w-6 h-6", darkMode ? "text-white/20" : "text-slate-300")} />
              </div>
              <p className={cn("font-bold text-[15px]", darkMode ? "text-white" : "text-slate-800")}>
                Nothing here yet
              </p>
              <p className={cn("text-sm mt-1 mb-6 max-w-[220px]", darkMode ? "text-white/40" : "text-slate-400")}>
                Apply to a job and your activity will appear here.
              </p>
              <button
                type="button"
                onClick={() => goTo("jobs")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold transition-all shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35"
              >
                Browse Jobs
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => {
                const Icon = notificationIcon(n.type);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      handleMarkRead(n);
                      if (n.linkTab) goTo(n.linkTab);
                    }}
                    className={cn(
                      "w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-4 transition-all group ring-1",
                      !n.isRead
                        ? darkMode
                          ? "bg-indigo-500/[0.08] ring-indigo-500/25 hover:bg-indigo-500/[0.12]"
                          : "bg-indigo-50/70 ring-indigo-200 hover:bg-indigo-50"
                        : darkMode
                          ? "bg-[#0e0f1a]/70 ring-white/[0.06] hover:ring-white/10 hover:bg-white/[0.02]"
                          : "bg-white ring-slate-200/80 hover:ring-slate-300 shadow-[0_1px_6px_rgba(15,23,42,0.03)]"
                    )}
                  >
                    <div
                      className={cn(
                        "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                        !n.isRead
                          ? darkMode ? "bg-indigo-500/20" : "bg-indigo-100"
                          : darkMode ? "bg-white/6 ring-1 ring-white/8" : "bg-slate-50 ring-1 ring-slate-100"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4.5 h-4.5",
                          !n.isRead
                            ? "text-indigo-500"
                            : darkMode ? "text-white/35" : "text-slate-400"
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-semibold text-[13px] truncate",
                          !n.isRead
                            ? darkMode ? "text-indigo-200" : "text-indigo-800"
                            : darkMode ? "text-white" : "text-slate-800"
                        )}
                      >
                        {n.title}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-0.5 line-clamp-1",
                          darkMode ? "text-white/40" : "text-slate-400"
                        )}
                      >
                        {n.body}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={cn(
                          "text-[11px] tabular-nums",
                          darkMode ? "text-white/25" : "text-slate-300"
                        )}
                      >
                        {formatRelativeTime(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}