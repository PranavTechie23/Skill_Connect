import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Building, Briefcase, Shield, TrendingUp, AlertTriangle } from "lucide-react";

// Type definitions remain the same
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

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "admin" | "employer" | "employee";
  location: string;
}

interface AdminJob {
  id:string;
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

const StatCard = ({ title, value, icon, note }: { title: string; value: string | number; icon: React.ReactNode; note: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{note}</p>
    </CardContent>
  </Card>
);

const UserListItem = ({ user }: { user: AdminUser }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
        <div className="flex-1">
            <div className="flex items-center space-x-3">
                <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                <Badge variant={user.userType === 'admin' ? 'destructive' : user.userType === 'employer' ? 'default' : 'secondary'}>
                    {user.userType}
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground mt-1">{user.location}</p>
        </div>
        <div className="flex space-x-2">
            <Button variant="outline" size="sm">View</Button>
            <Button variant="outline" size="sm">Edit</Button>
        </div>
    </div>
);

const JobListItem = ({ job }: { job: AdminJob }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
        <div className="flex-1">
            <div className="flex items-center space-x-3">
                <p className="font-medium text-foreground">{job.title}</p>
                <Badge variant={job.isActive ? 'default' : 'secondary'}>
                    {job.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{job.jobType}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{job.location}</p>
            <p className="text-sm text-muted-foreground mt-1">
                ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
            </p>
        </div>
        <div className="flex space-x-2">
            <Button variant="outline" size="sm">View</Button>
            <Button variant="outline" size="sm">Edit</Button>
        </div>
    </div>
);

const CompanyListItem = ({ company }: { company: AdminCompany }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
        <div className="flex-1">
            <div className="flex items-center space-x-3">
                <p className="font-medium text-foreground">{company.name}</p>
                <Badge variant="outline">{company.industry}</Badge>
                <Badge variant="secondary">{company.size}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{company.location}</p>
            <p className="text-sm text-muted-foreground mt-1 truncate">{company.description}</p>
        </div>
        <div className="flex space-x-2">
            <Button variant="outline" size="sm">View</Button>
            <Button variant="outline" size="sm">Edit</Button>
        </div>
    </div>
);


export default function Admin() {
  const { user } = useAuth();

  // Mock data for demonstration purposes
  const mockStats: AdminStats = {
    totalUsers: 1250,
    activeJobs: 340,
    totalCompanies: 150,
    totalApplications: 5432,
    newUsersThisWeek: 45,
    newJobsThisWeek: 20,
    newCompaniesThisWeek: 5,
    newApplicationsThisWeek: 300,
  };

  const mockUsers: AdminUser[] = [
    { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', userType: 'employee', location: 'New York, USA' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', userType: 'employer', location: 'London, UK' },
    { id: '3', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', userType: 'admin', location: 'Remote' },
  ];

  const mockJobs: AdminJob[] = [
      { id: '1', title: 'Software Engineer', location: 'San Francisco, CA', isActive: true, jobType: 'Full-time', salaryMin: 120000, salaryMax: 150000 },
      { id: '2', title: 'Product Manager', location: 'New York, NY', isActive: false, jobType: 'Full-time', salaryMin: 110000, salaryMax: 140000 },
  ];

  const mockCompanies: AdminCompany[] = [
      { id: '1', name: 'TechCorp', location: 'Mountain View, CA', industry: 'Technology', size: '1000+', description: 'A leading technology company.' },
      { id: '2', name: 'Innovate Inc.', location: 'Austin, TX', industry: 'Startup', size: '50-200', description: 'An innovative startup in the AI space.' },
  ];

  const { data: stats = mockStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.userType === "admin",
  });

  const { data: users = mockUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.userType === "admin",
  });

  const { data: jobs = mockJobs } = useQuery<AdminJob[]>({
    queryKey: ["/api/admin/jobs"],
    enabled: user?.userType === "admin",
  });

  const { data: companies = mockCompanies } = useQuery<AdminCompany[]>({
    queryKey: ["/api/admin/companies"],
    enabled: user?.userType === "admin",
  });

  if (user?.userType !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4 text-2xl font-bold text-destructive">Access Denied</CardTitle>
            <CardDescription className="mt-2">
              You do not have the necessary permissions to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 bg-background text-foreground">
      <header className="flex items-center justify-between space-x-2 mb-8">
        <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers || 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} note={`${stats.newUsersThisWeek || 0} new this week`} />
        <StatCard title="Active Jobs" value={stats.activeJobs || 0} icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} note={`${stats.newJobsThisWeek || 0} posted this week`} />
        <StatCard title="Companies" value={stats.totalCompanies || 0} icon={<Building className="h-4 w-4 text-muted-foreground" />} note={`${stats.newCompaniesThisWeek || 0} new this week`} />
        <StatCard title="Applications" value={stats.totalApplications || 0} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} note={`${stats.newApplicationsThisWeek || 0} new this week`} />
      </section>

      {/* Detailed Management */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage platform users and their accounts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No users found.</p>
              ) : (
                users.map((user) => <UserListItem key={user.id} user={user} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Management</CardTitle>
              <CardDescription>Monitor and manage all job postings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No jobs found.</p>
              ) : (
                jobs.map((job) => <JobListItem key={job.id} job={job} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Company Management</CardTitle>
              <CardDescription>Oversee and manage registered companies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {companies.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No companies found.</p>
              ) : (
                companies.map((company) => <CompanyListItem key={company.id} company={company} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
