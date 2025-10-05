import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { Users, Briefcase, TrendingUp, MessageCircle, Activity, ClipboardList } from "lucide-react";
import { Eye, FileText } from "lucide-react";
const Dashboards = () => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const userGrowthData = [
    { month: "Jan", users: 1000 },
    { month: "Feb", users: 1500 },
    { month: "Mar", users: 2000 },
    { month: "Apr", users: 2500 },
    { month: "May", users: 3000 },
    { month: "Jun", users: 3500 },
  ];

  const jobCategoriesData = [
    { name: "Technology", value: 400 },
    { name: "Design", value: 300 },
    { name: "Marketing", value: 300 },
    { name: "Sales", value: 200 },
    { name: "Other", value: 100 },
  ];

  const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#8B5CF6', '#EC4899'];

  const applicationStatusData = [
    { name: "Pending", value: 50 },
    { name: "Reviewed", value: 30 },
    { name: "Interviewed", value: 15 },
    { name: "Hired", value: 5 },
  ];

  const engagementData = [
    { day: "Mon", messages: 120, applications: 50 },
    { day: "Tue", messages: 150, applications: 60 },
    { day: "Wed", messages: 180, applications: 70 },
    { day: "Thu", messages: 190, applications: 80 },
    { day: "Fri", messages: 160, applications: 65 },
    { day: "Sat", messages: 100, applications: 40 },
    { day: "Sun", messages: 80, applications: 30 },
  ];

  // Custom pie chart rendering with better visibility in both modes
  interface PieChartData {
    name: string;
    value: number;
    [key: string]: string | number;
  }

  interface PieChartLabel {
    name: string;
    percent: number;
  }

  const renderPieChart = (data: PieChartData[], height: number = 300) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          labelLine={false}
          label={({ name, value, percent }: { name: string; value: number; percent: number }) => `${name}: ${percent.toFixed(0)}%`}
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
      </PieChart>
    </ResponsiveContainer>   
  );

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
                    <span>3,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Jobs</span>
                    <span>250</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Applications Today</span>
                    <span>75</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Successful Matches</span>
                    <span>120</span>
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
                  {[
                    { title: "Senior Software Engineer", views: 1200, applications: 45 },
                    { title: "UX Designer", views: 980, applications: 38 },
                    { title: "Marketing Manager", views: 850, applications: 30 },
                    { title: "Data Analyst", views: 720, applications: 25 },
                    { title: "Customer Support Specialist", views: 650, applications: 20 },
                  ].map((job, index) => (
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
                  <PieChart />
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