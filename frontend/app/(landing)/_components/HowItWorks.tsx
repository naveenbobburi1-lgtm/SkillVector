"use client";

import { motion } from "framer-motion";
import { useCursorEvents } from "../_hooks/useCursor";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    id: "01",
    title: "Connect",
    desc: "Auth & baseline setup",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" x2="3" y1="12" y2="12" />
      </svg>
    ),
    color: "#7c3aed" // Violet
  },
  {
    id: "02",
    title: "Profile",
    desc: "AI identifies skill gaps",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    color: "#0891b2" // Cyan
  },
  {
    id: "03",
    title: "Engine",
    desc: "RAG path generation",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <path d="M12 11h.01" />
        <path d="M16 11h.01" />
        <path d="M8 11h.01" />
      </svg>
    ),
    color: "#d97706" // Amber
  },
  {
    id: "04",
    title: "Insights",
    desc: "Real-time O*NET market data",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    color: "#ec4899" // Pink
  },
  {
    id: "05",
    title: "Execute",
    desc: "Learn & become job-ready",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    color: "#10b981" // Emerald
  }
];

export function HowItWorks() {
  const cursorEvents = useCursorEvents();
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      id="how-it-works" 
      className="relative bg-[var(--bg-base)] overflow-hidden flex flex-col items-center justify-center font-body pt-24 pb-32"
    >
      {/* Background Ambience */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[400px] rounded-[100%] z-[0] pointer-events-none opacity-[0.4] mix-blend-multiply"
        style={{
          background: "radial-gradient(ellipse, var(--accent-light) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="max-w-7xl w-full mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center">
        
        {/* Eyebrow & Headline (Very concise) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent)] font-mono text-[var(--text-xs)] uppercase tracking-[0.15em] mb-4">
            The Pipeline
          </div>
          <h2 className="font-display text-[clamp(2.5rem,5vw,4rem)] font-[800] text-[var(--text-primary)] leading-[1.05] tracking-[-0.03em]">
            From Zero to Job Ready.
          </h2>
        </motion.div>

        {/* HORIZONTAL SNAPSHOT GRAPHIC */}
        <div className="relative w-full h-auto min-h-[400px] flex items-center justify-center mt-10" {...cursorEvents}>
          
          {/* Main Desktop Pipeline Line Container (Hidden on mobile) */}
          <div className="absolute top-[50%] left-0 w-full h-[2px] bg-[var(--bg-border)] hidden md:block" />
          
          {/* Animated Glow Line (Desktop) */}
          <motion.div 
            className="absolute top-[50%] left-0 h-[2px] hidden md:block z-0"
            style={{
              background: "linear-gradient(90deg, #7c3aed, #0891b2, #10b981)",
              boxShadow: "0 0 20px rgba(79,63,240,0.4)"
            }}
            initial={{ width: "0%" }}
            animate={isInView ? { width: "100%" } : {}}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
          />

          {/* Steps Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-0 relative z-10">
            {STEPS.map((step, idx) => {
              const isTop = idx % 2 === 0; // Alternate up and down for visual rhythm on desktop
              
              return (
                <div key={idx} className="relative flex flex-row md:flex-col items-center group/node">
                  
                  {/* Mobile vertical line connecting steps */}
                  {idx !== STEPS.length - 1 && (
                    <div className="absolute left-[38px] top-[76px] bottom-[-24px] w-[2px] bg-[var(--bg-border)] md:hidden z-0" />
                  )}
                  {idx !== STEPS.length - 1 && (
                    <motion.div 
                      className="absolute left-[38px] top-[76px] bottom-[-24px] w-[2px] md:hidden z-[1]"
                      style={{ background: step.color }}
                      initial={{ height: "0%" }}
                      animate={isInView ? { height: "100%" } : {}}
                      transition={{ duration: 0.5, delay: 0.5 + (idx * 0.4) }}
                    />
                  )}

                  {/* Desktop Card (positioned above/below line) */}
                  <div className={`hidden md:flex w-full absolute left-1/2 -translate-x-1/2 ${isTop ? 'bottom-[calc(50%+45px)]' : 'top-[calc(50%+45px)]'} flex-col items-center text-center px-2`}>
                    <motion.div
                      initial={{ opacity: 0, y: isTop ? 20 : -20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.6 + (idx * 0.3), type: "spring", stiffness: 100 }}
                      className="bg-white/70 dark:bg-[var(--bg-surface)] backdrop-blur-md border border-[var(--bg-border)] rounded-xl p-4 w-[160px] shadow-sm group-hover/node:shadow-[var(--shadow-md)] group-hover/node:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover/node:opacity-10 transition-opacity duration-300 pointer-events-none" style={{ background: step.color }} />
                      <div className="text-[10px] font-mono font-bold tracking-[0.1em] opacity-50 mb-1" style={{ color: step.color }}>STEP {step.id}</div>
                      <h3 className="font-display font-[700] text-[var(--text-primary)] text-[16px] leading-[1.2] mb-1.5">{step.title}</h3>
                      <p className="text-[11px] leading-[1.4] text-[var(--text-muted)] font-medium">{step.desc}</p>
                    </motion.div>
                    
                    {/* Connecting Stem (Desktop) */}
                    <motion.div 
                      className="w-[2px] bg-[var(--bg-border)] absolute left-1/2 -translate-x-1/2"
                      style={{ height: '30px', [isTop ? 'bottom' : 'top']: '-35px' }}
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ duration: 0.3, delay: 0.8 + (idx * 0.3) }}
                    />
                  </div>

                  {/* Node Circle */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 + (idx * 0.3) }}
                    className="relative w-[76px] h-[76px] rounded-full bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--bg-border)] flex items-center justify-center flex-shrink-0 z-10 shadow-sm group-hover/node:shadow-lg transition-all duration-300 md:my-0 cursor-pointer"
                    style={{ 
                      boxShadow: `0 0 0 4px var(--bg-base), inset 0 0 20px ${step.color}15`,
                    }}
                  >
                    {/* Animated pulse ring */}
                    <motion.div 
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2px solid ${step.color}` }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: [0, 1, 0], scale: [1, 1.4, 1.6] } : {}}
                      transition={{ duration: 2, delay: 0.5 + (idx * 0.3), repeat: Infinity, repeatDelay: 3 }}
                    />
                    
                    <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white shadow-inner z-10" style={{ background: `linear-gradient(135deg, ${step.color}, #ffffff40)` }}>
                      {step.icon}
                    </div>
                  </motion.div>

                  {/* Mobile Content right of the node */}
                  <div className="ml-6 md:hidden py-4 w-full">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.4 + (idx * 0.3) }}
                      className="bg-white/60 dark:bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 shadow-sm"
                    >
                      <div className="text-[10px] font-mono font-bold tracking-[0.1em] opacity-60 mb-1" style={{ color: step.color }}>STEP {step.id}</div>
                      <h3 className="font-display font-[700] text-[var(--text-primary)] text-[20px] leading-[1.2] mb-1">{step.title}</h3>
                      <p className="text-[13px] leading-[1.5] text-[var(--text-muted)]">{step.desc}</p>
                    </motion.div>
                  </div>
                  
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
