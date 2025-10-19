import React, { useState, useEffect } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import {
  BarChart3, TrendingUp, Users, Briefcase, ArrowUp, ArrowDown,
  Calendar, DollarSign, Target, Activity, PieChart, LineChart,
  UserCheck, Building2, CheckCircle, Clock, Filter, Download,
  Eye, Sparkles, Zap, Star, Award, TrendingDown, FileText
} from 'lucide-react';
import { adminService } from '@/lib/admin-service';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Pie, Cell, PieChart as RechartsPieChart, LineChart as RechartsLineChart } from 'recharts';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({
    userGrowth: [],
    jobCategories: [],
    recentActivities: [],
    performanceMetrics: {},
    stats: {}
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await adminService.getAnalytics(timeRange);
        setAnalyticsData(data);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeRange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="mb-4">
          <AdminBackButton />
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/50 animate-pulse-slow">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time platform insights and metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 dark:from-blue-900 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                  <ArrowUp className="w-3 h-3" />
                  12%
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1">Total Users</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">{analyticsData.stats?.totalUsers || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">+{analyticsData.stats?.newUsers || 0} from last month</p>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-green-300 dark:hover:border-green-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200 dark:from-green-900 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/50 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                  <ArrowUp className="w-3 h-3" />
                  8%
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1">Active Jobs</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">{analyticsData.stats?.activeJobs || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">+{analyticsData.stats?.newJobs || 0} from last month</p>
            </div>
          </div>

          {/* Applications */}
          <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 dark:from-purple-900 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                  <ArrowUp className="w-3 h-3" />
                  15%
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1">Applications</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">{analyticsData.stats?.applications || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">+{analyticsData.stats?.newApplications || 0} from last month</p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="group relative bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                  <ArrowUp className="w-3 h-3" />
                  3%
                </div>
              </div>
              <p className="text-white/90 text-sm font-semibold mb-1">Success Rate</p>
              <p className="text-4xl font-black mb-2">{analyticsData.stats?.successRate || 0}%</p>
              <p className="text-xs text-white/80">+{analyticsData.stats?.successRateChange || 0}% improvement</p>
            </div>
          </div>
        </div>

          {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* User Growth Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">User Growth</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Monthly registration trends</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600"></div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600"></div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-600"></div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Employers</span>
                </div>
              </div>
            </div>
            {/* Bar Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.userGrowth}>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="employees" fill="#22c55e" name="Employees" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="employers" fill="#a855f7" name="Employers" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Job Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Job Categories</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Distribution by industry</p>
            </div>

            {/* Pie Chart Representation */}
            <div className="h-48 mx-auto mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart> 
                  <Pie data={analyticsData.jobCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {analyticsData.jobCategories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {analyticsData.jobCategories.map((category: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full shadow-md`} style={{ backgroundColor: category.color }}></div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{category.name}</span>
                  </div>
                  <span className="font-black text-gray-900 dark:text-white">{category.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Metrics */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Performance Metrics</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Key performance indicators</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                  <UserCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Employee Satisfaction</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">{analyticsData.performanceMetrics?.employeeSatisfaction || 0}%</p>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2"> 
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-2xl border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-4">
                  <Building2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400 animate-spin-slow" />
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Employer Satisfaction</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">{analyticsData.performanceMetrics?.employerSatisfaction || 0}%</p>
                <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2"> 
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  <Zap className="w-5 h-5 text-purple-500 dark:text-purple-400 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Placement Rate</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">{analyticsData.performanceMetrics?.placementRate || 0}%</p>
                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2"> 
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" style={{ width: '76%' }}></div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900 dark:to-red-900 rounded-2xl border-2 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  <Activity className="w-5 h-5 text-orange-500 dark:text-orange-400 animate-bounce" />
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Avg. Time to Hire</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">{analyticsData.performanceMetrics?.avgTimeToHire || 0}d</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-bold">{analyticsData.performanceMetrics?.timeToHireChange || 0} days improvement</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Live Activity</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Real-time updates</p>
              </div>
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <div className="space-y-4">
              {analyticsData.recentActivities.map((activity: any, index: number) => {
                const colorClasses = {
                  blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
                  green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
                  purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
                  orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
                };
                const colorClass = colorClasses[activity.color as keyof typeof colorClasses] || colorClasses.blue;
                
                return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all cursor-pointer"
                >
                  <div className={`p-2 rounded-xl ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                    {activity.type === 'user' && <Users className={`w-4 h-4 ${colorClass.split(' ')[2]} ${colorClass.split(' ')[3]}`} />}
                    {activity.type === 'job' && <Briefcase className={`w-4 h-4 ${colorClass.split(' ')[2]} ${colorClass.split(' ')[3]}`} />}
                    {activity.type === 'application' && <FileText className={`w-4 h-4 ${colorClass.split(' ')[2]} ${colorClass.split(' ')[3]}`} />}
                    {activity.type === 'hire' && <CheckCircle className={`w-4 h-4 ${colorClass.split(' ')[2]} ${colorClass.split(' ')[3]}`} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{activity.action}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{activity.user}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div> 
                );
              })}
            </div>

            <button className="w-full mt-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 rounded-2xl font-bold text-gray-700 dark:text-white transition-all">
              View All Activity
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Analytics;






