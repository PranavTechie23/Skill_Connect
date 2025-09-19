
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, Briefcase, TrendingUp, MessageCircle } from "lucide-react";

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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 p-6"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
    >
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Dashboard</h1>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <TabsTrigger value="overview" className="bg-white shadow-md hover:bg-purple-100 transition-colors">
            <Users className="mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="jobs" className="bg-white shadow-md hover:bg-purple-100 transition-colors">
            <Briefcase className="mr-2" /> Jobs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="bg-white shadow-md hover:bg-purple-100 transition-colors">
            <TrendingUp className="mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="engagement" className="bg-white shadow-md hover:bg-purple-100 transition-colors">
            <MessageCircle className="mr-2" /> Engagement
          </TabsTrigger>
        </TabsList>

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
                    <Tooltip />
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobCategoriesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {jobCategoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Users</span>
                    <span className="text-2xl font-bold text-purple-600">3,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Jobs</span>
                    <span className="text-2xl font-bold text-green-600">250</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Applications Today</span>
                    <span className="text-2xl font-bold text-blue-600">75</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Successful Matches</span>
                    <span className="text-2xl font-bold text-yellow-600">120</span>
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Job Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    { title: "Senior Software Engineer", views: 1200, applications: 45 },
                    { title: "UX Designer", views: 980, applications: 38 },
                    { title: "Marketing Manager", views: 850, applications: 30 },
                    { title: "Data Analyst", views: 720, applications: 25 },
                    { title: "Customer Support Specialist", views: 650, applications: 20 },
                  ].map((job, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                      <span className="font-medium">{job.title}</span>
                      <div className="text-sm text-gray-600">
                        <span className="mr-2">{job.views} views</span>
                        <span>{job.applications} apps</span>
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
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="#8884d8" />
                    <Line type="monotone" dataKey="applications" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. Time to Hire</span>
                    <span className="text-2xl font-bold text-purple-600">12 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Applicant to Interview Ratio</span>
                    <span className="text-2xl font-bold text-green-600">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Job Posting Engagement Rate</span>
                    <span className="text-2xl font-bold text-blue-600">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User Retention Rate</span>
                    <span className="text-2xl font-bold text-yellow-600">82%</span>
                  </div>
                </div>
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
                <CardTitle>Engagement Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="applications" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Daily Active Users</span>
                    <span className="text-xl font-bold text-purple-600">1,200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Messages Sent Today</span>
                    <span className="text-xl font-bold text-green-600">850</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. Response Time</span>
                    <span className="text-xl font-bold text-blue-600">2.5 hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Platform Satisfaction</span>
                    <span className="text-xl font-bold text-yellow-600">4.2/5</span>
                  </div>
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
