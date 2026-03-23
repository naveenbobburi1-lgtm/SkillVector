"use client";
import Link from "next/link";
import { useCursorEvents } from "../_hooks/useCursor";

export function FinalCTA() {
  const cursorEvents = useCursorEvents();

  return (
    <section 
      className="bg-[var(--accent)] relative overflow-hidden"
      style={{ padding: "var(--section-y) var(--section-x)" }}
    >
      {/* Background Textures */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      />
      <div 
        className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)" }}
      />
      
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-[3rem]">
        
        <div className="flex-1 flex flex-col items-start pr-0 md:pr-10 text-center md:text-left pt-6">
          <div 
            data-reveal
            className="inline-flex items-center gap-2 px-[0.8rem] py-[0.3rem] rounded-[100px] bg-[rgba(255,255,255,0.15)] text-[var(--text-inverted)] font-mono text-[var(--text-xs)] uppercase tracking-[0.15em] mb-6"
          >
            Start transforming today
          </div>

          <h2 data-reveal data-delay="1" className="font-display text-[var(--text-4xl)] font-[800] text-[var(--text-inverted)] tracking-[-0.04em] mb-[1.25rem] max-w-[540px]">
            Ready to build your AI-curated path?
          </h2>

          <p data-reveal data-delay="2" className="text-[rgba(255,255,255,0.75)] font-body text-[var(--text-lg)] max-w-[480px]">
            Join thousands of professionals optimizing their careers through intelligent, data-driven learning vectors.
          </p>
        </div>

        {/* BUTTON STACK */}
        <div className="w-full md:w-auto flex flex-col items-center gap-[0.75rem] min-w-[280px]" data-reveal data-delay="3">
          
          <Link 
            href="/learning-path" 
            {...cursorEvents}
            className="w-full text-center group inline-block font-body font-[700] text-[var(--accent)] bg-[var(--text-inverted)] px-[2.25rem] py-[1rem] rounded-[6px] transition-all duration-300 hover:bg-[rgba(255,255,255,0.9)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-[2px]"
          >
            Start your journey
          </Link>
          
          <Link 
            href="/login" 
            {...cursorEvents}
            className="w-full text-center group inline-block font-body font-[500] text-[var(--text-inverted)] bg-transparent border-[1.5px] border-[rgba(255,255,255,0.35)] px-[2.25rem] py-[1rem] rounded-[6px] transition-all duration-300 hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.8)]"
          >
            I already have an account
          </Link>

        </div>

      </div>
    </section>
  );
}
