"use client";

import React from "react";

interface RoleRadarProps {
    salaryMatch: number; // 0-100
    demandMatch: number;
    skillMatch: number;
    futureGrowth: number;
}

export default function RoleRadar({ salaryMatch, demandMatch, skillMatch, futureGrowth }: RoleRadarProps) {
    // Basic Diamond Shape Radar
    // Center is 100,100. Max Radius 80.

    // Normalize 0-100 to 0-80 radius
    const rSalary = (salaryMatch / 100) * 80;
    const rDemand = (demandMatch / 100) * 80;
    const rSkill = (skillMatch / 100) * 80;
    const rGrowth = (futureGrowth / 100) * 80;

    // Points: Top (Skill), Right (Salary), Bottom (Demand), Left (Growth)
    const pSkill = `100,${100 - rSkill}`;
    const pSalary = `${100 + rSalary},100`;
    const pDemand = `100,${100 + rDemand}`;
    const pGrowth = `${100 - rGrowth},100`;

    const polyPoints = `${pSkill} ${pSalary} ${pDemand} ${pGrowth}`;

    return (
        <div className="glass-panel p-6 rounded-3xl h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent text-sm">radar</span>
                    Market Resonance
                </h3>
                <span className="text-[10px] bg-surface-2 px-2 py-1 rounded text-text-muted border border-border">Live Sync</span>
            </div>

            <div className="relative flex-1 min-h-[200px] flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full max-w-[220px]">
                    {/* Background Web grid */}
                    <circle cx="100" cy="100" r="20" fill="none" stroke="var(--surface-3)" strokeWidth="1" />
                    <circle cx="100" cy="100" r="40" fill="none" stroke="var(--surface-3)" strokeWidth="1" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="var(--surface-3)" strokeWidth="1" />
                    <circle cx="100" cy="100" r="80" fill="none" stroke="var(--surface-3)" strokeWidth="1" />

                    {/* Axes */}
                    <line x1="100" y1="20" x2="100" y2="180" stroke="var(--surface-3)" strokeWidth="1" />
                    <line x1="20" y1="100" x2="180" y2="100" stroke="var(--surface-3)" strokeWidth="1" />

                    {/* The Data Shape */}
                    <polygon
                        points={polyPoints}
                        fill="var(--primary)"
                        fillOpacity="0.2"
                        stroke="var(--primary)"
                        strokeWidth="2"
                        className="drop-shadow-md transition-all duration-1000 ease-out"
                    />

                    {/* Labels */}
                    <text x="100" y="15" textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontWeight="bold">SKILLS</text>
                    <text x="190" y="103" textAnchor="start" fontSize="8" fill="var(--text-muted)" fontWeight="bold">SALARY</text>
                    <text x="100" y="195" textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontWeight="bold">DEMAND</text>
                    <text x="5" y="103" textAnchor="end" fontSize="8" fill="var(--text-muted)" fontWeight="bold">GROWTH</text>
                </svg>

                {/* Center Insight */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="bg-surface-1/80 backdrop-blur-sm rounded-full p-1 border border-primary/20 shadow-sm">
                        <span className="material-symbols-outlined text-primary text-xs">bolt</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 text-center">
                <p className="text-xs text-text-muted">
                    Strong <span className="text-primary font-bold">Growth Potential</span> detected for your role path.
                </p>
            </div>
        </div>
    );
}
