"use client";

import React from "react";

interface SkillGapChartProps {
    coverage: number;
}

export default function SkillGapChart({ coverage }: SkillGapChartProps) {
    // Ensure coverage is between 0 and 100
    const percentage = Math.min(Math.max(coverage, 0), 100);
    const circumference = 2 * Math.PI * 40; // r=40
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="transform -rotate-90 w-full h-full">
                {/* Track */}
                <circle
                    className="text-surface-3"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50%"
                    cy="50%"
                />
                {/* Indicator */}
                <circle
                    className="text-primary transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50%"
                    cy="50%"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-text-main">{percentage}%</span>
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Match</span>
            </div>
        </div>
    );
}
