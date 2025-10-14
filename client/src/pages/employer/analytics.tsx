import { useState } from 'react';
import AdminBackButton from "@/components/AdminBackButton";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  DollarSign,
  MapPin,
  Calendar,
  Filter,
  Download,
  MoreHorizontal,
  Building,
  Target,
  Award,
  Clock4
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
  }[];
  demographic: {
    locations: { location: string; applicants: number }[];
    experience: { level: string; count: number }[];
  };
  timeline: {
    date: string;
    events: { type: string; count: number }[];
  }[];
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

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
      { id: '1', title: 'Senior Frontend Developer', views: 2450, applicants: 68, conversionRate: 2.78, department: 'Engineering' },
      { id: '2', title: 'Product Manager', views: 1890, applicants: 54, conversionRate: 2.86, department: 'Product' },
      { id: '3', title: 'DevOps Engineer', views: 1670, applicants: 42, conversionRate: 2.51, department: 'Engineering' },
      { id: '4', title: 'UX Designer', views: 1540, applicants: 38, conversionRate: 2.47, department: 'Design' },
      { id: '5', title: 'Data Scientist', views: 1320, applicants: 35, conversionRate: 2.65, department: 'Data' }
    ],
    demographic: {
      locations: [
        { location: 'San Francisco, CA', applicants: 89 },
        { location: 'New York, NY', applicants: 67 },
        { location: 'Remote', applicants: 54 },
        { location: 'Austin, TX', applicants: 38 },
        { location: 'Seattle, WA', applicants: 32 }
      ],
      experience: [
        { level: 'Entry Level (0-2 years)', count: 45 },
        { level: 'Mid Level (3-5 years)', count: 128 },
        { level: 'Senior Level (6-10 years)', count: 89 },
        { level: 'Executive (10+ years)', count: 12 }
      ]
    },
    timeline: [
      {
        date: 'Today',
        events: [
          { type: 'applications', count: 8 },
          { type: 'views', count: 320 }
        ]
      },
      {
        date: 'Yesterday',
        events: [
          { type: 'applications', count: 12 },
          { type: 'views', count: 280 }
        ]
      }
    ]
  };

  const StatCard = ({ title, value, change, icon: Icon, trend = 'up' }: any) => (
    <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <p className="text-2xl font-bold text-white mb-1">{value.toLocaleString()}</p>
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            <TrendingUp className="w-4 h-4" />
            <span>{change}% from last period</span>
          </div>
        </div>
        <div className="p-3 bg-blue-600/20 rounded-lg">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
      </div>
    </div>
  );

  const TrafficChart = () => (
    <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Traffic Overview</h3>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1 px-3 py-1 bg-gray-700 rounded-lg text-sm text-gray-300">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-1 bg-gray-700 rounded-lg text-sm text-gray-300">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      <div className="h-64">
        {/* Simplified chart visualization */}
        <div className="flex items-end justify-between h-48 space-x-1 mb-4">
          {analyticsData.traffic.views.map((views, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="flex space-x-1 flex-1 w-full items-end">
                <div 
                  className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400 flex-1"
                  style={{ height: `${(views / 1200) * 100}%` }}
                  title={`${views} views`}
                />
                <div 
                  className="bg-green-500 rounded-t transition-all duration-300 hover:bg-green-400 flex-1"
                  style={{ height: `${(analyticsData.traffic.applicants[index] / 50) * 100}%` }}
                  title={`${analyticsData.traffic.applicants[index]} applicants`}
                />
              </div>
              <span className="text-xs text-gray-400 mt-2">
                {analyticsData.traffic.dates[index]}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-300">Page Views</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-300">Applicants</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SourcesChart = () => (
    <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-6">Applicant Sources</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-4">
          {analyticsData.applicantSources.map((source, index) => (
            <div key={source.source} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-gray-300 text-sm">{source.source}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-white font-medium">{source.count}</span>
                <span className="text-gray-400 text-sm">({source.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center">
          {/* Simplified pie chart visualization */}
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 rounded-full border-8 border-gray-700" />
            {analyticsData.applicantSources.map((source, index) => {
              const total = analyticsData.applicantSources.length;
              const angle = (index / total) * 360;
              return (
                <div
                  key={source.source}
                  className="absolute inset-0 rounded-full"
                  style={{
                    clipPath: `conic-gradient(from ${angle}deg, ${source.color} 0% ${source.percentage}%, transparent 0%)`
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const TopJobsList = () => (
    <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-6">Top Performing Jobs</h3>
      <div className="space-y-4">
        {analyticsData.topJobs.map((job, index) => (
          <div key={job.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-300">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{index + 1}</span>
              </div>
              <div>
                <h4 className="text-white font-medium">{job.title}</h4>
                <p className="text-gray-400 text-sm">{job.department}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-right">
                <p className="text-white font-medium">{job.views.toLocaleString()}</p>
                <p className="text-gray-400 text-xs">Views</p>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{job.applicants}</p>
                <p className="text-gray-400 text-xs">Applicants</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-medium">{job.conversionRate}%</p>
                <p className="text-gray-400 text-xs">Conversion</p>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors duration-300">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const DemographicChart = () => (
    <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-6">Applicant Demographics</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-gray-300 font-medium mb-4 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Top Locations
          </h4>
          <div className="space-y-3">
            {analyticsData.demographic.locations.map((location, index) => (
              <div key={location.location} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{location.location}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(location.applicants / 89) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium w-8 text-right">
                    {location.applicants}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-gray-300 font-medium mb-4 flex items-center">
            <Award className="w-4 h-4 mr-2" />
            Experience Levels
          </h4>
          <div className="space-y-3">
            {analyticsData.demographic.experience.map((exp) => (
              <div key={exp.level} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{exp.level}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(exp.count / 128) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium w-8 text-right">
                    {exp.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Back Button */}
        <div className="mb-6">
          <AdminBackButton />
        </div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Analytics Dashboard</h1>
            <p className="text-gray-400 mt-2">Track your hiring performance and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-300">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Page Views"
            value={analyticsData.overview.totalViews}
            change={12.5}
            icon={Eye}
            trend="up"
          />
          <StatCard
            title="Total Applicants"
            value={analyticsData.overview.totalApplicants}
            change={8.3}
            icon={Users}
            trend="up"
          />
          <StatCard
            title="Conversion Rate"
            value={analyticsData.overview.conversionRate}
            change={2.1}
            icon={Target}
            trend="up"
          />
          <StatCard
            title="Avg. Time to Hire (days)"
            value={analyticsData.overview.averageTimeToHire}
            change={-5.2}
            icon={Clock4}
            trend="down"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2">
            <TrafficChart />
          </div>
          <div>
            <TopJobsList />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SourcesChart />
          <DemographicChart />
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4 text-center">
            <Building className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Active Jobs</p>
            <p className="text-white font-bold text-xl">{analyticsData.overview.activeJobs}</p>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Cost per Hire</p>
            <p className="text-white font-bold text-xl">$2,450</p>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Avg. Response Time</p>
            <p className="text-white font-bold text-xl">2.3 days</p>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4 text-center">
            <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Quality Score</p>
            <p className="text-white font-bold text-xl">8.7/10</p>
          </div>
        </div>
      </div>
    </div>
  );
}