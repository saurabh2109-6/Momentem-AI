'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Sparkles, 
  ShieldAlert, 
  Users, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'planner' | 'chat' | 'analytics' | 'ai'>('planner');

  const tabs = [
    { id: 'planner', label: 'Dynamic Planner', icon: Calendar },
    { id: 'chat', label: 'E2EE Chat', icon: MessageSquare },
    { id: 'analytics', label: 'Intelligent Analytics', icon: TrendingUp },
    { id: 'ai', label: 'AI Goal Engine', icon: Sparkles },
  ] as const;

  const mockData = {
    planner: {
      title: "Your Day, Optimized.",
      description: "Schedule auto-arranged based on priorities and energy levels. Integrate habits, daily objectives, and calendar events seamlessly.",
      visual: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded bg-primary"></div>
              <div>
                <p className="text-sm font-medium">Design System Refinement</p>
                <p className="text-xs text-muted-foreground">09:00 AM - 10:30 AM</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-foreground font-semibold">High</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded bg-emerald-500"></div>
              <div>
                <p className="text-sm font-medium">Cardio & Mindfulness Session</p>
                <p className="text-xs text-muted-foreground">11:00 AM - 12:00 PM</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">Health</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded bg-muted-foreground"></div>
              <div>
                <p className="text-sm font-medium line-through">Review Weekly Goals with Team</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white font-semibold">Done</span>
          </div>
        </div>
      )
    },
    chat: {
      title: "Absolute Privacy.",
      description: "Secure communication using the Double Ratchet Protocol. End-to-end encrypted messaging, voice notes, and media sharing.",
      visual: (
        <div className="space-y-3">
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 text-sm">
              <p className="text-xs text-primary font-bold mb-1">Sarah Jenkins</p>
              <p>Did you check the shared weekly roadmap? I've updated the marketing task.</p>
              <span className="text-[10px] text-muted-foreground block mt-1 text-right">E2EE Secured</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] p-3 rounded-2xl rounded-tr-none bg-primary text-primary-foreground text-sm">
              <p>Just verified it. The schedule optimization algorithm looks perfect.</p>
              <span className="text-[10px] text-white/70 block mt-1 text-right">E2EE Secured</span>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 text-sm">
              <p className="text-xs text-emerald-400 font-bold mb-1">Momentum AI</p>
              <p>Suggesting a 15-minute break. Your cognitive load has been high for 2 hours. 🧠</p>
            </div>
          </div>
        </div>
      )
    },
    analytics: {
      title: "Track, Predict, Succeed.",
      description: "Visual heatmaps, consistency scores, and burnout detection. Receive predictions for completion success based on past data.",
      visual: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-primary">94%</p>
              <p className="text-[10px] text-muted-foreground">Consistency Score</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-emerald-400">12 Days</p>
              <p className="text-[10px] text-muted-foreground">Longest Streak</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-medium">Burnout Risk Index</p>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Low</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
        </div>
      )
    },
    ai: {
      title: "AI-Powered Productivity.",
      description: "Goal recommendations, schedule optimization, time predictions, and habit analysis tailored specifically to your daily workflow.",
      visual: (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex gap-3 items-start">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary-foreground">AI Optimization Suggestion</p>
              <p className="text-xs text-muted-foreground mt-1">Based on your past habits, scheduling \"Research & Coding\" at 09:30 AM will increase completion success by 18%.</p>
              <button className="mt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Apply Optimization <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
            <span className="text-xs font-medium">Predicted Task Duration:</span>
            <span className="text-xs font-bold text-purple-400">45 mins (AI estimation)</span>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
              M
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              MOMENTUM
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/auth" 
              className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth?mode=register" 
              className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg hover:shadow-white/5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI-Driven Productivity Ecosystem</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Transform your plan.<br/>
            <span className="bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent">
              Own your day.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A premium dynamic daily planner powered by intelligence. Optimize your goals, encrypt your communication, and share milestones with friends in a stunning interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            <Link 
              href="/auth" 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/25 group"
            >
              Start Planning Free 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features" 
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-md hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Dashboard Mockup (Interactive Glassmorphism) */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] pointer-events-none"></div>
            
            {/* Header controls inside mockup */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">dashboard.momentum.app</span>
            </div>

            {/* Interactive Tabs */}
            <div className="flex gap-2 border-b border-white/5 pb-3 mb-4 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary text-white shadow-md shadow-primary/25' 
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Simulated Window Content */}
            <div className="min-h-[220px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {mockData[activeTab].title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mockData[activeTab].description}
                    </p>
                  </div>

                  <div className="bg-black/25 rounded-xl p-4 border border-white/5 font-sans">
                    {mockData[activeTab].visual}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Features Section */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Designed for Peak Performance
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to focus, align, and accomplish goals with your team or individually. Built with security and scalability at its core.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Intuitive Planning Engine</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Seamlessly organize tasks into Daily, Weekly, and Monthly timeline views. Map recurring tasks and categorize your priorities with high-fidelity styles.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-1 text-xs font-bold text-primary">
              Learn More <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">End-to-End Encrypted Chat</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chat securely with friends using the Double Ratchet Protocol. Messages, media, and status changes are encrypted locally before transmission.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-1 text-xs font-bold text-purple-400">
              Learn More <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Assistant Optimizer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Predict task completions, analyze streaks, and detect potential burnout using intelligent models designed to adjust to your daily performance.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-1 text-xs font-bold text-emerald-400">
              Learn More <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Social Productivity</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect via unique Friend Codes, view mutual goals, react to completions, and coordinate plans using shared timelines.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-1 text-xs font-bold text-yellow-400">
              Learn More <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Consistency Analytics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visualize achievements with full-scale habit streak indicators, activity heatmaps, success ratios, and dynamic forecasting templates.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-1 text-xs font-bold text-pink-400">
              Learn More <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 6 */}
          <div className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Reminders & Queues</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Set time-aware notification intervals. Get browser push alerts, email summaries, and peer nudges for upcoming deadlines.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-1 text-xs font-bold text-blue-400">
              Learn More <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-12 px-6 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-xs text-white">
              M
            </div>
            <span className="font-extrabold tracking-tight text-white text-sm">
              MOMENTUM
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Momentum. Built to production-grade standards.
          </p>
        </div>
      </footer>
    </div>
  );
}
