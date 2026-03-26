import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: number;
  from: "user" | "bot";
  text: string;
}

const SUGGESTIONS = [
  "How do I use SkillConnect?",
  "I need help with this page",
  "Where can I edit my profile?",
  "How do I contact support?",
];

export function SkillConnectAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: "bot",
      text: "Hi! I’m your SkillConnect assistant. I can guide you around the app and help with basic questions.",
    },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(2);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [open, messages.length]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;

    const idUser = nextId.current++;
    const idBot = nextId.current++;

    const userMessage: ChatMessage = { id: idUser, from: "user", text: content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const history = [...messages, userMessage];
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.from === "user" ? "user" : "assistant",
            text: m.text,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      const replyText: string =
        data.reply ||
        "I had trouble generating a detailed answer, but your question was received.";

      setMessages((prev) => [
        ...prev,
        {
          id: idBot,
          from: "bot",
          text: replyText,
        },
      ]);
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: idBot,
          from: "bot",
          text:
            "I couldn't reach the assistant service right now. Please check your connection or try again later.",
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 flex flex-col-reverse items-end" style={{ backdropFilter: 'none !important' as any }}>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
          boxShadow:
            "0 4px 10px -2px rgba(79,70,229,.3), 0 0 0 1px rgba(129,140,248,.2)",
        }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle at top, rgba(255,255,255,.35), transparent 60%)",
          }}
        />
        <AnimatePresence initial={false} mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ scale: 0, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-7 w-7 text-primary-foreground" />
            </motion.span>
          ) : (
            <motion.span
              key="icon"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle className="h-7 w-7 text-primary-foreground" />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground shadow">
          AI
        </span>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[28rem] max-w-[28rem] relative overflow-hidden rounded-3xl border bg-card shadow-2xl"
            style={{ backdropFilter: 'none !important' as any, maxHeight: 'calc(100vh - 8rem)' }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(1200px circle at top right, hsl(var(--primary) / 0.22), transparent 55%), radial-gradient(900px circle at bottom left, hsl(var(--accent) / 0.18), transparent 45%)",
              }}
            />

            <div className="relative flex items-center justify-between px-5 py-4 border-b text-sm font-semibold">
              <span className="text-[0.95rem] tracking-tight">SkillConnect assistant</span>
              <span className="flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>

            <div ref={listRef} className="relative px-4 pt-3 pb-3 space-y-3 max-h-[22rem] overflow-y-auto text-[0.88rem]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-2xl px-3 py-2.5 max-w-[80%] leading-relaxed border ${
                      m.from === "user"
                        ? "bg-primary text-primary-foreground border-primary/20"
                        : "bg-secondary text-secondary-foreground border-border/50"
                    }`}
                  >
                    {m.from === "bot" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="leading-snug">{children}</li>,
                          code: ({ children }) => <code className="bg-black/20 rounded px-1 text-xs font-mono">{children}</code>,
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium bg-secondary/70 text-secondary-foreground border border-border/50 hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {s}
                </button>
              ))}
            </div>

            <form
              className="relative flex items-center gap-2.5 px-4 py-3 border-t border-border/50"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question or describe the issue..."
                className="flex-1 h-10 rounded-full bg-background/60 border-border/50 text-[0.9rem] placeholder:text-muted-foreground focus-visible:ring-primary/30"
              />
              <Button
                type="submit"
                disabled={!input.trim()}
                size="icon"
                className="h-10 w-10 rounded-full shadow-sm bg-primary hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

