import JobCard from "@/components/job-card";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import JobSearch from "@/components/job-search";
import { Card, CardContent } from "@/components/ui/card";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Briefcase,
  MapPin,
  Clock,
  IndianRupee,
  TrendingUp,
  Zap,
  Code,
  Palette,
  Database,
  Smartphone,
  Cloud,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
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
  company?: {
    name: string;
  };
}

interface JobsApiResponse {
  jobs: Job[];
  totalCount: number;
}

// Job icons mapping
const jobIcons = {
  software: Code,
  developer: Code,
  engineer: Code,
  frontend: Palette,
  backend: Database,
  fullstack: Code,
  mobile: Smartphone,
  cloud: Cloud,
  devops: Zap,
  design: Palette,
  data: Database,
  ai: Zap,
  machine: Zap,
  web: Code,
  application: Code,
  senior: TrendingUp,
  junior: Code,
  lead: TrendingUp,
  principal: TrendingUp,
};

const getJobIcon = (jobTitle: string) => {
  const title = jobTitle.toLowerCase();
  for (const [keyword, Icon] of Object.entries(jobIcons)) {
    if (title.includes(keyword)) {
      return Icon;
    }
  }
  return Briefcase;
};

// Animated Counter Component
const AnimatedCounter = ({
  value,
  duration = 2000,
}: {
  value: number;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView && value > 0) {
      let start = 0;
      const end = value;
      const incrementTime = Math.max(1, duration / end);

      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    } else if (isInView) {
      setCount(0);
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}</span>;
};

// Floating Element Component
const FloatingElement = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{
      duration: 0.6,
      delay,
      type: "spring",
      stiffness: 100,
    }}
    whileHover={{
      y: -5,
      transition: { duration: 0.2 },
    }}
  >
    {children}
  </motion.div>
);

