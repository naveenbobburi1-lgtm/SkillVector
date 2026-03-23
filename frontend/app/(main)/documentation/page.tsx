"use client";

import Link from "next/link";
import { useState, ReactNode } from "react";

interface DocItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface DocSection {
  id: string;
  title: string;
  items: DocItem[];
}

const CodeBlock = ({ code, language = "json" }: { code: string; language?: string }) => (
  <div className="my-6 rounded-xl overflow-hidden bg-[#0f172a] shadow-2xl">
    <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b] border-b border-[#334155]">
      <span className="text-xs font-mono text-[#94a3b8]">{language.toUpperCase()}</span>
      <button className="text-[#94a3b8] hover:text-white transition-colors">
        <span className="material-symbols-outlined text-sm">content_copy</span>
      </button>
    </div>
    <pre className="p-4 text-sm font-mono text-[#e2e8f0] overflow-x-auto leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

const TechnicalTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="my-6 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
    <table className="w-full text-left text-sm border-collapse">
      <thead className="bg-[#FAFAF5] border-b border-[#e2e8f0]">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 font-semibold text-[#0f172a] uppercase tracking-wider text-[10px]">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#e2e8f0]">
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-[#F5F5F0]/50 transition-colors">
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-3 text-[#64748b]">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const sections: DocSection[] = [
  {
    id: "core-architecture",
    title: "System Core",
    items: [
      {
        id: "philosophy",
        title: "The SkillVector Philosophy",
        content: (
          <div className="space-y-4">
            <p>
              SkillVector is a **Production-Grade Career Intelligence System** designed to bridge the gap between static educational content and dynamic labor market demands. Unlike simple LLM wrappers, SkillVector implements a complex orchestration of verified data sources, vector databases, and multi-model AI.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-white rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#7c3aed]">
                <h4 className="font-bold text-[#0f172a] mb-2">Verified Grounding</h4>
                <p className="text-sm">Every learning path is grounded in O*NET occupational data and live web sources. No hallucinations.</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#10b981]">
                <h4 className="font-bold text-[#0f172a] mb-2">Enterprise Performance</h4>
                <p className="text-sm">Sub-millisecond cache hits and distributed search queries ensure low latency even with complex RAG pipelines.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: "stack",
        title: "Technical Stack",
        content: (
          <div className="space-y-4">
            <p>Built with cutting-edge technologies that favor safety, scalability, and type integrity.</p>
            <TechnicalTable
              headers={["Layer", "Technology", "Role"]}
              rows={[
                ["Frontend", "Next.js 16 / React 19", "Server-Side Rendering & Client Interactivity"],
                ["Backend", "FastAPI / Python 3.13", "Asynchronous API & AI Orchestration"],
                ["Database", "PostgreSQL + pgvector", "Relational Data + High-Dim Vector Storage"],
                ["LLM Engine", "Groq / Llama 3.3 70B", "Ultra-fast inference (LPU) for Generation"],
                ["Embeddings", "Mistral Embed", "Semantic mapping of search queries"],
                ["3D Graphics", "Three.js / R3F", "SkillUniverse visualization engine"]
              ]}
            />
          </div>
        )
      }
    ]
  },
  {
    id: "rag-pipeline",
    title: "The RAG Engine",
    items: [
      {
        id: "retrieval-layers",
        title: "3-Layer Retrieval Strategy",
        content: (
          <div className="space-y-4">
            <p>To optimize for both speed and cost, SkillVector implements a tiered retrieval system that drastically reduces redundant LLM and API calls.</p>
            <ul className="space-y-4 mt-4">
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-[#7c3aed] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">L0</span>
                <div>
                  <strong className="text-[#0f172a]">In-Memory Global Cache:</strong> Stores complete context strings for frequent (role, language) pairs. Returns in **~0ms**.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-[#10b981] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">L1</span>
                <div>
                  <strong className="text-[#0f172a]">pgvector Semantic Cache:</strong> Uses HNSW indexes to find semantically similar past queries. If similarity is {">"}= 0.86, returns cached sources.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-[#f59e0b] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">L2</span>
                <div>
                  <strong className="text-[#0f172a]">Live Orchestration:</strong> Parallelized fetch from Tavily and YouTube Data API v3 for complete cache misses.
                </div>
              </li>
            </ul>
          </div>
        )
      },
      {
        id: "vector-search",
        title: "Hybrid Vector Search",
        content: (
          <div className="space-y-4">
            <p>SkillVector uses `pgvector` with HNSW (Hierarchical Navigable Small Worlds) indexes to ensure search performance doesn't degrade as the cache grows.</p>
            <CodeBlock
              language="sql"
              code={`-- L1 Semantic Lookup in PostgreSQL
SELECT sources
FROM rag_source_cache
WHERE target_role = :role
  AND language = :lang
  AND 1 - (query_embedding <=> :new_emb) >= 0.86
ORDER BY query_embedding <=> :new_emb
LIMIT 10;`}
            />
          </div>
        )
      }
    ]
  },
  {
    id: "market-data",
    title: "Market Intelligence",
    items: [
      {
        id: "onet-integration",
        title: "O*NET 29.0 Integration",
        content: (
          <div className="space-y-4">
            <p>SkillVector maps user goals to the U.S. Department of Labor's O*NET database (Standard Occupational Classification). This provides a baseline of verified skills, knowledge, and activities for over 1,000 occupations.</p>
            <TechnicalTable
              headers={["O*NET Dataset", "Application in SkillVector"]}
              rows={[
                ["Technology Skills", "Hot Technology & In Demand skill extraction"],
                ["Knowledge Domains", "Baseline knowledge requirement for prompts"],
                ["Work Activities", "Tailoring practice tasks to real-world workflows"],
                ["SOC Code Title", "Role-matching and standardization"]
              ]}
            />
          </div>
        )
      },
      {
        id: "exa-realtime",
        title: "Real-time Analysis via Exa",
        content: (
          <div className="space-y-4">
            <p>Static data isn't enough for the tech industry. SkillVector uses the Exa API to fetch live market signals, including trending salary bands and emerging "must-have" skills from job postings across the web.</p>
            <div className="p-4 bg-info/5 rounded-xl border border-info/20 text-info">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-sm">info</span>
                <span className="font-bold text-xs uppercase tracking-widest">Live Integration</span>
              </div>
              <p className="text-sm italic">"Real-time data prevents learning roadmaps from including deprecated tech and prioritizes skills currently in hiring cycles."</p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "security",
    title: "Production Engineering",
    items: [
      {
        id: "anti-cheat",
        title: "Anti-Cheat Systems",
        content: (
          <div className="space-y-4">
            <p>To maintain certificate integrity, SkillVector implements multiple defensive systems:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li><strong className="text-[#0f172a]">Video Heartbeat:</strong> Tracks playback every 5s. Seek-skip detection triggers "cheat flags" if user jumps {">"}15s beyond legitimate progress.</li>
              <li><strong className="text-[#0f172a]">Server-Side MCQ Validation:</strong> Test answers are never sent to the client. Scoring and next-phase unlocking happen strictly on the backend.</li>
              <li><strong className="text-[#0f172a]">Advisory Locks:</strong> Prevents duplicate path generation when React StrictMode double-fires requests.</li>
            </ul>
          </div>
        )
      },
      {
        id: "concurrency",
        title: "Concurrency Management",
        content: (
          <div className="space-y-4">
            <p>Using PostgreSQL advisory locks to manage expensive AI operations:</p>
            <CodeBlock
              language="python"
              code={`# server/routes/learning_path.py
lock_acquired = db.execute(
    text("SELECT pg_try_advisory_xact_lock(:uid)"),
    {"uid": current_user.id}
).scalar()

if not lock_acquired:
    # Polling wait for concurrent generation...
    return await poll_for_completion(current_user.id)`}
            />
          </div>
        )
      }
    ]
  }
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("core-architecture");
  const [activeItem, setActiveItem] = useState("philosophy");

  const currentSection = sections.find(s => s.id === activeSection);
  const currentItem = currentSection?.items.find(i => i.id === activeItem);

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-white text-xl">hub</span>
                </div>
                <span className="font-bold text-xl text-text-main tracking-tight">SkillVector</span>
              </Link>
              <span className="text-text-dim mx-3">/</span>
              <span className="text-text-muted font-mono text-sm uppercase tracking-widest">Docs</span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-sm font-medium text-text-muted hover:text-text-main transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-bold bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10 active:scale-95"
              >
                Launch System
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <nav className="sticky top-28 space-y-8">
              {sections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <h3 className="px-4 text-[10px] font-bold text-text-dim uppercase tracking-[0.2em]">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            setActiveSection(section.id);
                            setActiveItem(item.id);
                          }}
                          className={`w-full text-left text-sm px-4 py-2.5 rounded-xl transition-all duration-200 border-l-2 flex items-center gap-3 ${activeItem === item.id
                              ? "bg-primary/5 text-primary border-primary font-bold shadow-sm"
                              : "text-text-muted border-transparent hover:bg-surface-2 hover:text-text-main"
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${activeItem === item.id ? "bg-primary" : "bg-text-dim/20"
                            }`}></span>
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {currentItem && (
              <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded">System Documentation</span>
                  <span className="text-text-dim text-xs">v1.2.4</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-extrabold text-text-main tracking-tight mb-8">
                  {currentItem.title}
                </h1>

                <div className="text-text-muted text-lg leading-relaxed space-y-6">
                  {currentItem.content}
                </div>

                <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-text-dim">Was this documentation helpful?</span>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 bg-surface-1 border border-border rounded-xl text-sm font-bold text-text-muted hover:bg-success/5 hover:border-success hover:text-success transition-all">
                        <span className="material-symbols-outlined text-sm">thumb_up</span>
                        Helpful
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-surface-1 border border-border rounded-xl text-sm font-bold text-text-muted hover:bg-error/5 hover:border-error hover:text-error transition-all">
                        <span className="material-symbols-outlined text-sm">thumb_down</span>
                        Issues
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-text-dim">
                    <span className="material-symbols-outlined text-sm">update</span>
                    <span className="text-xs font-mono uppercase tracking-wider">Updated: March 2026</span>
                  </div>
                </div>
              </article>
            )}
          </main>

          {/* Right sidebar - Meta */}
          <aside className="w-72 flex-shrink-0 hidden xl:block">
            <div className="sticky top-28 space-y-8">
              <div className="glass-panel p-6 rounded-3xl border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-main">Production Ready</h4>
                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest">Verified System</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-6">
                  SkillVector is built with high-availability constraints and rigorous data grounding.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-text-main">
                    <span className="material-symbols-outlined text-success text-sm">verified</span>
                    O*NET 29.0 COMPLIANT
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-text-main">
                    <span className="material-symbols-outlined text-success text-sm">verified</span>
                    RAG-ORCHESTRATED
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-text-main">
                    <span className="material-symbols-outlined text-success text-sm">verified</span>
                    ADVISORY-LOCKED
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-text-dim uppercase tracking-[0.2em] px-2">Support Channels</h4>
                <div className="space-y-2">
                  <Link href="mailto:pavanvenkatanagamanoj@gmail.com" className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl group hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-text-dim group-hover:text-primary transition-colors">mail</span>
                      <span className="text-sm font-medium text-text-main">Email Dev</span>
                    </div>
                    <span className="material-symbols-outlined text-text-dim text-sm">open_in_new</span>
                  </Link>
                  <Link href="#" className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl group hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-text-dim group-hover:text-primary transition-colors">bug_report</span>
                      <span className="text-sm font-medium text-text-main">Report Bug</span>
                    </div>
                    <span className="material-symbols-outlined text-text-dim text-sm">open_in_new</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="border-t border-border mt-24 py-12 bg-surface-1">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">hub</span>
            </div>
            <span className="font-bold text-text-main">SkillVector</span>
          </div>
          <p className="text-sm text-text-dim font-medium">
            © 2026 SkillVector Intelligence. Architected for Career Transformation.
          </p>
          <div className="flex items-center gap-8 text-sm font-bold text-text-dim">
            <Link href="#" className="hover:text-primary transition-colors">Status</Link>
            <Link href="#" className="hover:text-primary transition-colors">Security</Link>
            <Link href="#" className="hover:text-primary transition-colors">Changelog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
