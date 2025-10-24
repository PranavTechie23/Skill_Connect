import JobCard from "@/components/job-card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import JobSearch from "@/components/job-search";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  skills: string[];
  companyId: string;
  employerId: string;
  isActive: boolean;
  createdAt: string;
}

interface JobsApiResponse {
  jobs: Job[];
  totalCount: number;
}

export default function Jobs() {
  const [filters, setFilters] = useState({
    location: "",
    skills: [] as string[],
    jobType: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const buildJobsQueryString = (
    filters: any,
    page: number,
    itemsPerPage: number
  ) => {
    const params = new URLSearchParams();
    if (filters.location) params.append("location", filters.location);
    if (filters.jobType) params.append("jobType", filters.jobType);
    if (filters.search) params.append("search", filters.search);
    if (filters.skills.length > 0) {
      filters.skills.forEach((skill: string) => params.append("skills", skill));
    }
    params.append("page", page.toString());
    params.append("itemsPerPage", itemsPerPage.toString());
    return params.toString();
  };

  const { data, isLoading } = useQuery<JobsApiResponse>({
    queryKey: ["/api/jobs", { ...filters, page, itemsPerPage }],
    queryFn: async (): Promise<JobsApiResponse> => {
      try {
        console.log('Fetching jobs with params:', { filters, page, itemsPerPage });
        const qs = buildJobsQueryString(filters, page, itemsPerPage);
        const response = await apiFetch(`/api/jobs?${qs}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`Failed to fetch jobs: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data || !Array.isArray(data.jobs)) {
          console.error('Invalid API response format:', data);
          throw new Error('Invalid API response format');
        }
        
        return {
          jobs: data.jobs,
          totalCount: data.totalCount || 0,
        };
      } catch (err) {
        console.error('Error fetching jobs:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const jobs = data?.jobs ?? [];
  const totalJobs = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalJobs / itemsPerPage));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover opportunities that match your skills and aspirations
          </p>
        </motion.div>

        <JobSearch onSearch={(searchFilters) => {
          setFilters(current => ({
            ...current,
            location: searchFilters.location,
            jobType: searchFilters.jobType,
            search: searchFilters.search,
            skills: current.skills // maintain existing skills
          }))
        }} />

        <div className="mt-8">
          {/* Jobs list */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Available Jobs
                </h2>
                <p className="text-gray-600">
                  {totalJobs > 0 ? `Showing ${jobs.length} of ${totalJobs} jobs` : "No jobs found"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : jobs.length > 0 ? (
                jobs.map((job: any, index: number) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No jobs found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your filters to find more opportunities
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={pageNum === page}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
