"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCursorEvents } from "../_hooks/useCursor";

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cursorEvents = useCursorEvents();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-[400ms] ease-[var(--ease-out-expo)] ${
          isScrolled 
            ? "border-b border-[var(--bg-border)] shadow-[var(--shadow-xs)]" 
            : "bg-transparent shadow-none border-transparent"
        }`}
        style={{
          padding: "1.25rem var(--section-x)",
          background: isScrolled ? "rgba(248,247,244,0.85)" : "transparent",
          backdropFilter: isScrolled ? "blur(16px) saturate(1.6)" : "none",
          WebkitBackdropFilter: isScrolled ? "blur(16px) saturate(1.6)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* LOGO */}
          <Link 
            href="/" 
            {...cursorEvents}
            className="flex items-center gap-1 font-display font-[800] text-[1.35rem] tracking-[-0.04em] text-[var(--text-primary)]"
          >
            SkillVector
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1" />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Manifesto", "Pricing"].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                {...cursorEvents}
                className="font-body text-[var(--text-sm)] font-[500] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
              >
                {item}
              </a>
            ))}
            <Link 
              href="/login" 
              {...cursorEvents}
              className="font-mono text-[var(--text-xs)] tracking-[0.08em] uppercase py-[0.6rem] px-[1.4rem] bg-[var(--accent)] text-[var(--text-inverted)] rounded-[4px] shadow-[var(--shadow-accent)] hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-accent-lg)] hover:-translate-y-[1px] transition-all duration-200 ease-[var(--ease-out-expo)] relative"
            >
              Sign In
            </Link>
          </nav>

          {/* MOBILE HAMBURGER BUTTON */}
          <button 
            className="md:hidden flex flex-col justify-center items-center w-6 h-6 z-50 relative"
            {...cursorEvents}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-[1.5px] bg-[var(--text-primary)] transition-all duration-300 absolute ${mobileMenuOpen ? "rotate-45 block" : "-translate-y-2"}`}></span>
            <span className={`block w-6 h-[1.5px] bg-[var(--text-primary)] transition-all duration-300 absolute ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`}></span>
            <span className={`block w-6 h-[1.5px] bg-[var(--text-primary)] transition-all duration-300 absolute ${mobileMenuOpen ? "-rotate-45 block" : "translate-y-2"}`}></span>
          </button>
        </div>
      </header>

      {/* MOBILE MENU DROPDOWN */}
      <div 
        className={`fixed top-0 left-0 w-full bg-[var(--bg-surface)] shadow-[var(--shadow-md)] z-[90] md:hidden transition-transform duration-[300ms] ease-out pt-24 pb-8 ${
          mobileMenuOpen ? "translate-y-0" : "-translate-y-[100%]"
        }`}
      >
        <div className="flex flex-col">
          {["Features", "Manifesto", "Pricing"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              onClick={() => setMobileMenuOpen(false)}
              className="font-display text-[var(--text-xl)] font-bold text-[var(--text-primary)] p-[1.25rem] border-b border-[var(--bg-border)] text-center hover:bg-[var(--bg-subtle)]"
            >
              {item}
            </a>
          ))}
          <div className="p-6 flex justify-center mt-2">
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono text-[var(--text-sm)] tracking-widest uppercase py-3 px-8 bg-[var(--accent)] text-[var(--text-inverted)] rounded-[4px] shadow-[var(--shadow-accent)] w-full text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[80] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
