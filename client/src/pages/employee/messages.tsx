import React, { useState } from 'react';
import {
  Search, Filter, MoreHorizontal, Phone, Video, Mail,
  User, Check, CheckCheck, Clock, Paperclip, Smile,
  Send, Image, File, MapPin, Calendar, Mic,
  Star, StarOff, Trash2, Archive, Ban, Volume2, VolumeX,
  Moon, Sun, Users, Eye, EyeOff, Shield
} from 'lucide-react';

const EmployeeMessages: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedChat, setSelectedChat] = useState('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Mock data
  const conversations = [
    {
      id: '1',
      userId: 'user2',
      userName: 'Sarah Chen',
      userRole: 'Product Manager',
      userAvatar: null,
      lastMessage: 'Hey! Did you get a chance to review the design specs?',
      timestamp: '2:30 PM',
      unread: 2,
      isOnline: true,
      isPinned: true,
      lastActive: '2 min ago'
    },
    {
      id: '2',
      userId: 'user3',
      userName: 'Mike Rodriguez',
      userRole: 'Backend Developer',
      userAvatar: null,
      lastMessage: 'The API endpoints are ready for testing',
      timestamp: '1:15 PM',
      unread: 0,
      isOnline: true,
      isPinned: false,
      lastActive: '5 min ago'
    },
    {
      id: '3',
      userId: 'user4',
      userName: 'Emily Davis',
      userRole: 'UI/UX Designer',
      userAvatar: null,
      lastMessage: 'I sent you the updated mockups',
      timestamp: '12:45 PM',
      unread: 0,
      isOnline: false,
      isPinned: true,
      lastActive: '1 hour ago'
    },
    {
      id: '4',
      userId: 'user5',
      userName: 'David Kim',
      userRole: 'Team Lead',
      userAvatar: null,
      lastMessage: 'Great work on the last deployment!',
      timestamp: '11:20 AM',
      unread: 1,
      isOnline: false,
      isPinned: false,
      lastActive: '2 hours ago'
    },
    {
      id: '5',
      userId: 'user6',
      userName: 'Lisa Wang',
      userRole: 'QA Engineer',
      userAvatar: null,
      lastMessage: 'Found some issues in the login flow',
      timestamp: 'Yesterday',
      unread: 0,
      isOnline: true,
      isPinned: false,
      lastActive: '30 min ago'
    }
  ];

  type Message = {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    status: string;
    type: string;
  };
  
  type Messages = {
    [key: string]: Message[];
  };
  
  const messages: Messages = {
    '1': [
      {
        id: '1',
        sender: 'user2',
        content: 'Hey Alex! Are you available for a quick call about the new feature?',
        timestamp: '2:15 PM',
        status: 'read',
        type: 'text'
      },
      {
        id: '2',
        sender: 'user1',
        content: 'Hi Sarah! Yes, I can talk now. What do you need?',
        timestamp: '2:16 PM',
        status: 'read',
        type: 'text'
      },
      {
        id: '3',
        sender: 'user2',
        content: 'I wanted to discuss the timeline for the user dashboard redesign',
        timestamp: '2:17 PM',
        status: 'read',
        type: 'text'
      },
      {
        id: '4',
        sender: 'user2',
        content: 'Did you get a chance to review the design specs I sent yesterday?',
        timestamp: '2:30 PM',
        status: 'delivered',
        type: 'text'
      }
    ],
    '2': [
      {
        id: '1',
        sender: 'user3',
        content: 'The new API endpoints are ready for frontend integration',
        timestamp: '1:15 PM',
        status: 'read',
        type: 'text'
      }
    ],
    '3': [
      {
        id: '1',
        sender: 'user4',
        content: 'I sent you the updated mockups for the mobile app',
        timestamp: '12:45 PM',
        status: 'read',
        type: 'text'
      }
    ],
    '4': [
      {
        id: '1',
        sender: 'user5',
        content: 'Great work on the last deployment! The client is very happy',
        timestamp: '11:20 AM',
        status: 'delivered',
        type: 'text'
      }
    ],
    '5': [
      {
        id: '1',
        sender: 'user6',
        content: 'Found some issues in the login flow that need attention',
        timestamp: 'Yesterday',
        status: 'read',
        type: 'text'
      }
    ]
  };

  const currentConversation = conversations.find(chat => chat.id === selectedChat);
  const currentMessages = messages[selectedChat] || [];

  const sendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send to a backend
      setMessageInput('');
      setShowAttachmentMenu(false);
    }
  };

  const togglePin = (chatId: string) => {
    // Toggle pin status
    console.log('Toggle pin:', chatId);
  };

  type Conversation = {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    userAvatar: string | null;
    lastMessage: string;
    timestamp: string;
    unread: number;
    isOnline: boolean;
    isPinned: boolean;
    lastActive: string;
  };

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => (
    <div
      onClick={() => setSelectedChat(conversation.id)}
      className={`p-4 rounded-2xl cursor-pointer transition-all ${
        selectedChat === conversation.id
          ? darkMode
            ? 'bg-blue-600/20 border border-blue-500/30'
            : 'bg-indigo-50 border border-indigo-200'
          : darkMode
          ? 'hover:bg-gray-700/50'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            darkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <User className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          {conversation.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-semibold truncate ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {conversation.userName}
            </h4>
            <div className="flex items-center gap-1">
              <span className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {conversation.timestamp}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(conversation.id);
                }}
                className="p-1 hover:bg-gray-600/20 rounded"
              >
                {conversation.isPinned ? (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                ) : (
                  <StarOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <p className={`text-sm truncate mb-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {conversation.userRole}
          </p>
          
          <p className={`text-sm truncate ${
            conversation.unread > 0
              ? 'text-white font-semibold'
              : darkMode
              ? 'text-gray-500'
              : 'text-gray-500'
          }`}>
            {conversation.lastMessage}
          </p>
        </div>
        
        {conversation.unread > 0 && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
            darkMode
              ? 'bg-blue-500 text-white'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
          }`}>
            {conversation.unread}
          </div>
        )}
      </div>
    </div>
  );

  const MessageBubble = ({ message }: { message: Message }) => {
    const isOwn = message.sender === 'user1';
    
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md rounded-2xl p-4 ${
          isOwn
            ? darkMode
              ? 'bg-blue-600 text-white'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
            : darkMode
            ? 'bg-gray-700 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
          <div className={`flex items-center gap-2 mt-2 text-xs ${
            isOwn
              ? 'text-blue-100'
              : darkMode
              ? 'text-gray-400'
              : 'text-gray-500'
          }`}>
            <span>{message.timestamp}</span>
            {isOwn && (
              message.status === 'read' ? (
                <CheckCheck className="w-4 h-4" />
              ) : message.status === 'delivered' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className={`p-2 rounded-xl transition-all ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className={`text-3xl font-black ${
                darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                Messages
              </h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Connect and collaborate with your team
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl transition-all ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>

        <div className="flex gap-8 h-[calc(100vh-200px)]">
          {/* Conversations Sidebar */}
          <div className="w-96 flex-shrink-0 flex flex-col">
            {/* Search Bar */}
            <div className={`rounded-2xl p-2 mb-4 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all ${
                    darkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              {['All', 'Unread', 'Pinned', 'Team'].map(tab => (
                <button
                  key={tab}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    tab === 'All'
                      ? darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Conversations List */}
            <div className={`flex-1 rounded-2xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg overflow-y-auto`}>
              <div className="p-4 space-y-2">
                {conversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className={`rounded-2xl p-4 mb-4 ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <User className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        </div>
                        {currentConversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {currentConversation.userName}
                        </h3>
                        <p className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {currentConversation.userRole} • {currentConversation.isOnline ? 'Online' : `Last seen ${currentConversation.lastActive}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className={`p-3 rounded-xl transition-all ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}>
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className={`p-3 rounded-xl transition-all ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}>
                        <Video className="w-5 h-5" />
                      </button>
                      <button className={`p-3 rounded-xl transition-all ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}>
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className={`flex-1 rounded-2xl ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-lg overflow-y-auto p-6`}>
                  <div className="space-y-4">
                    {currentMessages.map(message => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className={`mt-4 rounded-2xl p-4 ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-lg`}>
                  <div className="flex items-end gap-3">
                    {/* Attachment Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className={`p-3 rounded-xl transition-all ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      
                      {showAttachmentMenu && (
                        <div className={`absolute bottom-14 left-0 p-2 rounded-xl shadow-2xl border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-200'
                        }`}>
                          <div className="grid grid-cols-2 gap-2">
                            <button className={`p-3 rounded-xl text-left transition-all ${
                              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                            }`}>
                              <Image className="w-5 h-5 mb-1" />
                              <span className="text-sm">Photo</span>
                            </button>
                            <button className={`p-3 rounded-xl text-left transition-all ${
                              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                            }`}>
                              <File className="w-5 h-5 mb-1" />
                              <span className="text-sm">File</span>
                            </button>
                            <button className={`p-3 rounded-xl text-left transition-all ${
                              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                            }`}>
                              <MapPin className="w-5 h-5 mb-1" />
                              <span className="text-sm">Location</span>
                            </button>
                            <button className={`p-3 rounded-xl text-left transition-all ${
                              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                            }`}>
                              <Calendar className="w-5 h-5 mb-1" />
                              <span className="text-sm">Event</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="flex-1">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        rows={1}
                        className={`w-full px-4 py-3 rounded-xl resize-none outline-none transition-all ${
                          darkMode
                            ? 'bg-gray-700 text-white placeholder-gray-400'
                            : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                        }`}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button className={`p-3 rounded-xl transition-all ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}>
                        <Mic className="w-5 h-5" />
                      </button>
                      <button className={`p-3 rounded-xl transition-all ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}>
                        <Smile className="w-5 h-5" />
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={!messageInput.trim()}
                        className={`p-3 rounded-xl transition-all ${
                          !messageInput.trim()
                            ? darkMode
                              ? 'bg-gray-600 text-gray-400'
                              : 'bg-gray-300 text-gray-500'
                            : darkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                        }`}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className={`flex-1 rounded-2xl flex items-center justify-center ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <div className="text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <Mail className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <h3 className={`text-2xl font-black mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Select a conversation
                  </h3>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Choose a chat from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMessages;