
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const OurStories = () => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const stories = [
    {
      name: "Sarah Johnson",
      title: "Found My Dream Job Locally",
      content: "Thanks to SkillConnect, I discovered an amazing opportunity right in my hometown...",
    },
    {
      name: "Mike Chen",
      title: "From Freelancer to Full-Time",
      content: "SkillConnect helped me transition from freelance gigs to a stable, full-time position...",
    },
    {
      name: "Emily Rodriguez",
      title: "Building a Team with Local Talent",
      content: "As a small business owner, finding the right talent was challenging until I found SkillConnect...",
    },
        {
      name: "Sarah Johnson",
      title: "Found My Dream Job Locally",
      content: "Thanks to SkillConnect, I discovered an amazing opportunity right in my hometown...",
    },
    {
      name: "Mike Chen",
      title: "From Freelancer to Full-Time",
      content: "SkillConnect helped me transition from freelance gigs to a stable, full-time position...",
    },
    {
      name: "Emily Rodriguez",
      title: "Building a Team with Local Talent",
      content: "As a small business owner, finding the right talent was challenging until I found SkillConnect...",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            Our Success Stories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real experiences from people who found success through SkillConnect.
          </p>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {stories.map((story, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{story.title}</h3>
                <p className="text-gray-600 mb-4">{story.content}</p>
                <p className="text-sm text-gray-500">- {story.name}</p>
              </CardContent>
            </Card>
          ))}
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Share Your Success</h2>
          <p className="text-xl text-gray-600 mb-8">
            Has SkillConnect helped you find success? We'd love to hear your story!
          </p>
          <Link href="/submit-story">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              Submit Your Story
            </Button>
          </Link>
        </motion.section>
      </div>
    </div>
  );
};

export default OurStories;
