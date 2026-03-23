export function Manifesto() {
  return (
    <section 
      id="manifesto" 
      className="bg-[var(--bg-subtle)] border-y border-[var(--bg-border)] text-center relative overflow-hidden"
      style={{ padding: "var(--section-y) var(--section-x)" }}
    >
      {/* Background Decoration */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, var(--accent-light) 0%, transparent 70%)"
        }}
      />

      <div className="relative z-10 max-w-[820px] mx-auto flex flex-col items-center">
        
        <div data-reveal className="inline-flex items-center gap-2 px-[0.8rem] py-[0.3rem] rounded-[100px] bg-[var(--accent-light)] text-[var(--accent)] font-mono text-[var(--text-xs)] uppercase tracking-[0.15em] mb-4">
          The Manifesto
        </div>

        <blockquote 
          data-reveal data-delay="1"
          className="font-display text-[var(--text-4xl)] font-[800] leading-[1.05] tracking-[-0.03em] text-[var(--text-primary)] my-[1.5rem]"
        >
          Built for career{" "}
          <span 
            style={{ 
              background: "linear-gradient(135deg, var(--accent), var(--sage))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            transformation
          </span>
          <br className="hidden md:block"/>
          <span className="text-[var(--text-muted)] font-[600]"> — not just course </span>
          <br className="hidden md:block"/>
          recommendations.
        </blockquote>

        <p data-reveal data-delay="2" className="font-mono text-[var(--text-xs)] tracking-[0.2em] uppercase text-[var(--text-muted)] mt-4">
          01. 10. 2026 / Release Alpha
        </p>

      </div>
    </section>
  );
}
