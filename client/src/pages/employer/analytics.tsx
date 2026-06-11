import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Download,
  Target,
  Clock,
  Layers,
  Star,
  ArrowLeft,
  TrendingDown,
  MapPin,
  UserCheck,
  Briefcase,
  FileText,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { employerPageTitleClass } from '@/lib/employer-page-styles';
import {
  exportEmployerAnalyticsCsv,
  exportEmployerAnalyticsPdf,
  fetchEmployerAnalytics,
  type EmployerAnalyticsData,
  type EmployerAnalyticsRange,
  type MonthTrend,
} from '@/lib/employer-analytics';

const JOB_TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

function panelClass(isDark: boolean, compact = false) {
  return cn(
    'relative overflow-hidden backdrop-blur-xl transition-all duration-500',
    compact ? 'rounded-2xl p-5 sm:p-6' : 'rounded-3xl p-6 sm:p-8',
    isDark
      ? 'bg-gradient-to-br from-slate-800/75 via-slate-900/85 to-slate-950/90 border border-white/[0.07] shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
      : 'bg-white/90 border border-slate-200/70 shadow-xl shadow-slate-300/25',
  );
}

/** Chart row panels — compact padding so cards don’t feel hollow */
function chartPanelClass(isDark: boolean) {
  return cn(
    'relative overflow-hidden backdrop-blur-xl transition-all duration-500',
    'rounded-2xl p-4 sm:p-5',
    isDark
      ? 'border border-white/[0.07] bg-gradient-to-br from-slate-800/75 via-slate-900/85 to-slate-950/90 shadow-md shadow-black/25'
      : 'border border-slate-200/70 bg-white/90 shadow-md shadow-slate-200/60',
  );
}

function PanelShine({ isDark }: { isDark: boolean }) {
  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px',
          isDark ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-300/80 to-transparent',
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-40',
          isDark ? 'bg-violet-500/25' : 'bg-violet-400/20',
        )}
      />
    </>
  );
}

function InsightBar({
  label,
  value,
  max,
  suffix,
  accent,
  isDark,
  rank,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  accent: string;
  isDark: boolean;
  rank?: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="group space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {rank != null && (
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                isDark ? 'bg-white/5 text-slate-300 ring-1 ring-white/10' : 'bg-slate-100 text-slate-600',
              )}
            >
              {rank}
            </span>
          )}
          <span className={cn('truncate text-base font-semibold', isDark ? 'text-slate-200' : 'text-slate-800')}>
            {label}
          </span>
        </div>
        <span className={cn('shrink-0 text-base font-black tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>
          {value.toLocaleString()}
          {suffix ? <span className={cn('ml-1 text-sm font-semibold', isDark ? 'text-slate-500' : 'text-slate-500')}>{suffix}</span> : null}
        </span>
      </div>
      <div className={cn('h-2.5 overflow-hidden rounded-full', isDark ? 'bg-white/5' : 'bg-slate-100')}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-100 opacity-90"
          style={{
            width: `${Math.max(pct, value > 0 ? 6 : 0)}%`,
            background: `linear-gradient(90deg, ${accent}dd, ${accent})`,
            boxShadow: value > 0 ? `0 0 12px ${accent}55` : undefined,
          }}
        />
      </div>
    </div>
  );
}

function AnalyticsSkeleton({ isDark, embedded }: { isDark: boolean; embedded: boolean }) {
  const bone = isDark ? 'bg-white/5' : 'bg-slate-200/80';
  return (
    <div className={cn('animate-pulse space-y-6', embedded ? 'py-2' : 'py-8')}>
      <div className={cn('h-10 w-64 rounded-2xl', bone)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn('h-28 rounded-2xl', bone)} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={cn('h-80 rounded-3xl', bone)} />
        <div className={cn('h-80 rounded-3xl', bone)} />
      </div>
    </div>
  );
}

