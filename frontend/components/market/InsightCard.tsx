"use client";

import React from "react";

interface InsightCardProps {
    title: string;
    value: string | string[];
    icon: string;
    trend?: "positive" | "negative" | "neutral";
}

export default function InsightCard({ title, value, icon, trend }: InsightCardProps) {
    const isArray = Array.isArray(value);

    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-full hover:shadow-lg transition-shadow duration-300 bg-surface-1/50 border-surface-3">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">{title}</h3>
            </div>

            <div className="mt-auto">
                {isArray ? (
                    <div className="flex flex-wrap gap-2">
                        {value.map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-surface-2 border border-border rounded-md text-sm font-medium text-text-main">
                                {item}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-text-main tracking-tight">{value}</span>
                        {trend === "positive" && <span className="text-success text-sm font-medium flex items-center"><span className="material-symbols-outlined text-sm mr-0.5">trending_up</span>Trending</span>}
                        {trend === "negative" && <span className="text-error text-sm font-medium flex items-center"><span className="material-symbols-outlined text-sm mr-0.5">trending_down</span>Declining</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
