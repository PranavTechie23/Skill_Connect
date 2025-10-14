import { useState } from 'react';
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, Star, Archive, Trash2, Check, CheckCheck, Clock, Circle } from 'lucide-react';
import { useTheme } from "@/components/theme-provider";
import AdminBackButton from "@/components/AdminBackButton";

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const conversations = [
    {
      id: 1,
      name: 'Sarah Chen',
      position: 'Senior Full Stack Developer',
      avatar: 'SC',
      lastMessage: 'Thank you for considering my application. I\'d love to discuss the role further.',
      time: '2m ago',
      unread: 2,
      online: true,
      status: 'typing',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      name: 'Marcus Johnson',
      position: 'DevOps Engineer',
      avatar: 'MJ',
      lastMessage: 'I\'m available for an interview next week. What times work best for you?',
      time: '15m ago',
      unread: 0,
      online: true,
      status: 'read',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      position: 'UX/UI Designer',
      avatar: 'ER',
      lastMessage: 'Here\'s my portfolio link with recent projects.',
      time: '1h ago',
      unread: 1,
      online: false,
      status: 'delivered',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      id: 4,
      name: 'David Kim',
      position: 'Data Scientist',
      avatar: 'DK',
      lastMessage: 'Looking forward to hearing from you!',
      time: '3h ago',
      unread: 0,
      online: false,
      status: 'read',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 5,
      name: 'Priya Sharma',
      position: 'Product Manager',
      avatar: 'PS',
      lastMessage: 'Could we schedule a call to discuss the product roadmap?',
      time: '5h ago',
      unread: 0,
      online: true,
      status: 'read',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      id: 6,
      name: 'Alex Thompson',
      position: 'Backend Developer',
      avatar: 'AT',
      lastMessage: 'Thank you for the opportunity!',
      time: '1d ago',
      unread: 0,
      online: false,
      status: 'read',
      gradient: 'from-amber-500 to-orange-500'
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'them',
      text: 'Hello! I\'m very excited about the Senior Full Stack Developer position at your company.',
      time: '10:30 AM',
      status: 'delivered'
    },
    {
      id: 1,
      sender: 'me',
      text: 'Hi Sarah! Thank you for your application. We were impressed by your experience with React and Node.js.',
      time: '10:35 AM',
      status: 'read' as 'read' | 'delivered' | 'sent'
    },
    {
      id: 3,
      sender: 'them',
      text: 'Thank you! I have over 7 years of experience building scalable web applications. I\'d love to learn more about your tech stack.',
      time: '10:37 AM',
      status: 'delivered'
    },
    {
      id: 4,
      sender: 'me',
      text: 'We primarily use React, TypeScript, Node.js, and AWS. We\'re also moving towards a microservices architecture.',
      time: '10:40 AM',
      status: 'read'
    },
    {
      id: 5,
      sender: 'them',
      text: 'That sounds perfect! I have extensive experience with all of those technologies. When would be a good time for an interview?',
      time: '10:42 AM',
      status: 'delivered'
    },
    {
      id: 6,
      sender: 'me',
      text: 'Great! How about next Tuesday at 2 PM? We can do a video call to discuss the role in more detail.',
      time: '10:45 AM',
      status: 'read'
    },
    {
      id: 7,
      sender: 'them',
      text: 'Thank you for considering my application. I\'d love to discuss the role further.',
      time: '10:48 AM',
      status: 'delivered'
    }
  ];

  const currentChat = conversations.find(c => c.id === selectedChat);
  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: 'read' | 'delivered' | 'sent') => {
    if (status === 'read') return <CheckCheck className="w-4 h-4 text-blue-400" />;
    if (status === 'delivered') return <CheckCheck className="w-4 h-4 text-gray-500" />;
    return <Check className="w-4 h-4 text-gray-500" />;
  };

  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gray-50'}`}>
      <div className="mb-6 p-6">
        <AdminBackButton />
      </div>
      {/* Animated background */}
      {darkMode && <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>}

      <div className="relative container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Messages
          </h1>
          <p className="text-gray-400">Connect with candidates and manage conversations</p>
        </div>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <div className="col-span-12 lg:col-span-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedChat(conv.id)}
                  className={`p-4 border-b border-slate-700/30 cursor-pointer transition-all ${
                    selectedChat === conv.id
                      ? 'bg-slate-700/50 border-l-4 border-l-blue-500'
                      : 'hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${conv.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate">{conv.name}</h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{conv.time}</span>
                      </div>
                      <p className="text-sm text-gray-400 truncate mb-1">{conv.position}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate flex-1">
                          {conv.status === 'typing' ? (
                            <span className="text-blue-400 italic flex items-center gap-1">
                              <Circle className="w-2 h-2 fill-blue-400 animate-pulse" />
                              typing...
                            </span>
                          ) : (
                            conv.lastMessage
                          )}
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
          <div className="col-span-12 lg:col-span-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col">
            {/* Chat Header */}
            {currentChat && (
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentChat.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {currentChat.avatar}
                    </div>
                    {currentChat.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{currentChat.name}</h2>
                    <p className="text-sm text-gray-400">{currentChat.position}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group">
                    <Phone className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </button>
                  <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group">
                    <Video className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  </button>
                  <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group">
                    <Star className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                  </button>
                  <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group">
                    <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-200 transition-colors" />
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${msg.sender === 'me' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl p-4 ${
                        msg.sender === 'me'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-slate-700/50 text-gray-100'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-500">{msg.time}</span>
                      {msg.sender === 'me' && getStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {currentChat?.status === 'typing' && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 rounded-2xl p-4 max-w-[70%]">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex items-end gap-3">
                <div className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-3 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    className="w-full bg-transparent text-gray-100 placeholder-gray-500 resize-none focus:outline-none text-sm"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors group">
                      <Paperclip className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors group">
                      <Smile className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                    </button>
                  </div>
                </div>
                <button className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 group">
                  <Send className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}