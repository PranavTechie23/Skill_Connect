import JobCard from "@/components/job-card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import JobSearch from "@/components/job-search";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, DollarSign, TrendingUp, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { RadixDropdownMenuDemo } from "@/components/RadixDropdownMenuDemo";
import { JobCategoryDropdown } from "@/components/JobCategoryDropdown";

export default function Jobs() {
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    jobType: "",
    skills: [] as string[],
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['Technology', 'Design', 'Marketing', 'Sales', 'Customer Service'];

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/jobs", { ...filters, page, itemsPerPage }],
    queryFn: async () => {
      const qs = buildJobsQueryString(filters, page, itemsPerPage);
      const response = await fetch(`/api/jobs${qs ? `?${qs}` : ""}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = (next: { search: string; location: string; jobType: string }) => {
    setPage(1);
    setFilters(prev => ({ ...prev, ...next }));
  };

  const jobTypes = ["All Jobs", "Full-time", "Part-time", "Remote", "Contract"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">Find Your Perfect Job</h1>
          <JobSearch onSearch={handleSearch} className="mb-8" />
        </motion.div>

        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {jobTypes.map((type) => (
            <Button
              key={type}
              variant={filters.jobType === type ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, jobType: type }))}
              className="rounded-full"
              size="sm"
            >
              {type === "All Jobs" ? <Briefcase className="mr-2 h-4 w-4" /> : null}
              {type}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-2/3 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {jobs.map((job: any) => (
              <JobCard key={job.id} job={job} />
            ))}
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(jobs.length / itemsPerPage)}
              onPageChange={setPage}
            />
          </motion.div>
        ) : (
          <Card className="text-center p-12">
            <CardContent>
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-semibold mb-4">Job Search Tips</h2>
          <ul className="space-y-2">
            <li className="flex items-center"><MapPin className="mr-2 h-5 w-5 text-purple-500" /> Use location filters to find jobs near you</li>
            <li className="flex items-center"><Clock className="mr-2 h-5 w-5 text-pink-500" /> Set job type preferences (Full-time, Part-time, etc.)</li>
            <li className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-orange-500" /> Compare salary ranges across different positions</li>
            <li className="flex items-center"><Filter className="mr-2 h-5 w-5 text-blue-500" /> Use multiple filters to narrow down your search</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
