import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, insertExperienceSchema } from "@shared/schema";
import { User, Plus, X, Edit2, Trash2 } from "lucide-react";
import { z } from "zod";

const profileSchema = insertUserSchema.omit({ password: true });
type ProfileData = z.infer<typeof profileSchema>;

const experienceSchema = insertExperienceSchema.omit({ userId: true });
type ExperienceData = z.infer<typeof experienceSchema>;

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [skillInput, setSkillInput] = useState("");
  const [editingExperience, setEditingExperience] = useState<string | null>(null);

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      userType: user?.userType || "job_seeker",
      location: user?.location || "",
      title: user?.title || "",
      bio: user?.bio || "",
      skills: user?.skills || [],
    },
  });

  const experienceForm = useForm<ExperienceData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
    },
  });

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["/api/experiences", { userId: user?.id }],
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const createExperienceMutation = useMutation({
    mutationFn: async (data: ExperienceData) => {
      const response = await apiRequest("POST", "/api/experiences", {
        ...data,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Experience added",
        description: "Your work experience has been added.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
      experienceForm.reset();
    },
  });

  const updateExperienceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExperienceData }) => {
      const response = await apiRequest("PUT", `/api/experiences/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Experience updated",
        description: "Your work experience has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
      setEditingExperience(null);
      experienceForm.reset();
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/experiences/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Experience deleted",
        description: "Your work experience has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
    },
  });

  const onSubmit = (data: ProfileData) => {
    updateProfileMutation.mutate(data);
  };

  const onExperienceSubmit = (data: ExperienceData) => {
    if (editingExperience) {
      updateExperienceMutation.mutate({ id: editingExperience, data });
    } else {
      createExperienceMutation.mutate(data);
    }
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = form.getValues("skills") || [];
      if (!currentSkills.includes(skillInput.trim())) {
        form.setValue("skills", [...currentSkills, skillInput.trim()]);
        setSkillInput("");
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues("skills") || [];
    form.setValue("skills", currentSkills.filter(skill => skill !== skillToRemove));
  };

  const startEditingExperience = (experience: any) => {
    setEditingExperience(experience.id);
    experienceForm.reset({
      title: experience.title,
      company: experience.company,
      description: experience.description || "",
      startDate: experience.startDate,
      endDate: experience.endDate || "",
      isCurrent: experience.isCurrent,
    });
  };

  const cancelEditingExperience = () => {
    setEditingExperience(null);
    experienceForm.reset();
  };

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        location: user.location || "",
        title: user.title || "",
        bio: user.bio || "",
        skills: user.skills || [],
      });
    }
  }, [user, form]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Please sign in</h3>
            <p className="text-gray-600">You need to be signed in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Professional Profile</h1>
        <p className="text-xl text-gray-600">Build a comprehensive profile that showcases your skills and experience</p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Photo Section */}
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="text-gray-400 h-16 w-16" />
                  </div>
                  <Button type="button" variant="outline">Upload Photo</Button>
                </div>

                {/* Basic Information */}
                <div className="md:col-span-2 space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Software Developer, Marketing Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your location" />
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
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about yourself and your experience..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Skills Section */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Skills</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Skills</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(form.watch("skills") || []).map((skill, index) => (
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
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Work Experience Section */}
      <Card>
        <CardHeader>
          <CardTitle>Work Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Experience Form */}
          <Form {...experienceForm}>
            <form onSubmit={experienceForm.handleSubmit(onExperienceSubmit)} className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={experienceForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Frontend Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={experienceForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., TechStart Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={experienceForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="month" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={experienceForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="month" 
                            {...field}
                            disabled={experienceForm.watch("isCurrent")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={experienceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3} 
                          placeholder="Describe your role and achievements..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createExperienceMutation.isPending || updateExperienceMutation.isPending}
                  >
                    {editingExperience ? "Update Experience" : "Add Experience"}
                  </Button>
                  {editingExperience && (
                    <Button type="button" variant="outline" onClick={cancelEditingExperience}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>

          {/* Experience List */}
          <div className="space-y-4">
            {experiencesLoading ? (
              <p>Loading experiences...</p>
            ) : experiences && experiences.length > 0 ? (
              experiences.map((experience: any) => (
                <div key={experience.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{experience.title}</h4>
                      <p className="text-gray-600">{experience.company}</p>
                      <p className="text-sm text-gray-500 mb-2">
                        {experience.startDate} - {experience.isCurrent ? "Present" : experience.endDate}
                      </p>
                      {experience.description && (
                        <p className="text-gray-700 text-sm">{experience.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingExperience(experience)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExperienceMutation.mutate(experience.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-8">No work experience added yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
