import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Send, Paperclip, Smile, MoreVertical, Calendar, Briefcase, ClipboardList, Loader2, Mail, Link2 } from 'lucide-react';
import { MessageDeliveryTicks, messageDeliveryStatus } from '@/components/message-delivery-ticks';
import { useTheme } from "@/components/theme-provider";
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/notifications-service';
import { getInitials } from '@/lib/employer-service';
import AdminBackButton from "@/components/AdminBackButton";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { employerPageTitleClass } from '@/lib/employer-page-styles';

interface MessagesProps {
  embedded?: boolean;
}

type RawMessage = Record<string, unknown>;

function normalizeMessage(m: RawMessage) {
  return {
    id: String(m.id ?? ''),
    senderId: String(m.senderId ?? m.sender_id ?? ''),
    receiverId: String(m.receiverId ?? m.receiver_id ?? ''),
    content: String(m.content ?? ''),
    isRead: Boolean(m.isRead ?? m.is_read),
    createdAt: String(m.createdAt ?? m.created_at ?? ''),
    senderDisplayName: String(m.senderDisplayName ?? m.sender_display_name ?? ''),
    receiverDisplayName: String(m.receiverDisplayName ?? m.receiver_display_name ?? ''),
  };
}

const GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-green-500 to-emerald-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500',
];

