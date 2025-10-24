﻿import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareQuote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Story {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: {
    firstName: string;
    lastName:string;
  };
  // Support for stories submitted by non-users
  submitter_name?: string;
}

// The original three success stories to ensure they are always available for display.
// In a production environment, these would be added to the backend database.
const fallbackStories: Story[] = [
  {
    id: "fallback-1",
    title: "From Unemployed to Full-Stack Developer",
    content: "I was struggling to find a job for months. SkillConnect helped me find a company that valued my skills and now I am a full-stack developer.",
    submitter_name: "Ravi Kumar",
    createdAt: "2023-10-26T10:00:00Z", // Fictional date to help with sorting
  },
  {
    id: "fallback-2",
    title: "My First Freelance Gig",
    content: "I was new to freelancing and didn't know where to start. SkillConnect helped me find my first client and now I have a steady stream of work.",
    submitter_name: "Aarti Verma",
    createdAt: "2023-10-25T11:00:00Z",
  },
  {
    id: "fallback-3",
    title: "Landed My Dream Job",
    content: "I always wanted to work for a big tech company. SkillConnect helped me get an interview with my dream company and I got the job!",
    submitter_name: "Neha Singh",
    createdAt: "2023-10-24T12:00:00Z",
  },
];

const StoryCard = ({ story, index }: { story: Story, index: number }) => {
  // Determine the author's name from different possible data structures
  const authorName = story.author 
    ? `${story.author.firstName} ${story.author.lastName}` 
    : story.submitter_name || "Anonymous";

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 + index * 0.2 }}
    >
        <Card className="h-full overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">{story.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
                <p className="text-muted-foreground mb-4 line-clamp-4">
                    {story.content}
                </p>
                <p className="text-sm font-medium text-primary mt-auto pt-2">
                    - {authorName}
                </p>
            </CardContent>
        </Card>
    </motion.div>
  );
};

export default function OurStories() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const title = "Our Success Stories";
  
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        // Fetch stories from both authenticated users and public submissions, then take the latest 3
        const [storiesRes, publicStoriesRes] = await Promise.all([
          apiFetch("/api/stories").catch(e => { console.error("Failed to fetch /api/stories", e); return null; }),
          apiFetch("/api/public-stories").catch(e => { console.error("Failed to fetch /api/public-stories", e); return null; })
        ]);

        const storiesData = storiesRes && storiesRes.ok ? await storiesRes.json() : [];
        const publicStoriesData = publicStoriesRes && publicStoriesRes.ok ? await publicStoriesRes.json() : [];

        // Combine fetched stories with the fallback stories
        const combinedStories = [...storiesData, ...publicStoriesData, ...fallbackStories];

        // Remove duplicates based on title and author name, preferring fresh data over fallback
        const uniqueStories = Array.from(new Map(combinedStories.map(story => [`${story.title}-${story.submitter_name || (story.author ? `${story.author.firstName} ${story.author.lastName}` : '')}`, story])).values());

        const allStories = uniqueStories
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setStories(allStories.slice(0, 3)); // Get the 3 most recent stories
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load success stories.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, [toast]);

  const handleShareClick = () => navigate("/submit-story");

  const sentenceVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sentenceVariants}
          className="text-center mb-16"
        >
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-blue-800 dark:text-blue-400 mb-4">
              {title.split("").map((char, index) => (
                <motion.span key={char + "-" + index} variants={letterVariants}>
                  {char}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-xl text-foreground/80 max-w-3xl mx-auto"
            >
              Real experiences from people who found success through our platform.
            </motion.p>
          </div>
        </motion.section>

        {/* Stories Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="h-full">
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : stories.map((story, index) => (
              <StoryCard key={story.id} story={story} index={index} />
            ))}
        </section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
            <Card className="bg-card/80 border-border shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between p-8 sm:p-12 gap-8">
                    <div className="flex items-center space-x-6">
                        <MessageSquareQuote className="h-16 w-16 text-primary hidden sm:block" />
                        <div className="max-w-2xl">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                                Share Your Success Story
                            </h2>
                            <p className="text-lg text-muted-foreground mt-2">
                                Has our platform helped you find success? We'd love to hear your story!
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 md:pt-0 flex-shrink-0">
                        <Button
                            size="lg"
                            onClick={handleShareClick}
                            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                        >
                            Submit Your Story
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.section>
      </div>
    </div>
  );
}
