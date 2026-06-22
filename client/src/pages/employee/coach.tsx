import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  FileText,
  HelpCircle,
  Copy,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Award,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { AIFeedback } from "@/components/ui/ai-feedback";
import { apiFetch } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  pending?: boolean;
}

interface ProfileSuggestions {
  score: number;
  suggestions: string[];
  missingSkills: string[];
  careerAdvice: string;
}

interface StaleApplication {
  jobId: string;
  jobTitle: string;
  status: string;
  appliedDate: string;
  actionType: string;
  recommendationText: string;
  draftMessage: string;
}

interface JobOption {
  id: string;
  title: string;
}

const QUICK_PROMPTS = [
  "How can I improve my profile?",
  "Practice interview questions",
  "Help me discover my skill gaps",
  "Write a cover letter"
];

export default function CareerCoachPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const darkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // General state
  const [activeSubTab, setActiveSubTab] = useState("chat");
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      text: "Hello! I am your AI Career Coach. I am here to help you optimize your profile, draft personalized cover letters, practice target interview prep questions, and guide your career steps. How can I help you today?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Profile suggestions states
  const [profileScore, setProfileScore] = useState<number | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [suggestions, setSuggestions] = useState<ProfileSuggestions | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [errorSuggestions, setErrorSuggestions] = useState<string | null>(null);

  // Cover letter states
  const [selectedLetterJob, setSelectedLetterJob] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);

  // Interview Prep states
  const [selectedPrepJob, setSelectedPrepJob] = useState<string>("");
  const [generatingPrep, setGeneratingPrep] = useState(false);
  const [prepResult, setPrepResult] = useState<any[] | null>(null);

  // Next steps states
  const [staleApps, setStaleApps] = useState<StaleApplication[]>([]);
  const [loadingNextSteps, setLoadingNextSteps] = useState(false);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load jobs list from recommendations for the dropdowns
  const loadJobsList = async () => {
    setLoadingJobs(true);
    try {
      const res = await apiFetch("/api/recommendations?limit=15");
      if (res.ok) {
        const data = await res.json();
        const recList = data?.data?.recommendations || [];
        const mapped = recList.map((r: any) => ({
          id: r.job?.id || r.id,
          title: r.job?.title || r.title || "Job Title"
        }));
        setJobs(mapped);
      }
    } catch (err) {
      console.error("Failed to load jobs list:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Load profile score (fast, deterministic)
  const loadProfileScore = async () => {
    setLoadingScore(true);
    try {
      const res = await apiFetch("/api/ai/candidate/profile-score");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfileScore(data.score);
        }
      }
    } catch (err) {
      console.error("Failed to load profile score:", err);
    } finally {
      setLoadingScore(false);
    }
  };

  // Load suggestions (slow, AI-driven)
  const loadProfileSuggestions = async (forceRefresh = false) => {
    setLoadingSuggestions(true);
    setErrorSuggestions(null);
    try {
      const url = forceRefresh 
        ? "/api/ai/candidate/profile-suggestions?refresh=true" 
        : "/api/ai/candidate/profile-suggestions";
      const res = await apiFetch(url);
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Suggestions rate limit reached. Please try again tomorrow.");
        }
        throw new Error("Failed to load suggestions.");
      }
      const data = await res.json();
      if (data.success) {
        // Also update score in case it changed
        if (data.score !== undefined) setProfileScore(data.score);
        setSuggestions({
          score: data.score,
          suggestions: data.suggestions,
          missingSkills: data.missingSkills,
          careerAdvice: data.careerAdvice
        });
      } else {
        throw new Error(data.error || "Suggestions failed.");
      }
    } catch (err: any) {
      setErrorSuggestions(err.message || "Failed to load suggestions.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Load stale application steps
  const loadNextSteps = async () => {
    setLoadingNextSteps(true);
    try {
      const res = await apiFetch("/api/ai/candidate/next-steps");
      if (res.ok) {
        const data = await res.json();
        setStaleApps(data?.recommendations || []);
      }
    } catch (err) {
      console.error("Failed to load next steps:", err);
    } finally {
      setLoadingNextSteps(false);
    }
  };

  useEffect(() => {
    loadJobsList();
    loadProfileScore();
    loadProfileSuggestions();
    loadNextSteps();
  }, [user?.id]);

  // Handle chat sending
  const handleSendChat = async (text?: string) => {
    if (sendingChat) return;
    const content = (text ?? chatInput).trim();
    if (!content) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text: content
    };

    const pendingBot: ChatMessage = {
      id: Math.random().toString(),
      role: "assistant",
      text: "Thinking...",
      pending: true
    };

    setMessages((prev) => [...prev, userMsg, pendingBot]);
    setChatInput("");
    setSendingChat(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/ai/candidate/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Daily chat limit of 30 messages reached. Please try again tomorrow.");
        }
        throw new Error("Failed to reach Career Coach.");
      }

      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.pending ? { ...m, text: data.reply, pending: false } : m))
        );
      } else {
        throw new Error(data.error || "Coaching fail.");
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.pending
            ? {
                ...m,
                text: `⚠️ ${err.message || "Failed to reach Career Coach. Please try again."}`,
                pending: false
              }
            : m
        )
      );
      toast({
        variant: "destructive",
        title: "Coaching Chat Error",
        description: err.message || "Chat failed."
      });
    } finally {
      setSendingChat(false);
    }
  };

  // Generate Cover Letter
  const handleGenerateCoverLetter = async () => {
    if (!selectedLetterJob) {
      toast({ variant: "destructive", title: "Job Required", description: "Select a job listing first." });
      return;
    }

    setGeneratingLetter(true);
    setCoverLetterResult(null);

    try {
      const res = await fetch("/api/ai/candidate/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedLetterJob, customInstructions })
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Cover letter limit (10/day) reached. Try again tomorrow.");
        }
        throw new Error("Failed to generate cover letter.");
      }

      const data = await res.json();
      if (data.success) {
        setCoverLetterResult(data.coverLetter);
        toast({ title: "Letter Generated", description: "Your tailored cover letter is ready." });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to Generate", description: err.message });
    } finally {
      setGeneratingLetter(false);
    }
  };

  // Generate Interview Prep Pack
  const handleGeneratePrep = async () => {
    if (!selectedPrepJob) {
      toast({ variant: "destructive", title: "Job Required", description: "Select a job listing first." });
      return;
    }

    setGeneratingPrep(true);
    setPrepResult(null);

    try {
      const res = await fetch("/api/ai/candidate/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedPrepJob })
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Prep pack limit (10/day) reached. Try again tomorrow.");
        }
        throw new Error("Failed to generate prep pack.");
      }

      const data = await res.json();
      if (data.success) {
        setPrepResult(data.questions);
        toast({ title: "Prep Pack Ready", description: "Generated questions and guidance guidelines." });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to Generate", description: err.message });
    } finally {
      setGeneratingPrep(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string, subject: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${subject} copied to clipboard.`
    });
  };

  const overviewGlassCard = darkMode
    ? "bg-slate-900/60 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    : "bg-white/90 border-slate-200/80 shadow-sm";

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md text-white">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              AI Career Coach
            </h1>
            <p className="text-sm text-muted-foreground">
              Optimize your profile and get job-specific application support.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/30 rounded-xl p-1 mb-6">
          <TabsTrigger value="chat" className="rounded-lg py-2.5 font-semibold">
            Career Chat
          </TabsTrigger>
          <TabsTrigger value="booster" className="rounded-lg py-2.5 font-semibold">
            Profile Booster
          </TabsTrigger>
          <TabsTrigger value="tools" className="rounded-lg py-2.5 font-semibold">
            Application Tools
          </TabsTrigger>
        </TabsList>

        {/* -------------------------------------------------------------
            TAB: CAREER COACH CHAT
            ------------------------------------------------------------- */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className={`${overviewGlassCard} flex flex-col h-[520px] overflow-hidden rounded-2xl`}>
                <CardHeader className="border-b py-3 px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">Coaching Conversation</CardTitle>
                    <span className="flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Coach Online
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[380px]">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 max-w-[85%] leading-relaxed border ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground border-primary/20"
                            : "bg-secondary/70 text-secondary-foreground border-border/40"
                        }`}
                      >
                        {m.role === "assistant" && m.pending ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                            Analyzing profile and formatting guidance...
                          </div>
                        ) : m.role === "assistant" ? (
                          <div className="prose dark:prose-invert max-w-none text-[0.92rem]">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                                li: ({ children }) => <li className="leading-snug">{children}</li>,
                                code: ({ children }) => <code className="bg-black/20 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>
                              }}
                            >
                              {m.text}
                            </ReactMarkdown>
                            <AIFeedback feature="coach_chat" promptSnippet={m.text.substring(0, 50)} />
                          </div>
                        ) : (
                          <span className="text-[0.92rem]">{m.text}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </CardContent>

                {/* Input box */}
                <div className="border-t p-3 bg-secondary/10 flex flex-col gap-2">
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSendChat(prompt)}
                        disabled={sendingChat}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border/50 text-secondary-foreground transition-colors shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChat();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask your coach advice (e.g., 'How should I explain my React experience?')..."
                      disabled={sendingChat}
                      className="flex-1 rounded-xl h-11 text-sm bg-background/50 border-border/50"
                    />
                    <Button type="submit" disabled={!chatInput.trim() || sendingChat} className="rounded-xl h-11 px-4">
                      {sendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                </div>
              </Card>
            </div>

            {/* Sidebar with statistics */}
            <div className="space-y-4">
              <Card className={`${overviewGlassCard} rounded-2xl`}>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Coach Scope</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-3">
                  <p>
                    I utilize your <strong>Profile Headline</strong>, <strong>Bio</strong>, and <strong>Skills</strong> to custom-tailor each response.
                  </p>
                  <p>
                    To get the best advice, ensure your booster score on the booster tab is at least 80%.
                  </p>
                  <div className="pt-2 border-t text-[11px] flex justify-between">
                    <span>Daily rate limit pool:</span>
                    <span className="font-semibold text-foreground">30 turns/day</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* -------------------------------------------------------------
            TAB: PROFILE BOOSTER
            ------------------------------------------------------------- */}
        <TabsContent value="booster" className="space-y-6">
          {/* Profile Completeness Dial Card (Always visible, fast load) */}
          <Card className={`${overviewGlassCard} rounded-2xl overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative flex items-center justify-center w-36 h-36 shrink-0 bg-secondary/20 rounded-full border">
                  {loadingScore ? (
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  ) : (
                    <div className="text-center">
                      <span className="text-4xl font-black text-indigo-500 tracking-tight">
                        {profileScore ?? suggestions?.score ?? 0}%
                      </span>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                        Complete
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 w-full">
                  <h2 className="text-lg font-bold">Profile Completion Score</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This score is calculated deterministically based on key parameters in your profile like having a Bio (minimum 40 characters), location, skills, education, and experience. Completing these ensures a higher ranking in semantic matches.
                  </p>
                  <Progress value={profileScore ?? suggestions?.score ?? 0} className="h-2 w-full mt-2 bg-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingSuggestions ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-[200px] w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-[200px] w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
              </div>
              <Skeleton className="h-[150px] w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : errorSuggestions ? (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Failing to load Suggestions</AlertTitle>
              <AlertDescription>{errorSuggestions}</AlertDescription>
              <Button onClick={() => loadProfileSuggestions(true)} size="sm" className="mt-2" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Suggestions Card */}
                <Card className={`${overviewGlassCard} rounded-2xl`}>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Improvement Actions
                    </CardTitle>
                    <CardDescription className="text-xs">Actionable ideas to complete your profile.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {suggestions?.suggestions && suggestions.suggestions.length > 0 ? (
                      <ul className="space-y-2.5">
                        {suggestions.suggestions.map((s, i) => (
                          <li key={i} className="text-xs flex items-start gap-2.5 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">Your profile contains all details. Outstanding job!</p>
                    )}
                  </CardContent>
                </Card>

                {/* Missing Skills Card */}
                <Card className={`${overviewGlassCard} rounded-2xl`}>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Suggested Missing Skills
                    </CardTitle>
                    <CardDescription className="text-xs">Qualifications in demand based on your career goals.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {suggestions?.missingSkills && suggestions.missingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.missingSkills.map((s, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No missing skills detected based on your target headline.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Career Coach Advice */}
              <Card className={`${overviewGlassCard} rounded-2xl`}>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Career Coach Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs leading-relaxed text-muted-foreground">
                  {suggestions?.careerAdvice || "Add professional bio detail to enable coaching advice."}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* -------------------------------------------------------------
            TAB: APPLICATION TOOLS
            ------------------------------------------------------------- */}
        <TabsContent value="tools" className="space-y-6">
          <Tabs defaultValue="cover" className="w-full">
            <TabsList className="flex gap-2 border-b pb-2 mb-4 bg-transparent justify-start h-auto p-0">
              <TabsTrigger value="cover" className="text-xs font-bold py-1.5 px-3 border border-transparent data-[state=active]:border-border data-[state=active]:bg-secondary/40 rounded-lg">
                Cover Letter Generator
              </TabsTrigger>
              <TabsTrigger value="prep" className="text-xs font-bold py-1.5 px-3 border border-transparent data-[state=active]:border-border data-[state=active]:bg-secondary/40 rounded-lg">
                Interview Prep Pack
              </TabsTrigger>
              <TabsTrigger value="steps" className="text-xs font-bold py-1.5 px-3 border border-transparent data-[state=active]:border-border data-[state=active]:bg-secondary/40 rounded-lg">
                Next-Step Recommendations
              </TabsTrigger>
            </TabsList>

            {/* COVER LETTER */}
            <TabsContent value="cover" className="space-y-4">
              <Card className={`${overviewGlassCard} rounded-2xl`}>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Draft Cover Letter</CardTitle>
                  <CardDescription className="text-xs">Select a job to generate a custom-tailored letter.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold">Target Position</label>
                    <Select value={selectedLetterJob} onValueChange={setSelectedLetterJob}>
                      <SelectTrigger className="rounded-xl h-11 bg-background/50">
                        <SelectValue placeholder="Choose a job vacancy..." />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingJobs ? (
                          <div className="p-2 text-xs flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500 mr-2" />
                            Loading jobs...
                          </div>
                        ) : jobs.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            No active matching jobs found.
                          </div>
                        ) : (
                          jobs.map((j) => (
                            <SelectItem key={j.id} value={j.id}>
                              {j.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold">Custom Focus (Optional)</label>
                    <Textarea
                      placeholder="e.g. 'Highlight my React and TypeScript project experience'"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="rounded-xl min-h-[80px] text-xs bg-background/50 border-border/50"
                    />
                  </div>

                  <Button onClick={handleGenerateCoverLetter} disabled={generatingLetter} className="rounded-xl h-11 w-full md:w-auto px-6">
                    {generatingLetter ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating Draft...
                      </>
                    ) : (
                      "Generate Tailored Cover Letter"
                    )}
                  </Button>

                  {coverLetterResult && (
                    <div className="space-y-2.5 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">Generated Draft</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyToClipboard(coverLetterResult, "Cover letter")}
                          className="rounded-lg h-8 px-2 flex items-center gap-1.5 text-xs"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </Button>
                      </div>
                      <div className="rounded-xl p-4 bg-secondary/30 border border-border/40 text-xs font-medium font-serif leading-relaxed whitespace-pre-wrap whitespace-pre">
                        {coverLetterResult}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* INTERVIEW PREP */}
            <TabsContent value="prep" className="space-y-4">
              <Card className={`${overviewGlassCard} rounded-2xl`}>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Interview Prep Questions</CardTitle>
                  <CardDescription className="text-xs">Tailored technical and behavioral mock interview questions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold">Target Position</label>
                    <Select value={selectedPrepJob} onValueChange={setSelectedPrepJob}>
                      <SelectTrigger className="rounded-xl h-11 bg-background/50">
                        <SelectValue placeholder="Choose a job vacancy..." />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingJobs ? (
                          <div className="p-2 text-xs flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500 mr-2" />
                            Loading jobs...
                          </div>
                        ) : jobs.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            No active matching jobs found.
                          </div>
                        ) : (
                          jobs.map((j) => (
                            <SelectItem key={j.id} value={j.id}>
                              {j.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleGeneratePrep} disabled={generatingPrep} className="rounded-xl h-11 w-full md:w-auto px-6">
                    {generatingPrep ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating Prep Guide...
                      </>
                    ) : (
                      "Generate Interview Prep Pack"
                    )}
                  </Button>

                  {prepResult && prepResult.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-xs font-bold text-muted-foreground">Mock Prep Guide</h3>
                      <Accordion type="single" collapsible className="w-full space-y-2">
                        {prepResult.map((q, i) => (
                          <AccordionItem key={i} value={`q-${i}`} className="border rounded-xl px-4 py-1 bg-secondary/20">
                            <AccordionTrigger className="text-xs font-bold text-left hover:no-underline">
                              <span className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${q.type === 'technical' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                  {q.type}
                                </span>
                                {q.question}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 text-xs text-muted-foreground space-y-2 border-t mt-2">
                              <p><strong>Coach Tips:</strong> {q.tips}</p>
                              <p><strong>Sample Answer Outline:</strong></p>
                              <div className="pl-4 border-l-2 border-indigo-500 whitespace-pre-wrap">{q.sampleOutline}</div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NEXT STEPS */}
            <TabsContent value="steps" className="space-y-4">
              <Card className={`${overviewGlassCard} rounded-2xl`}>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Stale Application Reminders</CardTitle>
                  <CardDescription className="text-xs">Follow-ups recommendations based on applications submitted over 5 days ago.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingNextSteps ? (
                    <div className="space-y-3">
                      <Skeleton className="h-[80px] rounded-xl" />
                      <Skeleton className="h-[80px] rounded-xl" />
                    </div>
                  ) : staleApps.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No stale applications found. You are fully up to date!</p>
                  ) : (
                    <div className="space-y-4">
                      {staleApps.map((app, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border/40 bg-secondary/10 space-y-2.5">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                                Stale Application
                              </span>
                              <h4 className="text-sm font-bold mt-1.5">{app.jobTitle}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{app.recommendationText}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyToClipboard(app.draftMessage, "Draft follow-up")}
                              className="rounded-lg h-9 px-3 flex items-center gap-1.5 text-xs shrink-0"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Draft
                            </Button>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg text-xs leading-relaxed font-mono whitespace-pre-wrap whitespace-pre border text-muted-foreground">
                            {app.draftMessage}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
