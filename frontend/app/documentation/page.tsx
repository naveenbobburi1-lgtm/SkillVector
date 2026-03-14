"use client";

import Link from "next/link";
import { useState } from "react";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      { id: "introduction", title: "Introduction", content: "Skillvector is an AI-powered career orchestration platform that helps professionals identify skill gaps, create personalized learning paths, and accelerate their careers." },
      { id: "quick-start", title: "Quick Start Guide", content: "Sign up for a free account, complete your profile setup, and let our AI analyze your skills against market demands. You'll receive a personalized learning roadmap within minutes." },
      { id: "account-setup", title: "Account Setup", content: "Create your account using email or Google sign-in. Complete the three-step profile wizard to tell us about your background, current skills, and career goals." },
    ]
  },
  {
    id: "features",
    title: "Features",
    items: [
      { id: "skill-dna", title: "Skill DNA Matrix", content: "Visualize your skills as a dynamic matrix. See your proficiencies across different domains and identify areas for growth with our AI-powered analysis." },
      { id: "learning-paths", title: "AI Learning Paths", content: "Get personalized learning recommendations based on your goals and current skill level. Our AI curates the best resources, courses, and projects for you." },
      { id: "market-insights", title: "Market Insights", content: "Access real-time data on in-demand skills, salary trends, and job market analytics. Stay ahead of industry changes." },
      { id: "career-north-star", title: "Career North Star", content: "Define your ultimate career goal and get a clear roadmap showing exactly what skills and experiences you need to get there." },
    ]
  },
  {
    id: "api-reference",
    title: "API Reference",
    items: [
      { id: "authentication", title: "Authentication", content: "All API requests require authentication using JWT tokens. Include your token in the Authorization header as 'Bearer <token>'." },
      { id: "endpoints", title: "Endpoints", content: "Access user profiles, skill data, learning paths, and market insights through our RESTful API. Rate limits apply based on your plan." },
      { id: "webhooks", title: "Webhooks", content: "Set up webhooks to receive real-time notifications about skill assessments, learning milestones, and market updates." },
    ]
  },
  {
    id: "help",
    title: "Help & Support",
    items: [
      { id: "faq", title: "FAQ", content: "Find answers to commonly asked questions about account management, billing, features, and troubleshooting." },
      { id: "contact", title: "Contact Support", content: "Need help? Reach out to our support team via email at support@skillvector.io or through the in-app chat." },
      { id: "troubleshooting", title: "Troubleshooting", content: "Having issues? Check our troubleshooting guides for common problems and their solutions." },
    ]
  }
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [activeItem, setActiveItem] = useState("introduction");

  const currentSection = sections.find(s => s.id === activeSection);
  const currentItem = currentSection?.items.find(i => i.id === activeItem);

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAFAF5] border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 bg-[#7c3aed] rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">hub</span>
                </div>
                <span className="font-bold text-xl text-[#0f172a]">Skillvector</span>
              </Link>
              <span className="text-[#94a3b8] mx-2">/</span>
              <span className="text-[#64748b] font-medium">Documentation</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-6">
              {sections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      setActiveSection(section.id);
                      setActiveItem(section.items[0].id);
                    }}
                    className={`w-full text-left font-semibold text-sm mb-2 transition-colors ${
                      activeSection === section.id
                        ? "text-[#7c3aed]"
                        : "text-[#0f172a] hover:text-[#7c3aed]"
                    }`}
                  >
                    {section.title}
                  </button>
                  {activeSection === section.id && (
                    <ul className="space-y-1 ml-2 border-l border-[#e2e8f0]">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveItem(item.id)}
                            className={`w-full text-left text-sm pl-3 py-1.5 transition-colors ${
                              activeItem === item.id
                                ? "text-[#7c3aed] border-l-2 border-[#7c3aed] -ml-[2px]"
                                : "text-[#64748b] hover:text-[#0f172a]"
                            }`}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-3xl">
            {currentItem && (
              <article className="prose prose-slate max-w-none">
                <h1 className="text-3xl font-bold text-[#0f172a] mb-4">
                  {currentItem.title}
                </h1>
                <p className="text-[#64748b] text-lg leading-relaxed">
                  {currentItem.content}
                </p>

                {/* Additional placeholder content */}
                <div className="mt-8 p-6 bg-white rounded-xl border border-[#e2e8f0]">
                  <h3 className="text-lg font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#7c3aed]">lightbulb</span>
                    Key Points
                  </h3>
                  <ul className="space-y-2 text-[#64748b]">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#7c3aed] text-sm mt-0.5">check_circle</span>
                      Easy to use and intuitive interface
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#7c3aed] text-sm mt-0.5">check_circle</span>
                      AI-powered personalized recommendations
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#7c3aed] text-sm mt-0.5">check_circle</span>
                      Real-time market insights and trends
                    </li>
                  </ul>
                </div>

                <div className="mt-6 flex items-center justify-between p-4 bg-[#FAFAF5] rounded-lg">
                  <span className="text-sm text-[#64748b]">
                    Was this page helpful?
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-[#64748b] hover:text-[#7c3aed] hover:bg-white rounded-lg transition-colors">
                      <span className="material-symbols-outlined">thumb_up</span>
                    </button>
                    <button className="p-2 text-[#64748b] hover:text-red-500 hover:bg-white rounded-lg transition-colors">
                      <span className="material-symbols-outlined">thumb_down</span>
                    </button>
                  </div>
                </div>
              </article>
            )}
          </main>

          {/* Right sidebar - On this page */}
          <aside className="w-64 flex-shrink-0 hidden xl:block">
            <div className="sticky top-24">
              <h4 className="text-sm font-semibold text-[#0f172a] mb-3">On this page</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-[#64748b] hover:text-[#7c3aed] transition-colors">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#64748b] hover:text-[#7c3aed] transition-colors">
                    Key Points
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#64748b] hover:text-[#7c3aed] transition-colors">
                    Examples
                  </a>
                </li>
              </ul>

              <div className="mt-8 p-4 bg-gradient-to-br from-[#7c3aed]/10 to-violet-500/5 rounded-xl border border-[#7c3aed]/20">
                <h4 className="text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7c3aed]">chat</span>
                  Need help?
                </h4>
                <p className="text-xs text-[#64748b] mb-3">
                  Can't find what you're looking for? Our team is here to help.
                </p>
                <Link
                  href="mailto:support@skillvector.io"
                  className="text-sm text-[#7c3aed] hover:underline font-medium"
                >
                  Contact Support →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] bg-[#FAFAF5] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-[#7c3aed] rounded-md flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm">hub</span>
              </div>
              <span className="font-semibold text-[#0f172a]">Skillvector</span>
            </div>
            <p className="text-sm text-[#64748b]">
              © 2025 Skillvector Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="#" className="text-[#64748b] hover:text-[#7c3aed] transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-[#64748b] hover:text-[#7c3aed] transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
