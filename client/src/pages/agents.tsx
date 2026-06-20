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
  FileText
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
    <div className="w-full space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg text-white">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Agent Control Center</h1>
            <p className="text-sm text-muted-foreground">
              Monitor multi-step AI agents, approve checkpoints, and audit automated workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Run Form & History List */}
        <div className="lg:col-span-5 space-y-6">
          {/* Start Run Form */}
          <Card className={`${cardStyle} rounded-2xl overflow-hidden`}>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-500" />
                Spawn New Agent
              </CardTitle>
              <CardDescription className="text-xs">
                Provide a high-level goal and let the agent manage the tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleStartRun} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Select Agent Template</label>
                  <Select value={agentType} onValueChange={setAgentType}>
                    <SelectTrigger className="rounded-xl h-11 bg-background/50">
                      <SelectValue placeholder="Choose agent workflow..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedAgentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-foreground">Describe Goal</label>
                    <span className={`text-[10px] ${goal.length > 500 ? "text-rose-500" : "text-muted-foreground"}`}>
                      {goal.length}/500 chars
                    </span>
                  </div>
                  <Textarea
                    placeholder="Enter what you want the agent to achieve (e.g. 'Search matching developer jobs and draft application packages')"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value.slice(0, 500))}
                    className="rounded-xl min-h-[90px] text-xs bg-background/50 border-border/50 resize-none"
                    maxLength={500}
                    required
                  />
                </div>

                <Button type="submit" disabled={startingRun || goal.length > 500} className="w-full rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2">
                  {startingRun ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Spawning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Start Execution Run
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Runs History */}
          <Card className={`${cardStyle} rounded-2xl overflow-hidden`}>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Execution History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRuns && runs.length === 0 ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Loading agent runs...</p>
                </div>
              ) : runs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No execution runs found. Start an agent to see history.
                </div>
              ) : (
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => selectRun(run)}
                      className={`p-3.5 text-left transition-colors cursor-pointer flex items-center justify-between gap-3 hover:bg-secondary/20 ${
                        selectedRun?.id === run.id ? "bg-secondary/40 border-l-4 border-indigo-500" : ""
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black capitalize tracking-tight text-foreground">
                            {run.agentType.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">#{run.id}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-medium max-w-[200px]">
                          {run.goal}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(run.createdAt).toLocaleDateString()}
                          </span>
                          {getSourceBadge(run.source)}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        {getStatusBadge(run.status)}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between p-3 border-t bg-secondary/5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="rounded-lg text-xs"
                >
                  Previous
                </Button>
                <span className="text-[11px] font-bold text-muted-foreground">Page {page}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => (hasMore ? p + 1 : p))}
                  disabled={!hasMore}
                  className="rounded-lg text-xs"
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Details Summary Card */}
                <Card className={`${cardStyle} rounded-2xl overflow-hidden`}>
                  <CardHeader className="py-4 border-b bg-secondary/10 flex flex-row items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base font-black capitalize">
                          {selectedRun.agentType.replace("_", " ")}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground font-mono">#{selectedRun.id}</span>
                        {getSourceBadge(selectedRun.source)}
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Triggered on {new Date(selectedRun.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div>{getStatusBadge(selectedRun.status)}</div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1 border-b pb-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Goal</span>
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {selectedRun.goal}
                      </p>
                    </div>

                    {/* Checkpoint Approval Box */}
                    {selectedRun.status === "requires_approval" && (
                      <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 shadow-md space-y-4 animate-glow">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500 shrink-0">
                            <Clock className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-amber-400">Decision Pending</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              The agent has drafted output that requires your explicit verification before submitting to the platform.
                            </p>
                          </div>
                        </div>

                        {/* Extracted draft display based on agent run output JSON */}
                        {(() => {
                          const steps = selectedRun.steps || [];
                          // Find the step that is requiring approval (last step or step with requiresApproval status pending/success)
                          const letterDraft = selectedRun.resultJson?.draft || selectedRun.resultJson?.messageText;
                          if (letterDraft) {
                            return (
                              <div className="space-y-2">
                                <span className="text-[11px] font-bold text-amber-400/80 flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" /> Draft Preview
                                </span>
                                <div className="rounded-xl p-3.5 bg-secondary/80 border border-border/40 text-xs font-medium font-serif leading-relaxed text-foreground whitespace-pre-wrap">
                                  {letterDraft}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(selectedRun.id)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 rounded-xl h-10 text-xs shadow-md"
                          >
                            Approve & Resume Agent
                          </Button>
                          <Button
                            onClick={() => handleCancel(selectedRun.id)}
                            variant="destructive"
                            className="rounded-xl h-10 text-xs font-bold"
                          >
                            Cancel Run
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Final Result / Execution Output Summary */}
                    {selectedRun.status === "completed" && (
                      <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <h4 className="text-xs font-bold text-emerald-400">Execution Completed</h4>
                        </div>
                        {selectedRun.resultJson?.summary && (
                          <p className="text-xs text-muted-foreground font-medium">
                            {selectedRun.resultJson.summary}
                          </p>
                        )}
                        {selectedRun.resultJson?.bestMatch && (
                          <p className="text-xs text-muted-foreground font-medium">
                            <strong>Best Match Vacancy:</strong> {selectedRun.resultJson.bestMatch} (Similarity Score: {selectedRun.resultJson.matchScore}%)
                          </p>
                        )}
                        {selectedRun.resultJson?.actionItems && (
                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-muted-foreground">Action Recommendations:</span>
                            <ul className="list-disc pl-4 space-y-1 mt-1">
                              {(selectedRun.resultJson.actionItems as string[]).map((item, index) => (
                                <li key={index} className="text-[11px] text-muted-foreground leading-relaxed">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cancellation / Fail Output Summary */}
                    {selectedRun.status === "failed" && (
                      <div className="rounded-2xl p-4 bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-rose-400">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold">Execution Run Aborted</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                            The executor aborted step sequence due to a critical error. The error outline has been logged to the step report below.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline / Step Sequence Progress */}
                <Card className={`${cardStyle} rounded-2xl overflow-hidden`}>
                  <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      Step Execution Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Render Step Logs */}
                    {selectedRun.steps && selectedRun.steps.length > 0 ? (
                      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-6 space-y-6">
                        {selectedRun.steps.map((step) => {
                          const isSuccess = step.status === "success";
                          const isFailed = step.status === "failed";
                          const isPending = step.status === "pending";

                          return (
                            <div key={step.id} className="relative group">
                              {/* Step circle marker */}
                              <div className={`absolute -left-[31px] top-0.5 w-[10px] h-[10px] rounded-full border-2 bg-background ${
                                isSuccess ? "border-emerald-500 bg-emerald-500" :
                                isFailed ? "border-rose-500 bg-rose-500" :
                                "border-blue-500 animate-ping"
                              }`} />

                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground">
                                      Step {step.stepOrder}
                                    </span>
                                    <h4 className="text-xs font-bold text-foreground capitalize">
                                      {step.toolName.replace(/([A-Z])/g, ' $1').trim()}
                                    </h4>
                                  </div>
                                  <div className="text-[10px]">
                                    {isSuccess && <span className="text-emerald-400 font-semibold">Success</span>}
                                    {isFailed && <span className="text-rose-400 font-semibold">Failed</span>}
                                    {isPending && <span className="text-blue-400 font-semibold animate-pulse">Running...</span>}
                                  </div>
                                </div>

                                {/* Step expanded reports */}
                                {(step.outputJson && Object.keys(step.outputJson).length > 0) && (
                                  <div className="rounded-xl p-3 bg-secondary/30 border border-border/30 mt-2 space-y-2 max-h-[160px] overflow-y-auto">
                                    {/* Handle formatted step outputs */}
                                    {step.toolName === "ProfileAnalyzer" && step.outputJson.advice && (
                                      <div className="text-[11px] text-muted-foreground space-y-1">
                                        <p><strong>Completeness:</strong> {step.outputJson.completenessScore}%</p>
                                        <p><strong>Missing Fields:</strong> {step.outputJson.missingFields?.join(", ") || "None"}</p>
                                        <p className="italic">"{step.outputJson.advice}"</p>
                                      </div>
                                    )}

                                    {step.toolName === "SemanticJobSearcher" && step.outputJson.bestMatch && (
                                      <div className="text-[11px] text-muted-foreground space-y-1">
                                        <p><strong>Semantic Vacancy Match:</strong> {step.outputJson.bestMatch}</p>
                                        <p><strong>Similarity Score:</strong> {step.outputJson.matchScore}%</p>
                                        <p><strong>Location:</strong> {step.outputJson.bestJobLocation}</p>
                                      </div>
                                    )}

                                    {step.toolName === "PipelineAnalyzer" && step.outputJson.actionItems && (
                                      <div className="text-[11px] text-muted-foreground space-y-1">
                                        <p><strong>Open Jobs:</strong> {step.outputJson.totalOpenJobs} | <strong>Total Applications:</strong> {step.outputJson.totalApplications}</p>
                                        <p><strong>Recommended Candidate:</strong> {step.outputJson.recommendedCandidateName || "None"}</p>
                                        <div>
                                          <strong>Alert Insights:</strong>
                                          <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                                            {(step.outputJson.actionItems as string[]).map((itm, idx) => (
                                              <li key={idx}>{itm}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}

                                    {/* Fail details */}
                                    {isFailed && step.outputJson.error && (
                                      <p className="text-[11px] text-rose-400 font-mono">
                                        Error: {step.outputJson.error}
                                      </p>
                                    )}

                                    {/* Default JSON backup */}
                                    {(!["ProfileAnalyzer", "SemanticJobSearcher", "PipelineAnalyzer"].includes(step.toolName) || isFailed) && (
                                      <pre className="text-[9px] font-mono text-muted-foreground bg-black/10 p-2 rounded overflow-x-auto max-h-[100px]">
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
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        Agent is loading steps sequence...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-2xl min-h-[300px]">
                <Bot className="w-10 h-10 text-indigo-500/60 animate-bounce mb-3" />
                <h3 className="text-sm font-bold text-foreground">No Agent Run Selected</h3>
                <p className="text-xs text-muted-foreground max-w-[280px] mt-1 leading-relaxed">
                  Choose an active execution run from history or spawn a new agent to view step-by-step progress reports.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
