import { Nav } from "./_components/Nav";
import { Hero } from "./_components/Hero";
import { StatsBar } from "./_components/StatsBar";
import { Marquee } from "./_components/Marquee";
import { Features } from "./_components/Features";
import { Manifesto } from "./_components/Manifesto";
import { FinalCTA } from "./_components/FinalCTA";
import { Footer } from "./_components/Footer";
import { CursorLayer } from "./_components/CursorLayer";
import { AmbientCanvas } from "./_canvas/AmbientCanvas";
import { ScrollRevealInit } from "./_components/ScrollRevealInit";

export default function LandingPage() {
  return (
    <main className="relative w-full min-h-[100svh] bg-[var(--bg-base)] text-[var(--text-secondary)] overflow-hidden">
      {/* Logic & Overlays */}
      <CursorLayer />
      <AmbientCanvas />
      <ScrollRevealInit />

      {/* Texture Overlays (LIGHT theme - Noise Only) */}
      <div 
        className="fixed inset-0 pointer-events-none z-40 opacity-[0.018]"
        aria-hidden="true"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "160px",
          mixBlendMode: "multiply"
        }}
      />

      {/* UI Sections */}
      <Nav />
      <Hero />
      <StatsBar />
      <Marquee />
      <Features />
      <Manifesto />
      <FinalCTA />
      
      {/* Footer handles its own section formatting */}
      <Footer />
    </main>
  );
}