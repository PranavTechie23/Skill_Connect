
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { QuoteIcon } from "lucide-react";

const OurStories = () => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const stories = [
    {
      name: "Aarti Verma",
      role: "Small Business Owner",
      image: "/images/aarti.jpg",
      story: "SkillConnect helped me find two skilled technicians for my appliance repair shop within a week. The quality of candidates was impressive, and the hiring process was smooth.",
      date: "May 15, 2023",
    },
    {
      name: "Ravi Kumar",
      role: "Electrician",
      image: "/images/ravi.jpg",
      story: "As a freelance electrician, finding consistent work was always a challenge. With SkillConnect, I've been able to secure steady projects in my area without endless phone calls or negotiations.",
      date: "June 2, 2023",
    },
    {
      name: "Neha Singh",
      role: "Graphic Designer",
      image: "/images/neha.jpg",
      story: "The skills-based matching on SkillConnect really sets it apart. As a designer, I love how my specific skills are highlighted to potential employers, leading to more relevant job opportunities.",
      date: "June 20, 2023",
    },
    {
      name: "Amit Patel",
      role: "Tech Startup Founder",
      image: "/images/amit.jpg",
      story: "SkillConnect has been a game-changer for our startup. We've been able to tap into a pool of local tech talent that we didn't even know existed in our community.",
      date: "July 5, 2023",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Our Success Stories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Real people, real impact. Discover how SkillConnect is transforming careers and businesses in your community.
          </p>
          <Link href="/submit-story">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              Submit Your Story
            </Button>
          </Link>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {stories.map((story, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 bg-gradient-to-br from-white to-purple-50">
                <div className="flex items-center mb-4">
                  <Avatar className="h-16 w-16 mr-4 ring-2 ring-purple-300">
                    <AvatarImage src={story.image} alt={story.name} />
                    <AvatarFallback>{story.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-purple-800">{story.name}</h3>
                    <p className="text-sm text-gray-600">{story.role}</p>
                  </div>
                </div>
                <div className="relative">
                  <QuoteIcon className="absolute top-0 left-0 text-purple-200 h-8 w-8 -mt-2 -ml-2" />
                  <p className="text-gray-700 mb-4 pl-6 italic">{story.story}</p>
                </div>
                <div className="text-sm text-gray-500 mt-4 flex justify-between items-center">
                  <span>Posted on {story.date}</span>
                  <span className="text-purple-600 font-semibold">SkillConnect Success</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.section>
      </div>
    </div>
  );
};

export default OurStories;
