"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";

export default function MarketInsightsPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for effect
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary selection:text-white flex flex-col">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-surface-1/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-lg">hub</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Skillvector</span>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
                    <Link href="/learning-path" className="hover:text-primary transition-colors">Learning Path</Link>
                    <Link href="/profile" className="hover:text-primary transition-colors">Profile</Link>
                    <Link href="/market-insights" className="text-text-main font-semibold">Market Insights</Link>
                </div>

                <div className="w-8"></div> {/* Spacer for balance */}
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-surface-1 border border-border p-12 rounded-3xl shadow-xl max-w-lg w-full relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <div className="h-20 w-20 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-8 relative">
                        <span className="material-symbols-outlined text-4xl text-primary animate-pulse">query_stats</span>
                        <div className="absolute -right-2 -top-2 h-6 w-6 bg-accent rounded-full flex items-center justify-center border-2 border-surface-1">
                            <span className="material-symbols-outlined text-xs text-white">lock</span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-text-main mb-3">Market Insights</h1>
                    <p className="text-text-muted mb-8 leading-relaxed">
                        Our AI brokers are currently aggregating real-time labor market data. This module will unlock predictive checks on your skill relevance.
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 rounded-full border border-primary/20 text-xs font-mono font-medium text-primary uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-warning animate-pulse"></span>
                        Coming Soon
                    </div>
                </div>

                <div className="mt-12 flex gap-4 text-sm text-text-muted">
                    <Link href="/learning-path" className="hover:text-text-main flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Back to Path
                    </Link>
                </div>
            </main>
        </div>
    );
}
