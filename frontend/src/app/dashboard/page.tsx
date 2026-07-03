'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  MessageSquare, 
  TrendingUp, 
  Sparkles, 
  Users, 
  Settings, 
  LogOut, 
  Flame, 
  CheckCircle2, 
  Plus, 
  Brain, 
  ArrowRight, 
  Search, 
  UserCheck, 
  ShieldAlert, 
  Send,
  HelpCircle,
  ThumbsUp,
  MessageCircle,
  Clock,
  Unlock,
  Key,
  Edit2,
  Trash2,
  UserPlus,
  Check,
  X,
  Copy
} from 'lucide-react';
import Link from 'next/link';

// Mock initial data structures
interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  startAt: string;
  endAt: string;
  estimatedTime?: number;
}

interface Habit {
  id: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
}

interface Friend {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  statusText: string | null;
}

interface FriendRequest {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  code: string;
  statusText?: string;
}

interface Activity {
  id: string;
  displayName: string;
  type: 'GOAL_COMPLETED' | 'HABIT_STREAK';
  content: string;
  createdAt: string;
  comments: Array<{ id: string; user: string; text: string }>;
  reactions: string[];
}

const generateFriendCode = (username: string) => {
  const cleanName = username.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefix = cleanName.substring(0, 4).padEnd(4, 'X');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MOMENTUM-${prefix}${rand}`;
};

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<'overview' | 'calendar' | 'analytics' | 'friends' | 'chat' | 'ai'>('overview');
  const [isE2EESecured, setIsE2EESecured] = useState(false);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // States for goals
  const [goals, setGoals] = useState<Goal[]>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return [
      { id: '1', title: 'Design System Refinement', description: 'Align shades and variables', status: 'TODO', priority: 'HIGH', category: 'Work', startAt: `${todayStr}T09:00:00Z`, endAt: `${todayStr}T10:30:00Z`, estimatedTime: 90 },
      { id: '2', title: 'Cardio & Mindfulness Session', description: 'Gym run and meditation', status: 'COMPLETED', priority: 'MEDIUM', category: 'Health', startAt: `${todayStr}T11:00:00Z`, endAt: `${todayStr}T12:00:00Z`, estimatedTime: 60 },
      { id: '3', title: 'Review Weekly Roadmap', description: 'Briefing with designers', status: 'TODO', priority: 'LOW', category: 'Work', startAt: `${todayStr}T14:00:00Z`, endAt: `${todayStr}T15:00:00Z`, estimatedTime: 60 }
    ];
  });

  const getDateStrip = () => {
    const dates = [];
    const today = new Date();
    
    // start from yesterday
    const start = new Date();
    start.setDate(today.getDate() - 1);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      let label = d.toLocaleDateString(undefined, { weekday: 'short' });
      const todayStr = today.toISOString().split('T')[0];
      
      const tomorrowDate = new Date();
      tomorrowDate.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
      
      const yesterdayDate = new Date();
      yesterdayDate.setDate(today.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
      
      if (dateStr === todayStr) label = 'Today';
      else if (dateStr === tomorrowStr) label = 'Tomorrow';
      else if (dateStr === yesterdayStr) label = 'Yesterday';

      dates.push({
        dateStr,
        dayNum: d.getDate(),
        dayName: label,
        isToday: dateStr === todayStr
      });
    }
    return dates;
  };

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newGoalCategory, setNewGoalCategory] = useState('Work');
  const [newGoalEstimated, setNewGoalEstimated] = useState(30);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleDeleteGoal = (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  // States for habits
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: 'Drink 3L Water', currentStreak: 5, longestStreak: 12, completedToday: false },
    { id: '2', name: 'Read 15 Pages', currentStreak: 3, longestStreak: 15, completedToday: true },
    { id: '3', name: 'Morning Meditation', currentStreak: 8, longestStreak: 20, completedToday: false }
  ]);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // States for user profile details and password settings
  const [profileName, setProfileName] = useState('alex_coder');
  const [profileDisplayName, setProfileDisplayName] = useState('Alex Coder');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'details' | 'security'>('details');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // States for friends
  const [friendCode, setFriendCode] = useState('MOMENTUM-ALEX4821');
  const [searchCode, setSearchCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [friendsList, setFriendsList] = useState<Friend[]>([
    { userId: 'sarah', username: 'sarah_j', displayName: 'Sarah Jenkins', avatarUrl: null, statusText: 'Focused on UI design' },
    { userId: 'alex', username: 'alex_k', displayName: 'Alex K.', avatarUrl: null, statusText: 'Coding backend templates' }
  ]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([
    { id: 'req_1', userId: 'rohit_sharma', displayName: 'Rohit Sharma', avatarUrl: null, code: 'MOMENTUM-RHT77', statusText: 'Planning for next hackathon!' }
  ]);
  const [friendRequestSuccess, setFriendRequestSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // States for social activity feed
  const [activities, setActivities] = useState<Activity[]>([
    { id: 'act1', displayName: 'Sarah Jenkins', type: 'GOAL_COMPLETED', content: 'completed "Finalize High-Fidelity Mockups"', createdAt: '10m ago', comments: [], reactions: ['🔥'] },
    { id: 'act2', displayName: 'Alex K.', type: 'HABIT_STREAK', content: 'reached a 10-day streak on "Morning Meditation"', createdAt: '1h ago', comments: [{ id: '1', user: 'You', text: 'Amazing job!' }], reactions: ['👍', '🎉'] }
  ]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // States for chat
  const [activeChat, setActiveChat] = useState<string | null>('sarah');
  const [messageText, setMessageText] = useState('');
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{ sender: string; text: string; encrypted?: boolean }>>>({
    sarah: [
      { sender: 'sarah', text: 'Hey, did you check the optimization metrics?' },
      { sender: 'me', text: 'Yes, looking great. E2EE keys are exchanging now.' }
    ],
    alex: [
      { sender: 'alex', text: 'Let me know when the backend updates compile.' }
    ]
  });

  // States for AI
  const [aiChatText, setAiChatText] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am Momentum AI. I have analyzed your planner. Type "optimize" to auto-arrange your tasks, or ask me tips to rebuild your streak.' }
  ]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on client-mount to prevent Next.js hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    
    const storedGoals = localStorage.getItem('momentum_goals');
    if (storedGoals) {
      try {
        setGoals(JSON.parse(storedGoals));
      } catch (e) {
        console.error('Failed to parse stored goals:', e);
      }
    }
    
    const storedHabits = localStorage.getItem('momentum_habits');
    if (storedHabits) {
      try {
        setHabits(JSON.parse(storedHabits));
      } catch (e) {
        console.error('Failed to parse stored habits:', e);
      }
    }

    const storedName = localStorage.getItem('momentum_profile_name');
    if (storedName) setProfileName(storedName);
    
    const storedDisplayName = localStorage.getItem('momentum_profile_display_name');
    if (storedDisplayName) setProfileDisplayName(storedDisplayName);
    
    const storedPic = localStorage.getItem('momentum_profile_pic');
    if (storedPic) setProfilePic(storedPic);

    const storedCode = localStorage.getItem('momentum_friend_code');
    if (storedCode) {
      setFriendCode(storedCode);
    } else {
      const generated = generateFriendCode(storedName || 'alex_coder');
      setFriendCode(generated);
      localStorage.setItem('momentum_friend_code', generated);
    }

    const storedFriends = localStorage.getItem('momentum_friends');
    if (storedFriends) {
      try {
        setFriendsList(JSON.parse(storedFriends));
      } catch (e) {}
    }

    const storedActivities = localStorage.getItem('momentum_activities');
    if (storedActivities) {
      try {
        setActivities(JSON.parse(storedActivities));
      } catch (e) {}
    }

    const storedIncoming = localStorage.getItem('momentum_incoming_requests');
    if (storedIncoming) {
      try {
        setIncomingRequests(JSON.parse(storedIncoming));
      } catch (e) {}
    }
  }, []);

  // Save goals and habits to localStorage when state changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('momentum_goals', JSON.stringify(goals));
    }
  }, [goals, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('momentum_habits', JSON.stringify(habits));
    }
  }, [habits, isMounted]);

  // Sync profile details and update unique Friend Code to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('momentum_profile_name', profileName);
      localStorage.setItem('momentum_profile_display_name', profileDisplayName);
      if (profilePic) {
        localStorage.setItem('momentum_profile_pic', profilePic);
      } else {
        localStorage.removeItem('momentum_profile_pic');
      }

      const newCode = generateFriendCode(profileName);
      setFriendCode(newCode);
      localStorage.setItem('momentum_friend_code', newCode);
    }
  }, [profileName, profileDisplayName, profilePic, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('momentum_friends', JSON.stringify(friendsList));
    }
  }, [friendsList, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('momentum_activities', JSON.stringify(activities));
    }
  }, [activities, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('momentum_incoming_requests', JSON.stringify(incomingRequests));
    }
  }, [incomingRequests, isMounted]);

  const calculateAnalytics = () => {
    const nowStr = new Date().toISOString();
    
    // Calculate goals metrics
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
    
    // Missed goals: TODO status but endAt is in the past
    const missedGoals = goals.filter(g => g.status === 'TODO' && g.endAt < nowStr).length;
    
    const successRatio = totalGoals > 0 
      ? Math.round((completedGoals / totalGoals) * 100) 
      : 0;

    // Calculate habit streak metrics
    const maxStreak = habits.length > 0 
      ? Math.max(...habits.map(h => h.longestStreak)) 
      : 0;
      
    const currentStreakSum = habits.length > 0
      ? Math.max(...habits.map(h => h.currentStreak))
      : 0;

    // Burnout index calculation based on task density
    const urgentDensity = goals.filter(g => g.priority === 'URGENT' || g.priority === 'HIGH').length;
    let burnoutRisk = 'Low';
    let burnoutColor = 'bg-emerald-500/20 text-emerald-400';
    if (urgentDensity > 4) {
      burnoutRisk = 'High';
      burnoutColor = 'bg-red-500/20 text-red-400';
    } else if (urgentDensity > 2) {
      burnoutRisk = 'Medium';
      burnoutColor = 'bg-orange-500/20 text-orange-400';
    }

    // Generate dynamic heatmap data for the past 28 days
    const heatmap = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Find completions on this date
      const dayCompletions = goals.filter(g => 
        g.startAt.startsWith(dateStr) && g.status === 'COMPLETED'
      ).length;

      heatmap.push({
        dateStr,
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        completions: dayCompletions
      });
    }

    // Dynamic analysis text report
    let advice = '';
    if (successRatio >= 80) {
      advice = 'Excellent consistency! Your execution rate is in the top tier. Keep pacing yourself and ensure you maintain rest blocks to prevent cognitive fatigue.';
    } else if (successRatio >= 50) {
      advice = 'Steady progress. You are converting half of your planned tasks. Consider reducing the scope of low-priority tasks and moving them to tomorrow if they overload your schedule.';
    } else if (totalGoals > 0) {
      advice = 'Productivity bottleneck detected. You have a high ratio of missed tasks. Try setting smaller estimated time blocks (under 30 minutes) to rebuild momentum.';
    } else {
      advice = 'No task history recorded yet. Start adding and completing tasks in the Calendar view to generate your first AI productivity scorecard.';
    }

    return {
      totalGoals,
      completedGoals,
      missedGoals,
      successRatio,
      maxStreak,
      currentStreakSum,
      burnoutRisk,
      burnoutColor,
      heatmap,
      advice
    };
  };

  // Core handler functions
  const handleToggleGoal = (goalId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const nextStatus = g.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
        
        // Log social activity if completed
        if (nextStatus === 'COMPLETED') {
          const newAct: Activity = {
            id: `act_${Date.now()}`,
            displayName: 'You',
            type: 'GOAL_COMPLETED',
            content: `completed "${g.title}"`,
            createdAt: 'Just now',
            comments: [],
            reactions: []
          };
          setActivities(prevAct => [newAct, ...prevAct]);
        }

        return { ...g, status: nextStatus };
      }
      return g;
    }));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const now = new Date();
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(now.getHours(), now.getMinutes(), 0, 0);

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title: newGoalTitle,
      description: 'Custom goal created via planner',
      status: 'TODO',
      priority: newGoalPriority,
      category: newGoalCategory,
      startAt: startDateTime.toISOString(),
      endAt: new Date(startDateTime.getTime() + newGoalEstimated * 60 * 1000).toISOString(),
      estimatedTime: newGoalEstimated
    };

    setGoals(prev => [newGoal, ...prev]);
    setNewGoalTitle('');
  };

  const handleToggleHabit = (habitId: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const nextCompleted = !h.completedToday;
        const nextStreak = nextCompleted ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1);
        
        if (nextCompleted && nextStreak > 0 && nextStreak % 5 === 0) {
          const newAct: Activity = {
            id: `act_${Date.now()}`,
            displayName: 'You',
            type: 'HABIT_STREAK',
            content: `reached a ${nextStreak}-day streak on "${h.name}"`,
            createdAt: 'Just now',
            comments: [],
            reactions: []
          };
          setActivities(prevAct => [newAct, ...prevAct]);
        }

        return {
          ...h,
          completedToday: nextCompleted,
          currentStreak: nextStreak,
          longestStreak: Math.max(h.longestStreak, nextStreak)
        };
      }
      return h;
    }));
  };

  const handleSendFriendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const code = searchCode.toUpperCase().trim();
      if (code === 'MOMENTUM-RHT77') {
        const req = incomingRequests.find(r => r.userId === 'rohit_sharma');
        if (req) {
          handleAcceptRequest(req);
        } else {
          setFriendRequestSuccess(true);
        }
      } else if (code.includes('KABIR') || code === 'MOMENTUM-KBR88') {
        const kabirFriend: Friend = {
          userId: 'kabir_ai',
          username: 'kabir_ai',
          displayName: 'Kabir AI',
          avatarUrl: null,
          statusText: 'Fine-tuning LLM pipelines'
        };
        setFriendsList(prev => {
          if (prev.some(f => f.userId === kabirFriend.userId)) return prev;
          return [...prev, kabirFriend];
        });
        setFriendRequestSuccess(true);
      } else {
        setFriendRequestSuccess(true);
      }
      setSearchCode('');
      setTimeout(() => setFriendRequestSuccess(false), 3000);
    }, 1000);
  };

  const handleSearchUsers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const discoverableUsers: Friend[] = [
      { userId: 'rohit_sharma', username: 'rohit_sharma', displayName: 'Rohit Sharma', avatarUrl: null, statusText: 'Planning for next hackathon!' },
      { userId: 'neha_dev', username: 'neha_dev', displayName: 'Neha Dev', avatarUrl: null, statusText: 'Debugging CSS layouts' },
      { userId: 'kabir_ai', username: 'kabir_ai', displayName: 'Kabir AI', avatarUrl: null, statusText: 'Fine-tuning LLM pipelines' },
      { userId: 'himaa_w', username: 'himaa_w', displayName: 'Himaa W.', avatarUrl: null, statusText: 'Morning workout complete!' }
    ];
    const matches = discoverableUsers.filter(u => 
      u.username.toLowerCase().includes(query) || 
      u.displayName.toLowerCase().includes(query)
    );
    setSearchResults(matches);
  };

  const handleSendRequestToUser = (user: Friend) => {
    setFriendRequestSuccess(true);
    setTimeout(() => setFriendRequestSuccess(false), 3000);
  };

  const handleAcceptRequest = (req: FriendRequest) => {
    const newFriend: Friend = {
      userId: req.userId,
      username: req.userId,
      displayName: req.displayName,
      avatarUrl: req.avatarUrl,
      statusText: req.statusText || 'Connected on Momentum'
    };
    
    setFriendsList(prev => {
      if (prev.some(f => f.userId === newFriend.userId)) return prev;
      return [...prev, newFriend];
    });

    setChatMessages(prev => ({
      ...prev,
      [newFriend.userId]: [
        { sender: newFriend.userId, text: `Hey there! Glad to connect on Momentum.` }
      ]
    }));

    setIncomingRequests(prev => prev.filter(r => r.id !== req.id));

    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      displayName: req.displayName,
      type: 'GOAL_COMPLETED',
      content: `is now connected with you on Momentum. Start planning together!`,
      createdAt: 'Just now',
      comments: [],
      reactions: ['🎉']
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const handleRejectRequest = (reqId: string) => {
    setIncomingRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleCopyFriendCode = () => {
    navigator.clipboard.writeText(friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSocialReact = (actId: string, emoji: string) => {
    setActivities(prev => prev.map(act => {
      if (act.id === actId) {
        return {
          ...act,
          reactions: act.reactions.includes(emoji) 
            ? act.reactions.filter(r => r !== emoji)
            : [...act.reactions, emoji]
        };
      }
      return act;
    }));
  };

  const handleAddSocialComment = (actId: string) => {
    const text = commentInputs[actId];
    if (!text || !text.trim()) return;

    setActivities(prev => prev.map(act => {
      if (act.id === actId) {
        return {
          ...act,
          comments: [...act.comments, { id: `c_${Date.now()}`, user: 'You', text }]
        };
      }
      return act;
    }));

    setCommentInputs(prev => ({ ...prev, [actId]: '' }));
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const newMsg = {
      sender: 'me',
      text: isE2EESecured ? `[E2EE Ciphertext: AES-GCM] ${messageText}` : messageText,
      encrypted: isE2EESecured
    };

    setChatMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMsg]
    }));

    setMessageText('');
  };

  const handleGenerateE2EEKeys = () => {
    setIsGeneratingKeys(true);
    setTimeout(() => {
      setIsGeneratingKeys(false);
      setIsE2EESecured(true);
    }, 1500);
  };

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatText.trim()) return;

    const userText = aiChatText;
    setAiMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setAiChatText('');

    setTimeout(() => {
      const lower = userText.toLowerCase();
      let aiResponse = 'I am scanning your productivity index. Type "optimize" to auto-arrange your tasks.';

      if (lower.includes('optimize')) {
        aiResponse = 'Optimizing schedule... Aligned with peak focus: "Design System Refinement" suggested for 09:00 AM. 15-minute recovery break suggested at 10:30 AM.';
        
        // Mock actual rearrange!
        setGoals(prev => {
          const urgentGoal = prev.find(g => g.priority === 'HIGH');
          if (urgentGoal) {
            return [
              { ...urgentGoal, title: '✨ [AI Optimized] Design System Refinement', startAt: new Date().toISOString() },
              ...prev.filter(g => g.id !== urgentGoal.id)
            ];
          }
          return prev;
        });
      } else if (lower.includes('burnout')) {
        aiResponse = ' burnOut Indicator: Your cognitive intensity is 84%. We recommend completing "Cardio & Mindfulness Session" and postponing low-priority tasks.';
      } else if (lower.includes('streak') || lower.includes('habit')) {
        aiResponse = 'Habit Streak Advice: Anchor "Drink 3L Water" to your coding session blocks. Complete it immediately after starting a Pomodoro timer.';
      }

      setAiMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 1000);
  };

  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-lg hidden md:flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-md">
              M
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              MOMENTUM
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveView('overview')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'overview' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'calendar' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar Planner
            </button>
            <button
              onClick={() => setActiveView('chat')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'chat' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Encrypted Chat
            </button>
            <button
              onClick={() => setActiveView('friends')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'friends' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Friend Hub
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'analytics' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setActiveView('ai')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'ai' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Workspace content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between backdrop-blur-md sticky top-0 bg-background/50 z-20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {activeView === 'overview' && 'Momentum Overview'}
            {activeView === 'calendar' && 'Calendar Planner'}
            {activeView === 'chat' && 'E2EE Real-time Chat'}
            {activeView === 'friends' && 'Friend Social Planner'}
            {activeView === 'analytics' && 'Consistency Metrics'}
            {activeView === 'ai' && 'AI Planning Assistant'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Local Fallback Mode</span>
            </div>
            <div className="flex items-center gap-3 border-l border-white/15 pl-4">
              <div 
                onClick={() => {
                  setActiveProfileTab('details');
                  setSecurityMessage(null);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
                title="Profile Settings"
              >
                {profilePic ? (
                  <img src={profilePic} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-white/15" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white uppercase">
                    {profileName ? profileName.charAt(0) : 'A'}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold leading-tight text-white">{profileDisplayName}</p>
                  <p className="text-[9px] text-muted-foreground">@{profileName}</p>
                </div>
              </div>
              <Link href="/" className="text-muted-foreground hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5" title="Log Out">
                <LogOut className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* View Switchers */}
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8 flex-1">
          {/* Week Date Strip Selector */}
          {(activeView === 'overview' || activeView === 'calendar') && (
            <div className="glass-panel p-4 rounded-3xl border border-white/10 flex flex-col gap-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Planning Calendar</h3>
                <span className="text-xs font-bold text-white bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                  {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {getDateStrip().map((d) => {
                  const isSelected = d.dateStr === selectedDate;
                  return (
                    <button
                      key={d.dateStr}
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`flex-1 min-w-[76px] py-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 ${
                        isSelected 
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                          : 'bg-white/5 border-white/5 text-muted-foreground hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider">{d.dayName}</span>
                      <span className="text-base font-extrabold">{d.dayNum}</span>
                      {d.isToday && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            
            {/* Overview dashboard */}
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* AI banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      Momentum AI Suggestion
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Your fatigue index is Low. Complete "Design System Refinement" today at 09:00 AM to unlock a +18% task efficiency bonus.
                    </p>
                    <button 
                      onClick={() => {
                        setActiveView('ai');
                        setIsOptimizing(true);
                      }} 
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-2"
                    >
                      Open Assistant Planner <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Habit Streaks grid */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Today's Habit Tracker</h3>
                    <button 
                      onClick={() => setIsAddingHabit(true)} 
                      className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Habit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {habits.map((habit) => (
                      <div 
                        key={habit.id} 
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group ${
                          habit.completedToday ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">{habit.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Flame className={`w-3.5 h-3.5 ${habit.completedToday ? 'text-orange-500' : ''}`} />
                            <span>{habit.currentStreak} Day Streak</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingHabit(habit);
                              }}
                              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                              title="Edit habit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setHabits(prev => prev.filter(h => h.id !== habit.id));
                              }}
                              className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                              title="Delete habit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                            habit.completedToday ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'
                          }`}>
                            {habit.completedToday && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Focus List */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Daily Focus Timeline</h3>
                    <button onClick={() => setActiveView('calendar')} className="text-xs text-primary hover:underline font-bold flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  </div>
                  <div className="space-y-3">
                    {goals.filter(g => g.startAt.startsWith(selectedDate)).length === 0 ? (
                      <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center py-10 space-y-2">
                        <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto opacity-35" />
                        <p className="text-sm font-semibold text-white">No tasks scheduled</p>
                        <p className="text-xs text-muted-foreground">Select another day or add tasks in the Calendar tab!</p>
                      </div>
                    ) : (
                      goals.filter(g => g.startAt.startsWith(selectedDate)).map((g) => (
                        <div 
                          key={g.id} 
                          onClick={() => handleToggleGoal(g.id)}
                          className={`glass-panel p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                            g.status === 'COMPLETED' ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                              g.status === 'COMPLETED' ? 'bg-primary border-primary text-white' : 'border-white/25'
                            }`}>
                              {g.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold text-white ${g.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>{g.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              g.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                              g.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                              g.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-muted/30 text-muted-foreground'
                            }`}>
                              {g.priority}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGoal(g);
                              }}
                              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                              title="Edit task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteGoal(g.id, e)}
                              className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Calendar view */}
            {activeView === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Planner List */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">Today</span>
                        <span className="px-3 py-1 rounded-full bg-white/5 text-muted-foreground text-xs font-semibold hover:text-white transition-colors cursor-pointer">Week</span>
                        <span className="px-3 py-1 rounded-full bg-white/5 text-muted-foreground text-xs font-semibold hover:text-white transition-colors cursor-pointer">Month</span>
                      </div>
                      <span className="text-sm font-bold text-white">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    </div>

                    <div className="space-y-4">
                      {goals.filter(g => g.startAt.startsWith(selectedDate)).length === 0 ? (
                        <div className="p-6 text-center py-10 space-y-2 border border-dashed border-white/10 rounded-xl">
                          <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto opacity-35" />
                          <p className="text-sm font-semibold text-white">No tasks scheduled</p>
                          <p className="text-xs text-muted-foreground">Use the form on the right to schedule a task for this day.</p>
                        </div>
                      ) : (
                        goals.filter(g => g.startAt.startsWith(selectedDate)).map((g) => (
                          <div key={g.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-8 rounded bg-primary"></div>
                              <div>
                                <p className="text-sm font-semibold text-white">{g.title}</p>
                                <span className="text-xs text-muted-foreground block mt-0.5">{g.category} • {g.estimatedTime || 30} mins</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setEditingGoal(g)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                title="Edit task"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  setGoals(prev => prev.filter(item => item.id !== g.id));
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Goal Sidebar Form */}
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Create New Task</h3>
                    <form onSubmit={handleAddGoal} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Title</label>
                        <input 
                          type="text" 
                          required
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                          placeholder="e.g. Code auth forms"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Priority</label>
                        <select 
                          value={newGoalPriority}
                          onChange={(e: any) => setNewGoalPriority(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                        >
                          <option value="LOW" className="bg-background text-foreground">Low</option>
                          <option value="MEDIUM" className="bg-background text-foreground">Medium</option>
                          <option value="HIGH" className="bg-background text-foreground">High</option>
                          <option value="URGENT" className="bg-background text-foreground">Urgent</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Category</label>
                        <input 
                          type="text" 
                          value={newGoalCategory}
                          onChange={(e) => setNewGoalCategory(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                          placeholder="Work, Health, Study"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estimation (Minutes)</label>
                        <input 
                          type="number" 
                          value={newGoalEstimated}
                          onChange={(e) => setNewGoalEstimated(Number(e.target.value))}
                          className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full h-10 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-md mt-6"
                      >
                        <Plus className="w-4 h-4" /> Add to Planner
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Friend Social Hub */}
            {activeView === 'friends' && (
              <motion.div
                key="friends"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left Side: Requests, Discover, Timeline */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Incoming Requests */}
                  {incomingRequests.length > 0 && (
                    <div className="glass-panel p-6 rounded-3xl border border-primary/25 space-y-4 shadow-lg shadow-primary/5">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Incoming Friend Requests ({incomingRequests.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {incomingRequests.map((req) => (
                          <div key={req.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white">
                                {req.displayName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{req.displayName}</p>
                                <p className="text-[10px] text-muted-foreground italic">"{req.statusText || 'Hey! Let\'s follow each other.'}"</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleAcceptRequest(req)}
                                className="p-2 rounded-xl bg-primary text-white hover:opacity-95 transition-opacity flex items-center justify-center"
                                title="Accept Request"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleRejectRequest(req.id)}
                                className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white transition-colors flex items-center justify-center"
                                title="Ignore Request"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discover & Search Users */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Discover & Search Users</h3>
                    <form onSubmit={handleSearchUsers} className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search friends by username or display name..."
                          className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-primary text-white"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="px-4 h-10 bg-white text-black font-bold text-xs rounded-xl flex items-center justify-center hover:bg-white/90 transition-colors"
                      >
                        Search
                      </button>
                    </form>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2.5 pt-2 border-t border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Search Results</p>
                        {searchResults.map((user) => {
                          const isAlreadyFriend = friendsList.some(f => f.userId === user.userId);
                          return (
                            <div key={user.userId} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white">
                                  {user.displayName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">{user.displayName}</p>
                                  <p className="text-[9px] text-muted-foreground">@{user.username}</p>
                                </div>
                              </div>
                              {isAlreadyFriend ? (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5" /> Friends
                                </span>
                              ) : (
                                <button 
                                  onClick={() => handleSendRequestToUser(user)}
                                  className="px-3 py-1.5 bg-primary text-white font-bold text-[10px] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Connect
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Social Feed Timeline */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Social Activity Feed</h3>
                    <div className="space-y-6">
                      {activities.map((act) => (
                        <div key={act.id} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center font-bold text-sm text-white">
                                {act.displayName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{act.displayName}</p>
                                <span className="text-[10px] text-muted-foreground">{act.createdAt}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {['🔥', '🎉', '👍'].map((emoji) => (
                                <button 
                                  key={emoji}
                                  onClick={() => handleSocialReact(act.id, emoji)}
                                  className={`px-2 py-1 rounded bg-white/5 border text-xs hover:bg-white/10 transition-colors ${
                                    act.reactions.includes(emoji) ? 'border-primary' : 'border-white/5'
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          <p className="text-sm text-white font-medium bg-black/20 p-3 rounded-xl border border-white/5">
                            {act.content}
                          </p>

                          {/* Comments list */}
                          {act.comments.length > 0 && (
                            <div className="space-y-2 border-t border-white/5 pt-3">
                              {act.comments.map((c) => (
                                <div key={c.id} className="text-xs flex gap-2">
                                  <span className="font-bold text-primary">{c.user}:</span>
                                  <span className="text-muted-foreground">{c.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add comment box */}
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={commentInputs[act.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [act.id]: e.target.value }))}
                              placeholder="Type an encouraging note..."
                              className="flex-1 h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-primary text-white"
                            />
                            <button 
                              onClick={() => handleAddSocialComment(act.id)}
                              className="px-3 h-8 bg-white text-black font-semibold text-xs rounded-lg flex items-center gap-1 hover:bg-white/90 transition-colors"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Share, Add, Friends List */}
                <div className="space-y-6">
                  {/* Share code */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Your Friend Code</h3>
                    <div 
                      onClick={handleCopyFriendCode}
                      className="p-3 rounded-xl bg-black/35 border border-white/5 font-mono text-sm font-bold text-center tracking-widest text-primary cursor-pointer hover:border-primary/40 transition-colors flex items-center justify-center gap-2 group"
                      title="Click to copy code"
                    >
                      <span>{friendCode}</span>
                      {copiedCode ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal text-center">Share this code with friends so they can follow your planning progress and check streaks.</p>
                  </div>

                  {/* Add friend by code */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Add Friend Code</h3>
                    {friendRequestSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold text-center">
                        Request Processed / Friend Added Successfully!
                      </div>
                    )}
                    <form onSubmit={handleSendFriendRequest} className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        placeholder="MOMENTUM-XXXXXX"
                        className="flex-1 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono focus:outline-none focus:border-primary text-white text-center"
                      />
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="px-4 h-10 bg-primary text-white font-bold text-xs rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                      </button>
                    </form>
                    <div className="text-[9px] text-muted-foreground leading-normal mt-1 space-y-0.5">
                      <p>💡 Tip: Enter <span className="font-mono text-white">MOMENTUM-RHT77</span> to accept Rohit's request.</p>
                      <p>💡 Tip: Enter <span className="font-mono text-white">MOMENTUM-KBR88</span> to add Kabir AI directly.</p>
                    </div>
                  </div>

                  {/* Friends List */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Friends ({friendsList.length})</h3>
                    <div className="space-y-3">
                      {friendsList.map((f) => (
                        <div key={f.userId} className="flex items-center gap-3 justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white">
                                {f.displayName.charAt(0)}
                              </div>
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black/80"></span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{f.displayName}</p>
                              <p className="text-[9px] text-muted-foreground italic mt-0.5">"{f.statusText || 'Active planner'}"</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => {
                                setActiveChat(f.userId);
                                setActiveView('chat');
                              }} 
                              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                            >
                              Chat
                            </button>
                            <button 
                              onClick={() => {
                                setFriendsList(prev => prev.filter(item => item.userId !== f.userId));
                              }} 
                              className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                              title="Remove Friend"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Secure E2EE Chat */}
            {activeView === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[500px]"
              >
                {/* Rooms selection list */}
                <div className="lg:col-span-1 glass-panel p-4 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Secured Chats</h3>
                  <div className="space-y-2">
                    {friendsList.map((f) => (
                      <div 
                        key={f.userId}
                        onClick={() => setActiveChat(f.userId)}
                        className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                          activeChat === f.userId ? 'bg-primary/20 border border-primary/20 text-white' : 'hover:bg-white/5 text-muted-foreground hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white">
                          {f.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{f.displayName}</p>
                          <span className="text-[9px] text-muted-foreground font-semibold">E2EE Chat Session</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversation Box */}
                <div className="lg:col-span-3 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none"></div>

                  {/* Cryptographic Controls Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isE2EESecured ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                      <span className="text-xs font-bold text-white">
                        {isE2EESecured ? 'E2EE Session Active (AES-GCM)' : 'E2EE Inactive (Session Unsigned)'}
                      </span>
                    </div>

                    {!isE2EESecured && (
                      <button 
                        onClick={handleGenerateE2EEKeys}
                        disabled={isGeneratingKeys}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold hover:bg-primary/95 transition-all shadow-md flex items-center gap-1"
                      >
                        {isGeneratingKeys ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Generating ECDH Keys...
                          </>
                        ) : (
                          <>
                            <Key className="w-3 h-3" />
                            Exchange E2EE Keys
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Messages Flow */}
                  <div className="flex-1 space-y-4 overflow-y-auto min-h-[300px] max-h-[350px] pr-2 scrollbar-thin">
                    {activeChat && chatMessages[activeChat]?.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs space-y-1 ${
                          msg.sender === 'me' 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                        }`}>
                          <p>{msg.text}</p>
                          {msg.encrypted && (
                            <span className="text-[8px] text-white/55 block text-right font-mono tracking-wider">
                              Decrypted E2EE Client-Side
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Inputs */}
                  <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-white/5 pt-4 mt-4">
                    <input 
                      type="text" 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a private message..."
                      className="flex-1 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-primary text-white"
                    />
                    <button 
                      type="submit" 
                      className="px-4 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:opacity-95 transition-opacity"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Analytics view */}
            {activeView === 'analytics' && (() => {
              const stats = calculateAnalytics();
              return (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  {/* Stats cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
                      <p className="text-3xl font-extrabold text-primary">{stats.successRatio}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Consistency Score</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
                      <p className="text-3xl font-extrabold text-emerald-400">{stats.maxStreak} Days</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Longest Habit Streak</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
                      <p className="text-3xl font-extrabold text-purple-400">{stats.currentStreakSum} Days</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Current Active Streak</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center flex flex-col justify-center items-center">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Burnout Risk Index</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${stats.burnoutColor} font-bold uppercase`}>{stats.burnoutRisk}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Heatmap Card */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Daily Completion Heatmap (Past 28 Days)</h3>
                      <div className="grid grid-cols-7 gap-2 p-4 bg-black/15 rounded-xl border border-white/5 justify-items-center">
                        {stats.heatmap.map((day) => {
                          let color = 'bg-white/5';
                          if (day.completions === 1) color = 'bg-primary/25 border-primary/20';
                          else if (day.completions === 2) color = 'bg-primary/50 border-primary/40';
                          else if (day.completions >= 3) color = 'bg-primary border-primary/60';

                          return (
                            <div 
                              key={day.dateStr}
                              className={`w-10 h-10 rounded-lg border ${color} transition-all cursor-pointer hover:ring-2 hover:ring-white/40 flex flex-col items-center justify-center`}
                              title={`${day.displayDate}: ${day.completions} task(s) completed`}
                            >
                              <span className="text-[8px] text-white/35 font-bold uppercase">{day.displayDate.split(' ')[0]}</span>
                              <span className="text-[11px] font-extrabold text-white">{day.displayDate.split(' ')[1]}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground max-w-xs mx-auto">
                        <span>Less Active</span>
                        <div className="flex gap-1.5">
                          <div className="w-3.5 h-3.5 rounded bg-white/5 border border-white/5"></div>
                          <div className="w-3.5 h-3.5 rounded bg-primary/25 border border-primary/20"></div>
                          <div className="w-3.5 h-3.5 rounded bg-primary/50 border border-primary/40"></div>
                          <div className="w-3.5 h-3.5 rounded bg-primary border border-primary/60"></div>
                        </div>
                        <span>Highly Productive</span>
                      </div>
                    </div>

                    {/* AI Productivity Report Card */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-primary" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">AI Planning Report</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Total Tasks Logged</span>
                            <span className="font-bold text-white">{stats.totalGoals}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Completed Tasks</span>
                            <span className="font-bold text-emerald-400">{stats.completedGoals}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Missed / Overdue Tasks</span>
                            <span className="font-bold text-red-400">{stats.missedGoals}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                          {stats.advice}
                        </p>
                      </div>
                      
                      <div className="border-t border-white/5 pt-4 text-[10px] text-muted-foreground flex justify-between items-center">
                        <span>Report Generated: Just Now</span>
                        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary animate-pulse" /> Verified by Momentum AI</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* AI Assistant Chat */}
            {activeView === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px]"
              >
                {/* AI Assistant Chat Panel */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-2">
                    {aiMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs flex gap-3 ${
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                        }`}>
                          {msg.sender === 'ai' && <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendAiMessage} className="flex gap-2 border-t border-white/5 pt-4 mt-4">
                    <input 
                      type="text" 
                      value={aiChatText}
                      onChange={(e) => setAiChatText(e.target.value)}
                      placeholder="Ask me: 'optimize', 'burnout check', or 'streak advice'..."
                      className="flex-1 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-primary text-white"
                    />
                    <button 
                      type="submit" 
                      className="px-4 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:opacity-95 transition-opacity"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* AI Schedule Optimizer controls panel */}
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3>Momentum Optimizer</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Let our AI analyze your tasks, priorities, and past habits to auto-arrange your day into a friction-free schedule.
                    </p>
                    <button 
                      onClick={() => {
                        setIsOptimizing(true);
                        setTimeout(() => {
                          setIsOptimizing(false);
                          // Trigger optimization message in AI chat
                          setAiMessages(prev => [
                            ...prev, 
                            { sender: 'user', text: 'optimize' },
                            { sender: 'ai', text: 'Optimizing schedule... Aligned with peak focus: "Design System Refinement" suggested for 09:00 AM. 15-minute recovery break suggested at 10:30 AM.' }
                          ]);
                        }, 1200);
                      }}
                      disabled={isOptimizing}
                      className="w-full h-10 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity shadow-md"
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Calculating schedule...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Optimize My Schedule
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Edit Goal Modal Overlay */}
      <AnimatePresence>
        {editingGoal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white">Modify Task</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Title</label>
                  <input 
                    type="text" 
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                    placeholder="Task title"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Description</label>
                  <input 
                    type="text" 
                    value={editingGoal.description || ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                    placeholder="Brief description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Priority</label>
                    <select 
                      value={editingGoal.priority}
                      onChange={(e) => setEditingGoal({ ...editingGoal, priority: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                    >
                      <option value="LOW" className="bg-zinc-950">LOW</option>
                      <option value="MEDIUM" className="bg-zinc-950">MEDIUM</option>
                      <option value="HIGH" className="bg-zinc-950">HIGH</option>
                      <option value="URGENT" className="bg-zinc-950">URGENT</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Minutes</label>
                    <input 
                      type="number" 
                      value={editingGoal.estimatedTime || 30}
                      onChange={(e) => setEditingGoal({ ...editingGoal, estimatedTime: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setGoals(prev => prev.map(g => g.id === editingGoal.id ? editingGoal : g));
                    setEditingGoal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Habit Modal */}
      <AnimatePresence>
        {isAddingHabit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/15 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white">Create New Habit</h3>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Habit Name</label>
                <input 
                  type="text" 
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                  placeholder="e.g. Drink 3L Water"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={() => {
                    setIsAddingHabit(false);
                    setNewHabitName('');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (!newHabitName.trim()) return;
                    const newHabit = {
                      id: `habit_${Date.now()}`,
                      name: newHabitName,
                      currentStreak: 0,
                      longestStreak: 0,
                      completedToday: false
                    };
                    setHabits(prev => [newHabit, ...prev]);
                    setIsAddingHabit(false);
                    setNewHabitName('');
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Create Habit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modify Habit Modal */}
      <AnimatePresence>
        {editingHabit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/15 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white">Modify Habit</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Habit Name</label>
                  <input 
                    type="text" 
                    value={editingHabit.name}
                    onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Streak</label>
                    <input 
                      type="number" 
                      value={editingHabit.currentStreak}
                      onChange={(e) => setEditingHabit({ ...editingHabit, currentStreak: Math.max(0, Number(e.target.value)) })}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Longest Streak</label>
                    <input 
                      type="number" 
                      value={editingHabit.longestStreak}
                      onChange={(e) => setEditingHabit({ ...editingHabit, longestStreak: Math.max(0, Number(e.target.value)) })}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={() => setEditingHabit(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setHabits(prev => prev.map(h => h.id === editingHabit.id ? editingHabit : h));
                    setEditingHabit(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Settings Modal Overlay */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/15 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white">Profile Settings</h3>
                <button 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-xs text-muted-foreground hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Tabs selector */}
              <div className="flex border-b border-white/5 gap-4">
                <button 
                  onClick={() => setActiveProfileTab('details')}
                  className={`pb-2 text-xs font-bold transition-all relative ${
                    activeProfileTab === 'details' ? 'text-primary' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Edit Profile
                  {activeProfileTab === 'details' && (
                    <motion.div layoutId="profileTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveProfileTab('security')}
                  className={`pb-2 text-xs font-bold transition-all relative ${
                    activeProfileTab === 'security' ? 'text-primary' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Account Security
                  {activeProfileTab === 'security' && (
                    <motion.div layoutId="profileTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>

              {/* Form Views */}
              {activeProfileTab === 'details' ? (
                <div className="space-y-4 py-2">
                  {/* Profile Picture Uploader */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative group cursor-pointer w-20 h-20 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                      {profilePic ? (
                        <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-white uppercase">{profileName.charAt(0)}</span>
                      )}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-bold transition-opacity cursor-pointer">
                        <span>Upload</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setProfilePic(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {profilePic && (
                      <button 
                        onClick={() => setProfilePic(null)}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Display Name</label>
                    <input 
                      type="text" 
                      value={profileDisplayName}
                      onChange={(e) => setProfileDisplayName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                      placeholder="e.g. Alex Coder"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Username</label>
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                      placeholder="e.g. alex_coder"
                    />
                  </div>

                  <button 
                    onClick={() => setIsProfileModalOpen(false)}
                    className="w-full h-10 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors mt-2"
                  >
                    Save & Apply Settings
                  </button>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Password</label>
                    <input 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary text-white"
                      placeholder="••••••••"
                    />
                  </div>

                  {securityMessage && (
                    <div className={`p-2.5 rounded-xl border text-xs font-bold text-center ${
                      securityMessage.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {securityMessage.text}
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      if (!oldPassword || !newPassword || !confirmPassword) {
                        setSecurityMessage({ text: 'All fields are required!', type: 'error' });
                        return;
                      }
                      if (newPassword.length < 6) {
                        setSecurityMessage({ text: 'Password must be at least 6 characters long!', type: 'error' });
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setSecurityMessage({ text: 'Passwords do not match!', type: 'error' });
                        return;
                      }
                      
                      setSecurityMessage({ text: 'Password updated successfully!', type: 'success' });
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setTimeout(() => setSecurityMessage(null), 3000);
                    }}
                    className="w-full h-10 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors mt-4"
                  >
                    Change Password Options
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple loader helper inline to prevent extra files import
function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
