import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { apiFetch } from "../lib/api";

interface Story {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  author?: {
    firstName: string;
    lastName: string;
  };
  // Support for stories submitted by non-users from the public form
  submitter_name?: string;
}

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    try {
      // The `/api/stories` endpoint should return all approved stories,
      // both from authenticated users and public submissions.
      const response = await apiFetch("/api/stories");
      if (!response.ok) throw new Error("Failed to fetch stories");
      const allStories = await response.json();

      setStories(allStories);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleShareClick = () => {
    navigate("/submit-story"); // Allow public submission
  };

  if (loading) {
    return <div className="p-8 text-center">Loading stories...</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Success Stories</h1>
          <Button onClick={handleShareClick}>Share Your Story</Button>
        </div>

        {stories.length === 0 ? (
          <Card className="p-6 text-center">
            <p>No stories yet. Be the first to share your success story!</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {stories.map((story) => (
              <Card key={story.id} className="p-6">
                <h2 className="text-2xl font-semibold mb-2">{story.title}</h2>
                <p className="text-sm text-muted-foreground mb-4 capitalize">
                  By{" "}
                  {story.author
                    ? `${story.author.firstName} ${story.author.lastName}`
                    : story.submitter_name || "Anonymous"}
                  {" • "}
                  {new Date(story.createdAt).toLocaleDateString()}
                </p>
                <p className="whitespace-pre-wrap">{story.content}</p>
                {story.tags && story.tags.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {story.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};