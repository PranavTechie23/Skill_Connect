import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertJobSchema, insertCompanySchema } from "@shared/schema";
import { Building, Plus, X, Eye, Users, MapPin, Clock, DollarSign } from "lucide-react";
import { z } from "zod";

const jobSchema = insertJobSchema.omit({ employerId: true });
type JobData = z.infer<typeof jobSchema>;

const companySchema = insertCompanySchema.omit({ ownerId: true });
type CompanyData = z.infer<typeof companySchema>;

export default function Employers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [skillInput, setSkillInput] = useState("");

  const jobForm = useForm<JobData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      location: "",
      jobType: "full-time",
      salaryMin: undefined,
      salaryMax: undefined,
      skills: [],
      companyId: "",
      isActive: true,
    },
  });

  const companyForm = useForm<CompanyData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      location: "",
      size: "",
      industry: "",
      logo: "",
    },
  });

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["/api/companies", { ownerId: user?.id }],
    enabled: !!user?.id && user?.userType === 'employer',
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/jobs", { employerId: user?.id }],
    enabled: !!user?.id && user?.userType === 'employer',
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobData) => {
      const response = await apiRequest("POST", "/api/jobs", {
        ...data,
        employerId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job posted successfully",
        description: "Your job posting is now live and visible to job seekers.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      jobForm.reset();
      setSkillInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post job",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyData) => {
      const response = await apiRequest("POST", "/api/companies", {
        ...data,
        ownerId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Company created successfully",
        description: "Your company profile has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      companyForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create company",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onJobSubmit = (data: JobData) => {
    createJobMutation.mutate(data);
  };

  const onCompanySubmit = (data: CompanyData) => {
    createCompanyMutation.mutate(data);
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = jobForm.getValues("skills") || [];
      if (!currentSkills.includes(skillInput.trim())) {
        jobForm.setValue("skills", [...currentSkills, skillInput.trim()]);
        setSkillInput("");
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = jobForm.getValues("skills") || [];
    jobForm.setValue("skills", currentSkills.filter(skill => skill !== skillToRemove));
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salary not specified";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  if (!user || user.userType !== 'employer') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access denied</h3>
            <p className="text-gray-600">Only employers can access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Employer Dashboard</h1>
        <p className="text-xl text-gray-600">Manage your company profile and job postings</p>
      </div>

      <Tabs defaultValue="post-job" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="post-job">Post a Job</TabsTrigger>
          <TabsTrigger value="my-jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="post-job">
          <Card>
            <CardHeader>
              <CardTitle>Post a New Job</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...jobForm}>
                <form onSubmit={jobForm.handleSubmit(onJobSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={jobForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Senior Frontend Developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="jobType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full-time">Full-time</SelectItem>
                              <SelectItem value="part-time">Part-time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="remote">Remote</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={jobForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Downtown District">Downtown District</SelectItem>
                              <SelectItem value="North District">North District</SelectItem>
                              <SelectItem value="South Hills">South Hills</SelectItem>
                              <SelectItem value="East Valley">East Valley</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companies?.map((company: any) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={jobForm.control}
                      name="salaryMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Salary</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="50000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="salaryMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Salary</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="80000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={jobForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={6}
                            placeholder="Describe the role, responsibilities, and what you're looking for..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={4}
                            placeholder="List the required qualifications, experience, and skills..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Skills Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(jobForm.watch("skills") || []).map((skill, index) => (
                        <Badge key={index} variant="default" className="flex items-center">
                          {skill}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-auto p-0 text-white hover:text-gray-300"
                            onClick={() => removeSkill(skill)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Type a skill and press Add"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" onClick={addSkill}>Add</Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={createJobMutation.isPending}
                    className="w-full"
                  >
                    {createJobMutation.isPending ? "Posting Job..." : "Post Job"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-jobs">
          <Card>
            <CardHeader>
              <CardTitle>My Job Postings</CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <p>Loading your jobs...</p>
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job: any) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-4">{job.title}</h3>
                            <Badge variant={job.isActive ? "default" : "secondary"}>
                              {job.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 space-x-4 mb-2">
                            <div className="flex items-center">
                              <MapPin className="mr-1 h-4 w-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-4 w-4" />
                              <span className="capitalize">{job.jobType.replace('_', '-')}</span>
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="mr-1 h-4 w-4" />
                              <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm mb-3 line-clamp-2">{job.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {job.skills.slice(0, 3).map((skill: string, index: number) => (
                              <Badge key={index} variant="outline">{skill}</Badge>
                            ))}
                            {job.skills.length > 3 && (
                              <Badge variant="outline">+{job.skills.length - 3} more</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-6">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs posted yet</h3>
                  <p className="text-gray-600 mb-4">Start by posting your first job to attract local talent.</p>
                  <Button onClick={() => document.querySelector('[value="post-job"]')?.click()}>
                    Post Your First Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {companies && companies.length > 0 ? (
                <div className="space-y-6">
                  {companies.map((company: any) => (
                    <div key={company.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                          <Building className="text-gray-400 h-8 w-8" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{company.name}</h3>
                          <p className="text-gray-600 mb-2">{company.description}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>{company.location}</span>
                            <span>{company.size}</span>
                            <span>{company.industry}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                </div>
              ) : null}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {companies && companies.length > 0 ? "Add Another Company" : "Create Company Profile"}
                </h3>
                
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={companyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., TechStart Solutions" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={companyForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={4}
                              placeholder="Describe your company, mission, and culture..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-3 gap-6">
                      <FormField
                        control={companyForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Downtown District">Downtown District</SelectItem>
                                <SelectItem value="North District">North District</SelectItem>
                                <SelectItem value="South Hills">South Hills</SelectItem>
                                <SelectItem value="East Valley">East Valley</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Size</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="201-500">201-500 employees</SelectItem>
                                <SelectItem value="500+">500+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Retail">Retail</SelectItem>
                                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={createCompanyMutation.isPending}
                    >
                      {createCompanyMutation.isPending ? "Creating Company..." : "Create Company"}
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
