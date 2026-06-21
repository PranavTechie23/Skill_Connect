import { useState } from "react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { ThumbsUp, ThumbsDown, Check, X, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIFeedbackProps {
  feature: string;
  promptSnippet?: string;
}

export function AIFeedback({ feature, promptSnippet }: AIFeedbackProps) {
  const [rating, setRating] = useState<"thumbs_up" | "thumbs_down" | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRate = async (newRating: "thumbs_up" | "thumbs_down") => {
    setRating(newRating);
    if (newRating === "thumbs_down") {
      setShowFeedback(true);
    } else {
      await submitFeedback(newRating, "");
    }
  };

  const submitFeedback = async (currentRating: "thumbs_up" | "thumbs_down" | null, text: string) => {
    if (!currentRating) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature,
          rating: currentRating,
          feedbackText: text,
          promptSnippet,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      toast({ title: "Feedback submitted", description: "Thanks for helping us improve our AI!" });
      setShowFeedback(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not submit feedback." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
          <MessageSquare className="h-3 w-3" /> AI-generated content
        </span>
        <div className="flex items-center gap-1">
          <span className="mr-2">Helpful?</span>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${rating === "thumbs_up" ? "text-green-500 bg-green-500/10" : ""}`}
            onClick={() => handleRate("thumbs_up")}
            disabled={isSubmitting || rating === "thumbs_up"}
          >
            <ThumbsUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${rating === "thumbs_down" ? "text-destructive bg-destructive/10" : ""}`}
            onClick={() => handleRate("thumbs_down")}
            disabled={isSubmitting || rating === "thumbs_down"}
          >
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {showFeedback && (
        <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-md animate-in fade-in zoom-in-95">
          <p className="text-sm font-medium text-foreground">What went wrong?</p>
          <Textarea 
            placeholder="Tell us why this wasn't helpful..."
            className="h-20 text-sm resize-none"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowFeedback(false)}>Cancel</Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => submitFeedback(rating, feedbackText)}
              disabled={isSubmitting || !feedbackText.trim()}
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
