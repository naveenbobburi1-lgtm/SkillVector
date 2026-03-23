"use client";
import { useCursorEvents } from "../_hooks/useCursor";

export function Marquee() {
  const KEYWORDS = [
    "Next.js 16", "React 19", "FastAPI", "PostgreSQL", "pgvector",
    "Llama 3.3 70B", "Mistral Embed", "O*NET 29.0", "Three.js", "Tavily Web Search"
  ];
  const cursorEvents = useCursorEvents();
  
  return (
    <div 
      className="relative overflow-hidden bg-[var(--bg-base)] border-b border-[var(--bg-border)] py-[1.25rem] group"
      {...cursorEvents}
    >
      {/* Edge Fades */}
      <div className="absolute top-0 bottom-0 left-0 w-[120px] bg-gradient-to-r from-[var(--bg-base)] to-transparent z-[2] pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-[120px] bg-gradient-to-l from-[var(--bg-base)] to-transparent z-[2] pointer-events-none" />

      <div 
        className="marquee-track flex gap-[3rem] w-max group-hover:[animation-play-state:paused]"
        style={{ animation: "marquee 28s linear infinite" }}
      >
        {[...KEYWORDS, ...KEYWORDS].map((item, i) => (
          <span 
            key={i} 
            className="flex items-center gap-[0.9rem] whitespace-nowrap font-mono text-[var(--text-xs)] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
          >
            <span className="w-[5px] h-[5px] rounded-full bg-[var(--accent)] opacity-50 shadow-[0_0_6px_var(--accent)]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
