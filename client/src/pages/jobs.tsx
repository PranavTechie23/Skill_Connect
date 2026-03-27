import JobCard from "@/components/job-card";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { QuickApplyModal } from "@/components/quick-apply-modal";
import JobSearch from "@/components/job-search";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/api";
import { Sparkles } from "lucide-react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  Briefcase,
  MapPin,
  Clock,
  IndianRupee,
  TrendingUp,
  Zap,
  Code,
  Palette,
  Database,
  Smartphone,
  Cloud,
  LucideIcon,
  Crown,
  ArrowRight,
  Building,
  BarChart3,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─── Types ─────────────────────────────────────────────────────── */
interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  skills: string[];
  companyId: string;
  employerId: string;
  isActive: boolean;
  createdAt: string;
  company?: { name: string };
  employer?: { firstName: string; lastName: string };
  matchScore?: number;
  matchReasons?: string[];
}

interface JobsApiResponse {
  jobs: Job[];
  totalCount: number;
}

/* ─── CSS injected at runtime ────────────────────────────────────── */
const OBSIDIAN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .obs-root {
    font-family: 'Outfit', sans-serif;
    transition: background .45s ease, color .45s ease;
    -webkit-overflow-scrolling: touch;
    
    /* Theme Variables - Default Light */
    --obs-bg: radial-gradient(circle at top, rgba(129,140,248,.10) 0%, transparent 55%), hsl(var(--background));
    --obs-text: hsl(var(--foreground));
    --obs-feat-bg: linear-gradient(160deg, #ffffff 0%, #eef2ff 60%, #faf5ff 100%);
    --obs-feat-border: linear-gradient(135deg, rgba(129,140,248,.35) 0%, rgba(196,181,253,.25) 40%, rgba(248,250,252,1) 100%);
    --obs-headline-grad: linear-gradient(135deg, #0f172a 0%, #4f46e5 50%, #7c3aed 100%);
    --obs-ticker-bg: linear-gradient(90deg, transparent, rgba(99,102,241,.03) 50%, transparent);
    --obs-ticker-text: rgba(15,23,42,.6);
    --obs-sub-text: #475569;
    --obs-modal-header: #0f172a;
    --obs-badge-bg: rgba(99,102,241,.12);
    --obs-badge-text: #4f46e5;
    --obs-badge-border: rgba(99,102,241,.35);
    --obs-badge-icon: #f59e0b;
    
    background: var(--obs-bg);
    color: var(--obs-text);
  }

  .dark .obs-root {
    --obs-bg: linear-gradient(160deg, #07070f 0%, #0c0b1a 50%, #080714 100%);
    --obs-text: #e2e8f0;
    --obs-feat-bg: linear-gradient(160deg, #0d0d1f 0%, #0a0a18 100%);
    --obs-feat-border: linear-gradient(135deg, rgba(139,92,246,.5) 0%, rgba(99,102,241,.25) 40%, rgba(245,158,11,.2) 100%);
    --obs-headline-grad: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 50%, #c084fc 100%);
    --obs-ticker-bg: linear-gradient(90deg, transparent, rgba(99,102,241,.05) 50%, transparent);
    --obs-ticker-text: rgba(241,245,249,.6);
    --obs-sub-text: #94a3b8;
    --obs-modal-header: #f1f5f9;
    --obs-badge-bg: rgba(165,180,252,.15);
    --obs-badge-text: #a5b4fc;
    --obs-badge-border: rgba(165,180,252,.4);
    --obs-badge-icon: #fbbf24;
  }

  .obs-display { font-family: 'Sora', sans-serif; }

  /* ── Keyframes ── */
  @keyframes orb-a {
    0%,100%  { transform: translate(0,0)   scale(1);    }
    30%      { transform: translate(50px,-35px) scale(1.08); }
    70%      { transform: translate(-25px,45px) scale(0.93); }
  }
  @keyframes orb-b {
    0%,100%  { transform: translate(0,0)    scale(1);   }
    40%      { transform: translate(-55px,30px) scale(1.1); }
    80%      { transform: translate(35px,-45px) scale(0.9); }
  }
  @keyframes orb-c {
    0%,100%  { transform: translate(0,0)   scale(1);    }
    50%      { transform: translate(30px,-20px) scale(1.06); }
  }
  @keyframes grain-shift {
    0%,100% { transform: translate(0,0); }
    10%  { transform: translate(-2%,-2%); }
    20%  { transform: translate(-4%, 0%); }
    30%  { transform: translate(4%,  2%); }
    40%  { transform: translate(-2%, 6%); }
    50%  { transform: translate(-4%, 4%); }
    60%  { transform: translate(2%,  2%); }
    70%  { transform: translate(2%, -4%); }
    80%  { transform: translate(-4%, 6%); }
    90%  { transform: translate(4%,  4%); }
  }
  @keyframes shimmer-slide {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: .7; }
    100% { transform: scale(1.8); opacity: 0;  }
  }
  @keyframes float-y {
    0%,100% { transform: translateY(0px);  }
    50%     { transform: translateY(-10px); }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes fade-up {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes ticker-scroll {
    from { transform: translateX(0);     }
    to   { transform: translateX(-50%);  }
  }

  /* ── Noise grain overlay ── */
  .obs-grain {
    position: fixed; inset: -50%;
    width: 200%; height: 200%;
    opacity: .03; pointer-events: none; z-index: 1;
    animation: grain-shift 8s steps(10) infinite;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 256px 256px;
    will-change: transform;
    transform: translateZ(0);
  }

  /* ── Glass surface ── */
  .obs-glass {
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(22px) saturate(140%);
    border: 1px solid rgba(255,255,255,.09);
    transition: all .3s cubic-bezier(.4,0,.2,1);
    will-change: transform;
    transform: translateZ(0);
  }
  .obs-glass:hover {
    background: rgba(255,255,255,.07);
    border-color: rgba(99,102,241,.4);
    box-shadow:
      0 0 0 1px rgba(99,102,241,.15),
      0 24px 64px -20px rgba(99,102,241,.3),
      0 4px 24px -4px rgba(0,0,0,.6);
    transform: translateY(-4px);
  }

  /* ── Stat card ── */
  .obs-stat {
    position: relative; overflow: hidden;
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(28px) saturate(130%);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 20px;
    transition: all .4s cubic-bezier(.4,0,.2,1);
  }
  .obs-stat::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,.9) 40%, rgba(167,139,250,.7) 60%, transparent);
  }
  .obs-stat::after {
    content:'';
    position:absolute; inset:0; border-radius:inherit;
    background: radial-gradient(ellipse at top, rgba(99,102,241,.06) 0%, transparent 65%);
    pointer-events:none;
  }
  .obs-stat:hover {
    border-color: rgba(99,102,241,.35);
    box-shadow:
      0 0 0 1px rgba(99,102,241,.2),
      0 32px 64px -24px rgba(99,102,241,.25),
      inset 0 1px 0 rgba(255,255,255,.08);
    transform: translateY(-6px);
  }

  /* ── Gradient text helpers ── */
  .obs-text-violet {
    background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 50%, #e879f9 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .obs-text-amber {
    background: linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #f59e0b 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .obs-text-blue {
    background: linear-gradient(135deg, #93c5fd 0%, #6366f1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .obs-gradient-text {
    background-clip: text !important;
    -webkit-background-clip: text !important;
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    display: inline-block;
  }

  /* ── Shimmer button ── */
  .obs-btn-shimmer {
    background: linear-gradient(90deg,#4f46e5,#7c3aed,#4338ca,#4f46e5);
    background-size: 300% auto;
    animation: shimmer-slide 4s linear infinite;
    border: none; outline: none;
  }
  .obs-btn-shimmer:hover { opacity: .9; transform: translateY(-1px); }

  /* ── Badge pulse ring ── */
  .obs-badge-pulse { position: relative; }
  .obs-badge-pulse::after {
    content:'';
    position:absolute; inset:0; border-radius:inherit;
    box-shadow: 0 0 0 0 rgba(99,102,241,.6);
    animation: pulse-ring 2.5s ease-out infinite;
  }

  /* ── Job card wrapper ── */
  .obs-job-wrap { transition: transform .3s cubic-bezier(.4,0,.2,1); }
  .obs-job-wrap:hover { transform: translateY(-5px); }

  /* ── Featured guest card ── */
  .obs-feat-card {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 16px;
    transition: all .3s ease;
  }
  .obs-feat-card:hover {
    background: rgba(255,255,255,.08);
    border-color: rgba(139,92,246,.45);
    box-shadow: 0 0 0 1px rgba(139,92,246,.2), 0 16px 40px -12px rgba(139,92,246,.25);
    transform: translateY(-3px);
  }

  /* ── Ticker ── */
  .obs-ticker-track { animation: ticker-scroll 22s linear infinite; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,.02); }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,.45); border-radius:3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,.7); }

  /* ── Dot grid hero decoration ── */
  .obs-dot-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image: radial-gradient(rgba(99,102,241,.18) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 80%);
  }

  /* ── Glowing divider ── */
  .obs-divider {
    height:1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,.4) 40%, rgba(167,139,250,.3) 60%, transparent);
    margin: 3rem 0;
  }

  /* ── Section badge ── */
  .obs-section-badge {
    display:inline-flex; align-items:center; gap:.5rem;
    padding: .35rem 1rem; border-radius:999px;
    font-size:.75rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
    border: 1px solid rgba(245,158,11,.35);
    background: rgba(245,158,11,.1);
    color: #fbbf24;
  }
  .obs-section-badge-violet {
    border-color: rgba(139,92,246,.35);
    background: rgba(139,92,246,.1);
    color: #c084fc;
  }

  /* ── Empty state ── */
  .obs-empty {
    background: rgba(255,255,255,.03);
    border: 2px dashed rgba(255,255,255,.08);
    border-radius:24px;
    text-align:center; padding:5rem 2rem;
  }

  /* ── Light theme refinements ── */
  .obs-root-light .obs-glass {
    background: rgba(255,255,255,.95);
    border: 1px solid rgba(226,232,240,1);
    box-shadow:
      0 18px 40px -24px rgba(15,23,42,.25),
      0 0 0 1px rgba(148,163,184,.18);
  }
  .obs-root-light .obs-glass:hover {
    background: #ffffff;
    border-color: rgba(129,140,248,.6);
    box-shadow:
      0 22px 50px -26px rgba(129,140,248,.45),
      0 0 0 1px rgba(129,140,248,.35);
  }

  .obs-root-light .obs-stat {
    background: rgba(255,255,255,.96);
    border: 1px solid rgba(226,232,240,1);
    box-shadow:
      0 18px 40px -24px rgba(15,23,42,.20),
      0 0 0 1px rgba(148,163,184,.12);
  }

  .obs-root-light .obs-feat-card {
    background: rgba(255,255,255,.98);
    border: 1px solid rgba(226,232,240,1);
    box-shadow:
      0 16px 40px -24px rgba(15,23,42,.15);
  }
  .obs-root-light .obs-feat-card:hover {
    background: #ffffff;
    border-color: rgba(129,140,248,.55);
    box-shadow:
      0 22px 50px -24px rgba(129,140,248,.35);
  }

  .obs-root-light .obs-empty {
    background: rgba(248,250,252,1);
    border-color: rgba(203,213,225,1);
  }

  .obs-root-light .obs-text-violet {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .obs-root-light .obs-text-amber {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .obs-root-light .obs-text-blue {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .obs-root-light .obs-section-badge {
    border-color: rgba(245,158,11,0.4);
    background: rgba(245,158,11,0.08);
    color: #b45309;
  }
  .obs-root-light .obs-section-badge-violet {
    border-color: rgba(99,102,241,0.4);
    background: rgba(99,102,241,0.08);
    color: #4f46e5;
  }
`;

/* ─── Job icon map ─────────────────────────────────────────────── */
const jobIcons: Record<string, LucideIcon> = {
  software: Code, developer: Code, engineer: Code, frontend: Palette,
  backend: Database, fullstack: Code, mobile: Smartphone, cloud: Cloud,
  devops: Zap, design: Palette, data: Database, ai: Zap, machine: Zap,
  web: Code, application: Code, senior: TrendingUp, junior: Code,
  lead: TrendingUp, principal: TrendingUp,
};
const getJobIcon = (title: string): LucideIcon => {
  const t = title.toLowerCase();
  for (const [k, v] of Object.entries(jobIcons)) if (t.includes(k)) return v;
  return Briefcase;
};

/* ─── Animated Counter ─────────────────────────────────────────── */
const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView || value === 0) { setCount(0); return; }
    let cur = 0;
    const inc = Math.max(1, Math.ceil(value / (duration / 16)));
    const id = setInterval(() => {
      cur = Math.min(cur + inc, value);
      setCount(cur);
      if (cur >= value) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [inView, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

/* ─── Ticker labels ────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Full-Time", "Remote", "Internship", "Part-Time", "Contract",
  "Engineering", "Design", "Product", "Data Science", "DevOps", "AI/ML",
  "Full-Time", "Remote", "Internship", "Part-Time", "Contract",
  "Engineering", "Design", "Product", "Data Science", "DevOps", "AI/ML",
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function Jobs() {
  const { user } = useAuth();
  const { t } = useLanguage();
   const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [filters, setFilters] = useState({ location: "", skills: [] as string[], jobType: "", search: "" });
  const [page, setPage] = useState(1);
  const [randomizedJobs, setRandomizedJobs] = useState<Job[]>([]);
  const [overallStats, setOverallStats] = useState({ totalLocations: 0, totalJobTypes: 0, avgSalary: 0 });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<Job | null>(null);
  const [headlineIndex, setHeadlineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const itemsPerPage = 12;
  const statsRef = useRef<HTMLDivElement>(null);
  const jobsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: "-40px" });
  const isJobsInView = useInView(jobsRef, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll();
  const smoothY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroOpacity = useTransform(smoothY, [0, 0.12], [1, 0]);
  const heroScale = useTransform(smoothY, [0, 0.12], [1, 0.88]);

  useEffect(() => {
    // Standard page-to-top on pagination.
    // The global ScrollToTop handles initial route mount, so we only need this for 'page' state changes.
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);

  /* ── inject CSS ── */
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = OBSIDIAN_CSS;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  /* ── helpers ── */
  const buildQS = (f: typeof filters, p: number, n: number) => {
    const params = new URLSearchParams();
    if (f.location) params.append("location", f.location);
    if (f.jobType) params.append("jobType", f.jobType);
    if (f.search) params.append("search", f.search);
    f.skills.forEach((s) => params.append("skills", s));
    params.append("page", String(p));
    params.append("itemsPerPage", String(n));
    return params.toString();
  };

  /* ── queries ── */
  const { data: overallData } = useQuery<JobsApiResponse>({
    queryKey: ["/api/jobs/overall", { ...filters }],
    queryFn: async () => {
      try {
        const r = await apiFetch(`/api/jobs?${buildQS(filters, 1, 1000)}`);
        if (!r.ok) throw new Error("overall fetch failed");
        const d = await r.json();
        return { jobs: d.jobs ?? [], totalCount: d.totalCount ?? 0 };
      } catch { return { jobs: [], totalCount: 0 }; }
    },
    staleTime: 600_000,
  });

  const isProfessional = user?.userType === "Professional" || user?.userType === "job_seeker";
  const { data: recommendedData } = useQuery({
    queryKey: ["/api/jobs/recommended"],
    queryFn: () => api.jobs.getRecommended(),
    staleTime: 300_000,
    enabled: !!isProfessional,
  });
  const recommendedJobs = (recommendedData?.jobs ?? []) as Job[];

  const isGuest = !user;
  const { data: featuredForGuestsData } = useQuery<JobsApiResponse>({
    queryKey: ["/api/jobs/featured-guests"],
    queryFn: async () => {
      const r = await apiFetch(`/api/jobs?page=1&itemsPerPage=4`);
      if (!r.ok) throw new Error("featured fetch failed");
      const d = await r.json();
      return { jobs: d.jobs ?? [], totalCount: d.totalCount ?? 0 };
    },
    staleTime: 300_000,
    enabled: isGuest,
  });
  const featuredForGuests = (featuredForGuestsData?.jobs ?? []) as Job[];

  const { data, isLoading } = useQuery<JobsApiResponse>({
    queryKey: ["/api/jobs", { ...filters, page, itemsPerPage }],
    queryFn: async () => {
      const r = await apiFetch(`/api/jobs?${buildQS(filters, page, itemsPerPage)}`);
      if (!r.ok) throw new Error("jobs fetch failed");
      const d = await r.json();
      return { jobs: d.jobs ?? [], totalCount: d.totalCount ?? 0 };
    },
    staleTime: 30_000,
  });

  /* ── effects ── */
  useEffect(() => {
    if (!overallData?.jobs) return;
    const all = overallData.jobs;
    setOverallStats({
      totalLocations: new Set(all.map((j) => j.location)).size,
      totalJobTypes: new Set(all.map((j) => j.jobType)).size,
      avgSalary: all.length > 0 ? Math.round(all.reduce((a, j) => a + (j.salaryMin + j.salaryMax) / 2, 0) / all.length / 1000) : 0,
    });
  }, [overallData]);

  useEffect(() => {
    if (data?.jobs) setRandomizedJobs([...data.jobs].sort(() => Math.random() - 0.5));
  }, [data?.jobs]);

  const jobs = randomizedJobs;
  const totalJobs = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalJobs / itemsPerPage));

  /* ── stat cards config ── */
  const statCards = [
    { icon: Briefcase, label: t("jobs.totalJobs"), value: totalJobs, suffix: "+", gradient: "from-indigo-500 to-violet-600", textCls: "obs-text-violet", delay: 0 },
    { icon: MapPin, label: t("jobs.locations"), value: overallStats.totalLocations, suffix: "+", gradient: "from-blue-500 to-cyan-500", textCls: "obs-text-blue", delay: 0.07 },
    { icon: Clock, label: t("jobs.jobTypes"), value: overallStats.totalJobTypes, suffix: "+", gradient: "from-purple-500 to-pink-500", textCls: "obs-text-violet", delay: 0.14 },
    { icon: IndianRupee, label: t("jobs.avgSalary"), value: overallStats.avgSalary, suffix: "k+", gradient: "from-amber-400 to-orange-500", textCls: "obs-text-amber", delay: 0.21, isCurrency: true },
  ];

   /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={`obs-root min-h-screen relative overflow-x-clip ${isDark ? "obs-root-dark" : "obs-root-light"}`}
    >
      {/* ── Grain (kept only for dark theme so light stays crisp) ── */}
      {isDark && <div className="obs-grain" />}



      {/* ════ CONTENT ════ */}
      <div className="relative py-10" style={{ zIndex: 2 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>

          {/* ── HERO ── */}
          <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="text-center mb-16 relative">
            {/* Dot grid decoration */}
            <div className="obs-dot-grid" style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: "100%", height: 320, pointerEvents: "none" }} />

            {/* Eyebrow */}
             <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .1 }} className="inline-block mb-6">
              <div
                className="obs-badge-pulse inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
                style={{
                  background: "var(--obs-badge-bg)",
                  border: "1px solid var(--obs-badge-border)",
                  backdropFilter: "blur(14px)",
                  boxShadow: isDark ? "0 0 20px rgba(99,102,241,.15)" : "none"
                }}
              >
                <motion.div animate={{ rotate: [0, 18, 0], scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <Zap className="w-4 h-4" style={{ color: "var(--obs-badge-icon)", fill: "var(--obs-badge-icon)", opacity: 0.9 }} />
                </motion.div>
                <span style={{ fontSize: ".875rem", fontWeight: 700, color: "var(--obs-badge-text)", letterSpacing: ".02em" }}>
                  <AnimatedCounter value={totalJobs} duration={1800} /> live opportunities
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 44 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .85, delay: 0.2, type: "spring", stiffness: 75 }}
              className="obs-display"
              style={{
                fontSize: "clamp(1.8rem, 6.5vw, 3.8rem)",
                fontWeight: 800,
                lineHeight: 1.3,
                letterSpacing: "-.04em",
                marginBottom: "1.5rem",
                maxWidth: "950px",
                margin: "0 auto 1.5rem"
              }}
            >
              <div style={{ position: "relative", minHeight: "1.3em" }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={headlineIndex}
                    initial={{ y: 40, opacity: 0, rotateX: -90 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    exit={{ y: -40, opacity: 0, rotateX: 90 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                     style={{
                      display: "block",
                      background: "var(--obs-headline-grad)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      perspective: "1000px"
                    }}
                  >
                    {[
                      "Careers That Move You Forward",
                      "Opportunities That Define Your Future",
                      "Connections That Spark Innovation",
                      "Excellence That Drives Success"
                    ][headlineIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .7, delay: .4 }}
              style={{
                fontSize: "1.15rem",
                color: "var(--obs-sub-text)",
                maxWidth: 520,
                margin: "0 auto 2.5rem",
                lineHeight: 1.75,
              }}
            >
              {t("jobs.discoverLine")}
            </motion.p>

            {/* Removed CTA pills as requested */}
          </motion.div>

          {/* ── TICKER ── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .7 }}
             style={{
              overflow: "hidden",
              margin: "0 -1.5rem 3rem",
               padding: "1.25rem 0",
              borderTop: "1px solid rgba(255,255,255,.06)",
              borderBottom: "1px solid rgba(255,255,255,.06)",
              background: "var(--obs-ticker-bg)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.02), inset 0 -1px 0 rgba(255,255,255,.02)",
              pointerEvents: "none", // Prevent ticker from catching swipe/scroll intent
              userSelect: "none"
            }}
          >
            <div className="obs-ticker-track" style={{ display: "flex", gap: "3rem", width: "max-content" }}>
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".75rem",
                  whiteSpace: "nowrap",
                  fontSize: ".85rem",
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--obs-ticker-text)",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #c084fc)", boxShadow: "0 0 12px rgba(99,102,241,.5)" }} />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ── AI RECOMMENDATIONS ── */}
          {isProfessional && recommendedJobs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .3 }} className="mb-14">
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.5rem" }}>
                <span className="obs-section-badge">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("jobs.jobsForYou")}
                </span>
                <span style={{ fontSize: ".875rem", color: "#64748b" }}>{t("jobs.personalizedProfile")}</span>
              </div>
              <div className="space-y-4">
                {recommendedJobs.map((job: Job, i: number) => (
                  <motion.div key={job.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .4, delay: i * .05 }} className="obs-job-wrap">
                    <JobCard
                      job={job}
                      setSelectedJob={(j) => { setSelectedJob(j); setShowQuickApply(true); }}
                      setShowQuickApply={setShowQuickApply}
                      onCardClick={() => setSelectedJobForDetail(job)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── SEARCH ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .6 }} style={{ marginBottom: "3rem", position: "relative", zIndex: 20 }}>
            <div style={{ borderRadius: 20, padding: 1, background: "linear-gradient(135deg, rgba(99,102,241,.2), rgba(139,92,246,.15), rgba(99,102,241,.15))" }}>
              <div style={{ borderRadius: 19 }}>
                <JobSearch
                  onSearch={(sf) => {
                    setFilters(c => ({ ...c, location: sf.location, jobType: sf.jobType, search: sf.search }));
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* ── STATS BENTO ── */}
          <div ref={statsRef}>
            {!isLoading && totalJobs > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: .65, ease: [.22, 1, .36, 1] }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "3.5rem" }}
              >
                {statCards.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 24 }}
                    animate={isStatsInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: .55, delay: stat.delay, ease: [.22, 1, .36, 1] }}
                    className="obs-stat"
                    style={{ padding: "1.75rem 1.5rem" }}
                  >
                    {/* Icon */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${stat.gradient.replace("from-", "").replace(" to-", ", ").split(" ").map(c => `var(--tw-${c.replace("-", "/")})`).join(", ")})`, backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`, boxShadow: `0 8px 24px -8px rgba(99,102,241,.4)` }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: idx === 3 ? "linear-gradient(135deg,#f59e0b,#d97706)" : idx === 1 ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : idx === 2 ? "linear-gradient(135deg,#a855f7,#ec4899)" : "linear-gradient(135deg,#6366f1,#7c3aed)", boxShadow: "0 6px 20px -6px rgba(99,102,241,.5)" }}>
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ opacity: .35 }}>
                        <BarChart3 className="w-4 h-4" style={{ color: "#6366f1" }} />
                      </motion.div>
                    </div>
                    {/* Value */}
                    <div style={{ marginBottom: ".375rem" }}>
                      <span
                        className={`obs-display ${stat.textCls}`}
                        style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1 }}
                      >
                        <AnimatedCounter value={stat.value} duration={2200} />
                        {stat.suffix}
                      </span>
                    </div>
                    <p style={{ fontSize: ".8rem", fontWeight: 500, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* ── GUEST FEATURED JOBS ── */}
          {isGuest && featuredForGuests.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} style={{ marginBottom: "3.5rem" }}>
              {/* Gradient border wrapper */}
              <div
                style={{
                  borderRadius: 24,
                  padding: 1,
                   background:
                    isDark
                      ? "linear-gradient(135deg, rgba(139,92,246,.5) 0%, rgba(99,102,241,.25) 40%, rgba(245,158,11,.2) 100%)"
                      : "linear-gradient(135deg, rgba(129,140,248,.35) 0%, rgba(196,181,253,.25) 40%, rgba(248,250,252,1) 100%)",
                  boxShadow: "0 0 80px -30px rgba(99,102,241,.25)",
                }}
              >
                <div
                  style={{
                    borderRadius: 23,
                     background:
                      isDark
                        ? "linear-gradient(160deg, #0d0d1f 0%, #0a0a18 100%)"
                        : "linear-gradient(160deg, #ffffff 0%, #eef2ff 60%, #faf5ff 100%)",
                    padding: "2.5rem",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Inner orb */}
                  <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.12) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: -60, left: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,.07) 0%, transparent 70%)", filter: "blur(35px)", pointerEvents: "none" }} />

                  <div style={{ position: "relative" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: ".75rem" }}>
                      <span className="obs-section-badge-violet obs-section-badge">
                        <Crown className="w-3.5 h-3.5" />
                        {t("jobs.curatedForYou")}
                      </span>
                      <span style={{ fontSize: ".875rem", color: "#475569" }}>{t("jobs.topPicks")}</span>
                    </div>
                     <h2
                      className="obs-display obs-gradient-text"
                      style={{
                        fontSize: "clamp(1.5rem,4vw,2.25rem)",
                        fontWeight: 800,
                        letterSpacing: "-.03em",
                        marginBottom: ".5rem",
                        background: isDark ? "linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 100%)" : "linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)",
                      }}
                    >
                      {t("jobs.bestRecommended")}
                    </h2>
                    <p style={{ color: "#64748b", fontSize: ".9rem", marginBottom: "2rem", maxWidth: 480 }}>
                      {t("jobs.createAccountToApply")}
                    </p>

                    {/* Cards grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                      {featuredForGuests.slice(0, 6).map((job: Job, i: number) => {
                        const JobIcon = getJobIcon(job.title);
                        return (
                          <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: .35, delay: i * .065 }}
                            className="obs-feat-card"
                            style={{ padding: "1.25rem" }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                              <div
                                style={{
                                  flexShrink: 0,
                                  width: 44,
                                  height: 44,
                                  borderRadius: 12,
                                  background:
                                    theme === "dark"
                                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                      : "linear-gradient(135deg, #4f46e5, #a855f7)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 6px 20px -6px rgba(99,102,241,.5)",
                                }}
                              >
                                <JobIcon className="w-5 h-5 text-white" />
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <h3
                                   style={{
                                    fontWeight: 700,
                                    color: isDark ? "#e2e8f0" : "#0f172a",
                                    fontSize: ".9rem",
                                    marginBottom: ".2rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {job.title}
                                </h3>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: ".75rem", color: "#64748b", marginBottom: "0.5rem" }}>
                                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", textTransform: "capitalize" }}>
                                    <Clock className="w-3 h-3" /> {job.jobType?.replace("-", " ")}
                                  </span>
                                </div>
                                {job.skills?.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem" }}>
                                    {job.skills.slice(0, 2).map((s: string, si: number) => (
                                      <span key={si} style={{ padding: ".2rem .6rem", borderRadius: 999, fontSize: ".72rem", fontWeight: 600, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.25)", color: "#a5b4fc" }}>
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                     <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", borderRadius: 20, padding: "2rem", background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)", border: isDark ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(99,102,241,0.2)", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -20px rgba(99,102,241,0.4)" }}>
                      {/* Premium shimmer flare */}
                      <div className="obs-btn-shimmer" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.1, pointerEvents: "none" }} />

                      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", position: "relative" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #8b5cf6, #6366f1, #d946ef)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px -5px rgba(139,92,246,0.6)" }}>
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: "1.1rem", color: isDark ? "#f8fafc" : "#1e293b", marginBottom: ".2rem", letterSpacing: "-.01em" }}>{t("jobs.joinSkillConnect")}</p>
                          <p style={{ fontSize: ".85rem", fontWeight: 500, color: isDark ? "#94a3b8" : "#64748b" }}>{t("jobs.getRecommendations")}</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: ".85rem", position: "relative" }}>
                        <Link
                          to="/login"
                          style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".75rem 1.5rem", borderRadius: 12, fontWeight: 700, fontSize: ".875rem", background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: isDark ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(0,0,0,.08)", color: isDark ? "#cbd5e1" : "#475569", textDecoration: "none", transition: "all .2s" }}
                        >
                          {t("nav.signIn")} <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          to="/signup"
                          className="obs-btn-shimmer"
                          style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".75rem 1.75rem", borderRadius: 12, fontWeight: 800, fontSize: ".92rem", color: "#fff", textDecoration: "none", boxShadow: "0 12px 30px -10px rgba(99,102,241,.6)", transition: "transform .3s ease" }}
                        >
                          {t("jobs.signUpFree")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── DIVIDER ── */}
          <div className="obs-divider" />

          {/* ── ALL JOBS ── */}
          <div ref={jobsRef}>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={isJobsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .65, ease: [.22, 1, .36, 1] }}
            >
              {/* Section header */}
               <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div className="space-y-3">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="obs-section-badge-violet obs-section-badge">
                      <Layers className="w-3.5 h-3.5" />
                      {t("jobs.allPositions") || "All Positions"}
                    </span>
                  </motion.div>
                  
                  <motion.h2
                    className="obs-display text-3xl md:text-4xl font-extrabold tracking-tight"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    style={{ color: "var(--obs-modal-header)" }}
                  >
                    {t("jobs.availableOpportunities")}
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-[14px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    {totalJobs > 0
                      ? t("jobs.showingCount", { count: Math.min(itemsPerPage, jobs.length), total: totalJobs })
                      : t("jobs.noJobsMatching")}
                  </motion.p>
                </div>

                {jobs.length > 0 && (
                  <motion.div
                    whileInView={{ x: [30, 0], opacity: [0, 1] }}
                    transition={{ duration: .45, delay: .1 }}
                    style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".8rem", color: "#475569", fontWeight: 500 }}
                  >
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}>
                      <TrendingUp className="w-4 h-4" style={{ color: "#6366f1" }} />
                    </motion.div>
                    {t("jobs.sortedByRelevance")}
                  </motion.div>
                )}
              </div>

              {/* Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1.25rem" }}>
                <AnimatePresence>
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}>
                        <div className="obs-glass" style={{ borderRadius: 20, padding: "1.5rem" }}>
                          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                            <Skeleton style={{ width: 44, height: 44, borderRadius: 12, background: theme === "dark" ? "rgba(255,255,255,.07)" : "rgba(0,0,0,0.06)" }} />
                            <div style={{ flex: 1 }}>
                              <Skeleton style={{ height: 20, width: "75%", marginBottom: 8, borderRadius: 8, background: theme === "dark" ? "rgba(255,255,255,.07)" : "rgba(0,0,0,0.06)" }} />
                              <Skeleton style={{ height: 14, width: "50%", marginBottom: 16, borderRadius: 8, background: theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,0.04)" }} />
                              <div style={{ display: "flex", gap: 8 }}>
                                {[60, 60, 60].map((w, j) => <Skeleton key={j} style={{ height: 14, width: w, borderRadius: 8, background: theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,0.04)" }} />)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                    : jobs.length > 0
                      ? jobs.map((job: any, i: number) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20, scale: .97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: .4, delay: Math.min(i, .8) * .05, type: "spring", stiffness: 90 }}
                          viewport={{ once: true, margin: "-40px" }}
                          className="obs-job-wrap"
                        >
                          <JobCard
                            job={job}
                            setSelectedJob={(j) => { setSelectedJob(j); setShowQuickApply(true); }}
                            setShowQuickApply={setShowQuickApply}
                            onCardClick={() => setSelectedJobForDetail(job)}
                          />
                        </motion.div>
                      ))
                      : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0, scale: .95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{ gridColumn: "1 / -1" }}
                        >
                          <div className="obs-empty">
                            <div style={{ width: 72, height: 72, borderRadius: "50%", background: theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                              <Briefcase className="w-9 h-9" style={{ color: theme === "dark" ? "#334155" : "#94a3b8" }} />
                            </div>
                            <h3 className="obs-display" style={{ fontSize: "1.5rem", fontWeight: 700, color: theme === "dark" ? "#f1f5f9" : "#0f172a", marginBottom: ".75rem" }}>
                              {t("jobs.noJobsMatching") || "No jobs found"}
                            </h3>
                            <p style={{ color: theme === "dark" ? "#64748b" : "#475569", fontSize: ".9rem", marginBottom: "1.75rem", maxWidth: 380, margin: "0 auto 1.75rem" }}>
                              We couldn't find any jobs matching your filters. Try broadening your search.
                            </p>
                            <button
                              onClick={() => { setFilters({ location: "", skills: [], jobType: "", search: "" }); setPage(1); }}
                              className="obs-btn-shimmer"
                              style={{ padding: ".7rem 1.75rem", borderRadius: 12, fontWeight: 700, color: "#fff", fontSize: ".9rem", cursor: "pointer", boxShadow: "0 8px 24px -8px rgba(99,102,241,.5)" }}
                            >
                              View All Jobs
                            </button>
                          </div>
                        </motion.div>
                      )
                  }
                </AnimatePresence>
              </div>

              {/* ── PAGINATION ── */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: .5 }}
                  style={{ marginTop: "3rem" }}
                >
                  <div className="obs-glass" style={{ borderRadius: 20, padding: "1.5rem" }}>
                    <Pagination>
                      <PaginationContent style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage(Math.max(1, page - 1))}
                            style={{ color: page === 1 ? (theme === "dark" ? "#1e293b" : "#cbd5e1") : "#6366f1", pointerEvents: page === 1 ? "none" : "auto", opacity: page === 1 ? .4 : 1, fontWeight: 800, fontSize: "1rem" }}
                          />
                        </PaginationItem>

                        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pn = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                            return (
                              <PaginationItem key={pn}>
                                <PaginationLink
                                  onClick={() => setPage(pn)}
                                  isActive={pn === page}
                                  style={{
                                    fontWeight: 700, fontSize: ".875rem",
                                    borderRadius: 10, width: 38, height: 38,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: pn === page ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "transparent",
                                    color: pn === page ? "#fff" : isDark ? "#64748b" : "#475569",
                                    border: pn === page ? "none" : isDark ? "1px solid rgba(255,255,255,.07)" : "1px solid rgba(0,0,0,0.08)",
                                    boxShadow: pn === page ? "0 6px 20px -6px rgba(99,102,241,.6)" : "none",
                                    cursor: "pointer",
                                    transition: "all .2s",
                                  }}
                                >
                                  {pn}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          {totalPages > 5 && page < totalPages - 2 && (
                            <>
                              <span style={{ color: "#334155" }}>···</span>
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() => setPage(totalPages)}
                                  style={{ fontWeight: 700, color: "#64748b", fontSize: ".875rem", cursor: "pointer" }}
                                >
                                  {totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            </>
                          )}
                        </div>

                        <PaginationItem>
                           <PaginationNext
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            style={{ color: page === totalPages ? (isDark ? "#1e293b" : "#cbd5e1") : "#6366f1", pointerEvents: page === totalPages ? "none" : "auto", opacity: page === totalPages ? .4 : 1, fontWeight: 800, fontSize: "1rem" }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>

                    <p style={{ textAlign: "center", fontSize: ".8rem", color: "#334155", marginTop: ".75rem" }}>
                      Page {page} of {totalPages} · {totalJobs.toLocaleString()} total opportunities
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div >
      </div >

      {/* ── JOB DETAIL MODAL ── */}
      < Dialog open={!!selectedJobForDetail} onOpenChange={(o) => !o && setSelectedJobForDetail(null)}>
        <DialogContent
          style={{
            maxWidth: 680,
            maxHeight: "90vh",
            overflowY: "auto",
             background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 24,
            boxShadow: isDark
              ? "0 0 0 1px rgba(99,102,241,.12), 0 40px 80px -20px rgba(0,0,0,.85), 0 0 100px -40px rgba(99,102,241,.25)"
              : "0 0 0 1px rgba(99,102,241,.1), 0 20px 50px -12px rgba(15,23,42,.15)",
          }}
        >
          {selectedJobForDetail && (
             <>
              <DialogHeader>
                <DialogTitle className="obs-display" style={{ fontSize: "1.5rem", fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a", letterSpacing: "-.025em", paddingRight: "2rem" }}>
                  {selectedJobForDetail.title}
                </DialogTitle>
              </DialogHeader>
              <div style={{ marginTop: "1.25rem" }}>
                {/* Meta row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", fontSize: ".8rem", color: "#64748b", marginBottom: "1.5rem" }}>
                  {[
                    { icon: Building, text: selectedJobForDetail.company?.name || t("common.company") },
                    { icon: MapPin, text: selectedJobForDetail.location },
                    { icon: Clock, text: selectedJobForDetail.jobType?.replace("-", " ") },
                    { icon: IndianRupee, text: selectedJobForDetail.salaryMin != null ? `₹${(selectedJobForDetail.salaryMin / 1000).toFixed(0)}k – ₹${(selectedJobForDetail.salaryMax / 1000).toFixed(0)}k` : t("jobCard.salaryNotSpecified") },
                   ].map(({ icon: Icon, text }, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: ".3rem", padding: ".3rem .8rem", borderRadius: 999, background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,.08)" : "1px solid rgba(0,0,0,0.08)", textTransform: i === 2 ? "capitalize" : "none", color: isDark ? "#94a3b8" : "#475569" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: "#6366f1" }} /> {text}
                    </span>
                  ))}
                </div>

                {/* Skills */}
                 {selectedJobForDetail.skills?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "1.5rem" }}>
                    {selectedJobForDetail.skills.map((s: string, i: number) => (
                      <span key={i} style={{ padding: ".3rem .85rem", borderRadius: 999, fontSize: ".78rem", fontWeight: 600, background: isDark ? "rgba(99,102,241,.12)" : "rgba(99,102,241,.08)", border: isDark ? "1px solid rgba(99,102,241,.25)" : "1px solid rgba(99,102,241,.15)", color: isDark ? "#a5b4fc" : "#4f46e5" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="obs-divider" style={{ margin: "1.25rem 0" }} />

                {/* Description */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <h4 style={{ fontSize: ".8rem", fontWeight: 700, color: "#6366f1", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: ".75rem" }}>
                    {t("jobs.description")}
                  </h4>
                  <p style={{ color: "#94a3b8", fontSize: ".9rem", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                    {selectedJobForDetail.description}
                  </p>
                </div>

                {selectedJobForDetail.requirements && (
                  <div style={{ marginBottom: "1.75rem" }}>
                    <h4 style={{ fontSize: ".8rem", fontWeight: 700, color: "#6366f1", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: ".75rem" }}>
                      {t("jobs.requirements")}
                    </h4>
                    <p style={{ color: "#94a3b8", fontSize: ".9rem", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                      {selectedJobForDetail.requirements}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="obs-btn-shimmer"
                    style={{ padding: ".7rem 1.75rem", borderRadius: 12, fontWeight: 700, color: "#fff", fontSize: ".9rem", cursor: "pointer", boxShadow: "0 8px 24px -8px rgba(99,102,241,.55)" }}
                    onClick={() => { setSelectedJob(selectedJobForDetail); setShowQuickApply(true); setSelectedJobForDetail(null); }}
                  >
                    {t("jobs.quickApply")}
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog >

      {/* ── QUICK APPLY MODAL ── */}
      {
        showQuickApply && selectedJob && (
          <QuickApplyModal
            isOpen={showQuickApply}
            onClose={() => setShowQuickApply(false)}
            jobId={selectedJob.id}
            jobTitle={selectedJob.title}
            companyName={selectedJob.company?.name || ""}
            matchPercentage={selectedJob.matchScore ?? 0}
          />
        )
      }
    </div >
  );
}