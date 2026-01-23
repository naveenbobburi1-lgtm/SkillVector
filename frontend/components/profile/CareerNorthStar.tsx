"use client";

import React from "react";

interface CareerNorthStarProps {
    currentRole: string;
    targetRole: string;
    velocity: string; // e.g. "Fast", "Moderate"
    matchScore: number;
    marketSummary?: string; // New prop for AI text
}

export default function CareerNorthStar({ currentRole, targetRole, velocity, matchScore, marketSummary }: CareerNorthStarProps) {
    return (
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group h-full flex flex-col justify-between">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6 z-10">
                <div>
                    <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">explore</span>
                        Career North Star
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-text-main">{targetRole || "Not Set"}</span>
                        {targetRole && <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20">TARGET</span>}
                    </div>
                </div>

                {/* Velocity Badge */}
                <div className={`
          flex flex-col items-end text-right
          ${velocity === "Fast" ? "text-success" : velocity === "Moderate" ? "text-warning" : "text-text-muted"}
        `}>
                    <div className="flex items-center gap-1 font-bold text-sm">
                        <span>{velocity || "Unset"}</span>
                        <span className="material-symbols-outlined text-lg">
                            {velocity === "Fast" ? "rocket_launch" : velocity === "Moderate" ? "speed" : "coffee"}
                        </span>
                    </div>
                    <span className="text-[10px] text-text-dim uppercase font-semibold">Velocity</span>
                </div>
            </div>

            {/* Flight Path Visualization */}
            <div className="relative h-24 w-full mb-4">
                <svg className="w-full h-full overflow-visible">
                    {/* Defs for gradients */}
                    <defs>
                        <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--primary)" />
                        </linearGradient>
                    </defs>

                    {/* The Path Line */}
                    <path
                        d="M 10,60 C 50,60 150,20 280,20"
                        fill="none"
                        stroke="url(#flightGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="drop-shadow-lg"
                    />

                    {/* Dashed Future Path */}
                    <path
                        d="M 280,20 L 350,20"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        strokeOpacity="0.4"
                    />

                    {/* Start Point */}
                    <circle cx="10" cy="60" r="4" fill="var(--surface-1)" stroke="var(--text-muted)" strokeWidth="2" />

                    {/* User Position (Animated) */}
                    <circle cx="280" cy="20" r="6" fill="var(--primary)" className="animate-pulse">
                        {/* Orbital Ring */}
                        <animate attributeName="r" values="6;8;6" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite" />
                    </circle>

                    {/* Target Label */}
                    <text x="10" y="85" fontSize="10" fill="currentColor" className="text-text-muted font-mono">CURRENT</text>
                    <text x="280" y="45" fontSize="10" fill="var(--primary)" className="font-bold font-mono">YOU</text>
                    <text x="350" y="25" fontSize="10" fill="var(--text-dim)" textAnchor="start" className="uppercase font-bold tracking-widest opacity-50">GOAL</text>
                </svg>
            </div>

            {/* Footer Metrics */}
            <div className="flex justify-between items-center bg-surface-2/50 p-3 rounded-xl border border-border/50 backdrop-blur-sm">
                <div>
                    <span className="text-xs text-text-dim block mb-0.5">Feasibility</span>
                    <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 bg-surface-3 rounded-full overflow-hidden">
                            <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(matchScore, 100)}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-text-main">{matchScore}%</span>
                    </div>
                </div>
                {matchScore < 50 && (
                    <div className="flex items-center gap-1 text-[10px] text-warning bg-warning/10 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        High Gap
                    </div>
                )}
            </div>

            {/* AI Market Pulse (Visual Proof of Dynamic Analysis) */}
            {marketSummary && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl relative">
                    <div className="absolute -top-2 left-3 bg-background px-2 text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Live Market Pulse
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed italic">
                        "{marketSummary}"
                    </p>
                </div>
            )}
        </div>
    );
}
