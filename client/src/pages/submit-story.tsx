
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const SubmitStory = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    title: "",
    story: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prevData => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/submit-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Story Submitted",
          description: "Thank you for sharing your story with us!",
        });
        setFormData({ name: "", email: "", role: "", title: "", story: "" });
      } else {
        throw new Error('Failed to submit story');
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your story. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 py-12">
      <motion.div 
        className="max-w-2xl mx-auto px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Submit Your Story</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
              </div>
              <div>
                <Label htmlFor="role">Your Role</Label>
                <Input id="role" value={formData.role} onChange={handleChange} placeholder="e.g., Graphic Designer, Small Business Owner" required />
              </div>
              <div>
                <Label htmlFor="title">Story Title</Label>
                <Input id="title" value={formData.title} onChange={handleChange} placeholder="My SkillConnect Success Story" required />
              </div>
              <div>
                <Label htmlFor="story">Your Story</Label>
                <Textarea 
                  id="story" 
                  value={formData.story}
                  onChange={handleChange}
                  placeholder="Share your experience with SkillConnect..." 
                  className="min-h-[200px]"
                  required 
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Submit Your Story
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SubmitStory;
