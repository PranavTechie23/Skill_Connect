import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Eye } from 'lucide-react';

interface Story {
  id: number;
  name: string;
  email: string;
  title: string;
  content: string;
  approved: boolean;
  createdAt: string;
}

export default function AdminStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await apiFetch('/api/admin/stories', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stories');
      const data = await response.json();
      setStories(data);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (storyId: number, approved: boolean) => {
    try {
      const response = await apiFetch(`/api/admin/stories/${storyId}/approval`, {
        method: 'PUT',
        body: JSON.stringify({ approved }),
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to update story');

      const updatedStory = await response.json();
      setStories(stories.map(story => 
        story.id === storyId ? updatedStory : story
      ));

      toast.success(approved ? "Story approved!" : "Story rejected");
    } catch (error) {
      console.error('Error updating story:', error);
      toast.error("Failed to update story status");
    }
  };

  if (!user || user.userType !== 'Admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Success Stories Management</CardTitle>
          <CardDescription>
            Review and manage success stories submitted by users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  {stories.length}
                </CardTitle>
                <CardDescription>Total Stories</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-green-600">
                  {stories.filter(story => story.approved).length}
                </CardTitle>
                <CardDescription>Approved Stories</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-amber-600">
                  {stories.filter(story => !story.approved).length}
                </CardTitle>
                <CardDescription>Pending Review</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.map((story) => (
                <TableRow key={story.id}>
                  <TableCell className="font-medium">{story.title.replace(/\s*-\s*[^\s@]+@[^\s@]+\.[^\s@]+$/, '')}</TableCell>
                  <TableCell>{story.name}</TableCell>
                  <TableCell>
                    {new Date(story.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      story.approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {story.approved ? 'Approved' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedStory(story)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleApproval(story.id, true)}
                        disabled={story.approved}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleApproval(story.id, false)}
                        disabled={!story.approved}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Story Preview Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{selectedStory.title}</CardTitle>
              <CardDescription>
                By {selectedStory.name} • {new Date(selectedStory.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{selectedStory.content}</p>
            </CardContent>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedStory(null)}
              >
                Close
              </Button>
              {!selectedStory.approved && (
                <Button
                  onClick={() => {
                    handleApproval(selectedStory.id, true);
                    setSelectedStory(null);
                  }}
                >
                  Approve Story
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}