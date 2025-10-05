import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Users, Calendar, TrendingUp, CheckCircle, Clock, XCircle, Hourglass, MapPin, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Job, Application, User } from '@shared/schema';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs', { employerId: user?.id }],
    enabled: !!user?.id && user?.userType === 'Employer',
  });

  const { data: applications = [] } = useQuery<(Application & { applicant: User; job: Job })[]>({
    queryKey: ['/api/applications', { employerId: user?.id }],
    enabled: !!user?.id && user?.userType === 'Employer',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <CheckCircle className="h-3 w-3" />;
      case 'under_review':
        return <Hourglass className="h-3 w-3" />;
      case 'interview':
        return <Clock className="h-3 w-3" />;
      case 'offered':
        return <CheckCircle className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your company's hiring process
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/employer/jobs')}>
            Manage Jobs
          </Button>
          <Button className="flex items-center space-x-2" onClick={() => navigate('/employer')}>
            <Plus className="h-4 w-4" />
            <span>Post Job</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{jobs.filter(job => job.isActive !== false).length}</div>
            <p className="text-xs text-muted-foreground">
              {jobs.length} total posted
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">
              {applications.filter(app => app.status === 'pending').length} pending review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              New applications
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">8%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Applications</span>
            </CardTitle>
            <CardDescription>Latest candidate applications</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No applications yet</p>
                  <Link to="/employer/jobs">
                    <Button className="mt-4">Post Your First Job</Button>
                  </Link>
                </div>
              ) : (
                applications.slice(0, 5).map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <div className="flex-shrink-0">
                          <p className="font-medium">{application.applicant.firstName} {application.applicant.lastName}</p>
                          <p className="text-sm text-muted-foreground">{application.applicant.title}</p>
                        </div>
                        <Badge className={getStatusColor(application.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(application.status)}
                            <span className="capitalize">{application.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Briefcase className="h-3 w-3" />
                          <span>{application.job.title}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Review</Button>
                  </div>
                ))
              )}
            </div>
            {applications.length > 0 && (
              <div className="mt-4">
                <Link to="/employer/candidates">
                  <Button variant="outline" className="w-full">View All Applications</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Active Jobs</span>
            </CardTitle>
            <CardDescription>Your current job postings</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No jobs posted yet</p>
                  <Link to="/employer/jobs/new">
                    <Button className="mt-4">Post Your First Job</Button>
                  </Link> {/* This link should probably go to the employer page with the "post-job" tab active */}
                </div>
              ) : (
                jobs.filter(job => job.isActive !== false).slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                          <p className="text-sm text-muted-foreground">{job.jobType}</p>
                        </div>
                        <Badge variant="outline">{applications.filter(app => app.job.id === job.id).length} applications</Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </div>
                        {job.salaryMin && job.salaryMax && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm">View</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {jobs.length > 0 && (
              <div className="mt-4">
                <Link to="/employer/jobs">
                  <Button variant="outline" className="w-full">Manage All Jobs</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Streamline your hiring process</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/employer/jobs/new">
              <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Plus className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-medium">Post New Job</h3>
                    <p className="text-sm text-muted-foreground">Create a job listing</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link to="/employer/candidates">
              <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium">Review Candidates</h3>
                    <p className="text-sm text-muted-foreground">Manage applications</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link to="/employer/profile">
              <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-medium">Company Profile</h3>
                    <p className="text-sm text-muted-foreground">Update company info</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}