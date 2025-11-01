import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiFetch } from "@/lib/api";

// Define the schema for story submission
const storySchema = z.object({
  name: z.string().min(1, "Your name is required."),
  email: z.string().email("Please enter a valid email address."),
  tags: z.string().optional(),
  title: z.string().min(5, "Title must be at least 5 characters long."),
  content: z.string().min(20, "Story content must be at least 20 characters long."),
});

type StoryFormData = z.infer<typeof storySchema>;

export default function SubmitStory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      content: "",
      tags: "",
    },
  });

  // The form is public. Pre-fill name and email if a user is logged in for convenience.
  useEffect(() => {
    if (user) {
      form.reset({
        ...form.getValues(), // Keep any existing form data
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: StoryFormData) => {
    setLoading(true);

    // The payload should be a clean representation of the form data for public submission.
    // The backend is responsible for processing this public submission.
    // A persistent 500 error indicates the backend API needs to be updated
    // to handle this payload without requiring a pre-existing authorId.
    const storyPayload = {
      name: data.name,
      email: data.email,
      title: data.title,
      content: data.content,
      tags: data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
    };

    try {
      const response = await apiFetch("/api/stories", {
        method: "POST",
        credentials: "same-origin", // Use same-origin to avoid browser conflicts with other authenticated calls.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyPayload)
      });

      if (!response.ok) {
        // Provide more specific feedback based on the error
        if (response.status === 401) {
          throw new Error("API endpoint is not public. Please check backend configuration for /api/stories.");
        }
        // Handle other errors, especially 500 Internal Server Error
        let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // The response was not JSON, which is common for 500 errors. The status text is the best we have.
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "Success!",
        description: "Your story has been sent to review.",
      });

      form.reset(); // Clear form fields after successful submission
      // Add a small delay before navigating to let the user read the toast
      setTimeout(() => { // Redirect to home page as requested
        navigate("/");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to submit story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Share Your Story</CardTitle>
            <p className="text-muted-foreground text-sm">Share your success story with our community</p>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem> 
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem> 
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                          />
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
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a title for your story"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Story</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your experience..."
                            rows={8}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Add tags separated by commas (e.g. career, success, tips)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Story"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={loading}
                    onClick={() => navigate("/our-stories")}
                  >
                    Cancel
                  </Button>
                </div>
                </form>
              </Form>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}