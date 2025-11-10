import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { storiesApi, type Story } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Eye } from 'lucide-react';

export function AdminStoryReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingStories();
  }, []);

  const loadPendingStories = async () => {
    try {
      setLoading(true);
      const response = await storiesApi.getPendingStories();
      setStories(response.stories || []);
    } catch (error) {
      console.error('Failed to load stories:', error);
      toast({
        title: "Error loading stories",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (storyId: string, status: Story['status']) => {
    try {
      await storiesApi.updateStoryStatus(storyId, status);
      
      // Update local state
      setStories(stories.filter(story => story.id !== storyId));
      
      toast({
        title: `Story ${status}`,
        description: `The story has been ${status} successfully.`,
        variant: status === 'approved' ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Failed to update story status:', error);
      toast({
        title: "Error updating story",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Access Denied
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You don't have permission to access this page.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent 
                   text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 
                   hover:bg-blue-700 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-blue-500"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Story Review Dashboard
      </h1>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          No stories pending review.
        </div>
      ) : (
        <div className="grid gap-6">
          {stories.map((story) => (
            <div
              key={story.id}
              className="border dark:border-gray-700 rounded-lg p-6 
                       bg-white dark:bg-gray-800 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {story.title}
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {story.content}
                  </p>
                  {story.tags && story.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {story.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                                   text-xs font-medium bg-blue-100 text-blue-800
                                   dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(story.id!, 'approved')}
                    className="inline-flex items-center p-2 border border-transparent 
                             rounded-full text-green-600 hover:bg-green-100
                             dark:text-green-400 dark:hover:bg-green-900/30"
                    title="Approve"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(story.id!, 'rejected')}
                    className="inline-flex items-center p-2 border border-transparent 
                             rounded-full text-red-600 hover:bg-red-100
                             dark:text-red-400 dark:hover:bg-red-900/30"
                    title="Reject"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/stories/${story.id}`)}
                    className="inline-flex items-center p-2 border border-transparent 
                             rounded-full text-gray-600 hover:bg-gray-100
                             dark:text-gray-400 dark:hover:bg-gray-700"
                    title="View Details"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Submitted {new Date(story.createdAt!).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}