function TalentInsightsPanel({
  data,
  isDark,
  embedded = false,
}: {
  data: EmployerAnalyticsData;
  isDark: boolean;
  embedded?: boolean;
}) {
  const maxLoc = Math.max(...data.topLocations.map((l) => l.count), 1);
  const maxType = Math.max(...data.jobTypes.map((j) => j.count), 1);
  const totalRoles = data.jobTypes.reduce((s, j) => s + j.count, 0);
  const locationAccent = ['#38bdf8', '#818cf8', '#a78bfa', '#34d399', '#f472b6'];

  const locationLimit = embedded ? 4 : 6;

  return (
    <div className={cn(panelClass(isDark, embedded), 'flex h-full flex-col', embedded ? 'min-h-0' : 'min-h-[360px]')}>
      <PanelShine isDark={isDark} />
      <div className="relative z-10 mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className={cn('font-bold', embedded ? 'text-lg' : 'text-xl sm:text-2xl', isDark ? 'text-white' : 'text-gray-900')}>
            Talent Insights
          </h3>
          <p className={cn('mt-0.5 font-medium', embedded ? 'text-sm' : 'text-base', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Where applicants apply from
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-sky-500/25 to-indigo-500/20 p-3 ring-1 ring-sky-400/20">
          <MapPin className={cn('h-6 w-6', isDark ? 'text-sky-300' : 'text-sky-600')} />
        </div>
      </div>

      {data.jobTypes.length > 0 && (
        <div className="relative z-10 mb-6">
          <p className={cn('mb-2.5 text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Role mix
          </p>
          <div className="flex h-3.5 overflow-hidden rounded-full ring-1 ring-white/10">
            {data.jobTypes.map((jt, i) => {
              const pct = totalRoles > 0 ? (jt.count / totalRoles) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={jt.type}
                  title={`${jt.type}: ${jt.count}`}
                  className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: JOB_TYPE_COLORS[i % JOB_TYPE_COLORS.length],
                  }}
                />
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.jobTypes.slice(0, embedded ? 4 : undefined).map((jt, i) => (
              <span
                key={jt.type}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm',
                  isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600',
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: JOB_TYPE_COLORS[i % JOB_TYPE_COLORS.length] }}
                />
                {jt.type} · {jt.count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1">
        <h4 className={cn('mb-4 flex items-center text-sm font-bold uppercase tracking-wide sm:text-base', isDark ? 'text-slate-300' : 'text-slate-700')}>
          <MapPin className="mr-2 h-4 w-4 text-sky-400" />
          Top Locations
        </h4>
        {data.topLocations.length === 0 ? (
          <p className={cn('text-sm sm:text-base', isDark ? 'text-gray-500' : 'text-gray-600')}>No location data yet.</p>
        ) : (
          <div className="space-y-4">
            {data.topLocations.slice(0, locationLimit).map((loc, index) => (
              <InsightBar
                key={loc.location}
                label={loc.location}
                value={loc.count}
                max={maxLoc}
                rank={index + 1}
                accent={locationAccent[index % locationAccent.length]}
                isDark={isDark}
              />
            ))}
          </div>
        )}
        {!embedded && data.jobTypes.length > 0 && (
          <div className="mt-8 border-t border-white/10 pt-6 dark:border-white/10">
            <h4 className={cn('mb-4 flex items-center text-sm font-bold uppercase tracking-wide sm:text-base', isDark ? 'text-slate-300' : 'text-slate-700')}>
              <Briefcase className="mr-2 h-4 w-4 text-violet-400" />
              Open roles by type
            </h4>
            <div className="space-y-4">
              {data.jobTypes.map((jt, index) => (
                <InsightBar
                  key={jt.type}
                  label={jt.type}
                  value={jt.count}
                  max={maxType}
                  accent={JOB_TYPE_COLORS[index % JOB_TYPE_COLORS.length]}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function sumActivityTrend(activityTrend: EmployerAnalyticsData['activityTrend']) {
  return activityTrend.reduce(
    (acc, row) => ({
      applications: acc.applications + row.applications,
      hires: acc.hires + row.hires,
      interviews: acc.interviews + row.interviews,
    }),
    { applications: 0, hires: 0, interviews: 0 },
  );
}

function ActivityMixDonut({
  activityTrend,
  isDark,
}: {
  activityTrend: EmployerAnalyticsData['activityTrend'];
  isDark: boolean;
}) {
  const totals = sumActivityTrend(activityTrend);
  const pieData = ACTIVITY_MIX.map((item) => ({
    name: item.label,
    value: totals[item.key],
    fill: isDark ? item.colorDark : item.color,
  }));
  const grandTotal = pieData.reduce((sum, d) => sum + d.value, 0);
  const isEmpty = grandTotal === 0;
  const chartData = isEmpty
    ? [{ name: 'No activity', value: 1, fill: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.25)' }]
    : pieData.filter((d) => d.value > 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {!isEmpty && (
        <div
          className={cn(
            'flex h-2.5 shrink-0 overflow-hidden rounded-full',
            isDark ? 'bg-white/[0.06] ring-1 ring-white/[0.08]' : 'bg-slate-100 ring-1 ring-slate-200',
          )}
        >
          {chartData.map((slice) => (
            <div
              key={slice.name}
              className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(slice.value / grandTotal) * 100}%`,
                backgroundColor: slice.fill,
              }}
              title={`${slice.name}: ${slice.value}`}
            />
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-row items-stretch gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <div className="relative h-full max-h-full aspect-square w-auto max-w-full min-h-[9.5rem]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                  labelStyle={{ color: isDark ? '#94a3b8' : '#64748b' }}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="56%"
                  outerRadius="92%"
                  paddingAngle={isEmpty ? 0 : 2}
                  dataKey="value"
                  stroke={isDark ? '#0f172a' : '#ffffff'}
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-500' : 'text-slate-500',
                )}
              >
                {isEmpty ? 'No data' : 'Total'}
              </p>
              <p className={cn('text-2xl font-black tabular-nums sm:text-[1.75rem]', isDark ? 'text-white' : 'text-slate-900')}>
                {isEmpty ? '—' : grandTotal.toLocaleString()}
              </p>
              {!isEmpty && (
                <p className={cn('text-[10px] font-medium', isDark ? 'text-slate-500' : 'text-slate-500')}>events</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex h-full min-w-[10.5rem] flex-1 flex-col justify-between gap-1 sm:max-w-[13.5rem]">
          {ACTIVITY_MIX.map((item) => {
            const value = totals[item.key];
            const pct = grandTotal > 0 ? Math.round((value / grandTotal) * 1000) / 10 : 0;
            const fill = isDark ? item.colorDark : item.color;
            return (
              <div
                key={item.key}
                className={cn(
                  'flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 sm:px-3',
                  isDark ? 'bg-white/[0.03] ring-1 ring-white/[0.05]' : 'bg-white/80 ring-1 ring-slate-100',
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/20"
                  style={{ backgroundColor: fill }}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-xs font-semibold sm:text-sm', isDark ? 'text-slate-200' : 'text-slate-800')}>
                    {item.label}
                  </p>
                  <div className={cn('mt-1 h-1 overflow-hidden rounded-full', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${grandTotal > 0 ? Math.max(pct, value > 0 ? 6 : 0) : 0}%`,
                        backgroundColor: fill,
                      }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right tabular-nums leading-tight">
                  <p className={cn('text-sm font-bold sm:text-base', isDark ? 'text-white' : 'text-slate-900')}>
                    {value.toLocaleString()}
                  </p>
                  <p className={cn('text-[10px] font-medium sm:text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                    {grandTotal > 0 ? `${pct}%` : '—'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isEmpty && (
        <p className={cn('shrink-0 text-center text-xs font-medium', isDark ? 'text-slate-500' : 'text-slate-500')}>
          Activity will appear here once candidates apply or move through hiring.
        </p>
      )}
    </div>
  );
}

function PipelineFlowChart({
  pipeline,
  total,
  isDark,
}: {
  pipeline: { stage: string; count: number; percentage: number; color: string }[];
  total: number;
  isDark: boolean;
}) {
  const maxCount = Math.max(...pipeline.map((s) => s.count), 1);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div
        className={cn(
          'flex h-3 shrink-0 overflow-hidden rounded-full',
          isDark ? 'bg-white/[0.06] ring-1 ring-white/[0.08]' : 'bg-slate-100 ring-1 ring-slate-200',
        )}
      >
        {total === 0
          ? pipeline.map((stage) => (
              <div
                key={stage.stage}
                className="flex-1 opacity-25"
                style={{ backgroundColor: stage.color }}
                title={stage.stage}
              />
            ))
          : pipeline.map((stage) =>
              stage.percentage > 0 ? (
                <div
                  key={stage.stage}
                  className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${stage.percentage}%`, backgroundColor: stage.color }}
                  title={`${stage.stage}: ${stage.count}`}
                />
              ) : null,
            )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5">
        {pipeline.map((stage) => {
          const barPct = Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0);
          return (
            <div
              key={stage.stage}
              className={cn(
                'flex flex-1 flex-col justify-center rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5',
                isDark ? 'bg-white/[0.03] ring-1 ring-white/[0.06]' : 'bg-white/80 ring-1 ring-slate-100',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className={cn('truncate text-sm font-semibold sm:text-base', isDark ? 'text-slate-200' : 'text-slate-800')}>
                    {stage.stage}
                  </span>
                </div>
                <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
                  <span className={cn('text-lg font-bold sm:text-xl', isDark ? 'text-white' : 'text-slate-900')}>
                    {stage.count}
                  </span>
                  <span className={cn('text-sm font-medium', isDark ? 'text-slate-500' : 'text-slate-500')}>
                    {total > 0 ? `${stage.percentage}%` : '—'}
                  </span>
                </div>
              </div>
              <div className={cn('mt-1.5 h-1.5 overflow-hidden rounded-full', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: stage.color,
                    opacity: stage.count > 0 ? 1 : 0.25,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AnalyticsProps {
  embedded?: boolean;
}

const ACTIVITY_MIX = [
  { key: 'applications' as const, label: 'Applications', color: '#6366f1', colorDark: '#818cf8' },
  { key: 'hires' as const, label: 'Hires', color: '#059669', colorDark: '#34d399' },
  { key: 'interviews' as const, label: 'Interviews', color: '#ea580c', colorDark: '#fb923c' },
];

function trendDisplay(trend: MonthTrend | null): { change: number; direction: 'up' | 'down' | 'flat' } {
  if (!trend) return { change: 0, direction: 'flat' };
  return {
    change: Math.abs(trend.changePercent),
    direction: trend.trend === 'flat' ? 'flat' : trend.trend,
  };
}

export default function Analytics({ embedded = false }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<EmployerAnalyticsRange>('1y');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark =
    typeof window !== 'undefined' &&
    (theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['employer-analytics', timeRange],
    queryFn: () => fetchEmployerAnalytics(timeRange),
    staleTime: 60_000,
  });

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const compact = embedded;

  const StatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    subtitle,
    gradient,
    invertTrend = false,
  }: {
    title: string;
    value: string | number;
    trend: MonthTrend | null;
    icon: typeof Users;
    subtitle?: string;
    gradient: string;
    invertTrend?: boolean;
  }) => {
    const t = trendDisplay(trend);
    const showUp = invertTrend ? t.direction === 'down' : t.direction === 'up';
    const showDown = invertTrend ? t.direction === 'up' : t.direction === 'down';

    return (
      <div
        className={cn(
          'group relative flex min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-2xl p-5 sm:min-h-[9rem] sm:p-6',
          'transition-all duration-300 hover:shadow-lg',
          isDark
            ? 'border border-white/[0.08] bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-slate-950 shadow-md shadow-black/20'
            : 'border border-slate-200/90 bg-white shadow-md shadow-slate-200/50',
          'backdrop-blur-xl',
        )}
      >
        <PanelShine isDark={isDark} />
        <div
          className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br ${gradient}`}
        />
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm',
              isDark
                ? 'bg-gradient-to-br from-blue-500/20 to-violet-500/15 ring-1 ring-white/10'
                : 'bg-gradient-to-br from-blue-50 to-violet-50 ring-1 ring-slate-200/80',
            )}
          >
            <Icon className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-600')} />
          </div>
          {t.direction !== 'flat' && trend && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ring-1 sm:text-sm',
                showUp
                  ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300'
                  : showDown
                    ? 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300'
                    : 'bg-gray-500/10 text-gray-600 ring-gray-500/20',
              )}
            >
              {showUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {t.change}%
            </span>
          )}
        </div>
        <div className="relative z-10 mt-3">
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-[0.12em] sm:text-sm',
              isDark ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'mt-1.5 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl',
              isDark ? 'text-white' : 'text-slate-900',
            )}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && !compact && (
            <p
              className={cn(
                'mt-2 line-clamp-1 text-sm leading-snug',
                isDark ? 'text-slate-500' : 'text-slate-500',
              )}
              title={subtitle}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  };

  const ActivityChart = ({ analyticsData }: { analyticsData: EmployerAnalyticsData }) => (
    <div className={cn(chartPanelClass(isDark), 'flex h-full min-h-0 flex-col !p-3 sm:!p-4')}>
      <PanelShine isDark={isDark} />
      <div className="relative z-10 mb-2 flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={cn('text-base font-bold leading-tight sm:text-lg', isDark ? 'text-white' : 'text-gray-900')}>
            Hiring Activity
          </h3>
          <p className={cn('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {analyticsData.rangeLabel}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <ActivityMixDonut activityTrend={analyticsData.activityTrend} isDark={isDark} />
      </div>
    </div>
  );

  const PipelineChart = ({ analyticsData }: { analyticsData: EmployerAnalyticsData }) => (
    <div className={cn(chartPanelClass(isDark), 'flex h-full min-h-0 flex-col !p-3 sm:!p-4')}>
      <PanelShine isDark={isDark} />
      <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className={cn('text-base font-bold sm:text-lg', isDark ? 'text-white' : 'text-gray-900')}>
            Recruitment Pipeline
          </h3>
          <p className={cn('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Live application status
          </p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2.5">
          <Layers className={cn('h-5 w-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PipelineFlowChart
          pipeline={analyticsData.pipeline}
          total={analyticsData.overview.totalApplications}
          isDark={isDark}
        />
      </div>
    </div>
  );

  const TopJobsList = ({ analyticsData }: { analyticsData: EmployerAnalyticsData }) => {
    const jobLimit = compact ? 4 : 5;
    const jobs = analyticsData.topJobs.slice(0, jobLimit);
    const maxApplicants = Math.max(...jobs.map((j) => j.applicants), 1);
    const totalApplicants = jobs.reduce((s, j) => s + j.applicants, 0);

    return (
      <div className={cn(panelClass(isDark, compact), 'flex h-full flex-col', compact ? 'min-h-0' : 'min-h-[360px]')}>
        <PanelShine isDark={isDark} />
        <div className="relative z-10 mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className={cn('font-bold', compact ? 'text-lg' : 'text-xl sm:text-2xl', isDark ? 'text-white' : 'text-gray-900')}>
              Top Roles
            </h3>
            <p className={cn('mt-0.5 font-medium', compact ? 'text-sm' : 'text-base', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {jobs.length > 0
                ? `${totalApplicants.toLocaleString()} applicants across top ${jobs.length}`
                : 'Most applicants by posting'}
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-500/20 p-3 ring-1 ring-amber-400/20">
            <Star className={`w-6 h-6 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
          </div>
        </div>

        {jobs.length === 0 ? (
          <p className={cn('relative z-10 text-sm sm:text-base', isDark ? 'text-gray-500' : 'text-gray-600')}>No job postings yet.</p>
        ) : (
          <>
            <div className={cn('relative z-10 flex flex-col', compact ? 'space-y-3' : 'space-y-3.5')}>
              {jobs.map((job, index) => {
                const share = Math.round((job.applicants / maxApplicants) * 100);
                const rankStyles =
                  index === 0
                    ? 'from-amber-400 to-orange-500 shadow-amber-500/30'
                    : index === 1
                      ? 'from-slate-400 to-slate-500 shadow-slate-500/20'
                      : index === 2
                        ? 'from-violet-500 to-purple-600 shadow-violet-500/25'
                        : 'from-blue-500 to-indigo-600 shadow-blue-500/20';
                const barColor =
                  index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#8b5cf6' : '#3b82f6';
                return (
                  <div
                    key={job.id}
                    className={cn(
                      'group rounded-xl transition-all duration-300',
                      'p-3.5 sm:p-4',
                      isDark
                        ? 'bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.06]'
                        : 'bg-slate-50/90 hover:bg-white ring-1 ring-slate-100',
                    )}
                  >
                    <div className="mb-2.5 flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-black text-white shadow-md sm:h-10 sm:w-10',
                          rankStyles,
                        )}
                      >
                        #{index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={cn('truncate text-base font-bold sm:text-lg', isDark ? 'text-white' : 'text-slate-900')}>
                          {job.title}
                        </h4>
                        {!compact && (
                          <p className={cn('truncate text-sm font-medium', isDark ? 'text-slate-500' : 'text-slate-500')}>
                            {job.department} · {job.location}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn('text-lg font-bold tabular-nums sm:text-xl', isDark ? 'text-white' : 'text-slate-900')}>
                          {job.applicants}
                        </p>
                        <p className={cn('text-xs font-semibold uppercase tracking-wide sm:text-sm', isDark ? 'text-slate-500' : 'text-slate-500')}>
                          applicants
                        </p>
                      </div>
                    </div>
                    <div className={cn('h-2 overflow-hidden rounded-full', isDark ? 'bg-white/5' : 'bg-slate-200/80')}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(share, job.applicants > 0 ? 8 : 0)}%`,
                          background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                          boxShadow: `0 0 14px ${barColor}44`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const handleExportCsv = () => {
    if (!data) return;
    exportEmployerAnalyticsCsv(data);
    setExportOpen(false);
  };

  const handleExportPdf = () => {
    if (!data) return;
    exportEmployerAnalyticsPdf(data);
    setExportOpen(false);
  };

  return (
    <div
      className={cn(
        embedded ? 'relative min-h-full' : 'min-h-screen',
        'transition-colors duration-700',
        !embedded &&
          (isDark
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black'
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-purple-50'),
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute -left-10 top-0 h-56 w-56 rounded-full blur-3xl',
            isDark ? 'bg-blue-500/12' : 'bg-blue-400/15',
            !embedded && 'animate-pulse',
          )}
        />
        <div
          className={cn(
            'absolute right-0 top-1/4 h-64 w-64 rounded-full blur-3xl',
            isDark ? 'bg-violet-500/10' : 'bg-violet-400/12',
          )}
          style={embedded ? undefined : { animationDelay: '2s' }}
        />
        <div
          className={cn(
            'absolute bottom-0 left-1/3 h-48 w-48 rounded-full blur-3xl',
            isDark ? 'bg-emerald-500/8' : 'bg-emerald-400/10',
          )}
        />
      </div>

      <div
        className={cn(
          'relative',
          embedded ? 'w-full px-2 py-4 sm:px-3' : 'container mx-auto max-w-7xl p-8',
        )}
      >
        <div className={cn('flex flex-wrap items-end justify-between gap-4', embedded ? 'mb-6' : 'mb-8')}>
          <div className="min-w-0">
            <h1 className={employerPageTitleClass(isDark)}>
              {embedded ? 'Analytics' : 'Analytics Hub'}
            </h1>
            <p className={cn('mt-1 font-medium', embedded ? 'text-base' : 'text-lg', isDark ? 'text-slate-400' : 'text-slate-600')}>
              {data?.companyName
                ? `${data.companyName} — recruiting performance`
                : 'Recruiting insights from your live data'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!embedded && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`rounded-xl p-2 transition-all duration-300 ${
                  isDark
                    ? 'bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:bg-gray-700/60'
                    : 'bg-white/80 border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as EmployerAnalyticsRange)}
              className={cn(
                'min-h-11 min-w-[10.5rem] rounded-xl border px-4 py-2.5 text-base font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all',
                isDark
                  ? 'border-gray-700/50 bg-gray-800/60 text-white'
                  : 'border-gray-200 bg-white text-gray-900 shadow-sm',
              )}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <div className="relative" ref={exportRef}>
              <button
                type="button"
                disabled={!data || isLoading}
                onClick={() => setExportOpen((o) => !o)}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold text-white transition-all disabled:opacity-50',
                  isDark
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/20'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-md',
                )}
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {exportOpen && data && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl border z-50 overflow-hidden ${
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-left hover:bg-blue-500/10 ${
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    CSV (Excel)
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-left hover:bg-blue-500/10 ${
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    PDF summary
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading && <AnalyticsSkeleton isDark={isDark} embedded={embedded} />}

        {isError && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">Could not load analytics.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {data && !isLoading && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                title="Applications"
                value={data.overview.periodApplications}
                trend={data.trends.applications}
                icon={Users}
                subtitle={`${data.overview.totalApplications} all time · ${data.rangeLabel}`}
                gradient="from-emerald-500/10 to-cyan-500/10"
              />
              <StatCard
                title="Hires"
                value={data.overview.hires}
                trend={data.trends.hires}
                icon={UserCheck}
                subtitle={`${data.overview.hiresInPeriod} hired in period`}
                gradient="from-blue-500/10 to-purple-500/10"
              />
              <StatCard
                title="Hire Rate"
                value={`${data.overview.hireRate}%`}
                trend={data.trends.hireRate}
                icon={TrendingUp}
                subtitle="Hires ÷ total applications"
                gradient="from-amber-500/10 to-orange-500/10"
              />
              <StatCard
                title="Avg Time to Fill"
                value={`${data.overview.avgTimeToFill}d`}
                trend={null}
                icon={Clock}
                subtitle="Post to hire (days)"
                gradient="from-violet-500/10 to-fuchsia-500/10"
                invertTrend
              />
              <StatCard
                title="Active Roles"
                value={data.overview.activeJobs}
                trend={data.trends.activeJobs}
                icon={Target}
                subtitle={`${data.overview.applicationsThisWeek} apps this week`}
                gradient="from-sky-500/10 to-blue-500/10"
              />
            </div>

            <div className={cn('mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-stretch [&>*]:min-h-0')}>
              <ActivityChart analyticsData={data} />
              <PipelineChart analyticsData={data} />
            </div>

            <div className={cn('grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2')}>
              <TopJobsList analyticsData={data} />

              <TalentInsightsPanel data={data} isDark={isDark} embedded={embedded} />
            </div>

            {!embedded && (
              <div
                className={cn(
                  'mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm',
                  isDark
                    ? 'bg-white/[0.03] text-slate-500 ring-1 ring-white/[0.06]'
                    : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
                )}
              >
                <p className="flex items-center gap-2 font-medium">
                  <Sparkles className={cn('h-4 w-4', isDark ? 'text-violet-400' : 'text-violet-600')} />
                  Report generated {new Date(data.generatedAt).toLocaleString()}
                </p>
                <p className="text-sm font-medium opacity-80">Export CSV or PDF for leadership reviews</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
