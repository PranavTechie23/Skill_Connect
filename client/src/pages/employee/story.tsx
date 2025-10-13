import React, { useState } from 'react';
import {
  Plus, Camera, Video, Smile, MapPin, Globe, X, Heart,
  MessageCircle, Share, Bookmark, MoreHorizontal, Clock,
  Users, Eye, TrendingUp, Calendar, Image, FileText,
  Play, Pause, Volume2, VolumeX, Moon, Sun
} from 'lucide-react';

const StoriesPage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [newStory, setNewStory] = useState({
    type: 'text',
    content: '',
    background: 'gradient-blue',
    privacy: 'public'
  });

  // Mock stories data
  const [stories, setStories] = useState({
    myStories: [
      {
        id: '1',
        userId: 'user1',
        userName: 'Alex Johnson',
        userAvatar: null,
        type: 'text',
        content: 'Just shipped an amazing new feature! 🚀 So proud of my team for pulling this off under tight deadlines.',
        background: 'gradient-blue',
        likes: 23,
        comments: 5,
        views: 142,
        timestamp: '2 hours ago',
        duration: 10,
        privacy: 'public'
      },
      {
        id: '2',
        userId: 'user1',
        userName: 'Alex Johnson',
        userAvatar: null,
        type: 'text',
        content: 'Beautiful day for some coding in the park! ☀️ Sometimes a change of scenery does wonders for productivity.',
        background: 'gradient-green',
        likes: 18,
        comments: 3,
        views: 98,
        timestamp: '1 day ago',
        duration: 8,
        privacy: 'public'
      }
    ],
    following: [
      {
        id: '3',
        userId: 'user2',
        userName: 'Sarah Chen',
        userAvatar: null,
        type: 'text',
        content: 'Just completed our quarterly planning session. Exciting things ahead for Q2! 📈',
        background: 'gradient-purple',
        likes: 45,
        comments: 12,
        views: 234,
        timestamp: '4 hours ago',
        duration: 12,
        privacy: 'public'
      },
      {
        id: '4',
        userId: 'user3',
        userName: 'Mike Rodriguez',
        userAvatar: null,
        type: 'text',
        content: 'Team lunch turned into an impromptu brainstorming session. Best ideas come from casual conversations!',
        background: 'gradient-orange',
        likes: 31,
        comments: 8,
        views: 167,
        timestamp: '6 hours ago',
        duration: 15,
        privacy: 'public'
      },
      {
        id: '5',
        userId: 'user4',
        userName: 'Emily Davis',
        userAvatar: null,
        type: 'text',
        content: 'Just wrapped up a fantastic workshop on React performance optimization. So much to learn!',
        background: 'gradient-pink',
        likes: 52,
        comments: 15,
        views: 289,
        timestamp: '1 day ago',
        duration: 9,
        privacy: 'public'
      }
    ]
  });

  const backgroundOptions = [
    { id: 'gradient-blue', name: 'Blue Gradient', class: 'from-blue-500 to-indigo-600' },
    { id: 'gradient-purple', name: 'Purple Gradient', class: 'from-purple-500 to-pink-600' },
    { id: 'gradient-green', name: 'Green Gradient', class: 'from-green-500 to-emerald-600' },
    { id: 'gradient-orange', name: 'Orange Gradient', class: 'from-orange-500 to-red-500' },
    { id: 'gradient-pink', name: 'Pink Gradient', class: 'from-pink-500 to-rose-600' },
    { id: 'solid-dark', name: 'Dark', class: 'bg-gray-900' },
    { id: 'solid-blue', name: 'Blue', class: 'bg-blue-600' },
    { id: 'solid-purple', name: 'Purple', class: 'bg-purple-600' }
  ];

  const privacyOptions = [
    { id: 'public', name: 'Public', icon: Globe, description: 'Visible to everyone' },
    { id: 'team', name: 'Team Only', icon: Users, description: 'Visible to your team only' },
    { id: 'private', name: 'Private', icon: Eye, description: 'Only visible to you' }
  ];

  const handleCreateStory = () => {
    if (newStory.content.trim()) {
      const story = {
        id: Date.now().toString(),
        userId: 'user1',
        userName: 'Alex Johnson',
        userAvatar: null,
        type: newStory.type,
        content: newStory.content,
        background: newStory.background,
        likes: 0,
        comments: 0,
        views: 0,
        timestamp: 'Just now',
        duration: Math.max(5, Math.ceil(newStory.content.length / 20)),
        privacy: newStory.privacy
      };

      setStories(prev => ({
        ...prev,
        myStories: [story, ...prev.myStories]
      }));

      setNewStory({
        type: 'text',
        content: '',
        background: 'gradient-blue',
        privacy: 'public'
      });
      setShowCreateStory(false);
    }
  };

  const likeStory = (storyId) => {
    setStories(prev => ({
      myStories: prev.myStories.map(story =>
        story.id === storyId ? { ...story, likes: story.likes + 1 } : story
      ),
      following: prev.following.map(story =>
        story.id === storyId ? { ...story, likes: story.likes + 1 } : story
      )
    }));
  };

  const StoryViewer = ({ story, onClose }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showReactions, setShowReactions] = useState(false);

    const backgroundClass = backgroundOptions.find(bg => bg.id === story.background)?.class;

    React.useEffect(() => {
      if (isPlaying && currentTime < story.duration) {
        const timer = setTimeout(() => {
          setCurrentTime(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (currentTime >= story.duration) {
        onClose();
      }
    }, [currentTime, isPlaying, story.duration, onClose]);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
        <div className="relative w-full max-w-md h-[80vh] rounded-3xl overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="flex gap-1">
              {Array.from({ length: story.duration }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    index < currentTime
                      ? 'bg-white'
                      : 'bg-white bg-opacity-30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Story Content */}
          <div className={`w-full h-full bg-gradient-to-br ${backgroundClass} flex items-center justify-center p-8`}>
            <div className="text-center">
              <p className="text-white text-2xl font-bold leading-relaxed">
                {story.content}
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="absolute top-12 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } bg-opacity-20 backdrop-blur-sm flex items-center justify-center`}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">{story.userName}</p>
                <p className="text-white text-opacity-70 text-sm">{story.timestamp}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black bg-opacity-30 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => likeStory(story.id)}
                className="p-3 rounded-xl bg-black bg-opacity-30 text-white hover:bg-opacity-50 transition-all"
              >
                <Heart className="w-6 h-6" />
              </button>
              <button className="p-3 rounded-xl bg-black bg-opacity-30 text-white hover:bg-opacity-50 transition-all">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="p-3 rounded-xl bg-black bg-opacity-30 text-white hover:bg-opacity-50 transition-all">
                <Share className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-xl bg-black bg-opacity-30 text-white hover:bg-opacity-50 transition-all"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CreateStoryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className={`w-full max-w-2xl rounded-3xl overflow-hidden ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-xl font-black ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Create Story
          </h3>
          <button
            onClick={() => setShowCreateStory(false)}
            className={`p-2 rounded-xl ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Story Type Selection */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setNewStory(prev => ({ ...prev, type: 'text' }))}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                newStory.type === 'text'
                  ? darkMode
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-indigo-500 bg-indigo-50'
                  : darkMode
                  ? 'border-gray-700 hover:border-gray-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`w-8 h-8 mx-auto mb-2 ${
                newStory.type === 'text'
                  ? darkMode ? 'text-blue-400' : 'text-indigo-600'
                  : darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <span className={`font-semibold ${
                newStory.type === 'text'
                  ? darkMode ? 'text-blue-400' : 'text-indigo-600'
                  : darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Text
              </span>
            </button>

            <button
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'border-gray-700 text-gray-500'
                  : 'border-gray-200 text-gray-400'
              }`}
              disabled
            >
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <span className="font-semibold">Photo</span>
            </button>

            <button
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'border-gray-700 text-gray-500'
                  : 'border-gray-200 text-gray-400'
              }`}
              disabled
            >
              <Video className="w-8 h-8 mx-auto mb-2" />
              <span className="font-semibold">Video</span>
            </button>
          </div>

          {/* Background Selection */}
          <div className="mb-6">
            <h4 className={`font-semibold mb-3 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Background
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {backgroundOptions.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => setNewStory(prev => ({ ...prev, background: bg.id }))}
                  className={`aspect-square rounded-xl transition-all ${
                    newStory.background === bg.id
                      ? 'ring-4 ring-blue-500 ring-offset-2'
                      : 'hover:scale-105'
                  } ${bg.class}`}
                  title={bg.name}
                />
              ))}
            </div>
          </div>

          {/* Story Content */}
          <div className="mb-6">
            <h4 className={`font-semibold mb-3 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Your Story
            </h4>
            <textarea
              value={newStory.content}
              onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
              placeholder="What's happening?"
              className={`w-full h-32 px-4 py-3 rounded-xl border-2 resize-none transition-all ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
              }`}
            />
            <div className={`text-sm mt-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {newStory.content.length}/200 characters
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="mb-6">
            <h4 className={`font-semibold mb-3 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Privacy
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {privacyOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setNewStory(prev => ({ ...prev, privacy: option.id }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      newStory.privacy === option.id
                        ? darkMode
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-indigo-500 bg-indigo-50'
                        : darkMode
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${
                      newStory.privacy === option.id
                        ? darkMode ? 'text-blue-400' : 'text-indigo-600'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className={`font-semibold ${
                      newStory.privacy === option.id
                        ? darkMode ? 'text-blue-400' : 'text-indigo-600'
                        : darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {option.name}
                    </div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateStory(false)}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateStory}
              disabled={!newStory.content.trim()}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                !newStory.content.trim()
                  ? darkMode
                    ? 'bg-gray-600 text-gray-400'
                    : 'bg-gray-300 text-gray-500'
                  : darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
              }`}
            >
              Share Story
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const StoryCard = ({ story, isOwn = false }) => {
    const backgroundClass = backgroundOptions.find(bg => bg.id === story.background)?.class;
    
    return (
      <div
        onClick={() => setActiveStory(story)}
        className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-all hover:scale-105 hover:shadow-2xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Story Content Preview */}
        <div className={`aspect-[9/16] bg-gradient-to-br ${backgroundClass} flex items-center justify-center p-6`}>
          <p className="text-white text-lg font-bold text-center leading-relaxed line-clamp-6">
            {story.content}
          </p>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />

        {/* Footer */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">
                {story.userName}
                {isOwn && ' (You)'}
              </p>
              <p className="text-white text-opacity-70 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {story.timestamp}
              </p>
            </div>
            <div className="flex items-center gap-2 text-white text-opacity-70">
              <div className="flex items-center gap-1 text-xs">
                <Heart className="w-3 h-3" />
                {story.likes}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Eye className="w-3 h-3" />
                {story.views}
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Badge */}
        {story.privacy !== 'public' && (
          <div className="absolute top-3 left-3">
            <div className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
              story.privacy === 'team'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-gray-500/20 text-gray-300'
            }`}>
              {story.privacy === 'team' ? 'Team' : 'Private'}
            </div>
          </div>
        )}
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
          <div>
            <h1 className={`text-3xl font-black ${
              darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
            }`}>
              Stories
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Share moments and connect with your team
            </p>
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
            
            <button
              onClick={() => setShowCreateStory(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
              }`}
            >
              <Plus className="w-5 h-5" />
              Create Story
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Stories */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${
                darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <Users className={`w-6 h-6 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h3 className={`text-xl font-black ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  My Stories
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {stories.myStories.length} stories shared
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stories.myStories.map(story => (
                <StoryCard key={story.id} story={story} isOwn={true} />
              ))}
              
              {/* Add Story Card */}
              <button
                onClick={() => setShowCreateStory(true)}
                className={`aspect-[9/16] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group ${
                  darkMode
                    ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                    : 'border-gray-300 text-gray-500 hover:border-indigo-500 hover:text-indigo-600'
                }`}
              >
                <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 ${
                  darkMode
                    ? 'bg-gray-800 group-hover:bg-blue-500/20'
                    : 'bg-gray-100 group-hover:bg-indigo-100'
                }`}>
                  <Plus className="w-8 h-8" />
                </div>
                <span className="font-semibold">Add Story</span>
              </button>
            </div>
          </div>

          {/* Team Stories */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${
                darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
              <div>
                <h3 className={`text-xl font-black ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Team Stories
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Latest updates from your colleagues
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stories.following.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>

            {/* Stats */}
            <div className={`mt-8 p-6 rounded-2xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h4 className={`font-black mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Stories Overview
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl text-center ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-black mb-1 ${
                    darkMode ? 'text-blue-400' : 'text-indigo-600'
                  }`}>
                    {stories.myStories.length + stories.following.length}
                  </div>
                  <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Total Stories
                  </div>
                </div>
                <div className={`p-4 rounded-xl text-center ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-black mb-1 ${
                    darkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {stories.following.reduce((acc, story) => acc + story.views, 0)}
                  </div>
                  <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Total Views
                  </div>
                </div>
                <div className={`p-4 rounded-xl text-center ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-black mb-1 ${
                    darkMode ? 'text-pink-400' : 'text-pink-600'
                  }`}>
                    {stories.following.reduce((acc, story) => acc + story.likes, 0)}
                  </div>
                  <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Total Likes
                  </div>
                </div>
                <div className={`p-4 rounded-xl text-center ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-black mb-1 ${
                    darkMode ? 'text-orange-400' : 'text-orange-600'
                  }`}>
                    {stories.following.length}
                  </div>
                  <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Team Members
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateStory && <CreateStoryModal />}
      {activeStory && (
        <StoryViewer
          story={activeStory}
          onClose={() => setActiveStory(null)}
        />
      )}
    </div>
  );
};

export default StoriesPage;