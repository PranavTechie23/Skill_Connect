import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Clock, CheckCircle, Calendar, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export default function Applications() {
  const { user } = useAuth();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["/api/applications", { applicantId: user?.id }],
    enabled: !!user?.id && user?.userType === 'job_seeker',
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <Send className="text-blue-600 h-4 w-4" />;
      case 'under_review':
        return <Clock className="text-yellow-600 h-4 w-4" />;
      case 'interview':
        return <CheckCircle className="text-green-600 h-4 w-4" />;
      case 'offered':
        return <CheckCircle className="text-green-600 h-4 w-4" />;
      case 'rejected':
        return <Clock className="text-red-600 h-4 w-4" />;
      default:
        return <Clock className="text-gray-600 h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return "bg-blue-100 text-blue-800";
      case 'under_review':
        return "bg-yellow-100 text-yellow-800";
      case 'interview':
        return "bg-green-100 text-green-800";
      case 'offered':
        return "bg-green-100 text-green-800";
      case 'rejected':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salary not specified";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  if (!user || user.userType !== 'job_seeker') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access denied</h3>
            <p className="text-gray-600">Only job seekers can view applications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Applications</h1>
          <p className="text-xl text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Applications</h1>
        <p className="text-xl text-gray-600">Stay organized and never lose track of your job application progress</p>
      </div>

      <Card>
        <CardContent className="p-8">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button variant="default" className="rounded-lg">All Applications</Button>
            <Button variant="outline" className="rounded-lg">Applied</Button>
            <Button variant="outline" className="rounded-lg">Under Review</Button>
            <Button variant="outline" className="rounded-lg">Interview</Button>
            <Button variant="outline" className="rounded-lg">Offered</Button>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {applications && applications.length > 0 ? (
              applications.map((application: any) => (
                <div key={application.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-4">
                          {application.job?.title || "Unknown Job"}
                        </h3>
                        <Badge className={getStatusColor(application.status)}>
                          {formatStatus(application.status)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {application.company?.name || (application.job?.employer ? 
                          `${application.job.employer.firstName} ${application.job.employer.lastName}` : 
                          "Unknown Company"
                        )}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>
                          Applied {application.appliedAt ? 
                            formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true }) : 
                            "recently"
                          }
                        </span>
                        <span>{application.job?.location}</span>
                        <span>{formatSalary(application.job?.salaryMin, application.job?.salaryMax)}</span>
                      </div>
                      
                      {application.status === 'interview' && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800 flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            Interview details will be shared by the employer
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {getStatusIcon(application.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Start applying to jobs to track your applications here.</p>
                <Button onClick={() => window.location.href = '/jobs'}>
                  Browse Jobs
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
