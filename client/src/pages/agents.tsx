import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Bot,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Cpu,
  Layers,
  ArrowRight,
  Loader2,
  Calendar,
  Eye,
  FileText,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { agentService, type AgentRun, type AgentStep } from "@/lib/agent-service";

export default function AgentsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const darkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [startingRun, setStartingRun] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Form states
  const [agentType, setAgentType] = useState<string>("");
  const [goal, setGoal] = useState("");

  const limit = 10;

  // Determine user type and allowed agents
  const role = String(user?.userType || (user as any)?.user_type || "").toLowerCase();
  const allowedAgentTypes = (() => {
    if (role === "admin") {
      return [
        { value: "candidate_career", label: "Candidate Career Assistant" },
        { value: "hiring_pipeline", label: "Hiring Pipeline Assistant" },
        { value: "resume_intelligence", label: "Resume Intelligence Agent" },
        { value: "recruiter_screening", label: "Recruiter Screening Agent" },
        { value: "job_description", label: "Job Description Agent" },
      ];
    }
    if (role === "employer" || role === "recruiter") {
      return [
        { value: "hiring_pipeline", label: "Hiring Pipeline Assistant" },
        { value: "recruiter_screening", label: "Recruiter Screening Agent" },
        { value: "job_description", label: "Job Description Agent" },
      ];
    }
    return [
      { value: "candidate_career", label: "Candidate Career Assistant" },
      { value: "resume_intelligence", label: "Resume Intelligence Agent" },
    ];
  })();

  // Set default agent type
  useEffect(() => {
    if (allowedAgentTypes.length > 0 && !agentType) {
      setAgentType(allowedAgentTypes[0].value);
    }
  }, [user]);

  const loadRuns = async (pageNum = 1) => {
    setLoadingRuns(true);
    try {
      const offset = (pageNum - 1) * limit;
      const data = await agentService.getRuns(limit, offset);
      setRuns(data);
      setHasMore(data.length === limit);
      
      // If we have a selected run, refresh its details
      if (selectedRun) {
        const updatedRun = data.find(r => r.id === selectedRun.id);
        if (updatedRun) {
          const details = await agentService.getRunDetails(updatedRun.id);
          setSelectedRun(details);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to load agent execution history."
      });
    } finally {
      setLoadingRuns(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRuns(page);
    }
  }, [user, page]);

  // Handle run selection
  const selectRun = async (run: AgentRun) => {
    setSelectedRun(null);
    try {
      const details = await agentService.getRunDetails(run.id);
      setSelectedRun(details);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to load details",
        description: err.message
      });
    }
  };

  // Start run
  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      toast({ variant: "destructive", title: "Goal required", description: "Please state the goal for the agent." });
      return;
    }
    setStartingRun(true);
    try {
      const result = await agentService.startRun(agentType, goal);
      toast({
        title: "Agent Spawned Successfully",
        description: `Agent run #${result.runId} has been queued in the background.`
      });
      setGoal("");
      setPage(1);
      // Wait a brief moment then reload history
      setTimeout(() => {
        loadRuns(1);
      }, 500);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to start agent",
        description: err.message || "Execution limit reached or missing credentials."
      });
    } finally {
      setStartingRun(false);
    }
  };

  // Approve Checkpoint
  const handleApprove = async (runId: string) => {
    try {
      const result = await agentService.approveRun(runId);
      toast({
        title: "Checkpoint Approved",
        description: result.message || "Execution resumed successfully."
      });
      // Refresh run details
      const details = await agentService.getRunDetails(runId);
      setSelectedRun(details);
      loadRuns(page);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: err.message
      });
    }
  };

  // Cancel Run
  const handleCancel = async (runId: string) => {
    try {
      const result = await agentService.cancelRun(runId);
      toast({
        title: "Agent Cancelled",
        description: result.message || "Run execution was terminated."
      });
      // Refresh run details
      const details = await agentService.getRunDetails(runId);
      setSelectedRun(details);
      loadRuns(page);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: err.message
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Running
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
          </Badge>
        );
      case "requires_approval":
        return (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse flex items-center gap-1">
            <Clock className="w-3 h-3" /> Paused Checkpoint
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelled
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    if (source === "cron") {
      return (
        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-purple-500/5 text-purple-400 border-purple-500/20">
          Weekly Cron
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-slate-500/5 text-slate-400 border-slate-500/20">
        User Run
      </Badge>
    );
  };

  const cardStyle = darkMode
    ? "bg-slate-900/60 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl"
    : "bg-white/90 border-slate-200/80 shadow-sm";

  return (
    <div className={`w-full min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950' : 'bg-gradient-to-br from-slate-50 via-indigo-50/50 to-white'} relative overflow-hidden`}>
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="w-full space-y-8 max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[2rem] border shadow-2xl backdrop-blur-xl ${
          darkMode ? 'bg-slate-900/40 border-white/10 shadow-black/50' : 'bg-white/60 border-white shadow-indigo-500/10'
        }`}>
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur group-hover:blur-md transition-all opacity-60"></div>
              <div className="relative p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl text-white transform group-hover:scale-105 transition-all">
                <Bot className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Control Center</span>
              </h1>
              <p className={`text-sm md:text-base font-medium mt-1 max-w-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Monitor multi-step AI agents, approve checkpoints, and audit automated workflows in real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left column: Run Form & History List */}
          <div className="lg:col-span-5 space-y-8">
            {/* Start Run Form */}
            <Card className={`rounded-[2rem] border-0 shadow-2xl backdrop-blur-xl overflow-hidden ${
              darkMode ? 'bg-slate-900/60 shadow-black/40 ring-1 ring-white/10' : 'bg-white/80 shadow-indigo-500/5 ring-1 ring-slate-200'
            }`}>
              <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <CardHeader className="py-6 px-8 border-b border-white/5">
                <CardTitle className={`text-lg font-black flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  Spawn New Agent
                </CardTitle>
                <CardDescription className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Select a specialized workflow and provide a high-level goal. The agent will handle the tools autonomously.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleStartRun} className="space-y-6">
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Select Agent Template</label>
                    <Select value={agentType} onValueChange={setAgentType}>
                      <SelectTrigger className={`rounded-xl h-14 border-2 font-medium transition-all ${
                        darkMode ? 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 hover:border-indigo-500/30'
                      }`}>
                        <SelectValue placeholder="Choose agent workflow..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-800 bg-slate-950">
                        {allowedAgentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="font-medium">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Describe Goal</label>
                      <span className={`text-[10px] font-bold ${goal.length > 500 ? "text-rose-500" : darkMode ? "text-slate-500" : "text-slate-400"}`}>
                        {goal.length}/500 chars
                      </span>
                    </div>
                    <Textarea
                      placeholder="e.g. 'Find matching developer jobs and draft applications for them'"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value.slice(0, 500))}
                      className={`rounded-xl min-h-[120px] text-sm font-medium border-2 resize-none transition-all ${
                        darkMode ? 'bg-slate-950/50 border-slate-800 focus:border-indigo-500/50' : 'bg-slate-50 border-slate-200 focus:border-indigo-500/30'
                      }`}
                      maxLength={500}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={startingRun || goal.length > 500} 
                    className="w-full rounded-xl h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 group"
                  >
                    {startingRun ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Spawning Agent...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Start Execution Run
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Runs History */}
            <Card className={`rounded-[2rem] border-0 shadow-2xl backdrop-blur-xl overflow-hidden ${
              darkMode ? 'bg-slate-900/60 shadow-black/40 ring-1 ring-white/10' : 'bg-white/80 shadow-indigo-500/5 ring-1 ring-slate-200'
            }`}>
              <CardHeader className="py-6 px-8 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className={`text-lg font-black flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  Execution History
                </CardTitle>
                <Badge variant="outline" className={`font-bold ${darkMode ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-200'}`}>Page {page}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {loadingRuns && runs.length === 0 ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                    <p className={`text-sm font-medium mt-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading agent history...</p>
                  </div>
                ) : runs.length === 0 ? (
                  <div className={`p-12 text-center font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No execution runs found.<br/>Start an agent to see history.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {runs.map((run) => (
                      <div
                        key={run.id}
                        onClick={() => selectRun(run)}
                        className={`p-5 text-left transition-all cursor-pointer flex flex-col gap-3 group ${
                          selectedRun?.id === run.id 
                            ? darkMode ? "bg-indigo-500/10 border-l-4 border-l-indigo-500" : "bg-indigo-50 border-l-4 border-l-indigo-500"
                            : darkMode ? "hover:bg-slate-800/50 border-l-4 border-l-transparent" : "hover:bg-slate-50 border-l-4 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-black capitalize tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {run.agentType.replace("_", " ")}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>#{run.id}</span>
                          </div>
                          <div className="shrink-0">
                            {getStatusBadge(run.status)}
                          </div>
                        </div>
                        <p className={`text-xs font-medium line-clamp-2 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {run.goal}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(run.createdAt).toLocaleDateString()}
                            </span>
                            {getSourceBadge(run.source)}
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${selectedRun?.id === run.id ? 'translate-x-1 text-indigo-500' : 'text-slate-600 group-hover:translate-x-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className={`flex items-center justify-between p-4 border-t ${darkMode ? 'border-white/5 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'}`}>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className={`rounded-xl text-xs font-bold ${darkMode ? 'border-slate-700 hover:bg-slate-800 hover:text-white' : ''}`}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => (hasMore ? p + 1 : p))}
                    disabled={!hasMore}
                    className={`rounded-xl text-xs font-bold ${darkMode ? 'border-slate-700 hover:bg-slate-800 hover:text-white' : ''}`}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Execution details & timeline steps */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {selectedRun ? (
                <motion.div
                  key={selectedRun.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {/* Details Summary Card */}
                  <Card className={`rounded-[2rem] border-0 shadow-2xl backdrop-blur-xl overflow-hidden ${
                    darkMode ? 'bg-slate-900/60 shadow-black/40 ring-1 ring-white/10' : 'bg-white/80 shadow-indigo-500/5 ring-1 ring-slate-200'
                  }`}>
                    <CardHeader className={`p-8 border-b ${darkMode ? 'bg-slate-800/30 border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                              <Cpu className="w-5 h-5 text-white" />
                            </div>
                            <CardTitle className={`text-2xl font-black capitalize ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {selectedRun.agentType.replace("_", " ")}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Run #{selectedRun.id}</span>
                            {getSourceBadge(selectedRun.source)}
                            <span className={`text-[11px] font-medium flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(selectedRun.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 scale-110 origin-left sm:origin-right">
                          {getStatusBadge(selectedRun.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="space-y-3">
                        <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Target className="w-4 h-4 text-indigo-500" /> Mission Goal
                        </span>
                        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950/50 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700'} text-sm font-medium leading-relaxed`}>
                          {selectedRun.goal}
                        </div>
                      </div>

                      {/* Checkpoint Approval Box */}
                      {selectedRun.status === "requires_approval" && (
                        <div className="rounded-3xl p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[50px] -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/30 transition-colors" />
                          <div className="relative z-10 space-y-6">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-500 shrink-0">
                                <Clock className="w-6 h-6 animate-pulse" />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-amber-500 mb-1">Human Verification Required</h4>
                                <p className={`text-sm font-medium ${darkMode ? 'text-amber-500/70' : 'text-amber-700/70'} leading-relaxed`}>
                                  The agent has generated output that requires your explicit review before proceeding.
                                </p>
                              </div>
                            </div>

                            {/* Extracted draft display based on agent run output JSON */}
                            {(() => {
                              const letterDraft = selectedRun.resultJson?.draft || selectedRun.resultJson?.messageText;
                              if (letterDraft) {
                                return (
                                  <div className="space-y-3">
                                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                                      <FileText className="w-4 h-4" /> Draft Preview
                                    </span>
                                    <div className={`rounded-2xl p-6 border text-sm font-medium leading-relaxed whitespace-pre-wrap shadow-inner ${
                                      darkMode ? 'bg-slate-950/80 border-amber-500/20 text-slate-200' : 'bg-white/80 border-amber-500/20 text-slate-800'
                                    }`}>
                                      {letterDraft}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <Button
                                onClick={() => handleApprove(selectedRun.id)}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black px-8 rounded-xl h-12 shadow-lg shadow-amber-500/25 flex-1 text-base transition-all hover:scale-[1.02]"
                              >
                                Approve & Resume Agent
                              </Button>
                              <Button
                                onClick={() => handleCancel(selectedRun.id)}
                                variant="outline"
                                className={`rounded-xl h-12 font-bold px-8 border-2 ${darkMode ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                              >
                                Abort Mission
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Final Result / Execution Output Summary */}
                      {selectedRun.status === "completed" && (
                        <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 shadow-xl shadow-emerald-500/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] -mr-10 -mt-10 pointer-events-none" />
                          <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-500 shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <h4 className="text-lg font-black text-emerald-500">Mission Accomplished</h4>
                            </div>
                            
                            <div className={`space-y-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {selectedRun.resultJson?.summary && (
                                <p className="text-sm font-medium leading-relaxed">
                                  {selectedRun.resultJson.summary}
                                </p>
                              )}
                              
                              {selectedRun.resultJson?.bestMatch && (
                                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/50 border-emerald-500/20' : 'bg-white border-emerald-500/20'}`}>
                                  <p className="text-sm font-medium">
                                    <strong className="text-emerald-500">Best Match Found:</strong> {selectedRun.resultJson.bestMatch}
                                  </p>
                                  <p className="text-xs font-bold mt-1 text-emerald-500/70">
                                    Similarity Score: {selectedRun.resultJson.matchScore}%
                                  </p>
                                </div>
                              )}
                              
                              {selectedRun.resultJson?.actionItems && (
                                <div className="pt-2 border-t border-emerald-500/20">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500/80 mb-3 block">Key Actions & Insights</span>
                                  <ul className="space-y-2">
                                    {(selectedRun.resultJson.actionItems as string[]).map((item, index) => (
                                      <li key={index} className="flex items-start gap-2 text-sm font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cancellation / Fail Output Summary */}
                      {selectedRun.status === "failed" && (
                        <div className="rounded-3xl p-6 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 shadow-xl shadow-rose-500/5">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-500 shrink-0">
                              <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-rose-500 mb-1">Execution Aborted</h4>
                              <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-rose-500/70' : 'text-rose-700/70'}`}>
                                The agent encountered a critical error during execution. See the timeline below for exact failure point.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Timeline / Step Sequence Progress */}
                  <Card className={`rounded-[2rem] border-0 shadow-2xl backdrop-blur-xl overflow-hidden ${
                    darkMode ? 'bg-slate-900/60 shadow-black/40 ring-1 ring-white/10' : 'bg-white/80 shadow-indigo-500/5 ring-1 ring-slate-200'
                  }`}>
                    <CardHeader className={`py-6 px-8 border-b ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                      <CardTitle className={`text-lg font-black flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                          <Layers className="w-5 h-5" />
                        </div>
                        Execution Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      {/* Render Step Logs */}
                      {selectedRun.steps && selectedRun.steps.length > 0 ? (
                        <div className={`relative border-l-2 pl-8 space-y-10 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          {selectedRun.steps.map((step) => {
                            const isSuccess = step.status === "success";
                            const isFailed = step.status === "failed";
                            const isPending = step.status === "pending";

                            return (
                              <div key={step.id} className="relative group">
                                {/* Step circle marker */}
                                <div className={`absolute -left-[41px] top-1 w-[18px] h-[18px] rounded-full border-[4px] bg-background shadow-md ${
                                  isSuccess ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-950" :
                                  isFailed ? "border-rose-500 bg-rose-100 dark:bg-rose-950" :
                                  "border-indigo-500 bg-indigo-100 dark:bg-indigo-950 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse"
                                }`} />

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between gap-4 flex-wrap bg-transparent">
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                        darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        Step {step.stepOrder}
                                      </span>
                                      <h4 className={`text-base font-bold capitalize ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {step.toolName.replace(/([A-Z])/g, ' $1').trim()}
                                      </h4>
                                    </div>
                                    <div>
                                      {isSuccess && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Success</Badge>}
                                      {isFailed && <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Failed</Badge>}
                                      {isPending && <Badge className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20 animate-pulse">Running...</Badge>}
                                    </div>
                                  </div>

                                  {/* Step expanded reports */}
                                  {(step.outputJson && Object.keys(step.outputJson).length > 0) && (
                                    <div className={`rounded-2xl p-5 border shadow-sm ${
                                      darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                                    }`}>
                                      {/* Handle formatted step outputs */}
                                      {step.toolName === "ProfileAnalyzer" && step.outputJson.advice && (
                                        <div className={`text-sm font-medium space-y-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                          <p className="flex justify-between items-center pb-2 border-b border-current/10">
                                            <span>Completeness Score</span>
                                            <span className="font-black text-indigo-500">{step.outputJson.completenessScore}%</span>
                                          </p>
                                          <p><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Missing Fields:</strong> {step.outputJson.missingFields?.join(", ") || "None"}</p>
                                          <p className="italic bg-current/5 p-3 rounded-xl border border-current/10">"{step.outputJson.advice}"</p>
                                        </div>
                                      )}

                                      {step.toolName === "SemanticJobSearcher" && step.outputJson.bestMatch && (
                                        <div className={`text-sm font-medium space-y-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                          <p><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Best Semantic Match:</strong> {step.outputJson.bestMatch}</p>
                                          <p><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Score:</strong> {step.outputJson.matchScore}%</p>
                                          <p><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Location:</strong> {step.outputJson.bestJobLocation}</p>
                                        </div>
                                      )}

                                      {step.toolName === "PipelineAnalyzer" && step.outputJson.actionItems && (
                                        <div className={`text-sm font-medium space-y-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                          <div className="flex gap-4 p-3 bg-current/5 rounded-xl border border-current/10">
                                            <div className="flex-1">
                                              <p className="text-xs uppercase tracking-wider opacity-70">Open Jobs</p>
                                              <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{step.outputJson.totalOpenJobs}</p>
                                            </div>
                                            <div className="flex-1">
                                              <p className="text-xs uppercase tracking-wider opacity-70">Applications</p>
                                              <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{step.outputJson.totalApplications}</p>
                                            </div>
                                          </div>
                                          <p><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Recommended Candidate:</strong> {step.outputJson.recommendedCandidateName || "None"}</p>
                                          <div className="pt-2">
                                            <strong className={`text-xs uppercase tracking-wider block mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Alert Insights:</strong>
                                            <ul className="space-y-1.5">
                                              {(step.outputJson.actionItems as string[]).map((itm, idx) => (
                                                <li key={idx} className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" /> {itm}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      )}

                                      {/* Fail details */}
                                      {isFailed && step.outputJson.error && (
                                        <div className="flex gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
                                          <AlertCircle className="w-5 h-5 shrink-0" />
                                          <p className="text-sm font-mono font-medium leading-relaxed">
                                            {step.outputJson.error}
                                          </p>
                                        </div>
                                      )}

                                      {/* Default JSON backup */}
                                      {(!["ProfileAnalyzer", "SemanticJobSearcher", "PipelineAnalyzer"].includes(step.toolName) || isFailed) && (
                                        <pre className={`mt-3 text-[11px] font-mono p-4 rounded-xl overflow-x-auto max-h-[200px] custom-scrollbar ${
                                          darkMode ? 'bg-slate-950/80 text-slate-400 border border-slate-800' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                          {JSON.stringify(step.outputJson, null, 2)}
                                        </pre>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={`text-center py-12 flex flex-col items-center justify-center font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500/50" />
                          Decoding agent trajectory logs...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className={`h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-[2rem] min-h-[500px] transition-all ${
                  darkMode ? 'border-slate-800 bg-slate-900/20 hover:border-indigo-500/30 hover:bg-slate-900/40' : 'border-slate-200 bg-white/40 hover:border-indigo-500/30 hover:bg-white/60'
                }`}>
                  <div className="p-6 bg-indigo-500/10 rounded-full mb-6">
                    <Bot className="w-16 h-16 text-indigo-500/60 animate-bounce" />
                  </div>
                  <h3 className={`text-2xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>No Mission Selected</h3>
                  <p className={`text-base font-medium max-w-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Choose an active execution run from the history panel or spawn a new autonomous agent to monitor its progress here.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
