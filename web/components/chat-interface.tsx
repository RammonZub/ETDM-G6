"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { recommend } from "@/lib/api";
import type { ChatMessage, Restaurant, ParsedQuery } from "@/lib/types";

const SUGGESTIONS = [
  { label: "🌹 Romantic French dinner", q: "Romantic French restaurant, 200+ reviews" },
  { label: "💎 Hidden gem Japanese", q: "Hidden gem Japanese restaurant nobody knows about" },
  { label: "💰 Best value Indian", q: "Cheap and cheerful Indian food 500+ reviews, top 5" },
  { label: "🍽️ Fine dining Italian", q: "Fine dining Italian, upscale and elegant, 300+ reviews" },
  { label: "🍸 Cocktails + great location", q: "Best cocktail bar with great location, top 5" },
  { label: "⚡ Quick lunch, British", q: "Quick bites British restaurant, budget-friendly, 200+ reviews" },
];

interface Props {
  onResults: (restaurants: Restaurant[]) => void;
}

export function ChatInterface({ onResults }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const query = text.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await recommend(query);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: buildSummary(data.results, data.parsed, query, data.note),
        results: data.results,
        parsed: data.parsed,
        note: data.note,
        timestamp: new Date(),
      };
      setMessages((m) => [...m, assistantMsg]);
      onResults(data.results);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the recommendation engine. Make sure the API server is running on port 8000.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const buildSummary = (
    results: Restaurant[],
    parsed: ParsedQuery,
    _query: string,
    note?: string
  ): string => {
    if (!results.length) {
      return `No restaurants found matching your criteria. Try removing the cuisine filter or lowering the minimum review count.`;
    }
    const prefLabels = parsed.preferences
      .map((p) => p.replace(/_/g, " "))
      .join(" + ");
    const cuisineStr = parsed.cuisine ? ` ${parsed.cuisine}` : "";
    // If the note starts with a relaxation message surface it as the summary
    if (note && note.includes("Relaxed") || note?.includes("No results") || note?.includes("No ")) {
      return note.split(" (")[0]; // just the relaxation sentence
    }
    return `Found **${results.length}${cuisineStr} ${prefLabels}** restaurant${results.length !== 1 ? "s" : ""}. Tap any card on the right or a map pin for details.`;
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const reset = () => {
    setMessages([]);
    onResults([]);
    setInput("");
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <ScrollArea className="flex-1 px-4">
        <div className="mx-auto max-w-2xl space-y-6 py-8">
          {/* Welcome state */}
          <AnimatePresence>
            {isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center text-center pt-16"
              >
                <div className="mb-4 text-4xl">🍽️</div>
                <h2 className="text-xl font-semibold text-slate-800">
                  London Restaurant Finder
                </h2>
                <p className="mt-2 text-sm text-slate-400 max-w-sm">
                  Ask in plain English — I&apos;ll find the best restaurants from
                  1,833 London venues scored by NLP analysis.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-md">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.q}
                      onClick={() => sendMessage(s.q)}
                      className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left text-xs text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message bubbles */}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mr-2.5 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-base">
                  🍴
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-br-sm bg-slate-100 text-slate-800"
                    : "rounded-bl-sm bg-white border border-slate-100 shadow-sm text-slate-700"
                }`}
              >
                <AssistantText content={msg.content} />

                {/* Inline result chips */}
                {msg.results && msg.results.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {msg.results.map((r) => (
                      <span
                        key={r.restaurant_name}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                      >
                        <span className="font-bold text-slate-900">#{r.rank}</span>
                        {r.restaurant_name.replace(/_/g, " ")}
                        <span className="text-slate-400">·</span>
                        <span className="text-amber-500">★ {r.composite_rating}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Parsed interpretation pill */}
                {msg.note && (
                  <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Interpreted as
                    </p>
                    <p className="text-[11px] text-slate-600">{msg.note}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-base">
                  🍴
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-100 shadow-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-slate-400"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input bar */}
      <div className="border-t border-slate-100 bg-white/80 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-slate-400 transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything — e.g. 'Romantic Italian with 200+ reviews'"
              className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none max-h-32 leading-relaxed"
              style={{ height: "24px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "24px";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
            />
            <div className="flex items-center gap-1.5 shrink-0">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white transition-all hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-slate-300">
            1,833 London restaurants · NLP-scored · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}

// Renders **bold** markdown in assistant messages
function AssistantText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-slate-900">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}
