"use client";

import React, { useState } from "react";

interface ActionCommandProps {
    onAddSkill: () => void;
    onEditParams: () => void;
    onGeneratePath: () => void;
}

export default function ActionCommand({ onAddSkill, onEditParams, onGeneratePath }: ActionCommandProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Desktop Bar */}
            <div className="hidden lg:flex fixed bottom-8 left-1/2 -translate-x-1/2 bg-surface-1/90 backdrop-blur-xl border border-border p-2 rounded-2xl shadow-2xl shadow-black/20 z-40 items-center gap-2 animate-in slide-in-from-bottom-10 fade-in duration-700">
                <div className="px-4 py-2 border-r border-border/50">
                    <span className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                        System Ready
                    </span>
                </div>

                <button
                    onClick={onAddSkill}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-surface-2 rounded-xl text-sm font-medium text-text-main transition-colors"
                >
                    <span className="material-symbols-outlined text-lg text-primary">add_circle</span>
                    Add Vector
                </button>

                <button
                    onClick={onEditParams}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-surface-2 rounded-xl text-sm font-medium text-text-main transition-colors"
                >
                    <span className="material-symbols-outlined text-lg text-text-muted">tune</span>
                    Params
                </button>

                <div className="w-[1px] h-6 bg-border/50 mx-1"></div>

                <button
                    onClick={onGeneratePath}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 transition-all hover:scale-105"
                >
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    Update Path
                </button>
            </div>

            {/* Mobile Fab */}
            <div className="lg:hidden fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-14 w-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                >
                    <span className={`material-symbols-outlined text-2xl transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>add</span>
                </button>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="absolute bottom-16 right-0 bg-surface-1 border border-border rounded-2xl shadow-xl w-48 p-2 space-y-1 animate-in slide-in-from-bottom-2 fade-in zoom-in-95 origin-bottom-right">
                        <button onClick={() => { onAddSkill(); setIsOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-surface-2 rounded-xl flex items-center gap-3 text-sm font-medium text-text-main">
                            <span className="material-symbols-outlined text-primary">add_circle</span> Add Vector
                        </button>
                        <button onClick={() => { onEditParams(); setIsOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-surface-2 rounded-xl flex items-center gap-3 text-sm font-medium text-text-main">
                            <span className="material-symbols-outlined text-text-muted">tune</span> Params
                        </button>
                        <div className="h-[1px] bg-border my-1"></div>
                        <button onClick={() => { onGeneratePath(); setIsOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-primary/5 rounded-xl flex items-center gap-3 text-sm font-bold text-primary">
                            <span className="material-symbols-outlined">auto_awesome</span> Update Path
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
