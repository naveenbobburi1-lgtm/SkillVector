"use client";

import Link from "next/link";
import { useCursorEvents } from "../_hooks/useCursor";
import { useParallax } from "../_hooks/useParallax";

export function Hero() {
  const cursorEvents = useCursorEvents();
  const parallax = useParallax(16);

  return (
    <section 
      ref={parallax.sectionRef}
      onMouseMove={parallax.onMouseMove}
      onMouseLeave={parallax.onMouseLeave}
      onMouseEnter={parallax.onMouseEnter}
      style={{
        minHeight: "100svh",
        padding: "calc(var(--section-y) + 4rem) var(--section-x) var(--section-y)",
      }}
      className="bg-[var(--bg-base)] relative overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Background Decor - Centered Radiant Glows */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full z-[1] pointer-events-none opacity-[0.35] mix-blend-multiply"
        style={{
          background: "radial-gradient(ellipse, var(--accent) 0%, transparent 60%)",
          filter: "blur(60px)",
          transformOrigin: "center top",
          animation: "pulseRing 8s ease-in-out infinite alternate"
        }}
      />
      <div 
        className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full z-[1] pointer-events-none opacity-[0.25] mix-blend-multiply"
        style={{
          background: "radial-gradient(ellipse, var(--sage) 0%, transparent 60%)",
          filter: "blur(50px)",
        }}
      />
      
      {/* Subtle Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "linear-gradient(var(--bg-border) 1px, transparent 1px), linear-gradient(90deg, var(--bg-border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: "center center",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, black 20%, transparent 100%)"
        }}
      />

      {/* CONTENT BLOCK - CENTERED */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl mx-auto">
        
        {/* Eyebrow Tag */}
        <div 
          className="inline-flex items-center gap-2 px-[1rem] py-[0.4rem] rounded-[100px] bg-[var(--accent-light)] text-[var(--accent)] font-mono text-[var(--text-xs)] uppercase tracking-[0.15em] mb-6 shadow-[0_0_20px_rgba(79,63,240,0.15)]"
          style={{ opacity: 0, animation: "blurIn 1s var(--ease-out-expo) 0.1s forwards" }}
        >
          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" style={{ animation: "pulseRing 1.5s ease-out infinite" }} />
          Production RAG Pipeline
        </div>

        {/* Headline */}
        <h1 
          className="font-display font-[800] text-[clamp(2.5rem,7vw,5.5rem)] text-[var(--text-primary)] tracking-[-0.04em] leading-[0.95] my-2 uppercase"
        >
          <span className="block" style={{ opacity: 0, animation: "blurIn 1.2s var(--ease-out-expo) 0.25s forwards" }}>
            AI-POWERED CAREER
          </span>
          <span 
            className="block mt-2"
            style={{ 
              background: "linear-gradient(135deg, var(--accent) 0%, var(--sage) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              opacity: 0,
              animation: "blurIn 1.2s var(--ease-out-expo) 0.4s forwards" 
            }}
          >
            INTELLIGENCE
          </span>
        </h1>

        {/* Subhead */}
        <p 
          className="text-[var(--text-lg)] md:text-[var(--text-xl)] text-[var(--text-secondary)] font-body font-[400] leading-[1.65] max-w-3xl mb-12 mt-6"
          style={{ opacity: 0, animation: "blurIn 1.2s var(--ease-out-expo) 0.6s forwards" }}
        >
          Stop relying on static course lists. Analyze your skills, match against real O*NET labor market data, and generate a dynamic, deeply personalized learning roadmap.
        </p>

        {/* CTAs */}
        <div 
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12 w-full"
          style={{ opacity: 0, animation: "blurIn 1.2s var(--ease-out-expo) 0.8s forwards" }}
        >
          {/* Primary Button */}
          <Link 
            href="/learning-path" 
            {...cursorEvents}
            className="group relative inline-flex items-center justify-center font-body font-[600] text-[var(--text-base)] text-[var(--text-inverted)] bg-[var(--accent)] px-[2.5rem] py-[1rem] rounded-[8px] shadow-[0_8px_30px_rgba(79,63,240,0.3)] overflow-hidden hover:shadow-[0_12px_40px_rgba(79,63,240,0.5)] hover:-translate-y-[2px] transition-all duration-300 ease-[var(--ease-out-expo)]"
          >
            <span className="absolute inset-0 bg-[var(--accent-hover)] -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-[350ms] ease-[var(--ease-out-expo)]" />
            <span className="relative z-10 flex items-center gap-2">
              Generate Path
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </Link>
          
          {/* Ghost Button */}
          <Link 
            href="/market-insights"
            {...cursorEvents}
            className="group inline-flex items-center justify-center gap-[0.6rem] font-body font-[500] text-[var(--text-base)] text-[var(--text-primary)] bg-[var(--bg-surface)] backdrop-blur-md border-[1.5px] border-[var(--bg-border)] px-[2.5rem] py-[1rem] rounded-[8px] transition-all duration-250 ease-[var(--ease-out-expo)] hover:border-[var(--accent)] hover:text-[var(--accent)] shadow-[var(--shadow-sm)]"
          >
            <span>View Insights</span>
            <span className="inline-block h-[1.5px] bg-current relative w-[1.75rem] group-hover:w-[2.5rem] transition-all duration-300 ease-[var(--ease-out-expo)]">
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-[1.5px] border-r-[1.5px] border-current rotate-45" />
            </span>
          </Link>
        </div>

        {/* Trust signal row */}
        <div className="flex flex-wrap justify-center items-center gap-[1.5rem] font-mono text-[var(--text-sm)] text-[var(--text-muted)] mt-4 opacity-0"
          style={{ animation: "fadeIn 1.5s ease 1.2s forwards" }}>
          <span>No credit card</span>
          <span className="w-[4px] h-[4px] rounded-full bg-[var(--accent)] opacity-40" />
          <span>Free tier</span>
          <span className="w-[4px] h-[4px] rounded-full bg-[var(--accent)] opacity-40" />
          <span>Open source</span>
        </div>
      </div>

      {/* Floating Elements that respond to Parallax */}
      <div 
        ref={parallax.targetRef}
        className="absolute inset-0 pointer-events-none z-10"
      >
        <div className="absolute top-[12%] sm:top-[20%] left-[5%] sm:left-[10%] bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[8px] py-[0.4rem] sm:py-[0.5rem] px-[0.6rem] sm:px-[0.85rem] shadow-[var(--shadow-sm)] font-mono text-[10px] sm:text-[var(--text-xs)] text-[var(--text-primary)] pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.05)]" style={{ animation: "float 6s ease-in-out infinite 0.5s" }}>
          ⚡ 2× faster
        </div>
        <div className="absolute top-[15%] sm:top-[25%] right-[5%] sm:right-[15%] bg-[var(--accent-light)] border border-[var(--accent)] border-opacity-20 rounded-[8px] py-[0.4rem] sm:py-[0.5rem] px-[0.6rem] sm:px-[0.85rem] font-mono text-[10px] sm:text-[var(--text-xs)] text-[var(--accent)] pointer-events-auto shadow-[0_4px_20px_rgba(79,63,240,0.15)]" style={{ animation: "float 8s ease-in-out infinite 1s" }}>
          ✦ 98% accuracy
        </div>
        <div className="absolute bottom-[20%] sm:bottom-[30%] left-[8%] sm:left-[18%] bg-[var(--sage-light)] border border-[var(--sage)] border-opacity-20 rounded-[8px] py-[0.4rem] sm:py-[0.5rem] px-[0.6rem] sm:px-[0.85rem] font-mono text-[10px] sm:text-[var(--text-xs)] text-[var(--sage)] pointer-events-auto shadow-[0_4px_20px_rgba(46,196,160,0.15)]" style={{ animation: "float 7s ease-in-out infinite 1.5s" }}>
          ↗ +340% ROI
        </div>
      </div>

      {/* Scroll indicator */}
      <div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-[0.5rem] font-mono text-[var(--text-xs)] text-[var(--text-muted)] tracking-[0.15em] uppercase opacity-0"
        style={{ animation: "fadeIn 1s ease 1.4s forwards" }}
      >
        <span>SCROLL</span>
        <div className="w-[1px] h-[30px] overflow-hidden bg-[var(--bg-border)] relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[var(--accent)] origin-top" style={{ animation: "bar-grow-vertical 2s cubic-bezier(0.8, 0, 0.2, 1) infinite" }} />
        </div>
      </div>
    </section>
  );
}
