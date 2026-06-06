import React, { useState, useEffect } from 'react';
import AdminBackButton, { useAdminEmbedded } from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import {
  AlertCircle, Building2, Briefcase, CheckCircle,
  Eye, MapPin, Calendar, User, Search, Loader2,
  FileText, ExternalLink, StickyNote, ChevronDown, UserCircle, BookOpen,
  Shield, Ban, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { adminService, type UserAccountStatus } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import {
  ApprovalActionButton,
  type ApprovalActionPhase,
} from '@/components/approval-action-button';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import {
  adminFormModalFooterClass,
  adminFormModalSectionClass,
} from '@/components/admin/admin-form-modal-styles';

interface PendingItem {
  id: string;
  type: 'employer' | 'job' | 'application' | 'story';
  title?: string;
  subtitle?: string;
  submittedBy?: string;
  submittedDate?: string;
  status?: string;
  priority?: 'high' | 'medium' | 'low';
  details?: Record<string, any>;
}

interface AdminApprovalsProps {
  /** Preloaded by admin dashboard on login — avoids empty flash on tab switch */
  initialApprovals?: any[] | null;
  onApprovalsChange?: (items: any[]) => void;
}

const AdminApprovals: React.FC<AdminApprovalsProps> = ({
  initialApprovals,
  onApprovalsChange,
}) => {
  const { embedded } = useAdminEmbedded();

  const cachedOnMount = initialApprovals ?? adminService.getCachedApprovals();
  const hasInitialData = cachedOnMount != null;

  const [filter, setFilter] = useState<'all' | 'application' | 'employer' | 'job' | 'story'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const { toast } = useToast();

  const normalizePendingItem = (raw: any): PendingItem => {
    const type = (raw?.type ?? 'application') as PendingItem["type"];
    const data = (raw?.data ?? {}) as Record<string, any>;
    const details = (raw?.details ?? data) as Record<string, any>;

    const title =
      raw?.title ??
      (type === "story"
        ? details?.title
        : type === "application"
          ? details?.jobTitle || "Job Application"
          : "Pending Approval");

    const subtitle =
      raw?.subtitle ??
      (type === "story"
        ? details?.submitterName || details?.submitterEmail || "Submitter"
        : type === "application"
          ? details?.applicantName ||
            (details?.applicantId ? `Applicant ${formatShortId(String(details.applicantId))}` : "Applicant")
          : data?.applicantId
            ? `Applicant ${formatShortId(String(data.applicantId))}`
            : "Applicant");

    const submittedBy =
      raw?.submittedBy ??
      (type === "story"
        ? details?.submitterName || details?.submitterEmail
        : type === "application"
          ? details?.applicantName || details?.applicantId
          : data?.applicantId);

    const submittedDate =
      raw?.submittedDate ??
      raw?.createdAt ??
      data?.appliedAt ??
      data?.submittedAt ??
      data?.createdAt ??
      "";

    return {
      id: String(raw?.id ?? ""),
      type,
      title: title ? String(title) : undefined,
      subtitle: subtitle ? String(subtitle) : undefined,
      submittedBy: submittedBy ? String(submittedBy) : undefined,
      submittedDate: submittedDate ? String(submittedDate) : undefined,
      status: raw?.status ? String(raw.status) : undefined,
      priority: (raw?.priority ?? data?.priority ?? "low") as PendingItem["priority"],
      details,
    };
  };

  const formatShortId = (value?: string) => {
    if (!value) return "N/A";
    const str = String(value);
    return str.length > 18 ? `${str.slice(0, 8)}...${str.slice(-6)}` : str;
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleString();
  };

  const formatSubmittedBy = (value?: string) => {
    if (!value) return "N/A";
    if (/^[0-9a-f-]{20,}$/i.test(value.trim())) return formatShortId(value);
    return value;
  };

  const getInitials = (name?: string) => {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  };

  const isUrl = (value?: string) => {
    if (!value) return false;
    try {
      const url = new URL(value.startsWith("http") ? value : `https://${value}`);
      return Boolean(url.hostname);
    } catch {
      return false;
    }
  };

  const normalizeUrl = (value: string) =>
    value.startsWith("http") ? value : `https://${value}`;

  const getStatusBadgeClass = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "approved" || normalized === "accepted") {
      return darkMode ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (normalized === "rejected") {
      return darkMode ? "bg-red-500/15 text-red-300 border-red-500/30" : "bg-red-50 text-red-700 border-red-200";
    }
    if (normalized === "review" || normalized === "reviewing") {
      return darkMode ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-amber-50 text-amber-700 border-amber-200";
    }
    return darkMode ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-blue-50 text-blue-700 border-blue-200";
  };

  const getTypeIcon = (type: PendingItem["type"]) => {
    switch (type) {
      case "employer":
        return <Building2 className="h-6 w-6" />;
      case "job":
        return <Briefcase className="h-6 w-6" />;
      case "story":
        return <BookOpen className="h-6 w-6" />;
      default:
        return <UserCircle className="h-6 w-6" />;
    }
  };

  const renderDetailField = (
    label: string,
    value: React.ReactNode,
    options?: { fullWidth?: boolean },
  ) => (
    <div className={options?.fullWidth ? "col-span-2" : undefined}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </p>
      <div className={`text-sm font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>{value}</div>
    </div>
  );

  const renderApplicationDetails = (item: PendingItem) => {
    const details = item.details ?? {};
    const applicantName = details.applicantName || formatSubmittedBy(item.submittedBy);
    const appliedAt = details.appliedAt || item.submittedDate;
    const resumeUrl = typeof details.resume === "string" ? details.resume.trim() : "";
    const coverLetter = typeof details.coverLetter === "string" ? details.coverLetter.trim() : "";
    const notes = typeof details.notes === "string" ? details.notes.trim() : "";
    const status = String(details.status || item.status || "applied");

    return (
      <div className="space-y-5">
        <div className={`flex items-center gap-4 rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-slate-900/40" : "border-violet-100 bg-white"}`}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-black text-white shadow-lg">
            {getInitials(applicantName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-lg font-black truncate ${darkMode ? "text-white" : "text-slate-900"}`}>{applicantName}</p>
            <p className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Applicant</p>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusBadgeClass(status)}`}>
            {status}
          </span>
        </div>

        <div className={adminFormModalSectionClass(darkMode)}>
          <div className="grid grid-cols-2 gap-4">
            {renderDetailField("Job Title", details.jobTitle || item.title || "N/A")}
            {renderDetailField("Applied On", formatDateTime(appliedAt))}
          </div>
        </div>

        {resumeUrl ? (
          <div className={adminFormModalSectionClass(darkMode)}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Resume / Portfolio
            </p>
            <a
              href={normalizeUrl(resumeUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                darkMode
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
                  : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[280px]">{resumeUrl.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="h-4 w-4 shrink-0 opacity-70" />
            </a>
          </div>
        ) : null}

        {coverLetter ? (
          <div className={adminFormModalSectionClass(darkMode)}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              <FileText className="h-3.5 w-3.5" />
              Cover Letter
            </p>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
              {coverLetter}
            </p>
          </div>
        ) : null}

        {notes ? (
          <div className={`rounded-2xl border p-4 ${darkMode ? "border-amber-500/20 bg-amber-500/10" : "border-amber-200 bg-amber-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2 ${darkMode ? "text-amber-300" : "text-amber-700"}`}>
              <StickyNote className="h-3.5 w-3.5" />
              Internal Notes
            </p>
            <p className={`text-sm leading-relaxed ${darkMode ? "text-amber-100/90" : "text-amber-900"}`}>{notes}</p>
          </div>
        ) : null}

        {(details.jobId || details.applicantId) ? (
          <details className={`group rounded-2xl border ${darkMode ? "border-white/10 bg-slate-900/30" : "border-slate-200 bg-slate-50"}`}>
            <summary className={`flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              <span>Reference IDs</span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className={`space-y-2 border-t px-4 py-3 text-xs font-mono ${darkMode ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
              {details.jobId ? <p><span className="font-semibold">Job ID:</span> {details.jobId}</p> : null}
              {details.applicantId ? <p><span className="font-semibold">Applicant ID:</span> {details.applicantId}</p> : null}
            </div>
          </details>
        ) : null}
      </div>
    );
  };

  const renderStoryDetails = (item: PendingItem) => {
    const story = (item.details ?? {}) as Record<string, any>;
    const tags = Array.isArray(story.tags) ? story.tags : [];

    return (
      <div className="space-y-5">
        <div className={adminFormModalSectionClass(darkMode)}>
          <div className="grid grid-cols-2 gap-4">
            {renderDetailField("Submitted By", formatSubmittedBy(story.submitterName || story.submitterEmail || item.submittedBy))}
            {renderDetailField("Submitted On", formatDateTime(item.submittedDate))}
          </div>
        </div>
        {story.content ? (
          <div className={adminFormModalSectionClass(darkMode)}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Story Content</p>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{story.content}</p>
          </div>
        ) : null}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <span key={tag} className={`rounded-full px-3 py-1 text-xs font-bold ${darkMode ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700"}`}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderGenericDetails = (item: PendingItem) => {
    const details = item.details ?? {};
    const entries = Object.entries(details).filter(([key, value]) => {
      if (value === null || value === undefined || value === "") return false;
      return !["jobId", "applicantId"].includes(key);
    });

    return (
      <div className={adminFormModalSectionClass(darkMode)}>
        <div className="grid grid-cols-2 gap-4">
          {entries.map(([key, value]) =>
            renderDetailField(
              key.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/\bId\b/g, "ID"),
              typeof value === "string" && isUrl(value) ? (
                <a href={normalizeUrl(value)} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline break-all">
                  {value.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                String(value)
              ),
              { fullWidth: typeof value === "string" && value.length > 80 },
            ),
          )}
        </div>
      </div>
    );
  };

  const renderApprovalDetails = (item: PendingItem) => {
    if (item.type === "application") return renderApplicationDetails(item);
    if (item.type === "story") return renderStoryDetails(item);
    return renderGenericDetails(item);
  };

  const toPendingItems = (data: any[]): PendingItem[] =>
    (Array.isArray(data) ? data : []).map(normalizePendingItem);

  const [pendingItems, setPendingItems] = useState<PendingItem[]>(() =>
    hasInitialData ? toPendingItems(cachedOnMount!) : []
  );
  const [loading, setLoading] = useState(!hasInitialData);
  const [itemActions, setItemActions] = useState<
    Record<string, { status: 'approved' | 'rejected'; phase: ApprovalActionPhase }>
  >({});
  const [moderationHistory, setModerationHistory] = useState<
    { id: string; name: string; email: string; status: UserAccountStatus; userType: string; createdAt?: string }[]
  >([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [showModerationHistory, setShowModerationHistory] = useState(true);

  const getButtonPhase = (
    itemId: string,
    variant: 'approve' | 'reject',
  ): ApprovalActionPhase => {
    const action = itemActions[itemId];
    if (!action) return 'idle';
    if (variant === 'approve' && action.status === 'approved') return action.phase;
    if (variant === 'reject' && action.status === 'rejected') return action.phase;
    return 'idle';
  };

  const isItemBusy = (itemId: string) => {
    const action = itemActions[itemId];
    return action?.phase === 'loading' || action?.phase === 'success';
  };

  const applyApprovals = (data: any[]) => {
    const list = Array.isArray(data) ? data : [];
    setPendingItems(toPendingItems(list));
    adminService.setApprovalsCache(list);
    onApprovalsChange?.(list);
  };

  const fetchApprovals = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const data = await adminService.getApprovals({ force: Boolean(options?.silent) });
      applyApprovals(data);
    } catch (error: any) {
      console.error("Failed to fetch approvals:", error);
      if (!options?.silent && !error?.message?.includes("401")) {
        toast({ title: "Error", description: "Could not fetch pending approvals.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadModerationHistory = async () => {
    setModerationLoading(true);
    try {
      const users = await adminService.getUsers();
      const moderated = (Array.isArray(users) ? users : [])
        .map((u) => {
          const status = String(
            u.accountStatus ?? u.status ?? (u as { account_status?: string }).account_status ?? "active",
          ).toLowerCase() as UserAccountStatus;
          const firstName = String(u.firstName ?? (u as { first_name?: string }).first_name ?? "");
          const lastName = String(u.lastName ?? (u as { last_name?: string }).last_name ?? "");
          const name = [firstName, lastName].filter(Boolean).join(" ").trim() || String(u.email ?? "User");
          return {
            id: String(u.id ?? ""),
            name,
            email: String(u.email ?? ""),
            status,
            userType: String(u.userType ?? (u as { user_type?: string }).user_type ?? ""),
            createdAt: String(u.createdAt ?? (u as { created_at?: string }).created_at ?? ""),
          };
        })
        .filter((u) => u.status === "flagged" || u.status === "suspended");
      setModerationHistory(moderated);
    } catch (error) {
      console.error("Failed to load moderation history:", error);
    } finally {
      setModerationLoading(false);
    }
  };

  useEffect(() => {
    if (hasInitialData) {
      applyApprovals(cachedOnMount!);
      void fetchApprovals({ silent: true });
    } else {
      void fetchApprovals();
    }
    void loadModerationHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = pendingItems.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const title = (item.title ?? "").toLowerCase();
    const subtitle = (item.subtitle ?? "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = title.includes(q) || subtitle.includes(q);
    return matchesFilter && matchesSearch;
  });

  const applicationCount = pendingItems.filter(i => i.type === 'application').length;
  const employerCount = pendingItems.filter(i => i.type === 'employer').length;
  const jobCount = pendingItems.filter(i => i.type === 'job').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-rose-600';
      case 'medium': return 'from-amber-500 to-orange-600';
      case 'low': return 'from-blue-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollDashboardToTop();
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const handleUpdateApproval = async (itemId: string, status: 'approved' | 'rejected') => {
    if (isItemBusy(itemId)) return;

    const previousItems = pendingItems;
    const removedItem = previousItems.find((i) => i.id === itemId);
    if (!removedItem) return;

    setItemActions((prev) => ({
      ...prev,
      [itemId]: { status, phase: 'loading' },
    }));

    const toastCtrl = toast({
      title: status === 'approved' ? 'Approving…' : 'Rejecting…',
      description: 'Updating approval status.',
      isLoading: true,
    });

    // Fast optimistic UI — remove card immediately.
    setPendingItems((prev) => prev.filter((i) => i.id !== itemId));
    if (selectedItem?.id === itemId) setSelectedItem(null);

    try {
      await adminService.updateApproval(itemId, status);

      setItemActions((prev) => ({
        ...prev,
        [itemId]: { status, phase: 'success' },
      }));

      toastCtrl.update({
        id: toastCtrl.id,
        title: 'Success',
        description: `Item has been ${status}.`,
        isLoading: false,
        variant: 'success',
      });

      setTimeout(() => {
        setItemActions((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }, 500);

      void fetchApprovals({ silent: true });
      void loadModerationHistory();
    } catch (error) {
      console.error(`Failed to ${status} item:`, error);

      setPendingItems(previousItems);
      setItemActions((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });

      toastCtrl.update({
        id: toastCtrl.id,
        title: 'Error',
        description: 'Could not update item status.',
        isLoading: false,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={`${embedded ? '' : `min-h-screen p-8 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}`}>
      <div className={`${embedded ? 'space-y-6' : 'max-w-7xl mx-auto'}`}>
        {/* Header */}
        <div className={`${embedded ? 'mb-6' : 'mb-8'}`}>
          {!embedded && <div className="mb-4"><AdminBackButton /></div>}
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/50 animate-pulse-slow">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Pending Approvals
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Review and approve pending submissions</p>
            </div>
          </div>

          {/* AI / moderation history (flagged & suspended accounts) */}
          <div
            className={`mb-6 rounded-3xl border-2 overflow-hidden ${
              darkMode ? "border-violet-500/30 bg-gray-800/80" : "border-violet-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setShowModerationHistory((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 px-6 py-4 text-left ${
                darkMode ? "hover:bg-gray-700/50" : "hover:bg-violet-50/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Moderation history
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Accounts flagged or suspended by automated checks
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  darkMode ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-800"
                }`}
              >
                {moderationLoading ? "…" : moderationHistory.length}
              </span>
            </button>
            {showModerationHistory && (
              <div className={`border-t px-6 py-4 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                {moderationLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading moderation records…
                  </div>
                ) : moderationHistory.length === 0 ? (
                  <p className={`text-sm py-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    No flagged or suspended accounts right now.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {moderationHistory.map((row) => (
                      <li
                        key={row.id}
                        className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
                          darkMode ? "bg-gray-900/60" : "bg-gray-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`font-semibold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {row.name}
                          </p>
                          <p className={`truncate text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                            {row.email} · {row.userType || "User"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
                            row.status === "flagged"
                              ? darkMode
                                ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                              : darkMode
                                ? "border-red-500/40 bg-red-500/15 text-red-300"
                                : "border-red-200 bg-red-50 text-red-800"
                          }`}
                        >
                          {row.status === "suspended" ? <Ban className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {row.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Stats Banner removed as requested */}
        </div>

        {/* Filters & Search */}
        <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-xl p-6 mb-8 border-2`}>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by company name, job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl focus:border-amber-500 outline-none transition-all font-medium ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                } border-2`}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({pendingItems.length})
              </button>
              <button
                onClick={() => setFilter('application')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filter === 'application'
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Applications ({applicationCount})
              </button>
              <button
                onClick={() => setFilter('employer')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filter === 'employer'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Employers ({employerCount})
              </button>
              <button
                onClick={() => setFilter('job')}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  filter === 'job'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Job Posts ({jobCount})
              </button>
            </div>
          </div>
        </div>

        {/* Pending Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              className={`group rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border-2 overflow-hidden ${
                darkMode 
                  ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)] hover:border-amber-500/50' 
                  : 'bg-white border-gray-100 hover:border-amber-300'
              }`}
            >
              {/* Priority Banner */}
              <div className={`h-2 bg-gradient-to-r ${getPriorityColor(item.priority ?? "low")}`}></div>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${
                      item.type === 'employer'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                        : item.type === 'application'
                        ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {item.type === 'employer' ? (
                        <Building2 className="w-8 h-8" />
                      ) : item.type === 'application' ? (
                        <UserCircle className="w-8 h-8" />
                      ) : (
                        <Briefcase className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          darkMode ? (
                            item.type === 'employer'
                              ? 'bg-purple-900/30 text-purple-400'
                              : item.type === 'application'
                              ? 'bg-violet-900/30 text-violet-400'
                              : 'bg-blue-900/30 text-blue-400'
                          ) : (
                            item.type === 'employer'
                              ? 'bg-purple-100 text-purple-700'
                              : item.type === 'application'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-blue-100 text-blue-700'
                          )
                        }`}>
                          {item.type === 'application' ? 'application' : item.type}
                        </span>
                      </div>
                      <div className={`flex items-center gap-3 mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {formatSubmittedBy(item.submittedBy)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateTime(item.submittedDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                    (item.priority ?? 'low') === 'high'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : (item.priority ?? 'low') === 'medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {(item.priority ?? 'low').toUpperCase()}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {item.type === 'employer' ? (
                    <>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Company Size</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.companySize || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Industry</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.industry || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl col-span-2 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                        <p className={`text-sm font-bold flex items-center gap-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          <MapPin className="w-4 h-4" />
                          {item.details?.location || 'N/A'}
                        </p>
                      </div>
                    </>
                  ) : item.type === 'application' ? (
                    <>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Applicant Name</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.details?.applicantName || item.subtitle || 'N/A'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Job Title</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.details?.jobTitle || item.title || 'N/A'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Application Status</p>
                        <p className={`text-sm font-bold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.status || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Submitted</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatDateTime(item.details?.appliedAt)}
                        </p>
                      </div>
                      {item.details?.coverLetter ? (
                        <div className={`p-3 rounded-xl col-span-2 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                          <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cover Letter Preview</p>
                          <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {String(item.details.coverLetter)}
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Salary</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.salary || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.type || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.location || 'N/A'}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Experience</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.details?.experience || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className={`flex gap-3 pt-4 border-t-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                    View Details
                  </button>
                  <ApprovalActionButton
                    variant="reject"
                    phase={getButtonPhase(item.id, 'reject')}
                    disabled={isItemBusy(item.id)}
                    onClick={() => handleUpdateApproval(item.id, 'rejected')}
                  />
                  <ApprovalActionButton
                    variant="approve"
                    phase={getButtonPhase(item.id, 'approve')}
                    disabled={isItemBusy(item.id)}
                    onClick={() => handleUpdateApproval(item.id, 'approved')}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className={`rounded-3xl shadow-lg p-6 border-2 mt-6 ${
            darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'
          }`}>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Showing <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{filteredItems.length}</span> items
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                      : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  {(() => {
                    const getVisiblePages = (current: number, total: number) => {
                      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
                      if (current <= 3) return [1, 2, 3, 4, '...', total];
                      if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
                      return [1, '...', current - 1, current, current + 1, '...', total];
                    };
                    return getVisiblePages(currentPage, totalPages).map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className={`px-2 font-bold flex items-center justify-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>…</span>
                      ) : (
                        <button
                          key={`page-${page}`}
                          onClick={() => handlePageChange(page as number)}
                          className={`w-10 h-10 rounded-lg font-bold transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                              : darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                      : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && pendingItems.length === 0 && (
          <div className={`rounded-3xl shadow-xl p-12 text-center border-2 ${
            darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'
          }`}>
            <Loader2 className={`w-10 h-10 mx-auto mb-4 animate-spin ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading pending approvals…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className={`rounded-3xl shadow-xl p-12 text-center border-2 ${
            darkMode 
              ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' 
              : 'bg-white border-gray-100'
          }`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              darkMode
                ? 'bg-gradient-to-br from-gray-700 to-gray-600'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
            }`}>
              <CheckCircle className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Clear!</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No pending approvals matching your filters.</p>
          </div>
        )}

        {/* Detail Modal */}
        <AdminFormModal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          darkMode={darkMode}
          title={selectedItem?.title ?? "Review submission"}
          subtitle={
            selectedItem?.type === "application"
              ? `Application from ${formatSubmittedBy(selectedItem.submittedBy)}`
              : selectedItem
                ? `Submitted by ${formatSubmittedBy(selectedItem.submittedBy)}`
                : undefined
          }
          icon={selectedItem ? getTypeIcon(selectedItem.type) : <UserCircle className="h-6 w-6" />}
          panelClassName="max-w-2xl"
          footer={
            selectedItem ? (
              <div className="px-8 pb-6">
                <div className={adminFormModalFooterClass(darkMode)}>
                  <ApprovalActionButton
                    variant="reject"
                    fullWidth
                    phase={getButtonPhase(selectedItem.id, "reject")}
                    disabled={isItemBusy(selectedItem.id)}
                    onClick={() => handleUpdateApproval(selectedItem.id, "rejected")}
                  />
                  <ApprovalActionButton
                    variant="approve"
                    fullWidth
                    phase={getButtonPhase(selectedItem.id, "approve")}
                    disabled={isItemBusy(selectedItem.id)}
                    onClick={() => handleUpdateApproval(selectedItem.id, "approved")}
                  />
                </div>
              </div>
            ) : undefined
          }
        >
          {selectedItem ? renderApprovalDetails(selectedItem) : null}
        </AdminFormModal>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminApprovals;
