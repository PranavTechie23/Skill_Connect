import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { Users, Briefcase, TrendingUp, MessageCircle, Activity, ClipboardList, Eye, FileText, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { PieChart as LucidePieChart } from "lucide-react";

const Dashboards = () => {
  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

  const [userGrowthData, setUserGrowthData] = useState<{ month: string; users: number; }[]>([]);
  const [jobCategoriesData, setJobCategoriesData] = useState<{ name: string; value: number; }[]>([]);
  const [applicationStatusData, setApplicationStatusData] = useState<{ name: string; value: number; }[]>([]);
  const [engagementData, setEngagementData] = useState<{ day: string; messages: number; applications: number; }[]>([]);
  const [quickStatsData, setQuickStatsData] = useState({ totalUsers: 0, activeJobs: 0, applicationsToday: 0, successfulMatches: 0 });
  interface TopJobListing {
    title: string;
    views: number;
    applications: number;
  }
  const [topJobListingsData, setTopJobListingsData] = useState<TopJobListing[]>([]);

  const useMockData = () => {
    setUserGrowthData([
      { month: 'Jan', users: 65 }, { month: 'Feb', users: 99 }, { month: 'Mar', users: 150 },
      { month: 'Apr', users: 121 }, { month: 'May', users: 176 }, { month: 'Jun', users: 195 },
    ]);
    setJobCategoriesData([
      { name: 'Technology', value: 400 }, { name: 'Marketing', value: 300 },
      { name: 'Sales', value: 300 }, { name: 'Design', value: 200 },
    ]);
    setApplicationStatusData([
      { name: 'Accepted', value: 550 }, { name: 'Rejected', value: 50 },
      { name: 'Pending', value: 200 }, { name: 'Interview', value: 375 },
    ]);
    setEngagementData([
      { day: 'Mon', messages: 100, applications: 50 }, { day: 'Tue', messages: 120, applications: 60 },
      { day: 'Wed', messages: 90, applications: 45 }, { day: 'Thu', messages: 150, applications: 70 },
      { day: 'Fri', messages: 180, applications: 90 },
    ]);
    setQuickStatsData({
      totalUsers: 5432,
      activeJobs: 123,
      applicationsToday: 89,
      successfulMatches: 45,
    });
    setTopJobListingsData([
      { title: 'Frontend Developer', views: 5000, applications: 150 },
      { title: 'Backend Developer', views: 4500, applications: 120 },
      { title: 'UI/UX Designer', views: 3000, applications: 90 },
      { title: 'Data Scientist', views: 2500, applications: 70 },
      { title: 'Product Manager', views: 2000, applications: 60 },
    ]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        const data = await response.json();
        setUserGrowthData(data.userGrowthData);
        setJobCategoriesData(data.jobCategoriesData);
        setApplicationStatusData(data.applicationStatusData);
        setEngagementData(data.engagementData);
        setQuickStatsData(data.quickStatsData[0]);
        setTopJobListingsData(data.topJobListingsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        useMockData();
      }
    };
    fetchData();
  }, []);

  interface PieChartData {
    name: string;
    value: number;
    [key: string]: string | number;
  }

  const renderPieChart = (data: PieChartData[], height: number = 300) => (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          fill="#8884d8"
          dataKey="value"
          labelLine={false}
          label={(props) => {
            const { value, payload } = props;
            const numericValue = value as number;
            const typedPayload = payload as { name: string; value: number };
            return `${typedPayload.name}: ${((numericValue / (data.reduce((a, b) => a + b.value, 0))) * 100).toFixed(0)}%`;
          }}
        >
          {data.map((entry: PieChartData, index: number) => (
            <Cell 
              key={`cell-${entry.name}`}
              fill={COLORS[index % COLORS.length]} 
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.98)', 
            color: '#333',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }} 
        />
      </RechartsPieChart>
    </ResponsiveContainer>   
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4QjVDRjYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEzIDAgNiAyLjY4NiA2IDZzLTIuNjg3IDYtNiA2LTYtMi42ODYtNi02IDIuNjg3LTYgNi02ek0yNCAzOGMzLjMxMyAwIDYgMi42ODYgNiA2cy0yLjY4NyA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ny02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <motion.div
        className="relative z-10 p-4 sm:p-6 lg:p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="mb-10 text-center"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Platform Analytics</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 mb-4 tracking-tight">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Monitor your platform's performance and insights in real-time
            </p>
          </motion.div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              <TabsTrigger 
                value="overview" 
                className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Users className="mr-2 h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger 
                value="jobs" 
                className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Briefcase className="mr-2 h-4 w-4" /> Jobs
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <TrendingUp className="mr-2 h-4 w-4" /> Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="engagement" 
                className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Engagement
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
              >
                <motion.div variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <span>User Growth</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userGrowthData}>
                          <XAxis dataKey="month" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }} 
                          />
                          <Bar dataKey="users" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
                          <defs>
                            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" />
                              <stop offset="100%" stopColor="#EC4899" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-lg">
                          <LucidePieChart className="h-5 w-5 text-white" />
                        </div>
                        <span>Job Categories</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderPieChart(jobCategoriesData)}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 text-white hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl text-white">
                        <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                          <Activity className="h-5 w-5" />
                        </div>
                        <span>Quick Stats</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all">
                          <span className="font-medium">Total Users</span>
                          <span className="text-2xl font-bold">{quickStatsData.totalUsers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all">
                          <span className="font-medium">Active Jobs</span>
                          <span className="text-2xl font-bold">{quickStatsData.activeJobs}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all">
                          <span className="font-medium">Applications Today</span>
                          <span className="text-2xl font-bold">{quickStatsData.applicationsToday}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all">
                          <span className="font-medium">Successful Matches</span>
                          <span className="text-2xl font-bold">{quickStatsData.successfulMatches}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="jobs">
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                variants={containerVariants}
              >
                <motion.div variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                          <ClipboardList className="h-5 w-5 text-white" />
                        </div>
                        <span>Application Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={applicationStatusData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis type="number" stroke="#888" />
                          <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 13 }} stroke="#888" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }} 
                          />
                          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                            {applicationStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-lg">
                          <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <span>Top Job Listings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {topJobListingsData.map((job, index) => (
                          <div 
                            key={index} 
                            className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-300 hover:shadow-md border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {job.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <Eye className="h-4 w-4" />
                                {job.views.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <FileText className="h-4 w-4" />
                                {job.applications}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics">
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                variants={containerVariants}
              >
                <motion.div variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span>User Growth Trend</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={userGrowthData}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#EC4899" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="month" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="users" 
                            stroke="#8B5CF6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorUsers)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl shadow-lg">
                          <LucidePieChart className="h-5 w-5 text-white" />
                        </div>
                        <span>Category Distribution</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={jobCategoriesData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }} 
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {jobCategoriesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="engagement">
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                variants={containerVariants}
              >
                <motion.div variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <span>Weekly Engagement</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={engagementData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="messages" 
                            stroke="#10B981" 
                            strokeWidth={3}
                            dot={{ fill: '#10B981', r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="applications" 
                            stroke="#8B5CF6" 
                            strokeWidth={3}
                            dot={{ fill: '#8B5CF6', r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg">
                          <ClipboardList className="h-5 w-5 text-white" />
                        </div>
                        <span>Application Progress</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-5">
                        {applicationStatusData.map((status, index) => {
                          const total = applicationStatusData.reduce((acc, s) => acc + s.value, 0);
                          const percentage = ((status.value / total) * 100).toFixed(1);
                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {status.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {status.value}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                <motion.div
                                  className="h-3 rounded-full shadow-sm"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboards;