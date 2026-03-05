"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
    getMarketGapAnalysis,
    getMarketOutlook,
    MarketGapAnalysis,
    MarketOutlook
} from "@/lib/market";
import { getUserProfile } from "@/lib/auth";
import SkillGapChart from "@/components/market/SkillGapChart";
import InsightCard from "@/components/market/InsightCard";
import Navbar from "@/components/Navbar";
import { exportMarketInsightsReport, UserProfileForReport } from "@/lib/exportReport";

export default function MarketInsightsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gapAnalysis, setGapAnalysis] = useState<MarketGapAnalysis | null>(null);
    const [outlook, setOutlook] = useState<MarketOutlook | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfileForReport | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data concurrently
                const [gapData, outlookData, profileData] = await Promise.all([
                    getMarketGapAnalysis(),
                    getMarketOutlook(),
                    getUserProfile().catch(() => null)
                ]);
                setGapAnalysis(gapData);
                setOutlook(outlookData);
                if (profileData) setUserProfile(profileData);
            } catch (err: any) {
                console.error("Market insights fetch error:", err);
                setError(err.message || "Failed to load market insights. Please ensure the backend server is running.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text-muted font-medium animate-pulse">Aggregating real-time market data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="max-w-md w-full glass-panel p-8 rounded-2xl border-error/20">
                    <span className="material-symbols-outlined text-5xl text-error mb-4">error_outline</span>
                    <h1 className="text-xl font-bold text-text-main mb-2">Unable to load insights</h1>
                    <p className="text-text-muted mb-4">{error}</p>
                    {error.includes("server") && (
                        <div className="mb-6 p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-text-muted text-left">
                            <p className="font-medium text-warning mb-1">💡 Tip:</p>
                            <p>Make sure the backend server is reachable at <code className="text-primary">{process.env.NEXT_PUBLIC_API_URL || "https://skillvector-odaw.onrender.com"}</code></p>
                        </div>
                    )}
                    <Link
                        href="/learning-path"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-surface-2 hover:bg-surface-3 text-text-main font-medium rounded-lg transition-colors"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary selection:text-white flex flex-col">
            {/* Top Navigation Bar */}
            <Navbar activePage="market-insights" />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-10 space-y-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 fade-in-up">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 text-xs font-bold text-primary bg-primary/10 rounded-full border border-primary/20 uppercase tracking-wide">
                                Live Analysis
                            </span>
                            <span className="text-text-dim text-sm font-mono">SOC: {gapAnalysis?.soc_code}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-text-main tracking-tight mb-3">
                            {gapAnalysis?.role} <span className="text-text-muted font-normal">Integration</span>
                        </h1>
                        <p className="text-lg text-text-muted max-w-2xl">
                            Real-time market intelligence analyzing your profile against specific employer requirements for <span className="text-primary font-semibold">{gapAnalysis?.role}</span> roles.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/learning-path"
                            className="px-5 py-2.5 rounded-xl border border-border bg-surface-1 text-text-main hover:bg-surface-2 font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">school</span>
                            View Plan
                        </Link>
                        <button
                            onClick={() => {
                                if (gapAnalysis && outlook) {
                                    exportMarketInsightsReport(gapAnalysis, outlook, userProfile);
                                }
                            }}
                            className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/25 hover:bg-primary-hover hover:shadow-primary/40 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Insight Intelligence (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col gap-8">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InsightCard
                                title="Projected Growth"
                                value={outlook?.role_growth || "--"}
                                icon="trending_up"
                                trend="positive"
                            />
                            <InsightCard
                                title="Salary Competitiveness"
                                value={outlook?.salary_insight || "--"}
                                icon="payments"
                            />
                            <InsightCard
                                title="Hot Sectors"
                                value={outlook?.hot_sectors || []}
                                icon="domain"
                            />
                        </div>

                        {/* Market Outlook Long Card */}
                        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <span className="material-symbols-outlined text-9xl">psychology</span>
                            </div>
                            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">lightbulb</span>
                                AI Market Outlook
                            </h3>
                            <p className="text-text-muted leading-relaxed text-lg">
                                {outlook?.market_outlook}
                            </p>

                            <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 text-sm text-text-dim">
                                    <span className="material-symbols-outlined text-base">update</span>
                                    Updated 2 hours ago
                                </div>
                                <div className="flex items-center gap-2 text-sm text-text-dim">
                                    <span className="material-symbols-outlined text-base">verified</span>
                                    Verified Sources
                                </div>
                            </div>
                        </div>

                        {/* Trending Skills */}
                        <div className="glass-panel p-8 rounded-2xl border-l-4 border-l-primary">
                            <h3 className="text-lg font-bold text-text-main mb-4">Trending Skills to Watch</h3>
                            <div className="flex flex-wrap gap-3">
                                {outlook?.trending_skills?.map((skill, i) => (
                                    <span key={i} className="px-4 py-2 bg-background rounded-lg border border-border text-text-main font-medium text-sm flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-success"></span>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Skill Gap Analysis (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Coverage Chart Card */}
                        <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

                            <h3 className="text-xl font-bold text-text-main mb-6">Profile Match</h3>

                            <SkillGapChart coverage={gapAnalysis?.insights.skill_coverage_percent || 0} />

                            <p className="mt-6 text-sm text-text-muted">
                                Your profile matches <strong className="text-text-main">{gapAnalysis?.insights.skill_coverage_percent}%</strong> of the standard requirements for this role.
                            </p>
                        </div>

                        {/* Missing Skills Alert */}
                        {gapAnalysis?.insights.missing_skills.length ? (
                            <div className="glass-panel p-6 rounded-2xl border-error/20 bg-error/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-error">warning</span>
                                    <h3 className="font-bold text-text-main">Critical Gaps Detected</h3>
                                </div>
                                <div className="space-y-2">
                                    {gapAnalysis.insights.missing_skills.slice(0, 5).map((skill, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-surface-1 rounded-lg border border-error/10">
                                            <span className="text-sm font-medium text-text-main">{skill}</span>
                                            <Link href="/learning-path" className="p-1 hover:bg-surface-2 rounded-md text-primary transition-colors">
                                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                            </Link>
                                        </div>
                                    ))}
                                    {gapAnalysis.insights.missing_skills.length > 5 && (
                                        <p className="text-xs text-text-muted text-center pt-2">
                                            +{gapAnalysis.insights.missing_skills.length - 5} more missing skills
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel p-6 rounded-2xl border-success/20 bg-success/5 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-success text-white flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">check</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main">All Systems Go</h3>
                                    <p className="text-sm text-text-muted">You have all core skills!</p>
                                </div>
                            </div>
                        )}

                        {/* Core Requirements List */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="font-bold text-text-main mb-4 text-sm uppercase tracking-wider text-text-muted">Core Requirements</h3>
                            <div className="flex flex-wrap gap-2">
                                {gapAnalysis?.insights.market_required_skills.slice(0, 10).map((skill, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-surface-2 text-text-muted rounded-md border border-border">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
