"use client";
import Link from "next/link";
import { useCursorEvents } from "../_hooks/useCursor";

export function Footer() {
  const cursorEvents = useCursorEvents();
  
  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--bg-border)] py-12 px-[var(--section-x)] relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        
        <div className="flex flex-col items-center md:items-start">
          <Link 
            href="/" 
            {...cursorEvents}
            className="font-display text-xl font-bold text-[var(--text-primary)] tracking-tight mb-2"
          >
            Skill<span className="text-[var(--accent)]">Vector</span>
          </Link>
          <p className="font-body text-[var(--text-sm)] text-[var(--text-muted)] text-center md:text-left">
            Precision engineering for your career trajectory.
          </p>
        </div>

        <div className="flex gap-8 font-mono text-[var(--text-xs)] uppercase tracking-wider text-[var(--text-secondary)]">
          <Link href="#features" {...cursorEvents} className="hover:text-[var(--accent)] transition-colors">Features</Link>
          <Link href="#pricing" {...cursorEvents} className="hover:text-[var(--accent)] transition-colors">Pricing</Link>
          <Link href="/terms" {...cursorEvents} className="hover:text-[var(--accent)] transition-colors">Terms</Link>
          <Link href="/privacy" {...cursorEvents} className="hover:text-[var(--accent)] transition-colors">Privacy</Link>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[var(--bg-border)] flex flex-col md:flex-row justify-between items-center text-[var(--text-muted)] font-mono text-[var(--text-xs)]">
        <p>&copy; {new Date().getFullYear()} SkillVector. All rights reserved.</p>
        <p className="mt-4 md:mt-0 opacity-50">Open Source Data Pipeline via O*NET</p>
      </div>
    </footer>
  );
}
