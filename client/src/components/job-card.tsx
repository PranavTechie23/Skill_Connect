import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, IndianRupee, Heart, Code, Megaphone, Users, Building } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
// No dialog imports needed anymore

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    skills: string[];
    company?: {
      name: string;
    };
    employer?: {
      firstName: string;
      lastName: string;
    };
    createdAt?: string;
  };
  setSelectedJob?: (job: any) => void;
  setShowQuickApply?: (show: boolean) => void;
  onCardClick?: () => void;
}

export default function JobCard({ job, setSelectedJob, setShowQuickApply, onCardClick }: JobCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const navigate = useNavigate();

  const getJobIcon = (skills: string[]) => {
    const iconColorClass = "text-foreground/90";

    if (skills.some(skill => ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Web', 'Frontend', 'Backend'].includes(skill))) {
      return <Code className={`${iconColorClass} text-xl`} />;
    }
    if (skills.some(skill => ['Marketing', 'Social Media', 'Advertising', 'SEO'].includes(skill))) {
      return <Megaphone className={`${iconColorClass} text-xl`} />;
    }
    return <Users className={`${iconColorClass} text-xl`} />;
  };

  const getSkillColor = (skill: string) => {
    if (['React', 'JavaScript', 'TypeScript', 'Node.js', 'Web', 'Frontend', 'Backend'].includes(skill)) {
      return "bg-blue-100 text-blue-800";
    }
    if (['Marketing', 'Social Media', 'Advertising', 'SEO'].includes(skill)) {
      return "bg-green-100 text-green-800";
    }
    return "bg-yellow-100 text-yellow-800";
  };

  // Removed unused functions

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salary not specified";
    if (min && max) return `₹${min / 1000}k - ₹${max / 1000}k`;
    if (min) return `₹${min / 1000}k+`;
    return `Up to ₹${max! / 1000}k`;
  };

  return (
    <Card 
      className="hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
      onClick={onCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-secondary/50 border border-border/50 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                {getJobIcon(job.skills)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground tracking-tight">{job.title}</h3>
                <p className="text-muted-foreground flex items-center">
                  {job.company ? (
                    <>
                      <Building className="h-4 w-4 mr-1" />
                      {job.company.name}
                    </>
                  ) : (
                    job.employer ? `${job.employer.firstName} ${job.employer.lastName}` : "Unknown Employer"
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <MapPin className="mr-1 h-4 w-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span className="capitalize">{job.jobType ? job.jobType.replace('_', '-') : 'Not specified'}</span>
              </div>
              <div className="flex items-center">
                <IndianRupee className="mr-1 h-4 w-4" />
                <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.isArray(job.skills) && job.skills.slice(0, 3).map((skill: string, index: number) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className={`${getSkillColor(skill)} rounded-full px-3 py-1`}
                >
                  {skill}
                </Badge>
              ))}
              {Array.isArray(job.skills) && job.skills.length > 3 && (
                <Badge variant="outline" className="rounded-full px-3">
                  +{job.skills.length - 3} more
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {job.description}
            </p>
          </div>
          <div className="flex flex-col items-end ml-6">
            <Button 
              className="mb-2 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  navigate('/signup', { state: { message: 'Register yourself on the portal to apply for this job.' } });
                  return;
                }
                if (user.userType !== 'Professional') {
                  toast({
                    title: "Access denied",
                    description: "Only job seekers can apply for jobs.",
                    variant: "destructive",
                  });
                  return;
                }
                setSelectedJob?.(job);
                setShowQuickApply?.(true);
              }}
            >
              Quick Apply
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-500 mt-2">
              {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : "Recently posted"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}