export default function Messages({ embedded = false }: MessagesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const initialPeer = (location.state as { peerId?: string } | null)?.peerId ?? null;

  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(initialPeer);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialPeer) setSelectedPeerId(initialPeer);
  }, [initialPeer]);

  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      const res = await apiFetch('/api/messages');
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map((m: RawMessage) => normalizeMessage(m));
    },
    enabled: !!user?.id,
    refetchInterval: 20_000,
  });

  const conversations = useMemo(() => {
    if (!user?.id) return [];
    const map = new Map<string, {
      id: string;
      name: string;
      position: string;
      avatar: string;
      lastMessage: string;
      time: string;
      unread: number;
      online: boolean;
      status: 'read' | 'typing';
      gradient: string;
      sortAt: string;
    }>();

    allMessages.forEach((msg, i) => {
      const isOutbound = msg.senderId === user.id;
      const peerId = isOutbound ? msg.receiverId : msg.senderId;
      if (!peerId || peerId === user.id) return;
      const displayName =
        (isOutbound ? msg.receiverDisplayName : msg.senderDisplayName)?.trim() ||
        peerNames[peerId]?.trim() ||
        'Candidate';
      const unreadAdd = msg.receiverId === user.id && !msg.isRead ? 1 : 0;
      const existing = map.get(peerId);
      if (!existing || msg.createdAt > existing.sortAt) {
        map.set(peerId, {
          id: peerId,
          name: displayName,
          position: 'Applicant',
          avatar: getInitials(displayName),
          lastMessage: msg.content,
          time: msg.createdAt ? formatRelativeTime(msg.createdAt) : '',
          unread: (existing?.unread ?? 0) + unreadAdd,
          online: false,
          status: 'read',
          gradient: GRADIENTS[i % GRADIENTS.length],
          sortAt: msg.createdAt,
        });
      } else if (existing) {
        map.set(peerId, { ...existing, unread: existing.unread + unreadAdd });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.sortAt.localeCompare(a.sortAt));
  }, [allMessages, user?.id, peerNames]);

  useEffect(() => {
    if (!user?.id) return;
    const missing = new Set<string>();
    for (const msg of allMessages) {
      const peerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      const display = msg.senderId === user.id ? msg.receiverDisplayName : msg.senderDisplayName;
      if (peerId && !display?.trim() && !peerNames[peerId]) missing.add(peerId);
    }
    missing.forEach(async (id) => {
      try {
        const res = await apiFetch(`/api/users/${id}`);
        if (!res.ok) return;
        const u = await res.json();
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
        if (name) setPeerNames((prev) => ({ ...prev, [id]: name }));
      } catch { /* ignore */ }
    });
  }, [allMessages, user?.id, peerNames]);

  const { data: threadMessages = [] } = useQuery({
    queryKey: ['messages', user?.id, selectedPeerId],
    queryFn: async () => {
      if (!selectedPeerId) return [];
      const res = await apiFetch(`/api/messages?otherUserId=${selectedPeerId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map((m: RawMessage) => normalizeMessage(m));
    },
    enabled: !!user?.id && !!selectedPeerId,
    refetchInterval: 10_000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !selectedPeerId) throw new Error('Select a conversation first');
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, receiverId: selectedPeerId, content }),
      });
      if (!res.ok) {
        let detail = 'Failed to send message';
        try {
          const err = await res.json();
          detail = String(err.message ?? err.error ?? detail);
        } catch { /* ignore */ }
        throw new Error(detail);
      }
      return res.json();
    },
    onSuccess: () => {
      setMessage('');
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (e: Error) => {
      toast({
        title: 'Could not send message',
        description: e.message,
        variant: 'destructive',
      });
    },
  });

  const sendMessage = () => {
    const text = message.trim();
    if (!text || !selectedPeerId || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const currentChat = conversations.find((c) => c.id === selectedPeerId);
  const currentMessages = threadMessages.map((msg) => ({
    id: msg.id,
    sender: msg.senderId === user?.id ? 'me' : 'them',
    text: msg.content,
    time: msg.createdAt ? formatRelativeTime(msg.createdAt) : '',
    status: msg.isRead ? 'read' as const : 'delivered' as const,
  }));
  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.position.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const shareJobLink = () => {
    const jobsUrl = `${window.location.origin}/employer/jobs`;
    void navigator.clipboard.writeText(jobsUrl).then(() => {
      toast({ title: 'Link copied', description: 'Job management link copied — paste it in the chat.' });
    });
  };

  const { theme } = useTheme();
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const inputClass = darkMode
    ? 'bg-slate-800/80 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:ring-violet-500/25 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0'
    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-500/20 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0';

  return (
    <div className={`${embedded ? 'min-h-full' : 'min-h-screen'} ${embedded ? 'bg-transparent' : darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gray-50'}`}>
      {!embedded && (
        <div className="mb-6 p-6">
          <AdminBackButton />
        </div>
      )}
      {/* Animated background */}
      {!embedded && darkMode && <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>}

      <div className={`relative ${embedded ? 'w-full' : 'container mx-auto max-w-7xl'} ${embedded ? 'p-2' : 'p-6'}`}>
        {/* Header */}
        <div className="mb-6">
          <h1 className={employerPageTitleClass(darkMode)}>Messages</h1>
        </div>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <div className={`col-span-12 lg:col-span-4 ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white border border-gray-200'} rounded-2xl overflow-hidden flex flex-col`}>
            {/* Search Bar */}
            <div className={`p-4 border-b ${darkMode ? 'border-slate-700/50' : 'border-gray-200'}`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all text-sm ${inputClass}`}
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedPeerId(conv.id)}
                  className={`p-4 border-b ${darkMode ? 'border-slate-700/30' : 'border-gray-200'} cursor-pointer transition-all ${selectedPeerId === conv.id ? darkMode ? 'bg-slate-700/50 border-l-4 border-l-blue-500' : 'bg-blue-50 border-l-4 border-l-blue-500' : darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-100'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${conv.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {conv.avatar}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{conv.name}</h3>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} flex-shrink-0 ml-2`}>{conv.time}</span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate mb-1`}>{conv.position}</p>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} truncate flex-1`}>
                          {conv.lastMessage}
                        </p>
                        {conv.unread > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium flex-shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`col-span-12 lg:col-span-8 ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white border border-gray-200'} rounded-2xl overflow-hidden flex flex-col`}>
            {selectedPeerId ? (
              <>
            {/* Chat Header */}
            {currentChat && (
              <div className={`p-4 border-b ${darkMode ? 'border-slate-700/50' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentChat.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {currentChat.avatar}
                    </div>
                  </div>
                  <div>
                    <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentChat.name}</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{currentChat.position}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Schedule interview"
                    className={`p-2 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}
                  >
                    <Calendar className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-blue-400 transition-colors`} />
                  </button>
                  <button
                    type="button"
                    title="View application"
                    className={`p-2 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}
                  >
                    <Briefcase className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-purple-400 transition-colors`} />
                  </button>
                  <button
                    type="button"
                    title="Interview notes"
                    className={`p-2 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}
                  >
                    <ClipboardList className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-amber-500 transition-colors`} />
                  </button>
                  <button
                    type="button"
                    title="Share job posting link"
                    onClick={shareJobLink}
                    className={`p-2 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}
                  >
                    <Link2 className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-emerald-400 transition-colors`} />
                  </button>
                  <button
                    type="button"
                    title="More options"
                    className={`p-2 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}
                  >
                    <MoreVertical className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-gray-200 transition-colors`} />
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentMessages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${msg.sender === 'me' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl p-4 ${msg.sender === 'me' ? darkMode ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' : 'bg-blue-500 text-white' : darkMode ? 'bg-slate-700/50 text-gray-100' : 'bg-gray-200 text-gray-900'}`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>{msg.time}</span>
                      {msg.sender === 'me' && (
                        <MessageDeliveryTicks
                          status={messageDeliveryStatus(msg.status === 'read')}
                          onOwnBubble
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {false && currentChat?.status === 'typing' && (
                <div className="flex justify-start">
                  <div className={`${darkMode ? 'bg-slate-700/50' : 'bg-gray-200'} rounded-2xl p-4 max-w-[70%]`}>
                    <div className="flex gap-1">
                      <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`}></div>
                      <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                      <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className={`p-4 border-t ${darkMode ? 'border-slate-700/50' : 'border-gray-200'}`}>
              <div className="flex items-end gap-2 min-w-0">
                <button
                  type="button"
                  className={cn(
                    'p-2.5 rounded-xl transition-colors shrink-0',
                    darkMode ? 'text-gray-400 hover:bg-slate-700/50' : 'text-gray-500 hover:bg-gray-100',
                  )}
                  aria-label="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={1}
                  className={cn(
                    'flex-1 min-w-0 px-4 py-2.5 rounded-xl resize-none text-sm outline-none transition-colors max-h-28 border',
                    inputClass
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  className={cn(
                    'p-2.5 rounded-xl transition-colors shrink-0 hidden sm:block',
                    darkMode ? 'text-gray-400 hover:bg-slate-700/50' : 'text-gray-500 hover:bg-gray-100',
                  )}
                  aria-label="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  disabled={!message.trim() || !selectedPeerId || sendMutation.isPending}
                  onClick={sendMessage}
                  aria-label="Send message"
                  className={cn(
                    'p-2.5 rounded-xl transition-all shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center',
                    !message.trim() || !selectedPeerId
                      ? darkMode
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : darkMode
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-blue-500/25'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30',
                  )}
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
                    darkMode
                      ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/20 ring-1 ring-slate-600/50'
                      : 'bg-gradient-to-br from-blue-100 to-purple-100'
                  }`}
                >
                  <Mail className={`w-8 h-8 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select a conversation
                </h3>
                <p className={`text-sm max-w-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
