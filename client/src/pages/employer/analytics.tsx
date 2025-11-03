import { useState } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  DollarSign,
  MapPin,
  Calendar,
  Download,
  MoreHorizontal,
  Building,
  Target,
  Award,
  Clock,
  BarChart3,
  PieChart,
  UserCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Activity,
  Star,
  Moon,
  Sun
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalApplicants: number;
    conversionRate: number;
    averageTimeToHire: number;
    totalJobs: number;
    activeJobs: number;
  };
  traffic: {
    dates: string[];
    views: number[];
    applicants: number[];
    conversions: number[];
  };
  applicantSources: {
    source: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  topJobs: {
    id: string;
    title: string;
    views: number;
    applicants: number;
    conversionRate: number;
    department: string;
    status: 'active' | 'paused' | 'closed';
  }[];
  demographic: {
    locations: { location: string; applicants: number; growth: number }[];
    experience: { level: string; count: number; trend: 'up' | 'down' }[];
  };
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeMetric, setActiveMetric] = useState<'views' | 'applicants' | 'conversions'>('views');
  const [isDark, setIsDark] = useState(true);

  const analyticsData: AnalyticsData = {
    overview: {
      totalViews: 12470,
      totalApplicants: 342,
      conversionRate: 2.74,
      averageTimeToHire: 24,
      totalJobs: 15,
      activeJobs: 8
    },
    traffic: {
      dates: ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14'],
      views: [650, 720, 800, 750, 850, 900, 920, 880, 950, 1000, 1050, 1100, 1150, 1200],
      applicants: [18, 22, 25, 20, 28, 30, 32, 29, 35, 38, 40, 42, 45, 48],
      conversions: [0.5, 0.6, 0.65, 0.55, 0.7, 0.75, 0.8, 0.72, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2]
    },
    applicantSources: [
      { source: 'LinkedIn', count: 145, percentage: 42.4, color: '#0A66C2' },
      { source: 'Indeed', count: 89, percentage: 26.0, color: '#2164F3' },
      { source: 'Company Website', count: 56, percentage: 16.4, color: '#10B981' },
      { source: 'Glassdoor', count: 32, percentage: 9.4, color: '#0CAA41' },
      { source: 'Other', count: 20, percentage: 5.8, color: '#6B7280' }
    ],
    topJobs: [
      { id: '1', title: 'Senior Frontend Developer', views: 2450, applicants: 68, conversionRate: 2.78, department: 'Engineering', status: 'active' },
      { id: '2', title: 'Product Manager', views: 1890, applicants: 54, conversionRate: 2.86, department: 'Product', status: 'active' },
      { id: '3', title: 'DevOps Engineer', views: 1670, applicants: 42, conversionRate: 2.51, department: 'Engineering', status: 'paused' },
      { id: '4', title: 'UX Designer', views: 1540, applicants: 38, conversionRate: 2.47, department: 'Design', status: 'active' },
      { id: '5', title: 'Data Scientist', views: 1320, applicants: 35, conversionRate: 2.65, department: 'Data', status: 'active' }
    ],
    demographic: {
      locations: [
        { location: 'San Francisco, CA', applicants: 89, growth: 12 },
        { location: 'New York, NY', applicants: 67, growth: 8 },
        { location: 'Remote', applicants: 54, growth: 25 },
        { location: 'Austin, TX', applicants: 38, growth: 15 },
        { location: 'Seattle, WA', applicants: 32, growth: 5 }
      ],
      experience: [
        { level: 'Entry Level (0-2 years)', count: 45, trend: 'up' },
        { level: 'Mid Level (3-5 years)', count: 128, trend: 'up' },
        { level: 'Senior Level (6-10 years)', count: 89, trend: 'down' },
        { level: 'Executive (10+ years)', count: 12, trend: 'up' }
      ]
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, trend = 'up', subtitle, gradient }: any) => (
    <div className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl ${
      isDark 
        ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/30' 
        : 'bg-white/80 border border-gray-200/50 shadow-xl'
    } backdrop-blur-xl`}>
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${gradient}`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className={`p-4 rounded-2xl ${
            isDark ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-br from-gray-50 to-gray-100'
          } group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
            <Icon className={`w-7 h-7 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
          <div className={`flex items-center space-x-1.5 text-sm font-bold px-3.5 py-1.5 rounded-full backdrop-blur-sm ${
            trend === 'up' 
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{change}%</span>
          </div>
        </div>
        
        <div>
          <p className={`text-sm font-semibold mb-3 uppercase tracking-wider ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>{title}</p>
          <p className={`text-4xl font-black mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {subtitle && (
            <p className={`text-sm font-medium flex items-center ${
              isDark ? 'text-gray-500' : 'text-gray-600'
            }`}>
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const TrafficChart = () => {
    const data = analyticsData.traffic[activeMetric];
    const maxValue = Math.max(...data);
    const avgValue = data.reduce((a, b) => a + b, 0) / data.length;
    
    return (
      <div className={`relative rounded-3xl p-8 transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/30' 
          : 'bg-white/80 border border-gray-200/50 shadow-xl'
      } backdrop-blur-xl`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className={`text-2xl font-black mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Traffic Trends</h3>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Real-time performance metrics across all channels</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex rounded-2xl p-1.5 shadow-lg ${
              isDark ? 'bg-gray-800/80' : 'bg-gray-100'
            }`}>
              {(['views', 'applicants', 'conversions'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeMetric === metric
                      ? isDark 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : isDark
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Chart Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-2xl ${
            isDark ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Peak Value</p>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {maxValue.toLocaleString()}
            </p>
          </div>
          <div className={`p-4 rounded-2xl ${
            isDark ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Average</p>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {avgValue.toFixed(0)}
            </p>
          </div>
          <div className={`p-4 rounded-2xl ${
            isDark ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Growth Rate</p>
            <p className="text-2xl font-black text-emerald-500">+12.5%</p>
          </div>
        </div>
        
        <div className="h-72 mb-6">
          <div className="flex items-end justify-between h-56 space-x-1.5">
            {data.map((value, index) => {
              const height = (value / maxValue) * 100;
              const isPeak = value === maxValue;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1 group cursor-pointer">
                  <div className="relative flex-1 w-full flex items-end">
                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t-2xl transition-all duration-700 group-hover:shadow-2xl relative overflow-hidden ${
                        isPeak ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        height: `${height}%`,
                        background: activeMetric === 'views' 
                          ? 'linear-gradient(to top, #3b82f6, #8b5cf6)' 
                          : activeMetric === 'applicants'
                          ? 'linear-gradient(to top, #10b981, #06b6d4)'
                          : 'linear-gradient(to top, #f59e0b, #ef4444)'
                      }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    
                    {/* Tooltip */}
                    <div className={`absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none ${
                      isDark ? 'bg-gray-800' : 'bg-white'
                    } px-3 py-2 rounded-xl shadow-2xl border ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {analyticsData.traffic.dates[index]}
                      </p>
                      <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs mt-3 font-medium ${
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    {analyticsData.traffic.dates[index].split(' ')[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center space-x-8">
          {[
            { label: 'Page Views', color: 'from-blue-500 to-purple-600' },
            { label: 'Applicants', color: 'from-emerald-500 to-cyan-600' },
            { label: 'Conversions', color: 'from-amber-500 to-red-500' }
          ].map((item, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${item.color}`} />
              <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SourcesChart = () => (
    <div className={`relative rounded-3xl p-8 transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/30' 
        : 'bg-white/80 border border-gray-200/50 shadow-xl'
    } backdrop-blur-xl`}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className={`text-2xl font-black mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Applicant Sources</h3>
          <p className={`text-sm font-medium ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>Channel distribution breakdown</p>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <PieChart className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-3">
          {analyticsData.applicantSources.map((source, index) => (
            <div 
              key={source.source} 
              className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4 flex-1">
                <div 
                  className="w-5 h-5 rounded-full transition-transform duration-300 group-hover:scale-125 shadow-lg"
                  style={{ backgroundColor: source.color }}
                />
                <div className="flex-1">
                  <span className={`font-bold text-sm ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>{source.source}</span>
                  <div className={`w-full h-2 mt-2 rounded-full overflow-hidden ${
                    isDark ? 'bg-gray-800' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="h-full rounded-full transition-all duration-700 shadow-lg"
                      style={{ 
                        width: `${source.percentage}%`,
                        background: `linear-gradient(90deg, ${source.color}, ${source.color}dd)`
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <span className={`font-black text-lg ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{source.count}</span>
                <span className={`text-sm ml-2 font-semibold ${
                  isDark ? 'text-gray-500' : 'text-gray-600'
                }`}>({source.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <div className="relative w-56 h-56">
            {/* Donut Chart */}
            <svg viewBox="0 0 200 200" className="transform -rotate-90">
              {analyticsData.applicantSources.map((source, index) => {
                const total = 100;
                const offset = analyticsData.applicantSources
                  .slice(0, index)
                  .reduce((sum, s) => sum + s.percentage, 0);
                const circumference = 2 * Math.PI * 70;
                const strokeDasharray = `${(source.percentage / total) * circumference} ${circumference}`;
                const strokeDashoffset = -((offset / total) * circumference);
                
                return (
                  <circle
                    key={source.source}
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke={source.color}
                    strokeWidth="24"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 hover:stroke-opacity-80"
                  />
                );
              })}
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-black mb-1 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {analyticsData.applicantSources.reduce((sum, s) => sum + s.count, 0)}
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TopJobsList = () => (
    <div className={`relative rounded-3xl p-8 transition-all duration-500 h-full ${
      isDark 
        ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/30' 
        : 'bg-white/80 border border-gray-200/50 shadow-xl'
    } backdrop-blur-xl`}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className={`text-2xl font-black mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Top Jobs</h3>
          <p className={`text-sm font-medium ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>Highest performing listings</p>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
          <Star className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        </div>
      </div>
      
      <div className="space-y-3">
        {analyticsData.topJobs.slice(0, 4).map((job, index) => (
          <div 
            key={job.id} 
            className={`group relative overflow-hidden flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
              isDark 
                ? 'bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/30' 
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200/50'
            }`}
          >
            <div className="flex items-center space-x-4 flex-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-xl ${
                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}>
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`font-bold text-sm truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{job.title}</h4>
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold ${
                    job.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                    job.status === 'paused'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <p className={`text-xs font-semibold ${
                  isDark ? 'text-gray-500' : 'text-gray-600'
                }`}>{job.department}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className={`font-black text-sm ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{job.applicants}</p>
                <p className={`text-xs font-semibold ${
                  isDark ? 'text-gray-500' : 'text-gray-600'
                }`}>Apps</p>
              </div>
              <div className="text-center">
                <p className="text-emerald-500 font-black text-sm">{job.conversionRate}%</p>
                <p className={`text-xs font-semibold ${
                  isDark ? 'text-gray-500' : 'text-gray-600'
                }`}>CVR</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-700 ${
      isDark 
        ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black' 
        : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-purple-50'
    }`}>
      {/* Animated particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container mx-auto p-8 max-w-7xl relative">
        <div className="mb-6 p-6">
          <AdminBackButton />
        </div>
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className={`text-5xl font-black mb-3 bg-gradient-to-r ${
              isDark 
                ? 'from-blue-400 via-purple-400 to-pink-400' 
                : 'from-blue-600 via-purple-600 to-pink-600'
            } bg-clip-text text-transparent`}>
              Analytics Hub
            </h1>
            <p className={`text-lg font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Real-time insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 ${
                isDark 
                  ? 'bg-gray-800/60 border border-gray-700/50 text-yellow-400 hover:bg-gray-700/60' 
                  : 'bg-white/80 border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-lg'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className={`border-2 rounded-2xl px-5 py-3 font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800/60 border-gray-700/50 text-white backdrop-blur-xl' 
                  : 'bg-white/80 border-gray-200 text-gray-900 backdrop-blur-xl shadow-lg'
              }`}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-blue-500/25' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-2xl hover:shadow-blue-500/50'
            }`}>
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Page Views"
            value={analyticsData.overview.totalViews}
            change={12.5}
            icon={Eye}
            trend="up"
            subtitle="Across all job postings"
            gradient="from-blue-500/10 to-purple-500/10"
          />
          <StatCard
            title="Total Applicants"
            value={analyticsData.overview.totalApplicants}
            change={8.3}
            icon={Users}
            trend="up"
            subtitle="From all sources"
            gradient="from-emerald-500/10 to-cyan-500/10"
          />
          <StatCard
            title="Conversion Rate"
            value={`${analyticsData.overview.conversionRate}%`}
            change={4.2}
            icon={TrendingUp}
            trend="up"
            subtitle="View to application"
            gradient="from-amber-500/10 to-orange-500/10"
          />
          <StatCard
            title="Avg Time to Hire"
            value={`${analyticsData.overview.averageTimeToHire}d`}
            change={-5.7}
            icon={Clock}
            trend="down"
            subtitle="Days to fill position"
            gradient="from-violet-500/10 to-fuchsia-500/10"
          />
          <StatCard
            title="Total Jobs Posted"
            value={analyticsData.overview.totalJobs}
            change={15.0}
            icon={Building}
            trend="up"
            subtitle="All time"
            gradient="from-rose-500/10 to-pink-500/10"
          />
          <StatCard
            title="Active Jobs"
            value={analyticsData.overview.activeJobs}
            change={23.1}
            icon={Target}
            trend="up"
            subtitle="Currently recruiting"
            gradient="from-sky-500/10 to-blue-500/10"
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <TrafficChart />
          <SourcesChart />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopJobsList />
          
          {/* Demographic Data */}
          <div className={`relative rounded-3xl p-8 transition-all duration-500 ${
            isDark 
              ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/30' 
              : 'bg-white/80 border border-gray-200/50 shadow-xl'
          } backdrop-blur-xl`}>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className={`text-2xl font-black mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Demographics</h3>
                <p className={`text-sm font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Applicant locations & experience</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <MapPin className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Locations */}
              <div>
                <h4 className={`text-lg font-black mb-4 flex items-center ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <MapPin className="w-5 h-5 mr-2" />
                  Top Locations
                </h4>
                <div className="space-y-3">
                  {analyticsData.demographic.locations.map((location, index) => (
                    <div key={location.location} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isDark ? 'bg-gray-800' : 'bg-gray-100'
                        } group-hover:scale-110 transition-transform duration-300`}>
                          {index + 1}
                        </div>
                        <span className={`font-semibold text-sm ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>{location.location}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`font-black text-sm ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>{location.applicants}</span>
                        <div className={`flex items-center space-x-1 text-sm font-bold px-2.5 py-1 rounded-full ${
                          location.growth > 0
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                        }`}>
                          {location.growth > 0 ? 
                            <ArrowUpRight className="w-3.5 h-3.5" /> : 
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          }
                          <span>{location.growth}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Experience Levels */}
              <div>
                <h4 className={`text-lg font-black mb-4 flex items-center ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <Award className="w-5 h-5 mr-2" />
                  Experience Levels
                </h4>
                <div className="space-y-3">
                  {analyticsData.demographic.experience.map((exp) => (
                    <div key={exp.level} className="flex items-center justify-between group cursor-pointer">
                      <span className={`font-semibold text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>{exp.level}</span>
                      <div className="flex items-center space-x-3">
                        <span className={`font-black text-sm ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>{exp.count}</span>
                        <div className={`p-1.5 rounded-lg ${
                          exp.trend === 'up' 
                            ? 'bg-emerald-500/20 text-emerald-600' 
                            : 'bg-red-500/20 text-red-600'
                        }`}>
                          {exp.trend === 'up' ? 
                            <TrendingUp className="w-3.5 h-3.5" /> : 
                            <TrendingDown className="w-3.5 h-3.5" />
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-12 pt-8 border-t ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <p className={`text-sm font-medium ${
            isDark ? 'text-gray-500' : 'text-gray-600'
          }`}>
            Last updated: {new Date().toLocaleDateString()} • Data refreshes every 15 minutes
          </p>
        </div>
      </div>
    </div>
  );
}