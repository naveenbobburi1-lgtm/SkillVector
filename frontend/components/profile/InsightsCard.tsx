"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, getToken } from "@/lib/auth";

interface InsightsData {
    trending_skills: string[];
    role_growth: string;
    salary_insight: string;
    market_outlook: string;
    hot_sectors: string[];
}

export default function InsightsCard() {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchInsights() {
            const token = getToken();
            if (!token) return;

            try {
                const res = await fetch(`${API_BASE_URL}/profile-insights`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    setError(true);
                }
            } catch (e) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchInsights();
    }, []);

    if (loading) {
        return (
            <div className="bg-surface-1 border border-border rounded-2xl p-6 h-full flex flex-col justify-center items-center gap-3">
                <div className="w-8 h-8 border-2 border-accent border-b-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-text-dim animate-pulse uppercase tracking-wider">Analyzing Market Signals...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-surface-1 border border-border rounded-2xl p-6 h-full flex flex-col justify-center items-center text-center">
                <span className="material-symbols-outlined text-3xl text-text-dim mb-2">signal_wifi_off</span>
                <p className="text-sm text-text-muted">Market data currently unavailable.</p>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-surface-1 to-surface-2 border border-border rounded-2xl p-6 h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-8xl">query_stats</span>
            </div>

            <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-accent">auto_awesome</span>
                AI Market Intelligence
            </h3>

            <div className="space-y-6 relative z-10">

                {/* Outlook */}
                <div>
                    <p className="text-sm text-text-muted italic border-l-2 border-accent pl-3">
                        "{data.market_outlook}"
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-1 rounded-lg p-3 border border-border/50">
                        <div className="text-xs font-semibold text-text-dim uppercase mb-1">Role Growth</div>
                        <div className="text-xl font-bold text-success flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">trending_up</span>
                            {data.role_growth}
                        </div>
                    </div>
                    <div className="bg-surface-1 rounded-lg p-3 border border-border/50">
                        <div className="text-xs font-semibold text-text-dim uppercase mb-1">Salary Check</div>
                        <div className="text-sm font-medium text-text-main line-clamp-2">
                            {data.salary_insight}
                        </div>
                    </div>
                </div>

                {/* Trending Skills */}
                <div>
                    <div className="text-xs font-semibold text-text-dim uppercase mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-warning">whatshot</span>
                        Trending Now
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {data.trending_skills.map((skill, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-warning/10 text-warning border border-warning/20 text-xs font-medium">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Hot Sectors */}
                <div>
                    <div className="text-xs font-semibold text-text-dim uppercase mb-2">High Demand In</div>
                    <div className="flex flex-wrap gap-2 text-sm text-text-main">
                        {data.hot_sectors.map((sector, i) => (
                            <span key={i} className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                                {sector}
                            </span>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
