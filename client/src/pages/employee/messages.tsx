import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Paperclip, Smile,
  Send, Loader2, MessageSquare, Mail,
  Phone, Video, MoreHorizontal, Briefcase, Lock,
} from 'lucide-react';
import { MessageDeliveryTicks, messageDeliveryStatus } from '@/components/message-delivery-ticks';
import { useTheme } from "@/components/theme-provider";
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, withSkipGlobalLoader } from '@/lib/api';
import { formatRelativeTime } from '@/lib/notifications-service';
import { hrRoleLabel, isHrUserType } from '@/lib/messaging-policy';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EmployeeMessagesProps {
  embedded?: boolean;
}

type RawMessage = Record<string, unknown>;

interface NormalizedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderDisplayName: string;
  receiverDisplayName: string;
  senderUserType: string;
  receiverUserType: string;
}

interface Conversation {
  peerId: string;
  userName: string;
  userRole: string;
  lastMessage: string;
  timestamp: string;
  sortAt: string;
  unread: number;
}

interface RecruiterThread {
  applicationId: number;
  jobId: string;
  jobTitle: string | null;
  companyName: string | null;
  employerId: string;
  employerName: string;
  status: string;
  employerHasMessaged: boolean;
  canSend: boolean;
  unlockReason: string | null;
  messagingHint?: string;
  statusLabel?: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

type SelectedChat =
  | { kind: 'hr'; peerId: string }
  | { kind: 'recruiter'; peerId: string; applicationId: number };

interface HrContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

function str(v: unknown): string {
  return v != null ? String(v) : '';
}

function normalizeMessage(m: RawMessage): NormalizedMessage {
  return {
    id: str(m.id),
    senderId: str(m.senderId ?? m.sender_id),
    receiverId: str(m.receiverId ?? m.receiver_id),
    content: str(m.content),
    isRead: Boolean(m.isRead ?? m.is_read),
    createdAt: str(m.createdAt ?? m.created_at),
    senderDisplayName: str(m.senderDisplayName ?? m.sender_display_name),
    receiverDisplayName: str(m.receiverDisplayName ?? m.receiver_display_name),
    senderUserType: str(m.senderUserType ?? m.sender_user_type),
    receiverUserType: str(m.receiverUserType ?? m.receiver_user_type),
  };
}

function formatUserRole(_userType: string): string {
  return hrRoleLabel();
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

function peerFromMessage(msg: NormalizedMessage, currentUserId: string) {
  const isOutbound = msg.senderId === currentUserId;
  return {
    peerId: isOutbound ? msg.receiverId : msg.senderId,
    displayName: isOutbound ? msg.receiverDisplayName : msg.senderDisplayName,
    userType: isOutbound ? msg.receiverUserType : msg.senderUserType,
  };
}

function displayNameFromUser(u: Record<string, unknown>): string {
  const firstName = str(u.firstName ?? u.first_name);
  const lastName = str(u.lastName ?? u.last_name);
  const email = str(u.email);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (email) return email;
  return '';
}

function Avatar({
  name,
  darkMode,
  size = 'md',
}: {
  name: string;
  darkMode: boolean;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base';
  return (
    <div
      className={cn(
        dim,
        'rounded-xl flex items-center justify-center font-bold shrink-0',
        darkMode
          ? 'bg-gradient-to-br from-violet-600/40 to-sky-600/40 text-violet-100 ring-1 ring-white/10'
          : 'bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 ring-1 ring-indigo-200/60',
      )}
    >
      {getInitials(name)}
    </div>
  );
}

const EmployeeMessages: React.FC<EmployeeMessagesProps> = ({ embedded = false }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});
  
  const { isConnected, latestMessage } = useSocket();
  const [isPendingEcho, setIsPendingEcho] = useState(false);
  const echoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPeerId = selectedChat?.peerId ?? null;
  const selectedApplicationId =
    selectedChat?.kind === 'recruiter' ? selectedChat.applicationId : null;

  // Catch up on missed messages when reconnecting
  useEffect(() => {
    if (isConnected) {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  }, [isConnected, queryClient]);

  // Handle real-time socket messages
  useEffect(() => {
    if (!latestMessage || !user?.id || !selectedChat) return;

    const isPeerMatch =
      (latestMessage.senderId === selectedChat.peerId && latestMessage.receiverId === user.id) ||
      (latestMessage.senderId === user.id && latestMessage.receiverId === selectedChat.peerId);

    const socketAppId = latestMessage.applicationId != null ? Number(latestMessage.applicationId) : null;
    const isApplicationMatch =
      selectedChat.kind === 'hr'
        ? socketAppId == null
        : socketAppId == null || socketAppId === selectedChat.applicationId;

    if (!isPeerMatch || !isApplicationMatch) return;

    const threadKey =
      selectedChat.kind === 'recruiter'
        ? ['messages', user.id, selectedChat.peerId, selectedChat.applicationId]
        : ['messages', user.id, selectedChat.peerId, null];

    queryClient.setQueryData(threadKey, (old: NormalizedMessage[] | undefined) => {
      const normalized = normalizeMessage(latestMessage);
      if (!old) return [normalized];
      if (old.some((m) => String(m.id) === String(normalized.id))) return old;
      return [...old, normalized];
    });

    if (latestMessage.senderId === user.id) {
      setIsPendingEcho(false);
      if (echoTimeoutRef.current) clearTimeout(echoTimeoutRef.current);
    }
  }, [latestMessage, selectedChat, user?.id, queryClient]);

  const panelClass = cn(
    'rounded-2xl border backdrop-blur-xl',
    darkMode
      ? 'bg-slate-900/60 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.22)]'
      : 'bg-white/95 border-gray-200/80 shadow-lg',
  );

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

  const { data: hrContacts = [] } = useQuery({
    queryKey: ['messages', 'hr-contacts', user?.id],
    queryFn: async (): Promise<HrContact[]> => {
      const res = await apiFetch('/api/messages/hr-contacts');
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((c: Record<string, unknown>) => ({
        id: str(c.id),
        firstName: str(c.firstName ?? c.first_name) || undefined,
        lastName: str(c.lastName ?? c.last_name) || undefined,
        email: str(c.email) || undefined,
      }));
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const { data: recruiterThreads = [], isLoading: recruiterThreadsLoading } = useQuery({
    queryKey: ['messages', 'recruiter-threads', user?.id],
    queryFn: async (): Promise<RecruiterThread[]> => {
      const res = await apiFetch('/api/messages/recruiter-threads');
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((t: Record<string, unknown>) => ({
        applicationId: Number(t.applicationId),
        jobId: str(t.jobId),
        jobTitle: t.jobTitle != null ? str(t.jobTitle) : null,
        companyName: t.companyName != null ? str(t.companyName) : null,
        employerId: str(t.employerId),
        employerName: str(t.employerName) || 'Recruiter',
        status: str(t.status),
        employerHasMessaged: Boolean(t.employerHasMessaged),
        canSend: Boolean(t.canSend),
        unlockReason: t.unlockReason != null ? str(t.unlockReason) : null,
        messagingHint: t.messagingHint != null ? str(t.messagingHint) : undefined,
        statusLabel: t.statusLabel != null ? str(t.statusLabel) : undefined,
        lastMessage: t.lastMessage != null ? str(t.lastMessage) : null,
        lastMessageAt: t.lastMessageAt != null ? str(t.lastMessageAt) : null,
        unreadCount: Number(t.unreadCount ?? 0),
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const applicationIdParam = searchParams.get('applicationId');
    if (!applicationIdParam || recruiterThreads.length === 0) return;

    const thread = recruiterThreads.find(
      (t) => String(t.applicationId) === applicationIdParam,
    );
    if (!thread) return;

    setSelectedChat({
      kind: 'recruiter',
      peerId: thread.employerId,
      applicationId: thread.applicationId,
    });

    const next = new URLSearchParams(searchParams);
    next.delete('applicationId');
    setSearchParams(next, { replace: true });
  }, [recruiterThreads, searchParams, setSearchParams]);

  const resolvePeerName = async (peerId: string) => {
    if (!peerId || peerNames[peerId]) return;
    try {
      const res = await apiFetch(`/api/users/${peerId}`);
      if (!res.ok) return;
      const u = await res.json();
      const name = displayNameFromUser(u);
      if (name) {
        setPeerNames((prev) => ({ ...prev, [peerId]: name }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!user?.id || allMessages.length === 0) return;
    const missing = new Set<string>();
    for (const msg of allMessages) {
      const { peerId, displayName } = peerFromMessage(msg, user.id);
      if (peerId && peerId !== user.id && !displayName && !peerNames[peerId]) {
        missing.add(peerId);
      }
    }
    missing.forEach((id) => void resolvePeerName(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages, user?.id]);

  const hrContactName = (contact: HrContact): string => {
    const full = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
    if (full) return full;
    if (contact.email) return contact.email;
    return 'HR Support';
  };

  const conversations = useMemo((): Conversation[] => {
    if (!user?.id) return [];

    const map = new Map<string, Conversation>();

    for (const msg of allMessages) {
      const { peerId, displayName, userType } = peerFromMessage(msg, user.id);
      if (!peerId || peerId === user.id) continue;
      if (!isHrUserType(userType)) continue;

      const fromApi = displayName?.trim();
      const userName = fromApi || peerNames[peerId]?.trim() || 'Loading…';
      const unreadAdd = msg.receiverId === user.id && !msg.isRead ? 1 : 0;

      const existing = map.get(peerId);
      if (!existing || (msg.createdAt && msg.createdAt > existing.sortAt)) {
        map.set(peerId, {
          peerId,
          userName,
          userRole: formatUserRole(userType),
          lastMessage: msg.content,
          timestamp: msg.createdAt ? formatRelativeTime(msg.createdAt) : '',
          sortAt: msg.createdAt,
          unread: (existing?.unread ?? 0) + unreadAdd,
        });
      } else if (existing) {
        map.set(peerId, {
          ...existing,
          unread: existing.unread + unreadAdd,
        });
      }
    }

    for (const contact of hrContacts) {
      if (!contact.id || map.has(contact.id)) continue;
      map.set(contact.id, {
        peerId: contact.id,
        userName: hrContactName(contact),
        userRole: hrRoleLabel(),
        lastMessage: 'Start a conversation with HR',
        timestamp: '',
        sortAt: '',
        unread: 0,
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread;
      return (b.sortAt || '').localeCompare(a.sortAt || '');
    });
  }, [allMessages, user?.id, peerNames, hrContacts]);

  useEffect(() => {
    if (selectedChat || recruiterThreads.length > 0) return;
    if (hrContacts.length === 0) return;
    setSelectedChat({ kind: 'hr', peerId: hrContacts[0].id });
  }, [hrContacts, selectedChat, recruiterThreads.length]);

  const filteredRecruiterThreads = recruiterThreads.filter((thread) => {
    const haystack = [
      thread.employerName,
      thread.jobTitle,
      thread.companyName,
      thread.lastMessage,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });

  const filteredConversations = conversations.filter(
    (c) =>
      c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { data: threadMessages = [], isLoading: threadLoading } = useQuery({
    queryKey: ['messages', user?.id, selectedPeerId, selectedApplicationId],
    queryFn: async () => {
      if (!selectedPeerId) return [];
      const url =
        selectedApplicationId != null
          ? `/api/messages?applicationId=${selectedApplicationId}`
          : `/api/messages?otherUserId=${selectedPeerId}`;
      const res = await apiFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map((m: RawMessage) => normalizeMessage(m));
    },
    enabled: !!user?.id && !!selectedPeerId,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!user?.id || threadMessages.length === 0) return;

    const unreadInbound = threadMessages.filter(
      (msg) => msg.receiverId === user.id && !msg.isRead,
    );
    if (unreadInbound.length === 0) return;

    void (async () => {
      await Promise.all(
        unreadInbound.map((msg) =>
          apiFetch(`/api/messages/${msg.id}/read`, {
            method: 'PUT',
            ...withSkipGlobalLoader(),
          }),
        ),
      );
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    })();
  }, [threadMessages, user?.id, queryClient]);

  const activeRecruiterThread =
    selectedChat?.kind === 'recruiter'
      ? recruiterThreads.find((t) => t.applicationId === selectedChat.applicationId)
      : null;

  const canSendInCurrentChat =
    selectedChat?.kind === 'hr' || activeRecruiterThread?.canSend !== false;

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !selectedChat) throw new Error('Missing recipient');
      const res = await apiFetch(
        '/api/messages',
        withSkipGlobalLoader({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: user.id,
            receiverId: selectedChat.peerId,
            content,
            ...(selectedChat.kind === 'recruiter'
              ? { applicationId: selectedChat.applicationId }
              : {}),
          }),
        }),
      );
      if (!res.ok) {
        let detail = 'Failed to send message';
        try {
          const err = await res.json();
          detail = String(err.message ?? err.error ?? detail);
        } catch {
          // ignore
        }
        throw new Error(detail);
      }
    },
  });

  const currentConversation = conversations.find((c) => c.peerId === selectedPeerId);
  const currentRecruiterThread = activeRecruiterThread;

  const sendMessage = () => {
    const text = messageInput.trim();
    if (!text || sendMutation.isPending || isPendingEcho || !canSendInCurrentChat) return;
    
    const backupText = text;
    setMessageInput('');
    setIsPendingEcho(true);
    
    echoTimeoutRef.current = setTimeout(() => {
      setIsPendingEcho(false);
      toast.error("Message delivery is delayed.");
    }, 10000);

    sendMutation.mutate(text, {
      onError: (error) => {
        setIsPendingEcho(false);
        if (echoTimeoutRef.current) clearTimeout(echoTimeoutRef.current);
        setMessageInput(backupText);
        toast.error(error instanceof Error ? error.message : "Failed to send message. Please try again.");
      }
    });
    
    setShowAttachmentMenu(false);
  };

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => (
    <button
      type="button"
      onClick={() => setSelectedChat({ kind: 'hr', peerId: conversation.peerId })}
      className={cn(
        'w-full text-left p-3 rounded-xl transition-all',
        selectedChat?.kind === 'hr' && selectedChat.peerId === conversation.peerId
          ? darkMode
            ? 'bg-violet-600/20 border border-violet-500/30'
            : 'bg-indigo-50 border border-indigo-200'
          : darkMode
            ? 'hover:bg-white/[0.06] border border-transparent'
            : 'hover:bg-gray-50 border border-transparent',
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={conversation.userName} darkMode={darkMode} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4 className={cn('font-semibold truncate text-sm', darkMode ? 'text-white' : 'text-gray-900')}>
              {conversation.userName}
            </h4>
            <span className={cn('text-xs shrink-0', darkMode ? 'text-slate-400' : 'text-gray-500')}>
              {conversation.timestamp}
            </span>
          </div>
          <p className={cn('text-xs truncate', darkMode ? 'text-slate-400' : 'text-gray-600')}>
            {conversation.lastMessage}
          </p>
        </div>
        {conversation.unread > 0 && (
          <span
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
              darkMode ? 'bg-violet-500 text-white' : 'bg-indigo-600 text-white',
            )}
          >
            {conversation.unread}
          </span>
        )}
      </div>
    </button>
  );

  const RecruiterThreadItem = ({ thread }: { thread: RecruiterThread }) => {
    const isSelected =
      selectedChat?.kind === 'recruiter' &&
      selectedChat.applicationId === thread.applicationId;
    const subtitle = [thread.jobTitle, thread.companyName].filter(Boolean).join(' · ');
    const preview =
      thread.lastMessage ||
      thread.messagingHint ||
      (thread.canSend ? 'Start a conversation' : 'Waiting for recruiter');

    return (
      <button
        type="button"
        onClick={() =>
          setSelectedChat({
            kind: 'recruiter',
            peerId: thread.employerId,
            applicationId: thread.applicationId,
          })
        }
        className={cn(
          'w-full text-left p-3 rounded-xl transition-all',
          isSelected
            ? darkMode
              ? 'bg-sky-600/20 border border-sky-500/30'
              : 'bg-sky-50 border border-sky-200'
            : darkMode
              ? 'hover:bg-white/[0.06] border border-transparent'
              : 'hover:bg-gray-50 border border-transparent',
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar name={thread.employerName} darkMode={darkMode} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h4 className={cn('font-semibold truncate text-sm', darkMode ? 'text-white' : 'text-gray-900')}>
                {thread.employerName}
              </h4>
              <span className={cn('text-xs shrink-0', darkMode ? 'text-slate-400' : 'text-gray-500')}>
                {thread.lastMessageAt ? formatRelativeTime(thread.lastMessageAt) : ''}
              </span>
            </div>
            <p className={cn('text-[11px] truncate mb-1', darkMode ? 'text-sky-300/80' : 'text-sky-700')}>
              {subtitle || 'Application thread'}
            </p>
            <p className={cn('text-xs truncate', darkMode ? 'text-slate-400' : 'text-gray-600')}>
              {preview}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {!thread.canSend && (
              <Lock className={cn('w-3.5 h-3.5', darkMode ? 'text-amber-400' : 'text-amber-600')} />
            )}
            {thread.unreadCount > 0 && (
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  darkMode ? 'bg-sky-500 text-white' : 'bg-sky-600 text-white',
                )}
              >
                {thread.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const MessageBubble = ({ message }: { message: NormalizedMessage }) => {
    const isOwn = message.senderId === user?.id;
    return (
      <div className={cn('flex mb-3', isOwn ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-xs lg:max-w-md rounded-2xl px-4 py-3',
            isOwn
              ? darkMode
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
                : 'bg-indigo-600 text-white shadow-md'
              : darkMode
                ? 'bg-white/[0.06] text-slate-100 border border-white/10'
                : 'bg-gray-100 text-gray-900',
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          <div
            className={cn(
              'flex items-center gap-1.5 mt-1.5 text-[11px]',
              isOwn
                ? darkMode ? 'text-violet-200/80' : 'text-indigo-100'
                : darkMode ? 'text-slate-500' : 'text-gray-500',
            )}
          >
            <span>{message.createdAt ? formatRelativeTime(message.createdAt) : ''}</span>
            {isOwn && (
              <MessageDeliveryTicks
                status={messageDeliveryStatus(message.isRead)}
                onOwnBubble
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        embedded ? 'h-full min-h-0 flex flex-col overflow-hidden' : 'min-h-screen',
        'transition-colors duration-300',
        embedded ? 'bg-transparent' : darkMode ? 'bg-slate-950' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50',
      )}
    >
      <div
        className={cn(
          embedded ? 'w-full flex-1 min-h-0 flex flex-col overflow-hidden' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8',
        )}
      >
        {!embedded && (
          <div className="mb-6">
            <h1 className={cn('text-2xl sm:text-3xl font-black tracking-tight', darkMode ? 'text-white' : 'text-gray-900')}>
              Messages
            </h1>
            <p className={cn('mt-1 text-sm', darkMode ? 'text-slate-400' : 'text-gray-600')}>
              Message recruiters for your applications or contact HR for platform support
            </p>
          </div>
        )}

        <div
          className={cn(
            'flex gap-4 lg:gap-6 min-h-0 overflow-hidden',
            embedded ? 'flex-1' : 'h-[calc(100vh-180px)] min-h-[420px]',
          )}
        >
          <div className="w-full sm:w-80 lg:w-96 flex-shrink-0 flex flex-col min-h-0 gap-3">
            <div className={cn(panelClass, 'p-2')}>
              <div className="relative">
                <Search
                  className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                    darkMode ? 'text-slate-500' : 'text-gray-400',
                  )}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors',
                    darkMode
                      ? 'bg-white/[0.05] border border-white/10 text-slate-50 placeholder-slate-500 focus:border-violet-500/50'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-indigo-400',
                  )}
                />
              </div>
            </div>

            <div className={cn(panelClass, 'flex-1 min-h-0 overflow-hidden flex flex-col')}>
              <div className="px-4 py-3 border-b border-inherit shrink-0">
                <p className={cn('text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5', darkMode ? 'text-slate-500' : 'text-gray-500')}>
                  <Briefcase className="w-3.5 h-3.5" />
                  Recruiters
                </p>
              </div>
              <div className="max-h-[42%] overflow-y-auto p-2 space-y-1 border-b border-inherit">
                {recruiterThreadsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                  </div>
                ) : filteredRecruiterThreads.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Briefcase className={cn('w-8 h-8 mx-auto mb-2', darkMode ? 'text-slate-600' : 'text-gray-300')} />
                    <p className={cn('text-xs font-medium', darkMode ? 'text-slate-400' : 'text-gray-600')}>
                      Apply to jobs to message recruiters
                    </p>
                  </div>
                ) : (
                  filteredRecruiterThreads.map((thread) => (
                    <RecruiterThreadItem key={thread.applicationId} thread={thread} />
                  ))
                )}
              </div>

              <div className="px-4 py-3 border-b border-inherit shrink-0">
                <p className={cn('text-xs font-semibold uppercase tracking-wider', darkMode ? 'text-slate-500' : 'text-gray-500')}>
                  HR support
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className={cn('w-10 h-10 mx-auto mb-3', darkMode ? 'text-slate-600' : 'text-gray-300')} />
                    <p className={cn('text-sm font-medium', darkMode ? 'text-slate-300' : 'text-gray-700')}>
                      HR support unavailable
                    </p>
                    <p className={cn('text-xs mt-1', darkMode ? 'text-slate-500' : 'text-gray-500')}>
                      No HR contacts are configured yet. Please try again later.
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <ConversationItem key={conversation.peerId} conversation={conversation} />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {selectedChat && selectedPeerId ? (
              <div className={cn(panelClass, 'flex flex-col flex-1 min-h-0 overflow-hidden')}>
                <div
                  className={cn(
                    'p-4 shrink-0 border-b',
                    darkMode ? 'border-white/10' : 'border-gray-200/80',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={
                          currentRecruiterThread?.employerName ||
                          currentConversation?.userName ||
                          'Contact'
                        }
                        darkMode={darkMode}
                      />
                      <div className="min-w-0">
                        <h3 className={cn('font-semibold truncate', darkMode ? 'text-white' : 'text-gray-900')}>
                          {currentRecruiterThread?.employerName ||
                            currentConversation?.userName ||
                            'Contact'}
                        </h3>
                        <p className={cn('text-xs truncate', darkMode ? 'text-slate-400' : 'text-gray-600')}>
                          {currentRecruiterThread
                            ? [currentRecruiterThread.jobTitle, currentRecruiterThread.companyName]
                                .filter(Boolean)
                                .join(' · ')
                            : currentConversation?.userRole || hrRoleLabel()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {[Phone, Video, MoreHorizontal].map((Icon, i) => (
                        <button
                          key={i}
                          type="button"
                          className={cn(
                            'p-2.5 rounded-xl transition-colors',
                            darkMode ? 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200' : 'text-gray-500 hover:bg-gray-100',
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {!canSendInCurrentChat && currentRecruiterThread?.messagingHint && (
                  <div
                    className={cn(
                      'mx-4 mt-3 px-3 py-2 rounded-xl text-xs flex items-start gap-2',
                      darkMode
                        ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20'
                        : 'bg-amber-50 text-amber-800 border border-amber-200',
                    )}
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{currentRecruiterThread.messagingHint}</span>
                  </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 lg:p-6">
                  {threadLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
                    </div>
                  ) : threadMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[12rem] py-16 text-center">
                      <MessageSquare className={cn('w-10 h-10 mb-3', darkMode ? 'text-slate-600' : 'text-gray-300')} />
                      <p className={cn('text-sm font-medium', darkMode ? 'text-slate-300' : 'text-gray-700')}>
                        No messages yet
                      </p>
                      <p className={cn('text-xs mt-1 max-w-xs', darkMode ? 'text-slate-500' : 'text-gray-500')}>
                        Say hello to start the conversation.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {threadMessages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'p-3 shrink-0 border-t',
                    darkMode ? 'border-white/10' : 'border-gray-200/80',
                  )}
                >
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className={cn(
                        'p-2.5 rounded-xl transition-colors',
                        darkMode ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-gray-500 hover:bg-gray-100',
                      )}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={
                        canSendInCurrentChat
                          ? selectedChat.kind === 'recruiter'
                            ? 'Message recruiter...'
                            : 'Message HR...'
                          : 'Messaging unlocks when the recruiter replies or advances your application'
                      }
                      rows={1}
                      disabled={!canSendInCurrentChat}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-xl resize-none text-sm outline-none transition-colors max-h-28',
                        !canSendInCurrentChat && 'opacity-60 cursor-not-allowed',
                        darkMode
                          ? 'bg-white/[0.05] border border-white/10 text-slate-50 placeholder-slate-500 focus:border-violet-500/50'
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-indigo-400',
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
                        'p-2.5 rounded-xl transition-colors hidden sm:block',
                        darkMode ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-gray-500 hover:bg-gray-100',
                      )}
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={
                        !messageInput.trim() ||
                        sendMutation.isPending ||
                        isPendingEcho ||
                        !canSendInCurrentChat
                      }
                      className={cn(
                        'p-2.5 rounded-xl transition-all shrink-0',
                        (!messageInput.trim() ||
                          sendMutation.isPending ||
                          isPendingEcho ||
                          !canSendInCurrentChat)
                          ? darkMode
                            ? 'bg-white/[0.06] text-slate-600'
                            : 'bg-gray-200 text-gray-400'
                          : darkMode
                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:opacity-90'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white',
                      )}
                    >
                      {sendMutation.isPending || isPendingEcho ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  panelClass,
                  'flex-1 flex flex-col items-center justify-center text-center p-8',
                )}
              >
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-5',
                    darkMode
                      ? 'bg-gradient-to-br from-violet-600/30 to-indigo-600/20 ring-1 ring-white/10'
                      : 'bg-gradient-to-br from-indigo-100 to-violet-100',
                  )}
                >
                  <Mail className={cn('w-8 h-8', darkMode ? 'text-violet-300' : 'text-indigo-500')} />
                </div>
                <h3 className={cn('text-xl font-bold mb-2', darkMode ? 'text-white' : 'text-gray-900')}>
                  Select a conversation
                </h3>
                <p className={cn('text-sm max-w-sm', darkMode ? 'text-slate-400' : 'text-gray-600')}>
                  Choose a recruiter thread or HR contact from the sidebar to start messaging.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMessages;
