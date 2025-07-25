import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertMessageSchema } from "@shared/schema";
import { Send, MessageSquare, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";

const messageSchema = insertMessageSchema.omit({ senderId: true });
type MessageData = z.infer<typeof messageSchema>;

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const form = useForm<MessageData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      receiverId: "",
      applicationId: "",
      content: "",
      isRead: false,
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages", { userId: user?.id }],
    enabled: !!user?.id,
  });

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ["/api/messages", { userId: user?.id, otherUserId: selectedConversation }],
    enabled: !!user?.id && !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageData) => {
      const response = await apiRequest("POST", "/api/messages", {
        ...data,
        senderId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("PUT", `/api/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  const onSubmit = (data: MessageData) => {
    if (selectedConversation) {
      sendMessageMutation.mutate({
        ...data,
        receiverId: selectedConversation,
      });
    }
  };

  // Group messages by conversation
  const conversations = messages ? messages.reduce((acc: any, message: any) => {
    const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        otherUserId,
        otherUser: message.senderId === user?.id ? message.receiver : message.sender,
        lastMessage: message,
        unreadCount: 0,
      };
    }
    
    // Update with latest message
    if (new Date(message.createdAt) > new Date(acc[otherUserId].lastMessage.createdAt)) {
      acc[otherUserId].lastMessage = message;
    }
    
    // Count unread messages
    if (!message.isRead && message.receiverId === user?.id) {
      acc[otherUserId].unreadCount++;
    }
    
    return acc;
  }, {}) : {};

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Please sign in</h3>
            <p className="text-gray-600">You need to be signed in to view messages.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Messages</h1>
        <p className="text-xl text-gray-600">Connect with employers and job seekers</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 h-[600px]">
        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {messagesLoading ? (
                <div className="p-4">Loading conversations...</div>
              ) : Object.keys(conversations).length > 0 ? (
                <div className="space-y-1">
                  {Object.values(conversations).map((conv: any) => (
                    <div
                      key={conv.otherUserId}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                        selectedConversation === conv.otherUserId ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv.otherUserId)}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.otherUser?.profilePhoto || ""} />
                          <AvatarFallback>
                            {conv.otherUser ? 
                              `${conv.otherUser.firstName?.[0]}${conv.otherUser.lastName?.[0]}` : 
                              <User className="h-4 w-4" />
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conv.otherUser ? 
                                `${conv.otherUser.firstName} ${conv.otherUser.lastName}` : 
                                'Unknown User'
                              }
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-primary text-white text-xs rounded-full px-2 py-1">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conv.lastMessage.content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Messages will appear here when you start conversations</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle>
                    {(() => {
                      const conv = conversations[selectedConversation];
                      return conv?.otherUser ? 
                        `${conv.otherUser.firstName} ${conv.otherUser.lastName}` : 
                        'Unknown User';
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[500px]">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {conversationLoading ? (
                      <div className="text-center">Loading messages...</div>
                    ) : conversation && conversation.length > 0 ? (
                      <div className="space-y-4">
                        {conversation.map((message: any) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.senderId === user?.id
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.senderId === user?.id
                                    ? 'text-blue-100'
                                    : 'text-gray-500'
                                }`}
                              >
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation below</p>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-2">
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Type your message..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={sendMessageMutation.isPending}
                          size="icon"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </Form>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MessageSquare className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
