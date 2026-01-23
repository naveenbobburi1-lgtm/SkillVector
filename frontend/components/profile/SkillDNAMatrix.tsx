"use client";

import React from "react";

interface SkillDNAMatrixProps {
    skills: string[];
}

export default function SkillDNAMatrix({ skills }: SkillDNAMatrixProps) {
    // Mock grouping logic for visual effect (In real app, AI categorizes these)
    const primarySkills = skills.slice(0, Math.ceil(skills.length / 2));
    const secondarySkills = skills.slice(Math.ceil(skills.length / 2));

    return (
        <div className="glass-panel p-6 rounded-3xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-info text-sm">hub</span>
                    Skill DNA Matrix
                </h3>
                <span className="text-xs text-text-muted">{skills.length} Vectors Mapped</span>
            </div>

            <div className="flex-1 space-y-6">
                {/* Primary Cluster */}
                <div>
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-3 block pl-1">Core Competencies</span>
                    <div className="flex flex-wrap gap-2">
                        {primarySkills.length > 0 ? primarySkills.map((skill, i) => (
                            <div key={i} className="group relative">
                                <span className="px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-sm font-medium text-text-main hover:border-primary/50 hover:text-primary transition-all cursor-default flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
                                    {skill}
                                </span>
                                {/* Hover Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-foreground text-surface-1 text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                                    High Market Value
                                </div>
                            </div>
                        )) : (
                            <span className="text-sm text-text-muted italic px-2">No Verified Skills</span>
                        )}
                    </div>
                </div>

                {/* Secondary Cluster */}
                {secondarySkills.length > 0 && (
                    <div className="opacity-80">
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-3 block pl-1">Emerging / Secondary</span>
                        <div className="flex flex-wrap gap-2">
                            {secondarySkills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-surface-1 border border-border/50 border-dashed rounded-lg text-xs font-medium text-text-muted hover:border-solid hover:border-text-dim transition-all cursor-default">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-4 border-t border-border/50 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                </div>
                <p className="text-xs text-text-muted">
                    AI suggests adding <strong className="text-text-main cursor-pointer hover:underline">System Design</strong> to unlock Senior roles.
                </p>
            </div>
        </div>
    );
}
