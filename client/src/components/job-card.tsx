import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    skills: string[];
    company?: {
      id?: string;
      name: string;
    };
    companyId?: string;
    employer?: {
      firstName: string;
      lastName: string;
    };
    createdAt?: string;
  };
  setSelectedJob?: (job: any) => void;
  setShowQuickApply?: (show: boolean) => void;
  onCardClick?: () => void;
  /** @deprecated use variant="list" */
  compact?: boolean;
  variant?: "list" | "card";
  /** Rank badge for trending lists (#1, #2, …) */
  rank?: number;
}

const AVATAR_PALETTES: Array<{ bg: string; fg: string }> = [
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#dbeafe", fg: "#1d4ed8" },
  { bg: "#ccfbf1", fg: "#0f766e" },
  { bg: "#ffedd5", fg: "#c2410c" },
  { bg: "#fce7f3", fg: "#be185d" },
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#f3e8ff", fg: "#7e22ce" },
  { bg: "#ecfccb", fg: "#4d7c0f" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function companyAvatarColors(label: string) {
  return AVATAR_PALETTES[hashString(label) % AVATAR_PALETTES.length];
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  if (min && max) return `₹${(min / 1000).toFixed(0)}k – ${(max / 1000).toFixed(0)}k`;
  if (min) return `₹${(min / 1000).toFixed(0)}k+`;
  return `Up to ₹${(max! / 1000).toFixed(0)}k`;
}

function formatJobType(jobType?: string): string | null {
  if (!jobType?.trim()) return null;
  return jobType
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function JobCard({
  job,
  setSelectedJob,
  setShowQuickApply,
  onCardClick,
  compact = false,
  variant,
  rank,
}: JobCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const resolvedVariant = variant ?? (compact ? "list" : "card");

  const companyLabel = job.company
    ? job.company.name
    : job.employer
      ? `${job.employer.firstName} ${job.employer.lastName}`
      : "Direct Post";

  const postedLabel = job.createdAt
    ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
    : "Recently posted";

  const handleQuickApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/signup', { state: { message: 'Register yourself on the portal to apply for this job.' } });
      return;
    }
    if (user.userType !== 'Professional') {
      toast({ title: "Access denied", description: "Only job seekers can apply.", variant: "destructive" });
      return;
    }
    setSelectedJob?.(job);
    setShowQuickApply?.(true);
  };

  const metaParts = [
    job.location,
    formatJobType(job.jobType),
    formatSalary(job.salaryMin, job.salaryMax),
  ].filter(Boolean);

  const companyInitial = companyLabel.replace(/[^a-zA-Z0-9]/g, "").charAt(0).toUpperCase() || "C";
  const avatar = companyAvatarColors(companyLabel);

  if (resolvedVariant === "list") {
    return (
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`job-list-row group${rank != null ? " job-list-row-ranked" : ""}`}
        onClick={onCardClick}
      >
        {rank != null && (
          <div
            className={`job-list-rank${rank <= 3 ? " job-list-rank-top" : ""}`}
            aria-label={`Rank ${rank}`}
          >
            #{rank}
          </div>
        )}
        <div
          className="job-list-avatar"
          style={{ backgroundColor: avatar.bg, color: avatar.fg }}
          aria-hidden
        >
          {companyInitial}
        </div>

        <div className="job-list-body">
          <div className="job-list-copy">
            <h3 className="job-list-title">{job.title}</h3>
            <p className="job-list-sub">
              <span className="job-list-company">{companyLabel}</span>
              {metaParts.length > 0 && (
                <>
                  <span className="job-list-sep" aria-hidden />
                  <span className="job-list-meta">{metaParts.join(" · ")}</span>
                </>
              )}
            </p>
          </div>

          <div className="job-list-actions">
            <time className="job-list-time">{postedLabel}</time>
            <button
              type="button"
              onClick={handleQuickApply}
              className="job-list-apply"
            >
              Apply
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative h-full"
      onClick={onCardClick}
    >
      <div className="job-card-surface relative h-full flex flex-col rounded-2xl p-5 cursor-pointer">
        <div className="flex items-start gap-3.5">
          <div
            className="job-list-avatar w-10 h-10 text-sm"
            style={{ backgroundColor: avatar.bg, color: avatar.fg }}
          >
            {companyInitial}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h3 className="job-list-title text-base">{job.title}</h3>
              <p className="job-list-company text-sm mt-1 block">{companyLabel}</p>
            </div>

            {metaParts.length > 0 && (
              <p className="job-list-meta text-xs">{metaParts.join(" · ")}</p>
            )}

            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {job.description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={handleQuickApply} className="job-list-apply">
                Apply
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </button>
              <time className="job-list-time">{postedLabel}</time>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
