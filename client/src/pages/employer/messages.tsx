import { useState } from 'react';
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, Star, Check, CheckCheck, Circle } from 'lucide-react';
import { useTheme } from "@/components/theme-provider";
import AdminBackButton from "@/components/AdminBackButton";

interface MessagesProps {
  embedded?: boolean;
}

export default function Messages({ embedded = false }: MessagesProps) {
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

  // Messages per conversation id so each chat shows distinct content
  const messagesByConversation: Record<number, any[]> = {
    1: [
      { id: '1-1', sender: 'them', text: 'Hello! I\'m very excited about the Senior Full Stack Developer position at your company.', time: '10:30 AM', status: 'delivered' },
      { id: '1-2', sender: 'me', text: 'Hi Sarah! Thank you for your application. We were impressed by your experience with React and Node.js.', time: '10:35 AM', status: 'read' },
      { id: '1-3', sender: 'them', text: 'Thank you! I have over 7 years of experience building scalable web applications. I\'d love to learn more about your tech stack.', time: '10:37 AM', status: 'delivered' },
      { id: '1-4', sender: 'me', text: 'We primarily use React, TypeScript, Node.js, and AWS. We\'re also moving towards a microservices architecture.', time: '10:40 AM', status: 'read' },
      { id: '1-5', sender: 'them', text: 'That sounds perfect! I have extensive experience with all of those technologies. When would be a good time for an interview?', time: '10:42 AM', status: 'delivered' }
    ],
    2: [
      { id: '2-1', sender: 'them', text: 'Hi, I\'m available for an interview next week. What times work best for you?', time: '9:12 AM', status: 'delivered' },
      { id: '2-2', sender: 'me', text: 'Thanks Marcus — could you do Wednesday or Friday afternoon?', time: '9:20 AM', status: 'read' },
      { id: '2-3', sender: 'them', text: 'Friday afternoon works great. I can do 3 PM.', time: '9:22 AM', status: 'delivered' }
    ],
    3: [
      { id: '3-1', sender: 'them', text: 'Hi — here\'s my portfolio: https://portfolio.example.com. Would love feedback.', time: '11:05 AM', status: 'delivered' },
      { id: '3-2', sender: 'me', text: 'Thanks Emily — your case studies look great. Can you share the design files for the last project?', time: '11:12 AM', status: 'read' }
    ],
    4: [
      { id: '4-1', sender: 'them', text: 'I ran the data analysis for the recent task and have some questions about the feature requirements.', time: '8:30 AM', status: 'delivered' },
      { id: '4-2', sender: 'me', text: 'Sure David — let\'s schedule 30 minutes to walk through the scope.', time: '8:45 AM', status: 'read' }
    ],
    5: [
      { id: '5-1', sender: 'them', text: 'Could we schedule a call to discuss the product roadmap?', time: '2:10 PM', status: 'delivered' },
      { id: '5-2', sender: 'me', text: 'Yes — how does Thursday 10 AM look for you?', time: '2:15 PM', status: 'read' }
    ],
    6: [
      { id: '6-1', sender: 'them', text: 'Thank you for the opportunity — excited to potentially join the backend team.', time: '4:00 PM', status: 'delivered' },
      { id: '6-2', sender: 'me', text: 'We\'ll review your profile and follow up next week.', time: '4:10 PM', status: 'read' }
    ]
  };

  const currentChat = conversations.find(c => c.id === selectedChat);
  const currentMessages = messagesByConversation[selectedChat] || [];
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
  const darkMode =
    typeof window !== 'undefined' &&
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

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
          <h1 className={`text-4xl font-bold ${darkMode ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent' : 'text-gray-900'} mb-2`}>
            Messages
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Connect with candidates and manage conversations</p>
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
                  className={`w-full pl-10 pr-4 py-2.5 ${darkMode ? 'bg-slate-900/50 border-slate-700/50 text-gray-100 placeholder-gray-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm`}
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedChat(conv.id)}
                  className={`p-4 border-b ${darkMode ? 'border-slate-700/30' : 'border-gray-200'} cursor-pointer transition-all ${selectedChat === conv.id ? darkMode ? 'bg-slate-700/50 border-l-4 border-l-blue-500' : 'bg-blue-50 border-l-4 border-l-blue-500' : darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-100'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${conv.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 ${darkMode ? 'border-slate-800' : 'border-white'} rounded-full`}></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{conv.name}</h3>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} flex-shrink-0 ml-2`}>{conv.time}</span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate mb-1`}>{conv.position}</p>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} truncate flex-1`}>
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
          <div className={`col-span-12 lg:col-span-8 ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white border border-gray-200'} rounded-2xl overflow-hidden flex flex-col`}>
            {/* Chat Header */}
            {currentChat && (
              <div className={`p-4 border-b ${darkMode ? 'border-slate-700/50' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentChat.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {currentChat.avatar}
                    </div>
                    {currentChat.online && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 ${darkMode ? 'border-slate-800' : 'border-white'} rounded-full`}></div>
                    )}
                  </div>
                  <div>
                    <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentChat.name}</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{currentChat.position}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className={`p-2 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}>
                    <Phone className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-blue-400 transition-colors`} />
                  </button>
                  <button className={`p-2 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}>
                    <Video className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-purple-400 transition-colors`} />
                  </button>
                  <button className={`p-2 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}>
                    <Star className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-yellow-400 transition-colors`} />
                  </button>
                  <button className={`p-2 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}>
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
                      {msg.sender === 'me' && getStatusIcon(msg.status as 'read' | 'delivered' | 'sent')}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {currentChat?.status === 'typing' && (
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
              <div className="flex items-end gap-3">
                <div className={`flex-1 ${darkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-gray-100 border-gray-300'} border rounded-2xl p-3 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all`}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    className={`w-full bg-transparent ${darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'} resize-none focus:outline-none text-sm`}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button className={`p-1.5 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-200'} rounded-lg transition-colors group`}>
                      <Paperclip className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-blue-400 transition-colors`} />
                    </button>
                    <button className={`p-1.5 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-200'} rounded-lg transition-colors group`}>
                      <Smile className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-yellow-400 transition-colors`} />
                    </button>
                  </div>
                </div>
                <button className={`p-3 ${darkMode ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' : 'bg-blue-500 hover:bg-blue-600'} rounded-2xl transition-all shadow-lg ${darkMode ? 'shadow-blue-500/25 hover:shadow-blue-500/40' : 'shadow-blue-500/50 hover:shadow-blue-500/60'} group`}>
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
