"use client";
import { useCountUp } from "../_hooks/useCountUp";
import { useCursorEvents } from "../_hooks/useCursor";

const STATS = [
  { value: 1000, suffix: "+", label: "O*NET Occupations", desc: "Real-time labor market matching across 1,000+ specialized fields." },
  { value: 3, suffix: "-Layer", label: "RAG Pipeline", desc: "Hybrid retrieval system combining vector search and live web context." },
  { value: 1024, suffix: "-D", label: "Hybrid Search", desc: "High-dimensional embedding space for profound semantic accuracy." },
  { value: 70, suffix: "B", label: "Llama 3.3 Engine", desc: "Powered by massive compound foundation models with fallback orchestration." }
];

function StatItem({ stat, index }: { stat: any, index: number }) {
  const { value, ref } = useCountUp(stat.value, 1800, stat.suffix);
  const cursorEvents = useCursorEvents();
  
  return (
    <div 
      ref={ref as any}
      data-reveal 
      data-delay={index + 1}
      {...cursorEvents}
      className="group relative overflow-hidden py-[2.5rem] px-[var(--section-x)] border-r border-[var(--bg-border)] last:border-r-0 hover:bg-[var(--accent-light)]/30 transition-colors duration-300"
    >
      <div className="relative z-10 flex flex-col items-start text-left">
        <span className="font-display font-[800] text-[var(--text-4xl)] leading-none tracking-[-0.04em] text-[var(--text-primary)]">
          {value}
        </span>
        <span className="font-mono font-[500] text-[var(--text-xs)] tracking-[0.12em] uppercase text-[var(--text-muted)] mt-[0.35rem]">
          {stat.label}
        </span>
        <p className="font-body text-[var(--text-sm)] text-[var(--text-muted)] mt-[0.2rem] max-w-xs">
          {stat.desc}
        </p>
      </div>

      {/* Sweep border */}
      <span className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-[450ms] ease-[var(--ease-out-expo)]"
        style={{ background: "linear-gradient(90deg, var(--accent), var(--sage))", boxShadow: "0 0 12px var(--accent-glow)" }}
      />
    </div>
  );
}

export function StatsBar() {
  return (
    <section className="bg-[var(--bg-surface)] border-y border-[var(--bg-border)] p-0">
      <div className="grid grid-cols-2 md:grid-cols-4 w-full">
        {STATS.map((stat, idx) => (
          <StatItem key={idx} stat={stat} index={idx} />
        ))}
      </div>
    </section>
  );
}
