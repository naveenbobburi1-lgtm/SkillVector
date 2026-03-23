"use client";

import Link from "next/link";
import { useCursorEvents } from "../_hooks/useCursor";
import { useParallax } from "../_hooks/useParallax";

export function Hero() {
  const cursorEvents = useCursorEvents();
  const parallax = useParallax(14); // 14px strength as defined

  return (
    <section 
      ref={parallax.sectionRef}
      onMouseMove={parallax.onMouseMove}
      onMouseLeave={parallax.onMouseLeave}
      onMouseEnter={parallax.onMouseEnter}
      style={{
        minHeight: "100svh",
        padding: "8rem var(--section-x) var(--section-y)",
      }}
      className="bg-[var(--bg-base)] relative overflow-hidden grid grid-cols-1 md:grid-cols-2 items-center"
    >
      {/* Background Decorations */}
      <div 
        className="absolute top-[-100px] right-[-150px] w-[600px] h-[600px] rounded-full z-[1] pointer-events-none opacity-60 mix-blend-multiply"
        style={{
          background: "radial-gradient(circle, var(--accent-light) 0%, transparent 70%)",
          filter: "blur(40px)"
        }}
      />
      <div 
        className="absolute bottom-[-50px] left-[-80px] w-[300px] h-[300px] rounded-full z-[1] pointer-events-none opacity-50 mix-blend-multiply"
        style={{
          background: "radial-gradient(circle, var(--sage-light) 0%, transparent 70%)",
          filter: "blur(30px)"
        }}
      />

      {/* LEFT COLUMN: TEXT CONTENT */}
      <div className="relative z-10 flex flex-col items-start pr-0 md:pr-10">
        
        {/* Eyebrow Tag */}
        <div 
          className="inline-flex items-center gap-2 px-[0.8rem] py-[0.3rem] rounded-[100px] bg-[var(--accent-light)] text-[var(--accent)] font-mono text-[var(--text-xs)] uppercase tracking-[0.15em] mb-4"
          style={{ opacity: 0, animation: "blurIn 1s var(--ease-out-expo) 0.1s forwards" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" style={{ animation: "pulseRing 1.5s ease-out infinite" }} />
          Production RAG Pipeline
        </div>

        {/* Headline */}
        <h1 
          className="font-display font-[800] text-[var(--text-hero)] text-[var(--text-primary)] tracking-[-0.04em] leading-[0.95] my-5 uppercase"
        >
          <span className="block" style={{ opacity: 0, animation: "blurIn 1.2s var(--ease-out-expo) 0.25s forwards" }}>
            AI-POWERED CAREER
          </span>
          <span 
            className="block"
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
          className="text-[var(--text-lg)] text-[var(--text-secondary)] font-body font-[400] leading-[1.65] max-w-[480px] mb-10"
          style={{ opacity: 0, animation: "blurIn 1.2s var(--ease-out-expo) 0.6s forwards" }}
        >
          Stop relying on static course lists. Analyze your skills, match against real O*NET labor market data, and generate a dynamic, deeply personalized learning roadmap.
        </p>

        {/* CTAs */}
        <div 
          className="flex flex-wrap items-center gap-4 mb-10 w-full"
          style={{ opacity: 0, animation: "blurIn 1.2s var(--ease-out-expo) 0.8s forwards" }}
        >
          {/* Primary Button */}
          <Link 
            href="/learning-path" 
            {...cursorEvents}
            className="group relative inline-flex items-center justify-center font-body font-[600] text-[var(--text-base)] text-[var(--text-inverted)] bg-[var(--accent)] px-[2rem] py-[0.85rem] rounded-[6px] shadow-[var(--shadow-accent)] overflow-hidden hover:shadow-[var(--shadow-accent-lg)] hover:-translate-y-[2px] transition-all duration-300 ease-[var(--ease-out-expo)]"
          >
            <span className="absolute inset-0 bg-[var(--accent-hover)] -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-[350ms] ease-[var(--ease-out-expo)]" />
            <span className="relative z-10">Generate Path</span>
          </Link>
          
          {/* Ghost Button */}
          <Link 
            href="/market-insights"
            {...cursorEvents}
            className="group inline-flex items-center justify-center gap-[0.6rem] font-body font-[500] text-[var(--text-base)] text-[var(--text-primary)] bg-transparent border-[1.5px] border-[var(--bg-border)] px-[2rem] py-[0.85rem] rounded-[6px] transition-all duration-250 ease-[var(--ease-out-expo)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)]"
          >
            <span>View Insights</span>
            <span className="inline-block h-[1.5px] bg-current relative w-[1.75rem] group-hover:w-[2.5rem] transition-all duration-300 ease-[var(--ease-out-expo)]">
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-[1.5px] border-r-[1.5px] border-current rotate-45" />
            </span>
          </Link>
        </div>

        {/* Trust signal row */}
        <div className="flex items-center gap-[1.25rem] font-mono text-[var(--text-xs)] text-[var(--text-muted)] mt-2 opacity-0"
          style={{ animation: "fadeIn 1.5s ease 1.2s forwards" }}>
          <span>No credit card</span>
          <span className="w-[3px] h-[3px] rounded-full bg-[var(--text-muted)]/40" />
          <span>Free tier</span>
          <span className="w-[3px] h-[3px] rounded-full bg-[var(--text-muted)]/40" />
          <span>Open source</span>
        </div>
      </div>

      {/* RIGHT COLUMN: ORBITAL VISUAL */}
      <div 
        className="relative flex items-center justify-center h-full w-full hidden md:flex opacity-0"
        style={{ animation: "blurIn 1.4s var(--ease-out-expo) 0.6s forwards" }}
      >
        <div 
          ref={parallax.targetRef}
          className="absolute top-1/2 left-1/2 w-[420px] h-[420px]"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          {/* Container animating float */}
          <div className="w-full h-full relative" style={{ animation: "float 7s ease-in-out infinite" }}>
            
            {/* Sphere Core */}
            <div 
              className="w-full h-full rounded-full"
              style={{
                background: "radial-gradient(circle at 38% 34%, rgba(79,63,240,0.18) 0%, rgba(46,196,160,0.08) 50%, transparent 72%)",
                border: "1px solid rgba(79,63,240,0.12)",
                boxShadow: "inset 0 0 60px rgba(79,63,240,0.08), 0 0 80px rgba(79,63,240,0.06), 0 0 160px rgba(46,196,160,0.04)"
              }}
            />

            {/* Ring 1 */}
            <div 
              className="absolute top-1/2 left-1/2 rounded-full border border-solid"
              style={{ width: "122%", height: "122%", borderColor: "rgba(79,63,240,0.15)", transform: "translate(-50%, -50%) rotateX(68deg)", animation: "spinSlow 20s linear infinite" }}
            />
            
            {/* Ring 2 */}
            <div 
              className="absolute top-1/2 left-1/2 rounded-full border border-solid"
              style={{ width: "148%", height: "148%", borderColor: "rgba(46,196,160,0.1)", transform: "translate(-50%, -50%) rotateX(68deg)", animation: "spinReverse 32s linear infinite" }}
            />

            {/* Ring 3 */}
            <div 
              className="absolute top-1/2 left-1/2 rounded-full border border-solid"
              style={{ width: "178%", height: "178%", borderColor: "rgba(255,92,92,0.07)", transform: "translate(-50%, -50%) rotateX(68deg)", animation: "spinSlow 48s linear infinite" }}
            />

            {/* Specular Highlight */}
            <div 
              className="absolute rounded-full"
              style={{ top: "13%", left: "17%", width: "26%", height: "16%", background: "rgba(255,255,255,0.5)", filter: "blur(10px)", transform: "rotate(-28deg)" }}
            />

            {/* Floating Tags */}
            <div className="absolute top-0 left-[-40px] bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[8px] py-[0.5rem] px-[0.85rem] shadow-[var(--shadow-sm)] font-mono text-[var(--text-xs)] text-[var(--text-primary)] pointer-events-none" style={{ animation: "float 6s ease-in-out infinite 0.5s" }}>
              ⚡ 2× faster
            </div>
            <div className="absolute top-[40%] right-[-70px] bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[8px] py-[0.5rem] px-[0.85rem] shadow-[var(--shadow-sm)] font-mono text-[var(--text-xs)] text-[var(--text-primary)] pointer-events-none" style={{ animation: "float 8s ease-in-out infinite 1s" }}>
              ✦ 98% accuracy
            </div>
            <div className="absolute bottom-[20%] left-[-20px] bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-[8px] py-[0.5rem] px-[0.85rem] shadow-[var(--shadow-sm)] font-mono text-[var(--text-xs)] text-[var(--text-primary)] pointer-events-none" style={{ animation: "float 7s ease-in-out infinite 1.5s" }}>
              ↗ +340% ROI
            </div>
          </div>
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
