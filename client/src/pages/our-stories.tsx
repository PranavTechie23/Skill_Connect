import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareQuote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface Story {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: {
    firstName: string;
    lastName: string;
  };
  // Support for stories submitted by non-users
  submitterName?: string;
  submitterEmail?: string;
  tags?: string[];
}

interface PaginatedResponse {
  stories: Story[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// The original three success stories to ensure they are always available for display.
// In a production environment, these would be added to the backend database.
const fallbackStories: Story[] = [
  {
    id: "fallback-1",
    title: "From Unemployed to Full-Stack Developer",
    content: "I was struggling to find a job for months. SkillConnect helped me find a company that valued my skills and now I am a full-stack developer.",
    submitterName: "Ravi Kumar",
    createdAt: "2023-10-26T10:00:00Z", // Fictional date to help with sorting
  },
  {
    id: "fallback-2",
    title: "My First Freelance Gig",
    content: "I was new to freelancing and didn't know where to start. SkillConnect helped me find my first client and now I have a steady stream of work.",
    submitterName: "Aarti Verma",
    createdAt: "2023-10-25T11:00:00Z",
  },
  {
    id: "fallback-3",
    title: "Landed My Dream Job",
    content: "I always wanted to work for a big tech company. SkillConnect helped me get an interview with my dream company and I got the job!",
    submitterName: "Neha Singh",
    createdAt: "2023-10-24T12:00:00Z",
  },
];

const StoryCard = ({ story, index }: { story: Story, index: number }) => {
  // Determine the author's name from different possible data structures
  const authorName = story.author 
    ? `${story.author.firstName} ${story.author.lastName}` 
    : story.submitterName || "Anonymous";

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 + index * 0.2 }}
        className="h-full group"
    >
        <div className="relative h-full flex flex-col rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_8px_30px_rgba(59,130,246,0.25)] hover:border-blue-400/50 dark:hover:border-blue-400/60 flex-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 pointer-events-none" />
            
            <div className="p-6 pb-4 relative z-10">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {story.title}
                </h3>
            </div>
            
            <div className="flex flex-col flex-grow justify-between p-6 pt-0 relative z-10">
                <p className="text-slate-600 dark:text-zinc-400 mb-6 line-clamp-4 leading-relaxed">
                    "{story.content}"
                </p>
                
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-200 dark:border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md">
                        {authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                          {authorName}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400/80">SkillConnect User</p>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
  );
};

export default function OurStories() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const title = t("stories.title");
  
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const storiesPerPage = 12;

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await apiFetch(`/api/stories?page=${currentPage}&limit=${storiesPerPage}`);
        if (!response.ok) throw new Error("Failed to fetch stories");
        
        const data: PaginatedResponse = await response.json();
        
        // If it's the first page, include fallback stories
        let allStories = data.stories;
        if (currentPage === 1) {
          allStories = [...allStories, ...fallbackStories];
        }

        // Sort stories by date
        allStories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setStories(allStories);
        setTotalPages(data.meta.totalPages);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load success stories.",
          variant: "destructive",
        });
        // On error, show fallback stories
        setStories(fallbackStories);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, [currentPage, toast]);

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
          className="text-center mb-16 relative"
        >
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-2xl h-32 bg-blue-500/20 dark:bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="space-y-4 relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 flex flex-wrap justify-center gap-[0.3em]">
              {title.split(" ").map((word, index) => (
                <motion.span 
                  key={word + "-" + index} 
                  variants={letterVariants}
                  className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent"
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-xl text-foreground/80 max-w-3xl mx-auto"
            >
              {t("stories.heroLine")}
            </motion.p>
          </div>
        </motion.section>

        {/* Stories Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {loading ? (
            Array.from({ length: storiesPerPage }).map((_, index) => (
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <section className="flex justify-center items-center gap-2 mb-20">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1 mx-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className="w-10 h-10 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </section>
        )}

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 border-0 dark:bg-zinc-950 p-1">
                {/* Dark mode inner glow border */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 dark:from-blue-500/50 dark:via-purple-500/50 dark:to-blue-500/50" />
                
                <div className="relative rounded-[1.4rem] bg-white/10 dark:bg-zinc-950/90 backdrop-blur-xl">
                    <div className="flex flex-col md:flex-row items-center justify-between p-8 sm:p-12 gap-8 relative z-10">
                        <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm hidden sm:flex border border-white/30 dark:border-blue-500/30">
                              <MessageSquareQuote className="h-8 w-8 text-white dark:text-blue-400" />
                            </div>
                            <div className="max-w-2xl">
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                    Share Your Success Story
                                </h2>
                                <p className="text-lg text-blue-100 dark:text-zinc-400">
                                    Has our platform helped you find success? We'd love to hear your story!
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 md:pt-0 flex-shrink-0">
                            <Button
                                size="lg"
                                onClick={handleShareClick}
                                className="bg-white text-blue-700 hover:bg-blue-50 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500 shadow-xl hover:shadow-2xl font-bold rounded-xl px-8 py-6 h-auto text-base transition-all duration-300 transform hover:-translate-y-1"
                            >
                                Submit Your Story
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
      </div>
    </div>
  );
}
