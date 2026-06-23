import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { apiFetch } from "@/lib/api";

interface ChatMessage {
  id: number;
  from: "user" | "bot";
  text: string;
  pending?: boolean;
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
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: "bot",
      text: "Hi! I’m your SkillConnect assistant. I can guide you around the app and help with basic questions.",
    },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(2);
  const messagesRef = useRef<ChatMessage[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [open, messages.length]);

  const handleSend = async (text?: string) => {
    if (isSending) return;
    const content = (text ?? input).trim();
    if (!content) return;

    const idUser = nextId.current++;
    const idBot = nextId.current++;

    const userMessage: ChatMessage = { id: idUser, from: "user", text: content };
    const pendingBot: ChatMessage = { id: idBot, from: "bot", text: "Thinking...", pending: true };
    setMessages((prev) => [...prev, userMessage, pendingBot]);
    setInput("");
    setIsSending(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      // Keep payload small to reduce latency.
      const history = [...messagesRef.current, userMessage].slice(-12);
      const res = await apiFetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.from === "user" ? "user" : "assistant",
            text: m.text,
          })),
        }),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      const replyText: string =
        data.reply ||
        "I had trouble generating a detailed answer, but your question was received.";

      setMessages((prev) =>
        prev.map((m) => (m.id === idBot ? { ...m, text: replyText, pending: false } : m)),
      );
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === idBot
            ? {
                ...m,
                pending: false,
                text:
                  "I couldn't reach the assistant service right now. Please check your connection or try again later.",
              }
            : m,
        ),
      );
    } finally {
      setIsSending(false);
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
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
          boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
        }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
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
                    {m.from === "bot" && m.pending ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                      </span>
                    ) : m.from === "bot" ? (
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
                  disabled={isSending}
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
                disabled={isSending}
                className="flex-1 h-10 rounded-full bg-background/60 border-border/50 text-[0.9rem] placeholder:text-muted-foreground focus-visible:ring-primary/30"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isSending}
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

