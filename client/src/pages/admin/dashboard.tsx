import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Building, Briefcase, MessageSquare, Shield, TrendingUp, Activity } from "lucide-react";
import { Link } from "react-router-dom";

// Type definition for admin stats
interface AdminStats {
  totalUsers: number;
  activeJobs: number;
  totalCompanies: number;
  totalApplications: number;
  newUsersThisWeek: number;
  newJobsThisWeek: number;
  newCompaniesThisWeek: number;
  newApplicationsThisWeek: number;
}

// Type definitions for other admin data
interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  location: string;
}

interface AdminJob {
  id: string;
  title: string;
  location: string;
  isActive: boolean;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
}

interface AdminCompany {
  id: string;
  name: string;
  location: string;
  industry: string;
  size: string;
  description: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats = {} as AdminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.userType === "admin",
  });

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.userType === "admin",
  });

  const { data: jobs = [] } = useQuery<AdminJob[]>({
    queryKey: ["/api/admin/jobs"],
    enabled: user?.userType === "admin",
  });

  const { data: companies = [] } = useQuery<AdminCompany[]>({
    queryKey: ["/api/admin/companies"],
    enabled: user?.userType === "admin",
  });

  if (user?.userType !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex space-x-2">
          <Link to="/admin/users">
            <Button variant="outline">Manage Users</Button>
          </Link>
          <Link to="/admin/jobs">
            <Button variant="outline">Manage Jobs</Button>
          </Link>
          <Link to="/admin/companies">
            <Button variant="outline">Manage Companies</Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newUsersThisWeek || 0} new this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newJobsThisWeek || 0} posted this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newCompaniesThisWeek || 0} new this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newApplicationsThisWeek || 0} new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
            <CardDescription>Manage platform users and their accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/users">
              <Button className="w-full">Go to User Management</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Job Management</span>
            </CardTitle>
            <CardDescription>Monitor and manage job postings</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/jobs">
              <Button className="w-full">Go to Job Management</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Company Management</span>
            </CardTitle>
            <CardDescription>Manage registered companies</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/companies">
              <Button className="w-full">Go to Company Management</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Latest platform activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium">New user registered</p>
                  <p className="text-sm text-muted-foreground">John Doe joined as an employee</p>
                </div>
              </div>
              <Badge variant="secondary">2 minutes ago</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Briefcase className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">New job posted</p>
                  <p className="text-sm text-muted-foreground">Software Engineer at TechCorp</p>
                </div>
              </div>
              <Badge variant="secondary">15 minutes ago</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Building className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="font-medium">Company registered</p>
                  <p className="text-sm text-muted-foreground">Austin Innovations joined the platform</p>
                </div>
              </div>
              <Badge variant="secondary">1 hour ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


