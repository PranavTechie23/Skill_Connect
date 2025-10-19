import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { Users, Briefcase, TrendingUp, MessageCircle, Activity, ClipboardList } from "lucide-react";
import { Eye, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { PieChart as LucidePieChart } from "lucide-react";

const Dashboards = () => {
  // Define COLORS array for PieChart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];


  const [userGrowthData, setUserGrowthData] = useState([]);
  const [jobCategoriesData, setJobCategoriesData] = useState([]);
  const [applicationStatusData, setApplicationStatusData] = useState([]);
  const [engagementData, setEngagementData] = useState([]);
  const [quickStatsData, setQuickStatsData] = useState({ totalUsers: 0, activeJobs: 0, applicationsToday: 0, successfulMatches: 0 });
  const [topJobListingsData, setTopJobListingsData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard");
        const data = await response.json();
        setUserGrowthData(data.userGrowthData);
        setJobCategoriesData(data.jobCategoriesData);
        setApplicationStatusData(data.applicationStatusData);
        setEngagementData(data.engagementData);
        setQuickStatsData(data.quickStatsData[0]);
        setTopJobListingsData(data.topJobListingsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  // Custom pie chart rendering with better visibility in both modes
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
          outerRadius={80}
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
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
          }} 
        />
      </RechartsPieChart>
    </ResponsiveContainer>   
  );

  // Animation variants for framer-motion
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="min-h-screen p-6 text-center mb-12"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
    >
      <br></br>
      <h1 className=" justify-center text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-4">Dashboard</h1>
      <br></br>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <TabsTrigger value="overview" className="data-[state=active]:bg-pink-400 data-[state=active]:text-white dark:data-[state=active]:bg-pink-500">
            <Users className="mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-pink-400 data-[state=active]:text-white dark:data-[state=active]:bg-pink-500">
            <Briefcase className="mr-2" /> Jobs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-pink-400 data-[state=active]:text-white dark:data-[state=active]:bg-pink-500">
            <TrendingUp className="mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="engagement" className="data-[state=active]:bg-pink-400 data-[state=active]:text-white dark:data-[state=active]:bg-pink-500">
            <MessageCircle className="mr-2" /> Engagement
          </TabsTrigger>
        </TabsList>
        <br />

        <TabsContent value="overview">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={sectionVariants}
          >
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userGrowthData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#333' }} />
                    <Bar dataKey="users" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {renderPieChart(jobCategoriesData)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Users</span>
                    <span>{quickStatsData.totalUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Jobs</span>
                    <span>{quickStatsData.activeJobs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Applications Today</span>
                    <span>{quickStatsData.applicationsToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Successful Matches</span>
                    <span>{quickStatsData.successfulMatches}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="jobs">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={sectionVariants}
          >
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                {renderPieChart(applicationStatusData)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase />
                  Top Job Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {topJobListingsData.map((job, index) => (
                    <li 
                      key={index} 
                      className="flex justify-between items-center p-4 rounded-lg transition-colors duration-200"
                    >
                      <span>
                        {job.title}
                      </span>
                      <div className="flex items-center gap-4">
                        <span>
                          <Eye className="h-4 w-4 mr-1" />
                          {job.views.toLocaleString()} views
                        </span>
                        <span>
                          <FileText className="h-4 w-4 mr-1" />
                          {job.applications} apps
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={sectionVariants}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp />
                  User Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month"/>
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#4F46E5" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucidePieChart />
                  Job Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderPieChart(jobCategoriesData)}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="engagement">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={sectionVariants}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity />
                  Weekly Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      dot={{ fill: '#8B5CF6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList />
                  Application Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderPieChart(applicationStatusData)}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {applicationStatusData.map((status, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>
                        {status.name}: {status.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Dashboards;