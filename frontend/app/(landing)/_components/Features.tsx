"use client";
import { useCursorEvents } from "../_hooks/useCursor";

const FEATURES = [
  {
    title: "RAG-Enhanced Paths",
    desc: "3-layer hybrid retrieval system with 0ms L0 cache, combining vector search and live Tavily web context.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
    )
  },
  {
    title: "O*NET Market Engine",
    desc: "Real-time U.S. Dept of Labor analytics. Match skills to 1,000+ occupations with Hot Technology extraction.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    )
  },
  {
    title: "Adaptive Testing",
    desc: "LLM-generated multi-phase MCQs. Pass thresholds auto-integrate validated skills into your profile.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 15L11 17L15 13" />
      </svg>
    )
  },
  {
    title: "Anti-Cheat Player",
    desc: "Server-side heartbeat verification and sub-second seek-skip detection to ensure high skill integrity.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    )
  },
  {
    title: "AI Career Assistant",
    desc: "Powered by massive compound models with fallback orchestration. Deeply contextual to your generated path.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" x2="15" y1="10" y2="10" />
        <line x1="12" x2="12" y1="7" y2="13" />
      </svg>
    )
  },
  {
    title: "Exa Hybrid Neural Retrieval",
    desc: "A neural search layer combining high-fidelity Web Search with context-aware Vector DB, extracting the freshest skill data continuously.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" x2="12" y1="22.08" y2="12" />
      </svg>
    )
  }
];

export function Features() {
  const cursorEvents = useCursorEvents();

  return (
    <section 
      id="features" 
      className="bg-[var(--bg-base)]"
      style={{ padding: "var(--section-y) var(--section-x)" }}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-[4rem]">
          <div>
            <div 
              data-reveal
              className="inline-flex items-center gap-2 px-[0.8rem] py-[0.3rem] rounded-[100px] bg-[var(--accent-light)] text-[var(--accent)] font-mono text-[var(--text-xs)] uppercase tracking-[0.15em] mb-4"
            >
              Platform Capabilities
            </div>
            <h2 data-reveal data-delay="1" className="font-display text-[var(--text-4xl)] font-[800] text-[var(--text-primary)] leading-[1.05] tracking-[-0.025em]">
              Engineered for <br/> Performance and Precision
            </h2>
          </div>
          <p data-reveal data-delay="2" className="text-[var(--text-secondary)] font-body text-[var(--text-lg)] leading-[1.65] max-w-[420px] self-end">
            An entire suite of industry-standard tools combined intelligently to provide you with an unfair career advantage.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[var(--bg-border)] border border-[var(--bg-border)] rounded-[12px] overflow-hidden">
          {FEATURES.map((feature, idx) => (
            <div 
              key={idx}
              data-reveal
              data-delay={idx + 1}
              {...cursorEvents}
              className="group relative bg-[var(--bg-surface)] p-[2.5rem_2rem] overflow-hidden transition-all duration-300 ease-[var(--ease-out-expo)] hover:bg-[var(--bg-subtle)] hover:scale-[1.01] hover:shadow-[var(--shadow-lg)] hover:z-10"
            >
              {/* Ghost number */}
              <span className="absolute top-[1rem] right-[1.5rem] font-display text-[5rem] font-[800] text-[var(--text-primary)] opacity-[0.04] group-hover:opacity-[0.09] transition-opacity duration-[350ms] leading-none select-none pointer-events-none">
                {String(idx + 1).padStart(2, "0")}
              </span>

               {/* Icon */}
              <div className="w-[48px] h-[48px] bg-[var(--accent-light)] rounded-[10px] flex items-center justify-center mb-[1.5rem] transition-all duration-300 ease-[var(--ease-spring)] group-hover:bg-[var(--accent)] group-hover:scale-[1.1] text-[var(--accent)] group-hover:text-[var(--text-inverted)]">
                {feature.icon}
              </div>

              {/* Text */}
              <h3 className="font-display text-[var(--text-xl)] font-[700] text-[var(--text-primary)] tracking-[-0.02em] mb-[0.6rem]">
                {feature.title}
              </h3>
              <p className="font-body text-[var(--text-sm)] text-[var(--text-muted)] leading-[1.7] relative z-10">
                {feature.desc}
              </p>

              {/* Bottom Link */}
              <div className="absolute bottom-[1.5rem] right-[1.5rem] font-mono text-[var(--text-xs)] text-[var(--accent)] tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 uppercase">
                Explore feature
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>

              {/* Diagonal Gradient */}
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(79,63,240,0.04)_0%,transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-[350ms] pointer-events-none" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
