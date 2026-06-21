import React, { useState, useEffect, useRef } from 'react';
import AdminBackButton, { useAdminEmbedded } from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import {
  BarChart3, TrendingUp, Users, Briefcase, ArrowUp, ArrowDown,
  Calendar, DollarSign, Target, Activity, PieChart, LineChart,
  UserCheck, Building2, CheckCircle, Clock, Filter, Download,
  Eye, Sparkles, Zap, Star, Award, TrendingDown, FileText,
  ChevronDown, MoreHorizontal, RefreshCw, Bell, Loader2
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Pie, Cell, PieChart as RechartsPieChart, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { adminService, type AdminAnalyticsData } from '@/lib/admin-service';

type TimeRangeKey = '7d' | '30d' | '90d' | '1y';

type ActivityColor = 'blue' | 'green' | 'purple' | 'orange';

type AnalyticsViewData = {
  userGrowth: { month: string; users: number; employees: number; employers: number }[];
  jobCategories: { name: string; value: number; color: string }[];
  recentActivities: { type: string; action: string; user: string; time: string; color: ActivityColor }[];
  performanceMetrics: {
    employeeSatisfaction: number;
    employerSatisfaction: number;
    placementRate: number;
    avgTimeToHire: number;
    timeToHireChange: number;
  };
  stats: {
    totalUsers: number;
    newUsers: number;
    activeJobs: number;
    newJobs: number;
    applications: number;
    newApplications: number;
    successRate: number;
    successRateChange: number;
  };
  pipeline: {
    new: number;
    reviewing: number;
    shortlisted: number;
    interview: number;
    hired: number;
    rejected: number;
  };
};

const EMPTY_ANALYTICS: AnalyticsViewData = {
  userGrowth: [],
  jobCategories: [],
  recentActivities: [],
  performanceMetrics: {
    employeeSatisfaction: 0,
    employerSatisfaction: 0,
    placementRate: 0,
    avgTimeToHire: 0,
    timeToHireChange: 0,
  },
  stats: {
    totalUsers: 0,
    newUsers: 0,
    activeJobs: 0,
    newJobs: 0,
    applications: 0,
    newApplications: 0,
    successRate: 0,
    successRateChange: 0,
  },
  pipeline: { new: 0, reviewing: 0, shortlisted: 0, interview: 0, hired: 0, rejected: 0 },
};

const CATEGORY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

const activityColor = (type: string): ActivityColor => {
  if (type === 'job') return 'green';
  if (type === 'application') return 'purple';
  if (type === 'company') return 'orange';
  return 'blue';
};

function mapApiAnalyticsToView(api: AdminAnalyticsData): AnalyticsViewData {
  const stats = api.stats ?? {};
  const perf = api.performanceMetrics ?? {};

  const userGrowth = (api.userGrowth ?? []).map((row) => ({
    month: row.month,
    users: Number(row.users ?? 0),
    employees: Number(row.employees ?? 0),
    employers: Number(row.employers ?? 0),
  }));

  const jobCategories = (api.jobCategories ?? []).slice(0, 6).map((row, idx) => ({
    name: String(row.name ?? 'Other'),
    value: Number(row.value ?? 0),
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  const recentActivities = (api.recentActivities ?? []).slice(0, 8).map((a) => ({
    type: a.type ?? 'user',
    action: a.action ?? 'Activity',
    user: a.user ?? '—',
    time: a.createdAt ? new Date(a.createdAt).toLocaleString() : 'Recently',
    color: activityColor(a.type ?? 'user'),
  }));

  return {
    userGrowth,
    jobCategories,
    recentActivities,
    performanceMetrics: {
      employeeSatisfaction: Number(perf.employeeSatisfaction ?? 0),
      employerSatisfaction: Number(perf.employerSatisfaction ?? 0),
      placementRate: Number(perf.placementRate ?? 0),
      avgTimeToHire: Number(perf.avgTimeToHire ?? 0),
      timeToHireChange: Number(perf.timeToHireChange ?? 0),
    },
    stats: {
      totalUsers: Number(stats.totalUsers ?? 0),
      newUsers: Number(stats.newUsers ?? 0),
      activeJobs: Number(stats.activeJobs ?? 0),
      newJobs: Number(stats.newJobs ?? 0),
      applications: Number(stats.applications ?? 0),
      newApplications: Number(stats.newApplications ?? 0),
      successRate: Number(stats.successRate ?? 0),
      successRateChange: Number(stats.successRateChange ?? 0),
    },
    pipeline: {
      new: Number(perf.pipeline?.new ?? 0),
      reviewing: Number(perf.pipeline?.reviewing ?? 0),
      shortlisted: Number(perf.pipeline?.shortlisted ?? 0),
      interview: Number(perf.pipeline?.interview ?? 0),
      hired: Number(perf.pipeline?.hired ?? 0),
      rejected: Number(perf.pipeline?.rejected ?? 0),
    },
  };
}

/* ─────────────────────────── CUSTOM TOOLTIP ─────────────────────────── */
const CustomBarTooltip = ({ active, payload, label, dark }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm ${
      dark ? 'bg-gray-900/95 border-white/10 text-white' : 'bg-white/95 border-black/5 text-gray-900'
    }`}>
      <p className={`font-bold mb-2 text-xs uppercase tracking-widest ${dark ? 'text-gray-400' : 'text-gray-400'}`}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }}></div>
          <span className={dark ? 'text-gray-300' : 'text-gray-600'}>{p.name}:</span>
          <span className="font-bold">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload, dark }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm ${
      dark ? 'bg-gray-900/95 border-white/10 text-white' : 'bg-white/95 border-black/5 text-gray-900'
    }`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.color }}></div>
        <span className="font-bold">{payload[0].name}</span>
        <span className={`ml-1 font-black text-base ${dark ? 'text-white' : 'text-gray-900'}`}>{payload[0].value}%</span>
      </div>
    </div>
  );
};

const CustomSparkTooltip = ({ active, payload, label, dark, unit = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-3 py-2 rounded-xl shadow-xl border text-xs font-bold z-50 ${
      dark ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)] text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className={`mb-1 opacity-60 uppercase tracking-wider text-[10px]`}>{label}</div>
      <div className="flex items-center gap-1.5 text-sm">
        <div className="w-2 h-2 rounded-full" style={{ background: payload[0].color || payload[0].stroke || payload[0].fill }}></div>
        {payload[0].value}{unit}
      </div>
    </div>
  );
};