export default function Jobs() {
  const [filters, setFilters] = useState({
    location: "",
    skills: [] as string[],
    jobType: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [randomizedJobs, setRandomizedJobs] = useState<Job[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalLocations: 0,
    totalJobTypes: 0,
    avgSalary: 0,
  });

  const itemsPerPage = 10;
  const statsRef = useRef(null);
  const jobsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: "-50px" });
  const isJobsInView = useInView(jobsRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);

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

  // Fetch overall stats
  const { data: overallData } = useQuery<JobsApiResponse>({
    queryKey: ["/api/jobs/overall", { ...filters }],
    queryFn: async (): Promise<JobsApiResponse> => {
      try {
        const qs = buildJobsQueryString(filters, 1, 1000);
        const response = await apiFetch(`/api/jobs?${qs}`);

        if (!response.ok) {
          throw new Error("Failed to fetch overall stats");
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.jobs)) {
          throw new Error("Invalid API response format");
        }

        return {
          jobs: data.jobs,
          totalCount: data.totalCount || 0,
        };
      } catch (err) {
        console.error("Error fetching overall stats:", err);
        return { jobs: [], totalCount: 0 };
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch paginated jobs
  const { data, isLoading } = useQuery<JobsApiResponse>({
    queryKey: ["/api/jobs", { ...filters, page, itemsPerPage }],
    queryFn: async (): Promise<JobsApiResponse> => {
      try {
        const qs = buildJobsQueryString(filters, page, itemsPerPage);
        const response = await apiFetch(`/api/jobs?${qs}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch jobs: ${response.status} ${errorText}`
          );
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.jobs)) {
          throw new Error("Invalid API response format");
        }

        return {
          jobs: data.jobs,
          totalCount: data.totalCount || 0,
        };
      } catch (err) {
        console.error("Error fetching jobs:", err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Calculate overall stats
  useEffect(() => {
    if (overallData?.jobs) {
      const allJobs = overallData.jobs;
      const uniqueLocations = new Set(allJobs.map((job) => job.location)).size;
      const uniqueJobTypes = new Set(allJobs.map((job) => job.jobType)).size;
      const totalSalary = allJobs.reduce(
        (acc, job) => acc + (job.salaryMin + job.salaryMax) / 2,
        0
      );
      const avgSalary =
        allJobs.length > 0
          ? Math.round(totalSalary / allJobs.length / 1000)
          : 0;

      setOverallStats({
        totalLocations: uniqueLocations,
        totalJobTypes: uniqueJobTypes,
        avgSalary,
      });
    }
  }, [overallData]);

  // Randomize job order
  useEffect(() => {
    if (data?.jobs) {
      const shuffled = [...data.jobs].sort(() => Math.random() - 0.5);
      setRandomizedJobs(shuffled);
    }
  }, [data?.jobs]);

  const jobs = randomizedJobs;
  const totalJobs = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalJobs / itemsPerPage));

  // Stats cards data
  const statsCards = [
    {
      icon: Briefcase,
      label: "Total Jobs",
      value: totalJobs,
      color: "blue",
      delay: 0,
    },
    {
      icon: MapPin,
      label: "Locations",
      value: overallStats.totalLocations,
      color: "green",
      delay: 0.1,
    },
    {
      icon: Clock,
      label: "Job Types",
      value: overallStats.totalJobTypes,
      color: "purple",
      delay: 0.2,
    },
    {
      icon: IndianRupee,
      label: "Avg Salary",
      value: overallStats.avgSalary,
      color: "orange",
      delay: 0.3,
      isCurrency: true,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-l-blue-500",
      },
      green: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-600 dark:text-green-400",
        border: "border-l-green-500",
      },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-l-purple-500",
      },
      orange: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-l-orange-500",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-60 right-10 w-96 h-96 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 py-8">
        <div className="container mx-auto px-4">
          {/* Hero Section with Scroll Effects */}
          <motion.div style={{ opacity, scale }} className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-6 h-6 text-yellow-500" />
              </motion.div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <AnimatedCounter value={totalJobs} duration={3000} />{" "}
                Opportunities Waiting
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Find Your Dream Job
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              Discover opportunities that match your{" "}
              <motion.span
                animate={{ color: ["#2563eb", "#7c3aed", "#2563eb"] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="font-semibold text-blue-600 dark:text-blue-400"
              >
                skills
              </motion.span>{" "}
              and{" "}
              <motion.span
                animate={{ color: ["#7c3aed", "#2563eb", "#7c3aed"] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="font-semibold text-purple-600 dark:text-purple-400"
              >
                aspirations
              </motion.span>
            </motion.p>
          </motion.div>

          {/* Enhanced Job Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-12"
          >
            <JobSearch
              onSearch={(searchFilters) => {
                setFilters((current) => ({
                  ...current,
                  location: searchFilters.location,
                  jobType: searchFilters.jobType,
                  search: searchFilters.search,
                  skills: current.skills,
                }));
                setPage(1);
              }}
            />
          </motion.div>

          <div className="mt-8">
            {/* Animated Stats Bar */}
            <div ref={statsRef}>
              {!isLoading && totalJobs > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={
                    isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
                  }
                  transition={{ duration: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >
                  {statsCards.map((stat, index) => {
                    const colorClasses = getColorClasses(stat.color);
                    return (
                      <FloatingElement key={stat.label} delay={stat.delay}>
                        <Card
                          className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-l-4 ${colorClasses.border} shadow-lg hover:shadow-xl transition-all duration-300`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              <motion.div
                                className={`p-3 ${
                                  colorClasses.bg
                                } rounded-xl border ${colorClasses.border.replace(
                                  "border-l-",
                                  "border-"
                                )}`}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <stat.icon
                                  className={`w-6 h-6 ${colorClasses.text}`}
                                />
                              </motion.div>
                              <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  {stat.label}
                                </p>
                                <motion.p
                                  className="text-2xl font-bold text-gray-900 dark:text-white"
                                  initial={{ scale: 0.5 }}
                                  animate={
                                    isStatsInView
                                      ? { scale: 1 }
                                      : { scale: 0.5 }
                                  }
                                  transition={{
                                    duration: 0.5,
                                    delay: stat.delay + 0.2,
                                  }}
                                >
                                  {stat.isCurrency ? (
                                    <>
                                      <AnimatedCounter
                                        value={stat.value}
                                        duration={2500}
                                      />
                                      k+
                                    </>
                                  ) : (
                                    <>
                                      <AnimatedCounter
                                        value={stat.value}
                                        duration={2500}
                                      />
                                      +
                                    </>
                                  )}
                                </motion.p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </FloatingElement>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Jobs List with Scroll Animations */}
            <div ref={jobsRef}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isJobsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <motion.h2
                      className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                      whileInView={{ x: [-50, 0], opacity: [0, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      Available Opportunities
                    </motion.h2>
                    <motion.p
                      className="text-gray-600 dark:text-gray-400 text-lg"
                      whileInView={{ x: [-30, 0], opacity: [0, 1] }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      {totalJobs > 0
                        ? `Showing ${Math.min(
                            itemsPerPage,
                            jobs.length
                          )} of ${totalJobs} carefully selected positions`
                        : "No jobs matching your criteria"}
                    </motion.p>
                  </div>

                  {jobs.length > 0 && (
                    <motion.div
                      className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                      whileInView={{ x: [30, 0], opacity: [0, 1] }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </motion.div>
                      <span>Sorted by relevance</span>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-6">
                  <AnimatePresence>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                        >
                          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <Skeleton className="h-12 w-12 rounded-xl bg-gray-300 dark:bg-gray-600" />
                                <div className="flex-1">
                                  <Skeleton className="h-6 w-3/4 mb-2 bg-gray-300 dark:bg-gray-600" />
                                  <Skeleton className="h-4 w-1/2 mb-4 bg-gray-300 dark:bg-gray-600" />
                                  <div className="flex gap-4">
                                    <Skeleton className="h-4 w-20 bg-gray-300 dark:bg-gray-600" />
                                    <Skeleton className="h-4 w-20 bg-gray-300 dark:bg-gray-600" />
                                    <Skeleton className="h-4 w-20 bg-gray-300 dark:bg-gray-600" />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    ) : jobs.length > 0 ? (
                      jobs.map((job: any, index: number) => {
                        const JobIcon = getJobIcon(job.title);
                        return (
                          <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.5,
                              delay: index * 0.1,
                              type: "spring",
                              stiffness: 100,
                            }}
                            whileHover={{
                              y: -8,
                              scale: 1.02,
                              transition: { duration: 0.2 },
                            }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="group"
                          >
                            <JobCard
                              job={job}
                              icon={JobIcon}
                              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm group-hover:shadow-2xl transition-all duration-300 group-hover:border-blue-300 dark:group-hover:border-blue-600"
                              hideDaysAgo={true} // Add this prop to hide "4 days ago"
                              applyButtonSize="lg" // Add this prop for bigger apply button
                            />
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-sm">
                          <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <Briefcase className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                              No jobs found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 max-w-md mx-auto">
                              We couldn't find any jobs matching your current
                              filters. Try adjusting your search criteria or
                              browse all available positions.
                            </p>
                            <Button
                              onClick={() => {
                                setFilters({
                                  location: "",
                                  skills: [],
                                  jobType: "",
                                  search: "",
                                });
                                setPage(1);
                              }}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 text-lg"
                            >
                              View All Jobs
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-12"
                  >
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                      <CardContent className="p-6">
                        <Pagination>
                          <PaginationContent className="flex items-center justify-between w-full">
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setPage(Math.max(1, page - 1))}
                                className={`flex items-center gap-2 ${
                                  page === 1
                                    ? "pointer-events-none opacity-50 text-gray-400 dark:text-gray-600"
                                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                }`}
                              />
                            </PaginationItem>

                            <div className="flex items-center gap-2">
                              {Array.from(
                                { length: Math.min(5, totalPages) },
                                (_, i) => {
                                  let pageNum;
                                  if (totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (page <= 3) {
                                    pageNum = i + 1;
                                  } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                  } else {
                                    pageNum = page - 2 + i;
                                  }

                                  return (
                                    <PaginationItem key={pageNum}>
                                      <PaginationLink
                                        onClick={() => setPage(pageNum)}
                                        isActive={pageNum === page}
                                        className={`font-semibold ${
                                          pageNum === page
                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
                                            : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-transparent"
                                        }`}
                                      >
                                        {pageNum}
                                      </PaginationLink>
                                    </PaginationItem>
                                  );
                                }
                              )}

                              {totalPages > 5 && page < totalPages - 2 && (
                                <>
                                  <span className="text-gray-400 dark:text-gray-600 mx-1">
                                    ...
                                  </span>
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() => setPage(totalPages)}
                                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                      {totalPages}
                                    </PaginationLink>
                                  </PaginationItem>
                                </>
                              )}
                            </div>

                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setPage(Math.min(totalPages, page + 1))
                                }
                                className={`flex items-center gap-2 ${
                                  page === totalPages
                                    ? "pointer-events-none opacity-50 text-gray-400 dark:text-gray-600"
                                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                }`}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>

                        <div className="text-center mt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Page {page} of {totalPages} • {totalJobs} total
                            opportunities
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}