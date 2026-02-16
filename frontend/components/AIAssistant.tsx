"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { API_BASE_URL, getToken } from "@/lib/auth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; url: string; snippet: string }[];
  timestamp: Date;
}

interface AIAssistantProps {
  /** Optional phase context to send with queries */
  phaseContext?: { phase_index: number; phase_name: string } | null;
  /** Learning path data for context */
  learningPath?: any;
}

export default function AIAssistant({ phaseContext, learningPath }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const greeting: Message = {
        id: "greeting",
        role: "assistant",
        content: `Hey! 👋 I'm your **SkillVector AI Assistant**. I can help you with:\n\n- 📖 Explaining topics from your learning path\n- 🎯 Answering questions about specific concepts\n- 🔗 Finding YouTube tutorials, articles & courses\n- 💡 Providing code examples and best practices\n\nAsk me anything about your learning journey!`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
      setHasGreeted(true);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasGreeted]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      // Build conversation history for context
      const history = messages
        .filter((m) => m.id !== "greeting")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE_URL}/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          phase_context: phaseContext || null,
          history,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to get response");
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "Explain the key concepts in my current phase",
    "What are good YouTube tutorials for this topic?",
    "How do I practice these skills effectively?",
    "What projects can I build to learn faster?",
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-surface-2 border border-border text-text-main rotate-0"
            : "bg-primary text-white shadow-primary/40"
        }`}
        title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? "close" : "smart_toy"}
        </span>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-surface-1 border border-border rounded-2xl shadow-2xl flex flex-col h-[600px] max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-text-main">SkillVector AI</h3>
              <p className="text-xs text-text-muted truncate">
                {phaseContext
                  ? `Helping with: ${phaseContext.phase_name}`
                  : "Ask about your learning path"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMessages([]);
                  setHasGreeted(false);
                }}
                className="h-8 w-8 rounded-lg hover:bg-surface-2 flex items-center justify-center transition-colors"
                title="Clear chat"
              >
                <span className="material-symbols-outlined text-text-dim text-lg">delete_sweep</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-surface-2 border border-border text-text-main rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="text-sm leading-relaxed">
                      <MarkdownRenderer content={msg.content} />
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs font-bold text-text-dim uppercase tracking-wider mb-2">
                            Web Sources
                          </p>
                          <div className="space-y-1.5">
                            {msg.sources.slice(0, 5).map((src, i) => (
                              <a
                                key={i}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2 text-xs text-primary hover:text-primary-hover transition-colors group"
                              >
                                <span className="material-symbols-outlined text-xs mt-0.5 flex-shrink-0">link</span>
                                <span className="group-hover:underline line-clamp-1">
                                  {src.title || src.url}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  <p
                    className={`text-[10px] mt-1.5 ${
                      msg.role === "user" ? "text-white/60" : "text-text-dim"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    <span className="text-xs text-text-dim">Searching & thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested questions (show only when no messages except greeting) */}
            {messages.length <= 1 && !isLoading && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                  Try asking:
                </p>
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg bg-surface-2/50 border border-border/50 text-xs text-text-muted hover:text-text-main hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-xs mr-1.5 align-middle text-primary">
                      chat_bubble
                    </span>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border px-4 py-3 bg-surface-1">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your learning topics..."
                rows={1}
                className="flex-1 resize-none bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all max-h-24 scrollbar-thin"
                style={{ minHeight: "40px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "40px";
                  target.style.height = Math.min(target.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <span className="material-symbols-outlined text-lg">
                  {isLoading ? "hourglass_top" : "send"}
                </span>
              </button>
            </div>
            <p className="text-[10px] text-text-dim mt-1.5 text-center">
              Powered by Groq Compound AI · Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* Simple Markdown Renderer for AI responses */
function MarkdownRenderer({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    // Split into blocks by double newlines
    const blocks = text.split(/\n\n+/);
    
    return blocks.map((block, blockIdx) => {
      // Code block
      if (block.startsWith("```")) {
        const lines = block.split("\n");
        const lang = lines[0].replace("```", "").trim();
        const code = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
        return (
          <pre key={blockIdx} className="bg-[#1e1e2e] text-[#cdd6f4] rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">
            {lang && <div className="text-[10px] text-[#a6adc8] mb-1 uppercase">{lang}</div>}
            <code>{code}</code>
          </pre>
        );
      }

      // Process inline content
      const lines = block.split("\n");
      return (
        <div key={blockIdx} className="mb-2">
          {lines.map((line, lineIdx) => {
            // Headers
            if (line.startsWith("### ")) {
              return <h4 key={lineIdx} className="font-bold text-sm mt-2 mb-1">{renderInline(line.slice(4))}</h4>;
            }
            if (line.startsWith("## ")) {
              return <h3 key={lineIdx} className="font-bold text-base mt-2 mb-1">{renderInline(line.slice(3))}</h3>;
            }
            if (line.startsWith("# ")) {
              return <h2 key={lineIdx} className="font-bold text-lg mt-2 mb-1">{renderInline(line.slice(2))}</h2>;
            }

            // Bullet list
            if (line.match(/^[-*•]\s/)) {
              return (
                <div key={lineIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
                  <span className="text-primary mt-1 text-xs">•</span>
                  <span>{renderInline(line.replace(/^[-*•]\s/, ""))}</span>
                </div>
              );
            }

            // Numbered list
            if (line.match(/^\d+\.\s/)) {
              const num = line.match(/^(\d+)\./)?.[1];
              return (
                <div key={lineIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
                  <span className="text-primary font-bold text-xs mt-0.5 min-w-[16px]">{num}.</span>
                  <span>{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
                </div>
              );
            }

            // Regular paragraph
            if (line.trim()) {
              return <p key={lineIdx} className="my-0.5">{renderInline(line)}</p>;
            }

            return null;
          })}
        </div>
      );
    });
  };

  const renderInline = (text: string): React.ReactNode => {
    // Process bold, italic, code, and links
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyCounter = 0;

    while (remaining.length > 0) {
      // Link: [text](url)
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      // Inline code: `text`
      const codeMatch = remaining.match(/`([^`]+)`/);
      // Emoji shortcodes are kept as-is

      // Find earliest match
      let earliest: { type: string; match: RegExpMatchArray; index: number } | null = null;

      if (linkMatch && linkMatch.index !== undefined) {
        earliest = { type: "link", match: linkMatch, index: linkMatch.index };
      }
      if (boldMatch && boldMatch.index !== undefined && (!earliest || boldMatch.index < earliest.index)) {
        earliest = { type: "bold", match: boldMatch, index: boldMatch.index };
      }
      if (codeMatch && codeMatch.index !== undefined && (!earliest || codeMatch.index < earliest.index)) {
        earliest = { type: "code", match: codeMatch, index: codeMatch.index };
      }

      if (earliest) {
        // Add text before the match
        if (earliest.index > 0) {
          parts.push(remaining.slice(0, earliest.index));
        }

        if (earliest.type === "link") {
          const url = earliest.match[2];
          const title = earliest.match[1];
          const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
          const isDoc = url.includes("docs.") || url.includes("developer.") || url.includes("nodejs.org") || url.includes("reactjs.org") || url.includes("typescriptlang.org") || url.includes("mdn.");
          const isCourse = url.includes("coursera") || url.includes("udemy") || url.includes("edx.org") || url.includes("freecodecamp");

          if (isYouTube || isDoc || isCourse) {
            // Render as a styled resource card
            const icon = isYouTube ? "play_circle" : isCourse ? "school" : "article";
            const iconColor = isYouTube ? "text-red-500" : isCourse ? "text-blue-500" : "text-green-600";
            const bgColor = isYouTube ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" : isCourse ? "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40" : "bg-green-500/5 border-green-500/20 hover:border-green-500/40";
            const label = isYouTube ? "YouTube" : isCourse ? "Course" : "Docs";

            parts.push(
              <a
                key={keyCounter++}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2.5 px-3 py-2 my-1 rounded-xl border transition-all ${bgColor} group cursor-pointer no-underline`}
              >
                <span className={`material-symbols-outlined text-lg ${iconColor} flex-shrink-0`}>{icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-text-main group-hover:text-primary transition-colors line-clamp-1 block">{title}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${iconColor}`}>{label}</span>
                </span>
                <span className="material-symbols-outlined text-sm text-text-dim group-hover:text-primary transition-colors flex-shrink-0">open_in_new</span>
              </a>
            );
          } else {
            parts.push(
              <a
                key={keyCounter++}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {title}
              </a>
            );
          }
        } else if (earliest.type === "bold") {
          parts.push(<strong key={keyCounter++}>{earliest.match[1]}</strong>);
        } else if (earliest.type === "code") {
          parts.push(
            <code key={keyCounter++} className="bg-surface-3 px-1.5 py-0.5 rounded text-xs font-mono text-primary">
              {earliest.match[1]}
            </code>
          );
        }

        remaining = remaining.slice(earliest.index + earliest.match[0].length);
      } else {
        // No more matches, add remaining text
        parts.push(remaining);
        break;
      }
    }

    return <>{parts}</>;
  };

  return <>{renderMarkdown(content)}</>;
}
