import React, { useState, useEffect } from 'react';
import { useSavedJobs } from '../../contexts/SavedJobsContext';
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  Search, MapPin, Briefcase, Heart, TrendingUp,
  ChevronDown, Star, ArrowRight, Crown, X, SlidersHorizontal, PanelLeftClose
} from 'lucide-react';
import { scrollPageToTop } from "@/lib/scroll-to-top";

interface ApiJobResponse {
  id: number;
  title: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  skills: string[];
  createdAt: string;
  company?: {
    id?: string;
    name: string;
  };
  companyId?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  location: string;
  type: string;
  salary: string;
  postedTime: string;
  applicants: number;
  matchPercentage: number;
  skills: string[];
  isNew: boolean;
  isFeatured?: boolean;
  isRemote?: boolean;
}



import { QuickApplyModal } from '../../components/quick-apply-modal';
import { CompanyProfileModal } from '@/components/company-profile-modal';

interface BrowseJobsProps {
  embedded?: boolean;
}

const BrowseJobs: React.FC<BrowseJobsProps> = ({ embedded = false }) => {
  const { theme } = useTheme();
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [salaryRange, setSalaryRange] = useState([150, 300]); // Adjusted for k range
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState('');
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobCount, setTotalJobCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { savedJobs, addJob, removeJob, isJobSaved } = useSavedJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [companyProfileId, setCompanyProfileId] = useState<string | null>(null);
  const [companyProfileName, setCompanyProfileName] = useState('');

  const toggleSaveJob = (job: Job) => {
    if (isJobSaved(job.id)) {
      removeJob(job.id);
    } else {
      addJob(job);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

useEffect(() => {
  setCurrentPage(1);
}, [selectedType, searchQuery, selectedSkills]);

useEffect(() => {
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        itemsPerPage: itemsPerPage.toString(),
        jobType: selectedType !== 'all' ? selectedType : '',
        search: searchQuery.trim(),
      });
      selectedSkills.forEach((skill) => queryParams.append('skills', skill));
      
      const response = await fetch(`/api/jobs?${queryParams}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received jobs data:', data); // Log the received data
      if (!data || !data.jobs) {
        throw new Error('Invalid jobs data received from server');
      }
      // Set the total count from the API response
      setTotalJobCount(data.totalCount || 0);
      
      setJobs(data.jobs.map((job: ApiJobResponse) => ({
        id: String(job.id),
        title: job.title,
        company: job.company?.name || 'Unknown Company',
        companyId: job.company?.id ? String(job.company.id) : job.companyId ? String(job.companyId) : undefined,
        location: job.location || 'Remote',
        type: job.jobType,
        salary: job.salaryMin && job.salaryMax ? `$${job.salaryMin/1000}k - $${job.salaryMax/1000}k` : 'Competitive',
        postedTime: new Date(job.createdAt).toLocaleDateString(),
        applicants: 0, // You can add this to the API response if needed
        matchPercentage: 85, // This should be calculated on the server
        skills: Array.isArray(job.skills) ? job.skills : [],
        isNew: new Date(job.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isFeatured: false, // You can add this to the API response if needed
        isRemote: job.jobType?.toLowerCase() === 'remote'
      })));
    } catch (err) {
      console.error('Error fetching jobs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch jobs';
      setJobs([]);
      setTotalJobCount(0);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  fetchJobs();
}, [currentPage, itemsPerPage, selectedType, searchQuery, selectedSkills]);

  const allSkills = Array.from(new Set(jobs.flatMap(job => job.skills)));
  const normalizedSkillQuery = skillQuery.trim().toLowerCase();
  const filteredSkills = allSkills
    .filter((skill) => (normalizedSkillQuery ? skill.toLowerCase().includes(normalizedSkillQuery) : true))
    .sort((a, b) => a.localeCompare(b));
  const visibleSkills = showAllSkills ? filteredSkills : filteredSkills.slice(0, 10);
  const totalPages = totalJobCount > 0 ? Math.ceil(totalJobCount / itemsPerPage) : 0;
  const showPagination = !error && totalJobCount > 0 && jobs.length > 0;
  const isInitialLoad = loading && jobs.length === 0;
  const isRefreshing = loading && jobs.length > 0;
  const pageWindowStart = Math.max(1, currentPage - 2);
  const pageWindowEnd = Math.min(totalPages, pageWindowStart + 4);
  const dynamicWindowStart = Math.max(1, pageWindowEnd - 4);
  const visiblePages = Array.from(
    { length: Math.max(0, pageWindowEnd - dynamicWindowStart + 1) },
    (_, idx) => dynamicWindowStart + idx
  );
  const activeFilterCount =
    (selectedType !== 'all' ? 1 : 0) +
    selectedSkills.length +
    (salaryRange[0] !== 150 || salaryRange[1] !== 300 ? 1 : 0);
  const averageMatch = jobs.length
    ? Math.round(jobs.reduce((sum, job) => sum + job.matchPercentage, 0) / jobs.length)
    : 0;
  const clearFilters = () => {
    setCurrentPage(1);
    setSelectedType('all');
    setSalaryRange([150, 300]);
    setSelectedSkills([]);
    setSkillQuery('');
    setSearchQuery('');
  };

  const shellPadding = embedded ? 'px-0' : 'px-4 sm:px-6';
  const shellWidth = embedded ? 'w-full' : 'max-w-[1600px] mx-auto';
  const filterStickyTop = embedded ? 'lg:top-2' : 'lg:top-24';

  const surfaceCard = darkMode
    ? 'bg-slate-900/50 border-white/10 backdrop-blur-md shadow-lg shadow-black/20'
    : 'bg-white border-slate-200 shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow';

  return (
    <div
      className={cn(
        'relative transition-colors duration-300',
        embedded ? 'min-h-[calc(100vh-5.5rem)] w-full' : 'min-h-screen',
        !embedded && (darkMode ? 'bg-[#070b14]' : 'bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/40')
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
        {darkMode ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(1100px_460px_at_18%_-12%,rgba(56,189,248,0.1),transparent_58%),radial-gradient(900px_420px_at_88%_-8%,rgba(99,102,241,0.12),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(900px_360px_at_55%_120%,rgba(124,58,237,0.08),transparent_60%)]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/70 to-indigo-100/50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,rgba(99,102,241,0.1),transparent_55%)]" />
          </>
        )}
      </div>

      {/* Header */}
      <div
        className={cn(
          'relative z-10',
          !embedded && 'sticky top-0 border-b backdrop-blur-md',
          embedded ? 'mb-5' : 'mb-0',
          darkMode
            ? embedded
              ? ''
              : 'border-white/10 bg-slate-950/80'
            : embedded
              ? ''
              : 'border-gray-200/50 bg-white/80'
        )}
      >
        <div className={cn(shellWidth, shellPadding, embedded ? 'pt-0 pb-0' : 'py-5')}>
          <div
            className={cn(
              embedded && 'pb-4 pt-2'
            )}
          >
          <div className={cn('flex flex-wrap items-end justify-between gap-4', embedded ? 'mb-4' : 'mb-4')}>
            <div className="flex min-w-0 items-center gap-4">
              {!embedded && (
                <button
                  onClick={() => window.history.back()}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-all ${
                    darkMode
                      ? 'border-white/10 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className={cn(
                    'text-2xl font-bold tracking-tight sm:text-3xl',
                    darkMode ? 'text-white' : 'text-gray-950'
                  )}>
                    {t("employee.browseJobs.title")}
                  </h1>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    darkMode ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-700'
                  }`}>
                    {totalJobCount} matches
                  </span>
                </div>
                <p className={`max-w-2xl text-base font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {t("employee.browseJobs.subhead")}
                </p>
              </div>
            </div>

          </div>

          {/* Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className={cn(
                  'absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2',
                  darkMode ? 'text-slate-500' : 'text-gray-400'
                )}
              />
              <input
                type="text"
                placeholder="Search jobs, companies, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'h-11 w-full rounded-xl pl-11 pr-4 text-sm font-medium outline-none ring-1 transition-all',
                  darkMode
                    ? 'bg-white/[0.04] text-slate-50 ring-white/10 placeholder:text-slate-500 focus:ring-sky-400/50'
                    : 'bg-white text-gray-900 ring-gray-200/80 placeholder:text-gray-400 focus:ring-blue-500/40 shadow-sm'
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all lg:hidden',
                darkMode
                  ? 'bg-white/[0.06] text-slate-100 ring-1 ring-white/10 hover:bg-white/[0.1]'
                  : 'bg-white text-gray-800 ring-1 ring-gray-200/80 hover:bg-gray-50 shadow-sm'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {['all', 'remote', 'full-time', 'contract'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all',
                  selectedType === type
                    ? darkMode
                      ? 'bg-sky-500/90 text-slate-950'
                      : 'bg-blue-600 text-white shadow-sm shadow-blue-500/15'
                    : darkMode
                      ? 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                      : 'text-gray-600 hover:bg-gray-100/80'
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
              </button>
            ))}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Clear all
              </button>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn('relative', shellWidth, shellPadding, embedded ? 'pb-4' : 'py-6')}>
        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar Filters */}
          {showFilters && (
            <aside
              className={cn(
                'w-full shrink-0 lg:w-[272px] xl:w-[300px]',
                filterStickyTop,
                'lg:sticky lg:self-start'
              )}
            >
              <div className={cn('rounded-2xl border p-5', surfaceCard)}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className={cn('text-base font-bold', darkMode ? 'text-white' : 'text-gray-900')}>
                    Filters
                  </h3>
                  <p className={cn('text-xs', darkMode ? 'text-slate-500' : 'text-gray-500')}>
                    Pay, skills, and work type
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg transition-colors',
                    darkMode ? 'text-slate-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'
                  )}
                  aria-label="Hide filters"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>

              {/* Salary Range */}
              <div className="mb-5">
                <h4 className={cn('mb-2.5 text-sm font-semibold', darkMode ? 'text-slate-200' : 'text-gray-800')}>
                  Salary Range
                </h4>
                <div
                  className={cn(
                    'space-y-3 rounded-xl border p-3',
                    darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200/70 bg-white/70'
                  )}
                >
                  <input
                    type="range"
                    min="150"
                    max="300"
                    step="50"
                    value={salaryRange[1]}
                    onChange={(e) => setSalaryRange([salaryRange[0], parseInt(e.target.value)])}
                    aria-label="Maximum salary"
                    className={cn(
                      'salary-range-slider',
                      darkMode ? 'salary-range-slider--dark' : 'salary-range-slider--light'
                    )}
                    style={{
                      background: `linear-gradient(to right,
                        ${darkMode ? 'rgba(56,189,248,0.9)' : 'rgba(37,99,235,0.95)'} 0%,
                        ${darkMode ? 'rgba(99,102,241,0.95)' : 'rgba(99,102,241,0.95)'} ${Math.round(((salaryRange[1] - 150) / 150) * 100)}%,
                        ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'} ${Math.round(((salaryRange[1] - 150) / 150) * 100)}%,
                        ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'} 100%)`,
                    }}
                  />
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold tabular-nums">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 ring-1',
                        darkMode
                          ? 'bg-slate-900/40 text-slate-300 ring-white/10'
                          : 'bg-white text-gray-600 ring-gray-200/70'
                      )}
                    >
                      ${salaryRange[0]}k
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 ring-1',
                        darkMode
                          ? 'bg-slate-900/50 text-slate-50 ring-white/10'
                          : 'bg-white text-gray-900 ring-gray-200/70'
                      )}
                    >
                      ${salaryRange[1]}k
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-5">
                <h4 className={cn('mb-2.5 text-sm font-semibold', darkMode ? 'text-slate-200' : 'text-gray-800')}>
                  Skills
                </h4>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      value={skillQuery}
                      onChange={(e) => {
                        setSkillQuery(e.target.value);
                        setShowAllSkills(false);
                      }}
                      placeholder="Search skills..."
                      className={cn(
                        'w-full rounded-lg py-2 pl-9 pr-3 text-sm font-medium outline-none ring-1 transition-all',
                        darkMode
                          ? 'bg-white/[0.04] text-slate-50 ring-white/10 placeholder:text-slate-500 focus:ring-sky-400/40'
                          : 'bg-gray-50/80 text-gray-900 ring-gray-200/70 placeholder:text-gray-400 focus:ring-blue-500/35'
                      )}
                    />
                  </div>

                  <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                    {visibleSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          'w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                          selectedSkills.includes(skill)
                            ? darkMode
                              ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30'
                              : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80'
                            : darkMode
                              ? 'text-slate-300 hover:bg-white/[0.06]'
                              : 'text-gray-700 hover:bg-gray-100/80'
                        )}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>

                  {filteredSkills.length > 10 && (
                    <button
                      onClick={() => setShowAllSkills((v) => !v)}
                      className={cn(
                        'w-full rounded-lg py-2 text-sm font-medium transition-colors',
                        darkMode
                          ? 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {showAllSkills ? 'Show less' : `Show more (${filteredSkills.length - 10} more)`}
                    </button>
                  )}
                </div>
              </div>

              {/* Clear Filters */}
              <button
                type="button"
                onClick={clearFilters}
                className={cn(
                  'w-full rounded-lg py-2.5 text-sm font-semibold transition-colors',
                  darkMode
                    ? 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                Clear all filters
              </button>
              </div>
            </aside>
          )}

          {/* Job listings */}
          <div className="min-w-0 flex-1">
            {!showFilters && (
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className={cn(
                  'mb-4 hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors lg:inline-flex',
                  darkMode
                    ? 'text-sky-300 hover:bg-white/[0.06]'
                    : 'text-blue-700 hover:bg-blue-50'
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Show filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}

            {/* Stats — inline chips */}
            <div className="mb-5 flex flex-wrap gap-2 sm:gap-3">
              {[
                { label: 'Available', value: totalJobCount, icon: Briefcase, accent: 'text-blue-500' },
                { label: 'New today', value: jobs.filter((j) => j.isNew).length, icon: TrendingUp, accent: 'text-emerald-500' },
                { label: 'Saved', value: savedJobs.length, icon: Heart, accent: 'text-violet-500' },
                { label: 'Avg match', value: `${averageMatch || 85}%`, icon: Star, accent: 'text-amber-500' },
              ].map(({ label, value, icon: Icon, accent }) => (
                <div
                  key={label}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-2',
                    darkMode
                      ? 'border-white/10 bg-slate-900/40'
                      : 'border-gray-200/80 bg-white/70'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', accent)} />
                  <span className={cn('text-xs font-medium', darkMode ? 'text-slate-400' : 'text-gray-500')}>
                    {label}
                  </span>
                  <span className={cn('text-sm font-bold tabular-nums', darkMode ? 'text-white' : 'text-gray-900')}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Jobs list — grid layout */}
            <div
              className={cn(
                'mb-8 relative',
                (isInitialLoad || error || totalJobCount === 0) && 'rounded-2xl border border-dashed overflow-hidden ' + surfaceCard
              )}
            >
              {isRefreshing && (
                <div className="absolute inset-x-0 top-0 z-10 flex justify-center py-2 pointer-events-none">
                  <span className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium shadow-sm',
                    darkMode ? 'bg-slate-800/90 text-slate-200' : 'bg-white/95 text-gray-600'
                  )}>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    Updating…
                  </span>
                </div>
              )}
              {!error && (
                <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity duration-200', isRefreshing && 'opacity-60')}>
                  {jobs.map((job, index) => (
                <article
                  key={job.id}
                  className={cn(
                    'group flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1',
                    surfaceCard,
                    darkMode ? 'hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/10' : 'hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/10',
                    job.isFeatured && (darkMode ? 'border-amber-500/30 bg-amber-500/5' : 'border-amber-400/40 bg-amber-50/40')
                  )}
                >
                  {job.isFeatured && (
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-4 py-2 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-bold">Featured Job</span>
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3.5">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
                          {job.company.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h3 className={cn(
                              'truncate text-lg font-bold tracking-tight transition-colors sm:text-xl',
                              darkMode ? 'text-white group-hover:text-sky-300' : 'text-gray-900 group-hover:text-blue-600'
                            )}>
                              {job.title}
                            </h3>
                            {job.isNew && (
                              <span className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">
                                NEW
                              </span>
                            )}
                          </div>
                          {job.companyId ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompanyProfileId(job.companyId!);
                                setCompanyProfileName(job.company);
                              }}
                              className={`mb-3 font-bold text-left hover:underline ${darkMode ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-800'}`}
                            >
                              {job.company}
                            </button>
                          ) : (
                            <p className={`mb-3 font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {job.company}
                            </p>
                          )}
                          <div className={cn('flex flex-wrap items-center gap-2 text-xs font-medium sm:text-sm', darkMode ? 'text-slate-500' : 'text-gray-500')}>
                            <span className={cn('inline-flex items-center gap-1', darkMode ? 'text-slate-400' : 'text-gray-600')}>
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {job.location}
                            </span>
                            <span className={darkMode ? 'text-slate-600' : 'text-gray-300'}>·</span>
                            <span className={cn('inline-flex items-center gap-1', darkMode ? 'text-slate-400' : 'text-gray-600')}>
                              <Briefcase className="h-3.5 w-3.5 shrink-0" />
                              {job.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="shrink-0 text-right">
                        <p className={cn('text-lg font-bold leading-none tabular-nums sm:text-xl', darkMode ? 'text-sky-300' : 'text-blue-600')}>
                          {job.matchPercentage}%
                        </p>
                        <p className={cn('mt-0.5 text-[10px] font-semibold uppercase tracking-wide', darkMode ? 'text-slate-500' : 'text-gray-500')}>
                          Match
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 4).map(skill => (
                        <span
                          key={skill}
                          className={cn(
                            'rounded-md px-2 py-0.5 text-xs font-medium',
                            darkMode ? 'bg-sky-500/10 text-sky-300' : 'bg-blue-50 text-blue-700'
                          )}
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', darkMode ? 'text-slate-500' : 'text-gray-500')}>
                          +{job.skills.length - 4}
                        </span>
                      )}
                    </div>

                    </div>

                    {/* Footer */}
                    <div className={cn(
                      'mt-auto flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between',
                      darkMode ? 'border-white/[0.06]' : 'border-gray-100'
                    )}>
                      <div className="flex flex-col gap-1">
                        <span className={`text-lg tracking-tight font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {job.salary}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {job.applicants} applied • {job.postedTime}
                        </span>
                      </div>
                      <div className="flex gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => toggleSaveJob(job)}
                          className={cn(
                            'grid h-10 w-10 place-items-center rounded-xl transition-all',
                            isJobSaved(job.id)
                              ? darkMode
                                ? 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30'
                                : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                              : darkMode
                                ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400'
                                : 'text-gray-400 hover:bg-rose-50 hover:text-rose-600'
                          )}
                          title={isJobSaved(job.id) ? 'Remove saved job' : 'Save job'}
                        >
                          <Heart className={`w-5 h-5 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowQuickApply(true);
                          }}
                          className={cn(
                            'group/btn flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold transition-all sm:flex-none',
                            darkMode
                              ? 'bg-blue-600 text-white hover:bg-blue-500'
                              : 'bg-blue-600 text-white shadow-sm shadow-blue-500/15 hover:bg-blue-700'
                          )}
                        >
                          Apply
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
                  ))}
                </div>
              )}

            {/* Loading State — first load only */}
            {isInitialLoad && (
              <div className="p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <h3 className={cn('text-xl font-bold mb-2', darkMode ? 'text-white' : 'text-gray-900')}>
                  Loading Jobs...
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Please wait while we fetch available positions
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-12 text-center">
                <div
                  className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
                    darkMode ? 'bg-red-500/20' : 'bg-red-100'
                  )}
                >
                  <X className={cn('w-10 h-10', darkMode ? 'text-red-400' : 'text-red-500')} />
                </div>
                <h3 className={cn('text-xl font-bold mb-2', darkMode ? 'text-white' : 'text-gray-900')}>
                  Error Loading Jobs
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isInitialLoad && !error && totalJobCount === 0 && (
              <div className="p-12 text-center">
                <div
                  className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  )}
                >
                  <Briefcase className={cn('w-10 h-10', darkMode ? 'text-gray-500' : 'text-gray-400')} />
                </div>
                <h3 className={cn('text-xl font-bold mb-2', darkMode ? 'text-white' : 'text-gray-900')}>
                  No Jobs Found
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Try adjusting your search or filters
                </p>
              </div>
            )}
            </div>

            {/* Quick Apply Modal */}
            {selectedJob && (
              <QuickApplyModal
                isOpen={showQuickApply}
                onClose={() => {
                  setShowQuickApply(false);
                  setSelectedJob(null);
                }}
                jobId={selectedJob.id}
                jobTitle={selectedJob.title}
                companyName={selectedJob.company}
                companyId={selectedJob.companyId}
                matchPercentage={selectedJob.matchPercentage}
              />
            )}

            {/* Pagination */}
            {showPagination && (
            <div
              className={cn(
                'mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-6',
                darkMode ? 'border-white/10' : 'border-gray-200/80'
              )}
            >
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    scrollPageToTop();
                  }}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    currentPage === 1
                      ? darkMode
                        ? 'bg-gray-700/60 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : darkMode
                      ? 'bg-indigo-500/90 text-white hover:bg-indigo-500'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    scrollPageToTop();
                  }}
                  disabled={currentPage >= totalPages}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    currentPage >= totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : darkMode
                      ? 'bg-indigo-500/90 text-white hover:bg-indigo-500'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="flex items-center gap-4 hidden md:flex">
                <div className="flex items-center gap-2">
                  {(function() {
                    const total = totalPages;
                    const current = currentPage;
                    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
                    if (current <= 3) return [1, 2, 3, '...', total];
                    if (current >= total - 2) return [1, '...', total - 2, total - 1, total];
                    return [1, '...', current, '...', total];
                  })().map((page, idx) => (
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className={darkMode ? 'text-gray-500' : 'text-gray-500'}>...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page as number);
                          scrollPageToTop();
                        }}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl font-semibold transition-all ${
                          currentPage === page
                            ? darkMode
                              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                              : 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700/60 text-gray-200 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Page {currentPage} of {totalPages} • {totalJobCount} jobs
                </p>
              </div>
            </div>
            )}

          </div>
        </div>
      </div>

      <CompanyProfileModal
        companyId={companyProfileId}
        companyName={companyProfileName}
        isOpen={Boolean(companyProfileId)}
        onClose={() => setCompanyProfileId(null)}
      />
    </div>
  );
};

export default BrowseJobs;
