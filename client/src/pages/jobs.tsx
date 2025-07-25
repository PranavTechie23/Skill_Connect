import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Clock, DollarSign, Heart, Code, Megaphone, Users } from "lucide-react";
import JobCard from "@/components/job-card";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [jobType, setJobType] = useState("All Jobs");
  const [activeFilter, setActiveFilter] = useState("All Jobs");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/jobs", { search, location: location === "All Locations" ? undefined : location, jobType: activeFilter === "All Jobs" ? undefined : activeFilter }],
  });

  const handleSearch = () => {
    // Search is handled by the query key changes
  };

  const jobTypeFilters = ["All Jobs", "Full-time", "Part-time", "Remote", "Contract"];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Match</h1>
          <p className="text-xl text-gray-600">Search thousands of local opportunities tailored to your skills</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title or Skills</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="e.g., Web Developer, Marketing"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Locations">All Locations</SelectItem>
                      <SelectItem value="Downtown District">Downtown District</SelectItem>
                      <SelectItem value="North District">North District</SelectItem>
                      <SelectItem value="South Hills">South Hills</SelectItem>
                      <SelectItem value="East Valley">East Valley</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
                  <Button onClick={handleSearch} className="w-full">
                    Search Jobs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {jobTypeFilters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                onClick={() => setActiveFilter(filter)}
                className="rounded-full"
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Job Results */}
          <div className="space-y-6">
            {jobs && jobs.length > 0 ? (
              jobs.map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {jobs && jobs.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline">
                Load More Jobs
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