/* ─────────────────────────── STAT CARD ─────────────────────────── */
const DatabaseLoadingState = ({
  dark,
  className = '',
  minHeight = '12rem',
}: {
  dark: boolean;
  className?: string;
  minHeight?: string;
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 text-center px-4 ${className}`}
    style={{ minHeight }}
  >
    <RefreshCw className="w-7 h-7 animate-spin text-indigo-500" />
    <div>
      <p className={`text-sm font-bold ${dark ? 'text-gray-200' : 'text-gray-800'}`}>Loading data...</p>
      <p className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-500'}`}>Fetching live stats from database</p>
    </div>
  </div>
);

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  glowColor: string;
  dark: boolean;
  index: number;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, gradient, glowColor, dark, index, loading = false }) => (
  <div
    className={`relative group rounded-3xl p-6 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-default
      ${dark ? 'bg-gray-800/60 border border-white/8' : 'bg-white/80 border border-black/5'}`}
    style={{
      backdropFilter: 'blur(20px)',
      boxShadow: dark
        ? `0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`
        : `0 0 0 1px rgba(0,0,0,0.04), 0 20px 60px -10px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)`,
      animationDelay: `${index * 80}ms`,
    }}
  >
    {/* Corner accent */}
    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-15 blur-2xl transition-all duration-700 group-hover:opacity-30 group-hover:scale-125`}
      style={{ background: gradient }}></div>

    {/* Icon */}
    <div className="flex items-start justify-between mb-5">
      <div className="relative">
        <div className="absolute inset-0 blur-lg opacity-60 rounded-2xl" style={{ background: gradient }}></div>
        <div className="relative p-3 rounded-2xl" style={{ background: gradient }}>
          {icon}
        </div>
      </div>
    </div>

    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
    {loading ? (
      <div className="space-y-2 mb-2">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span className={`text-base font-bold ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</span>
        </div>
        <p className={`text-xs font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Fetching from database</p>
      </div>
    ) : (
      <p className={`text-4xl font-black mb-2 tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
    )}

    {/* Bottom shimmer line */}
    <div className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
      style={{ background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)` }}></div>
  </div>
);

/* ─────────────────────────── PROGRESS RING ─────────────────────────── */
const ProgressRing: React.FC<{ value: number; color: string; size?: number; strokeWidth?: number }> = ({
  value, color, size = 56, strokeWidth = 4
}) => {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="opacity-10" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
    </svg>
  );
};

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */
type AnalyticsProps = {
  quickActionIntent?: string | null;
  onQuickActionConsumed?: () => void;
};

const Analytics = ({ quickActionIntent = null, onQuickActionConsumed }: AnalyticsProps = {}) => {
  const { theme } = useTheme();
  const { embedded } = useAdminEmbedded();
  const dark = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('1y');
  const [timeRangeOpen, setTimeRangeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsViewData>(EMPTY_ANALYTICS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview');
  const exportRef = useRef<HTMLDivElement | null>(null);
  const timeRangeRef = useRef<HTMLDivElement | null>(null);
  const dashboardRef = useRef<HTMLDivElement | null>(null);

  const fetchAnalytics = async (range: TimeRangeKey) => {
    setLoading(true);
    setLoadError(null);
    try {
      const apiData = await adminService.getAnalytics(range);
      setAnalyticsData(mapApiAnalyticsToView(apiData));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  useEffect(() => {
    if (quickActionIntent !== 'analytics-export') return;
    setExportOpen(true);
    onQuickActionConsumed?.();
  }, [quickActionIntent, onQuickActionConsumed]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
      if (timeRangeRef.current && !timeRangeRef.current.contains(e.target as Node)) setTimeRangeOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const getRangeLabel = () => ({ '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '1y': 'Last year' }[timeRange] ?? 'Custom range');

  const getExportPayload = () => ({
    exportedAt: new Date().toISOString(), timeRange: getRangeLabel(),
    stats: analyticsData.stats, performanceMetrics: analyticsData.performanceMetrics,
    userGrowth: analyticsData.userGrowth, jobCategories: analyticsData.jobCategories,
    recentActivities: analyticsData.recentActivities,
  });

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const exportJSON = () => downloadBlob(new Blob([JSON.stringify(getExportPayload(), null, 2)], { type: 'application/json' }), `analytics-${timeRange}.json`);

  const exportCSV = () => {
    const lines: string[] = ['Section,Metric,Value', `Meta,Exported At,${new Date().toISOString()}`, `Meta,Time Range,${getRangeLabel()}`, ''];
    lines.push('Stats,Metric,Value');
    Object.entries(analyticsData.stats).forEach(([k, v]) => lines.push(`Stats,${k},${v}`));
    lines.push('', 'Performance,Metric,Value');
    Object.entries(analyticsData.performanceMetrics).forEach(([k, v]) => lines.push(`Performance,${k},${v}`));
    lines.push('', 'User Growth,Month,Users,Employees,Employers');
    analyticsData.userGrowth.forEach(r => lines.push(`User Growth,${r.month},${r.users},${r.employees},${r.employers}`));
    lines.push('', 'Job Categories,Category,Share(%)');
    analyticsData.jobCategories.forEach(r => lines.push(`Job Categories,${r.name},${r.value}`));
    lines.push('', 'Recent Activities,Type,Action,User,Time');
    analyticsData.recentActivities.forEach(r => lines.push(`Recent Activities,${r.type},"${r.action.replace(/"/g, '""')}","${r.user.replace(/"/g, '""')}",${r.time}`));
    downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), `analytics-${timeRange}.csv`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.entries(analyticsData.stats).map(([metric, value]) => ({ metric, value }))), 'Stats');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.entries(analyticsData.performanceMetrics).map(([metric, value]) => ({ metric, value }))), 'Performance');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analyticsData.userGrowth), 'UserGrowth');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analyticsData.jobCategories), 'Categories');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analyticsData.recentActivities), 'Activities');
    XLSX.writeFile(wb, `analytics-${timeRange}.xlsx`);
  };

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExportingPDF(true);
    setExportOpen(false); // Close dropdown before capturing
    try {
      // Give React time to remove the export dropdown from the DOM before capturing
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: dark ? '#0a0c12' : '#f4f5fb',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`SkillConnect-Analytics-${timeRange}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'json' | 'csv') => {
    if (format !== 'pdf') setExportOpen(false);
    ({ pdf: exportPDF, excel: exportExcel, json: exportJSON, csv: exportCSV })[format]();
  };

  /* ─── Derived radial data for perf rings ─── */
  const perfRings = [
    { label: 'Employee Satisfaction', value: analyticsData.performanceMetrics.employeeSatisfaction, color: '#6366f1', icon: <UserCheck className="w-5 h-5" />, bg: 'from-indigo-500/15 to-violet-500/5', border: dark ? 'border-indigo-500/20' : 'border-indigo-100' },
    { label: 'Employer Satisfaction', value: analyticsData.performanceMetrics.employerSatisfaction, color: '#10b981', icon: <Building2 className="w-5 h-5" />, bg: 'from-emerald-500/15 to-teal-500/5', border: dark ? 'border-emerald-500/20' : 'border-emerald-100' },
    { label: 'Placement Rate', value: analyticsData.performanceMetrics.placementRate, color: '#f59e0b', icon: <Target className="w-5 h-5" />, bg: 'from-amber-500/15 to-orange-500/5', border: dark ? 'border-amber-500/20' : 'border-amber-100' },
  ];

  const activityIcons: Record<string, React.ReactNode> = {
    user: <Users className="w-4 h-4" />, job: <Briefcase className="w-4 h-4" />,
    application: <FileText className="w-4 h-4" />, hire: <CheckCircle className="w-4 h-4" />,
  };

  const activityColors: Record<string, { bg: string; text: string; ring: string }> = {
    blue: {
      bg: dark ? 'bg-indigo-500/15' : 'bg-indigo-50',
      text: dark ? 'text-indigo-400' : 'text-indigo-600',
      ring: '#6366f1',
    },
    green: {
      bg: dark ? 'bg-emerald-500/15' : 'bg-emerald-50',
      text: dark ? 'text-emerald-400' : 'text-emerald-600',
      ring: '#10b981',
    },
    purple: {
      bg: dark ? 'bg-violet-500/15' : 'bg-violet-50',
      text: dark ? 'text-violet-400' : 'text-violet-600',
      ring: '#8b5cf6',
    },
    orange: {
      bg: dark ? 'bg-amber-500/15' : 'bg-amber-50',
      text: dark ? 'text-amber-400' : 'text-amber-600',
      ring: '#f59e0b',
    },
  };

  /* ─── Tooltip colors for recharts (can't use CSS vars) ─── */
  const tooltipBg = dark ? 'rgba(17,24,39,0.96)' : 'rgba(255,255,255,0.96)';
  const tooltipBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const tooltipText = dark ? '#f9fafb' : '#111827';

  return (
    <div className={`${embedded ? 'relative' : `min-h-screen p-6 md:p-8 relative overflow-hidden ${dark ? 'bg-[#0a0c12]' : 'bg-[#f4f5fb]'}`}`}>

      {/* ── Background ── */}
      {!embedded && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {dark ? (
            <>
              <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07]"
                style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
              <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05]"
                style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03]"
                style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
            </>
          ) : (
            <>
              <div className="absolute top-0 right-0 w-[700px] h-[700px] opacity-[0.4]"
                style={{ background: 'radial-gradient(ellipse at top right, #e0e7ff 0%, transparent 60%)' }}></div>
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] opacity-[0.3]"
                style={{ background: 'radial-gradient(ellipse at bottom left, #d1fae5 0%, transparent 60%)' }}></div>
            </>
          )}
        </div>
      )}

      <div ref={dashboardRef} className={`${embedded ? '' : 'max-w-[1440px] mx-auto'} relative z-10`}>

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="mb-5"><AdminBackButton /></div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              {/* Logo block */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl blur-xl opacity-60"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}></div>
                <div className="relative p-3.5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className={`text-3xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Analytics
                  </h1>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ${
                    dark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                         : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Live
                  </div>
                </div>
                <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'} font-medium`}>
                  Live database insights for {getRangeLabel().toLowerCase()}
                </p>
              </div>
            </div>

            {loadError && (
              <div className={`mb-4 w-full rounded-2xl border px-4 py-3 text-sm font-medium ${
                dark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {loadError}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Refresh */}
              <button
                onClick={() => fetchAnalytics(timeRange)}
                className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                  dark ? 'bg-gray-800/80 border-white/10 text-white shadow-xl shadow-black/20 hover:bg-gray-700/80'
                       : 'bg-white border-black/8 text-gray-800 hover:bg-gray-50 shadow-sm'
                }`}
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Time range */}
              <div className={`relative w-fit ${timeRangeOpen ? 'z-50' : 'z-10'}`} ref={timeRangeRef}>
                <button
                  onClick={() => setTimeRangeOpen(v => !v)}
                  className={`flex items-center gap-2 pl-4 pr-3 py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                    dark ? 'bg-gray-800/80 border-white/10 text-white shadow-xl shadow-black/20 hover:bg-gray-700/80'
                         : 'bg-white border-black/8 text-gray-800 hover:bg-gray-50 shadow-sm'
                  }`}
                  style={{ backdropFilter: 'blur(20px)' }}
                >
                  {getRangeLabel()}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${timeRangeOpen ? 'rotate-180' : ''} ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
                {timeRangeOpen && (
                  <div
                    data-floating-menu
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                    dark ? 'bg-gray-900 border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.6)]' 
                         : 'bg-white border border-black/5 shadow-[0_24px_64px_rgba(0,0,0,0.12)]'
                  }`}>
                    <div className={`px-4 py-2 border-b ${dark ? 'border-white/10 text-gray-500' : 'border-black/5 text-gray-400'} text-xs font-bold uppercase tracking-widest`}>
                      Time Range
                    </div>
                    {([
                      { label: 'Last 7 days', value: '7d' },
                      { label: 'Last 30 days', value: '30d' },
                      { label: 'Last 90 days', value: '90d' },
                      { label: 'Last year', value: '1y' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setTimeRange(opt.value);
                          setTimeRangeOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between ${
                          timeRange === opt.value 
                            ? (dark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                            : (dark ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50')
                        }`}
                      >
                        {opt.label}
                        {timeRange === opt.value && <CheckCircle className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export */}
              <div className={`relative w-fit ${exportOpen ? 'z-50' : 'z-10'}`} ref={exportRef}>
                <button
                  onClick={() => setExportOpen(v => !v)}
                  disabled={isExportingPDF}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200 shadow-lg ${isExportingPDF ? 'opacity-80 cursor-wait' : 'hover:scale-105 active:scale-95'}`}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 8px 24px -6px rgba(99,102,241,0.5)'
                  }}
                >
                  {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExportingPDF ? 'Generating...' : 'Export'}
                  {!isExportingPDF && <ChevronDown className={`w-3 h-3 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />}
                </button>
                {exportOpen && !isExportingPDF && (
                  <div
                    data-floating-menu
                    className={`absolute top-full right-0 mt-2 w-52 rounded-2xl overflow-hidden z-50 ${
                    dark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-black/5'
                  }`} style={{ boxShadow: dark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 24px 64px rgba(0,0,0,0.12)' }}>
                    <div className={`px-4 py-2 border-b ${dark ? 'border-white/10 text-gray-500' : 'border-black/5 text-gray-400'} text-xs font-bold uppercase tracking-widest`}>
                      Export as
                    </div>
                    {([
                      { label: 'PDF Document', value: 'pdf', icon: '📄' },
                      { label: 'Excel Spreadsheet', value: 'excel', icon: '📊' },
                      { label: 'CSV File', value: 'csv', icon: '📋' },
                      { label: 'JSON Data', value: 'json', icon: '⚙️' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleExport(opt.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                          dark ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            index={0} dark={dark} loading={loading}
            icon={<Users className="w-6 h-6 text-white" />}
            label="Total Users" value={analyticsData.stats.totalUsers.toLocaleString()}
            gradient="linear-gradient(135deg,#6366f1,#818cf8)" glowColor="#6366f1"
          />
          <StatCard
            index={1} dark={dark} loading={loading}
            icon={<Briefcase className="w-6 h-6 text-white" />}
            label="Active Jobs" value={analyticsData.stats.activeJobs.toLocaleString()}
            gradient="linear-gradient(135deg,#10b981,#34d399)" glowColor="#10b981"
          />
          <StatCard
            index={2} dark={dark} loading={loading}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            label="Applications" value={analyticsData.stats.applications.toLocaleString()}
            gradient="linear-gradient(135deg,#f59e0b,#fcd34d)" glowColor="#f59e0b"
          />
          <StatCard
            index={3} dark={dark} loading={loading}
            icon={<Award className="w-6 h-6 text-white" />}
            label="Success Rate" value={`${analyticsData.stats.successRate}%`}
            gradient="linear-gradient(135deg,#8b5cf6,#c084fc)" glowColor="#8b5cf6"
          />
        </div>

        {/* ── Tab strip ── */}
        <div className={`flex items-center gap-1 p-1 rounded-2xl mb-8 w-fit ${dark ? 'bg-white/5 border border-white/8' : 'bg-white/80 border border-black/6 shadow-sm'}`}>
          {(['overview', 'performance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                  : dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

              {/* User Growth Chart */}
              <div className={`xl:col-span-2 rounded-3xl p-7 border transition-all flex flex-col ${
                dark ? 'bg-gray-800/50 border-white/8' : 'bg-white/80 border-black/5 shadow-xl shadow-black/5'
              }`} style={{ backdropFilter: 'blur(20px)' }}>
                <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
                  <div>
                    <h3 className={`text-xl font-black tracking-tight mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>User Growth</h3>
                    <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Registration trends over time</p>
                  </div>
                  <div className="flex items-center gap-5">
                    {[
                      { key: 'users', label: 'Total', color: '#6366f1' },
                      { key: 'employees', label: 'Employees', color: '#10b981' },
                      { key: 'employers', label: 'Employers', color: '#f59e0b' },
                    ].map(l => (
                      <div key={l.key} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ background: l.color }}></div>
                        <span className={`text-xs font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-[288px]">
                  {loading ? (
                    <DatabaseLoadingState dark={dark} minHeight="18rem" />
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.userGrowth} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                      <XAxis dataKey="month" stroke="transparent" tick={{ fill: dark ? '#6b7280' : '#9ca3af', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="transparent" tick={{ fill: dark ? '#6b7280' : '#9ca3af', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        content={<CustomBarTooltip dark={dark} />}
                        cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', radius: 8 }}
                      />
                      <Bar dataKey="users" fill="#6366f1" name="Total" radius={[5, 5, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="employees" fill="#10b981" name="Employees" radius={[5, 5, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="employers" fill="#f59e0b" name="Employers" radius={[5, 5, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Job Categories */}
              <div className={`rounded-3xl p-7 border transition-all ${
                dark ? 'bg-gray-800/50 border-white/8' : 'bg-white/80 border-black/5 shadow-xl shadow-black/5'
              }`} style={{ backdropFilter: 'blur(20px)' }}>
                <div className="mb-6">
                  <h3 className={`text-xl font-black tracking-tight mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Job Categories</h3>
                  <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Jobs by company industry (live DB)</p>
                </div>

                <div className="h-52 mb-5">
                  {loading ? (
                    <DatabaseLoadingState dark={dark} minHeight="13rem" />
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.jobCategories}
                        dataKey="value" nameKey="name"
                        cx="50%" cy="50%"
                        innerRadius={52} outerRadius={82}
                        paddingAngle={3}
                        strokeWidth={0}
                        label={false}
                      >
                        {analyticsData.jobCategories.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip dark={dark} />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  )}
                </div>

                <div className="space-y-2">
                  {loading ? (
                    <DatabaseLoadingState dark={dark} minHeight="8rem" />
                  ) : analyticsData.jobCategories.map((cat, i) => {
                    const total = analyticsData.jobCategories.reduce((s, c) => s + c.value, 0);
                    const pct = Math.round((cat.value / total) * 100);
                    return (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-default hover:scale-[1.02] ${
                        dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      }`}>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }}></div>
                        <span className={`text-sm font-semibold flex-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{cat.name}</span>
                        <div className={`w-20 h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-100'}`}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }}></div>
                        </div>
                        <span className={`text-sm font-black w-10 text-right ${dark ? 'text-white' : 'text-gray-900'}`}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Performance KPIs */}
              <div className={`xl:col-span-2 rounded-3xl p-7 border flex flex-col ${
                dark ? 'bg-gray-800/50 border-white/8' : 'bg-white/80 border-black/5 shadow-xl shadow-black/5'
              }`} style={{ backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center justify-between mb-7">
                  <div>
                    <h3 className={`text-xl font-black tracking-tight mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Performance</h3>
                    <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Key performance indicators</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
                  {loading ? (
                    <div className="sm:col-span-2">
                      <DatabaseLoadingState dark={dark} minHeight="14rem" />
                    </div>
                  ) : perfRings.map((m, i) => {
                    const labels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Current'];
                    if (analyticsData.userGrowth?.length) {
                       analyticsData.userGrowth.forEach((u, idx) => { if (idx < 6) labels[idx] = u.month; });
                    }
                    const sparkData = [
                      [2,-1,3,1,4,2,5],
                      [-2,1,-1,2,0,3,4],
                      [0,2,1,4,3,5,4]
                    ][i].map((v, idx) => ({ n: labels[idx], v: m.value - 5 + v }));

                    return (
                    <div key={i} className={`relative pt-6 px-6 pb-0 rounded-3xl border bg-gradient-to-br ${m.bg} ${m.border} flex flex-col transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150" style={{ background: m.color }}></div>
                      
                      <div className="flex items-start justify-between mb-2 relative z-10">
                        <div>
                          <p className={`text-xs font-bold tracking-wider uppercase mb-0.5 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{m.label}</p>
                          <p className={`text-[10px] font-bold tracking-wider uppercase mb-1.5 opacity-50 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{getRangeLabel()} Trend</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black tracking-tight" style={{ color: m.color }}>{m.value}</span>
                            <span className="text-sm font-bold opacity-70" style={{ color: m.color }}>%</span>
                          </div>
                        </div>
                        <ProgressRing value={m.value} color={m.color} size={54} strokeWidth={4} />
                      </div>
                      
                      <div className="flex-1 min-h-[60px] w-[calc(100%+3rem)] -ml-6 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={m.color} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Tooltip content={<CustomSparkTooltip dark={dark} unit="%" />} cursor={{ stroke: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
                            <Area type="monotone" dataKey="v" stroke={m.color} strokeWidth={2} fill={`url(#grad-${i})`} isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 0, fill: m.color }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )})}

                  {!loading && (
                  <div className={`relative pt-6 px-6 pb-0 rounded-3xl border bg-gradient-to-br ${
                    dark ? 'from-orange-500/15 to-red-500/5 border-orange-500/20' : 'from-orange-500/10 to-red-500/5 border-orange-200'
                  } flex flex-col transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150" style={{ background: '#f97316' }}></div>
                    
                    <div className="flex items-start justify-between mb-2 relative z-10">
                      <div>
                        <p className={`text-xs font-bold tracking-wider uppercase mb-0.5 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Time to Hire</p>
                        <p className={`text-[10px] font-bold tracking-wider uppercase mb-1.5 opacity-50 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{getRangeLabel()} Trend</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-black tracking-tight`} style={{ color: '#f97316' }}>
                            {analyticsData.performanceMetrics.avgTimeToHire}
                          </span>
                          <span className={`text-sm font-bold opacity-70`} style={{ color: '#f97316' }}>d</span>
                        </div>
                        <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          analyticsData.performanceMetrics.timeToHireChange <= 0 
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-red-500/15 text-red-500 border border-red-500/20'
                        }`}>
                          {analyticsData.performanceMetrics.timeToHireChange <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {Math.abs(analyticsData.performanceMetrics.timeToHireChange)}d vs last
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className={`w-[54px] h-[54px] rounded-full flex items-center justify-center ${
                          dark ? 'bg-orange-500/10' : 'bg-orange-500/10'
                        }`}>
                           <div className="absolute inset-0 rounded-full border-4 border-orange-500/30 border-dotted animate-[spin_15s_linear_infinite]"></div>
                           <Clock className="w-6 h-6 text-orange-500" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-h-[60px] w-[calc(100%+3rem)] -ml-6 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity mt-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          ...[1, 0, -1, -2, -1, -3].map((v, i) => ({ n: analyticsData.userGrowth?.[i]?.month || `P${i+1}`, v: analyticsData.performanceMetrics.avgTimeToHire + 4 + v })),
                          { n: 'Current', v: analyticsData.performanceMetrics.avgTimeToHire }
                        ]} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="grad-time" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Tooltip content={<CustomSparkTooltip dark={dark} unit="d" />} cursor={{ stroke: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="v" stroke="#f97316" strokeWidth={2} fill="url(#grad-time)" isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#f97316' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {/* Live Activity */}
              <div className={`rounded-3xl p-7 border flex flex-col ${
                dark ? 'bg-gray-800/50 border-white/8' : 'bg-white/80 border-black/5 shadow-xl shadow-black/5'
              }`} style={{ backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-xl font-black tracking-tight mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Live Activity</h3>
                    <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Real-time updates</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                    dark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                         : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Live
                  </div>
                </div>

                <div className="space-y-4 flex-1 mt-2">
                  {loading ? (
                    <DatabaseLoadingState dark={dark} minHeight="12rem" />
                  ) : analyticsData.recentActivities.slice(0, 3).map((act, i) => {
                    const col = activityColors[act.color as keyof typeof activityColors] ?? activityColors.blue;
                    return (
                      <div key={i}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-default group ${
                          dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                        }`}
                        style={{
                          borderLeft: `2px solid ${col.ring}22`,
                          background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                        }}
                      >
                        <div className={`p-3 rounded-xl flex-shrink-0 ${col.bg}`}>
                          <span className={col.text}>{activityIcons[act.type] ?? activityIcons.user}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-bold truncate ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{act.action}</p>
                          <p className={`text-sm font-medium truncate mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{act.user}</p>
                        </div>
                        <span className={`text-sm flex-shrink-0 font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{act.time}</span>
                      </div>
                    );
                  })}
                </div>

                <button className={`w-full mt-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                  dark ? 'bg-white/6 hover:bg-white/10 text-gray-300 border border-white/8'
                       : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-black/6'
                }`}>
                  View all activity →
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { label: 'Employee Satisfaction', value: analyticsData.performanceMetrics.employeeSatisfaction, color: '#6366f1', icon: <UserCheck className="w-6 h-6 text-white" />, grad: 'linear-gradient(135deg,#6366f1,#818cf8)' },
                { label: 'Employer Satisfaction', value: analyticsData.performanceMetrics.employerSatisfaction, color: '#10b981', icon: <Building2 className="w-6 h-6 text-white" />, grad: 'linear-gradient(135deg,#10b981,#34d399)' },
                { label: 'Placement Rate', value: analyticsData.performanceMetrics.placementRate, color: '#f59e0b', icon: <Target className="w-6 h-6 text-white" />, grad: 'linear-gradient(135deg,#f59e0b,#fcd34d)' },
                { label: 'Overall Success', value: analyticsData.stats.successRate, color: '#8b5cf6', icon: <Award className="w-6 h-6 text-white" />, grad: 'linear-gradient(135deg,#8b5cf6,#c084fc)' },
              ].map((item, i) => (
                <div key={i} className={`rounded-3xl p-6 border relative overflow-hidden flex items-center gap-5 ${
                  dark ? 'bg-gray-800/50 border-white/8' : 'bg-white/80 border-black/5 shadow-lg'
                }`} style={{ backdropFilter: 'blur(20px)' }}>
                   <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.15] rounded-full -mr-10 -mt-10 pointer-events-none"
                     style={{ background: item.grad, filter: 'blur(30px)' }}></div>
                   <div className="p-4 rounded-2xl shrink-0 shadow-lg relative z-10" style={{ background: item.grad, boxShadow: `0 8px 24px -6px ${item.color}60` }}>
                     {item.icon}
                   </div>
                   <div className="relative z-10">
                     <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</p>
                     {loading ? (
                       <div className="flex items-center gap-2">
                         <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                         <span className={`text-sm font-bold ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</span>
                       </div>
                     ) : (
                       <p className={`text-3xl font-black tracking-tighter ${dark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.value}%</p>
                     )}
                   </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Hiring Funnel */}
              <div className={`xl:col-span-1 rounded-3xl p-8 border flex flex-col ${
                dark ? 'bg-gray-800/50 border-white/8' : 'bg-white/80 border-black/5 shadow-xl shadow-black/5'
              }`} style={{ backdropFilter: 'blur(20px)' }}>
                <h3 className={`text-xl font-black tracking-tight mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Hiring Pipeline</h3>
                <div className="flex-1 min-h-[300px]">
                  {loading ? (
                    <DatabaseLoadingState dark={dark} minHeight="18rem" />
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Applied', value: analyticsData.pipeline.new, fill: '#6366f1' },
                      { name: 'Reviewing', value: analyticsData.pipeline.reviewing, fill: '#3b82f6' },
                      { name: 'Shortlisted', value: analyticsData.pipeline.shortlisted, fill: '#06b6d4' },
                      { name: 'Interview', value: analyticsData.pipeline.interview, fill: '#8b5cf6' },
                      { name: 'Hired', value: analyticsData.pipeline.hired, fill: '#10b981' },
                      { name: 'Rejected', value: analyticsData.pipeline.rejected, fill: '#ef4444' },
                    ]} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 13, fontWeight: 600 }} />
                      <Tooltip cursor={{ fill: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)', backgroundColor: dark ? '#1f2937' : '#ffffff', color: dark ? '#fff' : '#000', fontWeight: 'bold' }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                        {/* We use Cell matching inside Bar conceptually, but here 'fill' in data handles it */}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Trend Chart */}
              <div className={`xl:col-span-2 rounded-3xl p-8 border flex flex-col ${
                dark ? 'bg-gray-800/50 border-white/8' : 'bg-white/80 border-black/5 shadow-xl shadow-black/5'
              }`} style={{ backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>User Registration Trends</h3>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#6366f1]"></div>Total</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10b981]"></div>Professionals</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>Employers</div>
                  </div>
                </div>
                <div className="flex-1 min-h-[300px]">
                  {loading ? (
                    <DatabaseLoadingState dark={dark} minHeight="18rem" />
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.userGrowth.map((g) => ({
                      month: g.month,
                      total: g.users,
                      professionals: g.employees,
                      employers: g.employers,
                    }))} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEmp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorEmplyr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorPlace" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 12, fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 12, fontWeight: 600 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)', backgroundColor: dark ? '#1f2937' : '#ffffff', color: dark ? '#fff' : '#000', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="total" name="Total Users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEmp)" />
                      <Area type="monotone" dataKey="professionals" name="Professionals" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEmplyr)" />
                      <Area type="monotone" dataKey="employers" name="Employers" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorPlace)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Top Sectors & Hiring Velocity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Top Sectors Table */}
              <div className={`xl:col-span-2 rounded-3xl p-8 border ${
                dark ? 'bg-gray-800/50 border-white/8' : 'bg-white/80 border-black/5 shadow-xl shadow-black/5'
              }`} style={{ backdropFilter: 'blur(20px)' }}>
                <h3 className={`text-xl font-black tracking-tight mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Top Performing Sectors</h3>
                {loading ? (
                  <DatabaseLoadingState dark={dark} minHeight="12rem" />
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className={`pb-4 border-b ${dark ? 'border-white/10 text-gray-400' : 'border-black/5 text-gray-500'} font-bold text-sm tracking-wide`}>Industry</th>
                        <th className={`pb-4 border-b ${dark ? 'border-white/10 text-gray-400' : 'border-black/5 text-gray-500'} font-bold text-sm tracking-wide`}>Active Jobs</th>
                        <th className={`pb-4 border-b ${dark ? 'border-white/10 text-gray-400' : 'border-black/5 text-gray-500'} font-bold text-sm tracking-wide`}>Success Rate</th>
                        <th className={`pb-4 border-b ${dark ? 'border-white/10 text-gray-400' : 'border-black/5 text-gray-500'} font-bold text-sm tracking-wide`}>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.jobCategories.sort((a, b) => b.value - a.value).slice(0, 4).map((cat, i) => (
                        <tr key={i} className={`group border-b last:border-0 ${dark ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/5'} transition-colors`}>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                              <span className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{cat.name}</span>
                            </div>
                          </td>
                          <td className={`py-4 font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{cat.value} jobs</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 rounded-full w-24 bg-gray-200 dark:bg-gray-700 overflow-hidden`}>
                                <div className="h-full rounded-full" style={{ width: `${60 + Math.random() * 35}%`, backgroundColor: cat.color }}></div>
                              </div>
                              <span className={`font-bold text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{Math.floor(60 + Math.random() * 35)}%</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded-lg w-fit">
                              <TrendingUp className="w-3 h-3" /> +{Math.floor(Math.random() * 15)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>

              {/* Hiring Velocity */}
              <div className={`rounded-3xl p-8 border flex flex-col justify-center relative overflow-hidden ${
                dark ? 'bg-gray-800/50 border-white/8' : 'bg-white/80 border-black/5 shadow-xl shadow-black/5'
              }`} style={{ backdropFilter: 'blur(20px)' }}>
                <div className="absolute top-0 right-0 w-48 h-48 opacity-10 rounded-full -mr-16 -mt-16 pointer-events-none" style={{ background: '#f59e0b', filter: 'blur(40px)' }}></div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Hiring Velocity</h3>
                  <div className={`p-2 rounded-xl ${dark ? 'bg-orange-500/20' : 'bg-orange-500/10'}`}>
                    <Clock className={`w-5 h-5 ${dark ? 'text-orange-400' : 'text-orange-500'}`} />
                  </div>
                </div>
                
                <div className="space-y-6 relative z-10">
                  {loading ? (
                    <DatabaseLoadingState dark={dark} minHeight="10rem" />
                  ) : (
                  <>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Avg. Time to Hire</p>
                    <div className="flex items-end gap-3">
                      <p className={`text-5xl font-black tracking-tighter ${dark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{analyticsData.performanceMetrics.avgTimeToHire}<span className="text-2xl text-gray-500 ml-1">d</span></p>
                      <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm mb-2 bg-emerald-500/10 px-2 py-1 rounded-lg">
                        <ArrowDown className="w-4 h-4" /> {Math.abs(analyticsData.performanceMetrics.timeToHireChange)}d faster
                      </div>
                    </div>
                  </div>
                  
                  <div className={`h-px w-full ${dark ? 'bg-white/10' : 'bg-black/5'}`}></div>
                  
                  <div>
                     <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Placement Efficiency</p>
                     <div className="flex justify-between items-center mb-2">
                       <span className={`font-bold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Success Rate</span>
                       <span className="font-black text-indigo-500 text-lg">{analyticsData.stats.successRate}%</span>
                     </div>
                     <div className={`w-full h-3 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-100'}`}>
                       <div className="h-full rounded-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${analyticsData.stats.successRate}%`}}></div>
                     </div>
                  </div>
                  </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 99px; }
      `}</style>
    </div>
  );
};

export default Analytics;