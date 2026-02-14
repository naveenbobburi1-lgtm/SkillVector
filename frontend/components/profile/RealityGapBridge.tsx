"use client";

import React, { useState } from "react";
import { API_BASE_URL, getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface RealityGapBridgeProps {
    missingSkills?: string[];
}

export default function RealityGapBridge({ missingSkills = [] }: RealityGapBridgeProps) {
    const router = useRouter();
    const [loadingSkill, setLoadingSkill] = useState<string | null>(null);

    // If no specific missing skills passed, show generic state or "All good"
    const hasGaps = missingSkills.length > 0;

    const handleAddToPath = async (skill: string) => {
        setLoadingSkill(skill);
        const token = getToken();
        
        try {
            const res = await fetch(`${API_BASE_URL}/add-skill-and-regenerate-path`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ skill })
            });

            if (res.ok) {
                const data = await res.json();
                // Redirect to learning path which will regenerate
                router.push("/learning-path");
            } else {
                alert("Failed to add skill to path");
            }
        } catch (e) {
            console.error(e);
            alert("Error adding skill to path");
        } finally {
            setLoadingSkill(null);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-3xl h-full flex flex-col justify-center">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-warning text-sm">engineering</span>
                    The Reality Gap
                </h3>
            </div>

            {hasGaps ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Bridge Completion</span>
                        <span className="font-bold text-text-main">65%</span>
                    </div>

                    {/* The Bridge Bar */}
                    <div className="h-3 w-full bg-surface-2 rounded-full flex overflow-hidden">
                        <div className="h-full bg-success w-[65%]"></div>
                        <div className="h-full bg-warning w-[10%] animate-pulse"></div> {/* Next Up */}
                        <div className="h-full bg-surface-3 w-[25%] opacity-50 bg-[url('/stripes.png')]"></div>
                    </div>

                    <div className="pt-4 space-y-2">
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest block mb-2">Critical Blockers (Immediate ROI)</span>
                        {missingSkills.slice(0, 3).map((skill, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-2/50 border border-border/50 hover:bg-surface-2 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-warning text-sm">block</span>
                                    <span className="text-sm font-medium text-text-main">{skill}</span>
                                </div>
                                <button 
                                    onClick={() => handleAddToPath(skill)}
                                    disabled={loadingSkill === skill}
                                    className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded hover:bg-primary/10 transition-colors uppercase disabled:opacity-50 flex items-center gap-1"
                                >
                                    {loadingSkill === skill ? (
                                        <>
                                            <span className="inline-block h-2 w-2 border border-primary border-t-transparent rounded-full animate-spin"></span>
                                            Adding...
                                        </>
                                    ) : (
                                        "Add to Path"
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="h-12 w-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3 text-success">
                        <span className="material-symbols-outlined text-2xl">check</span>
                    </div>
                    <h4 className="font-bold text-text-main">Gap Bridged</h4>
                    <p className="text-sm text-text-muted">You are aligned with market requirements.</p>
                </div>
            )}
        </div>
    );
}
