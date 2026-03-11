"use client";

import { useState, useEffect, useRef } from "react";
import { UserProfileData, SkillItem } from "@/lib/types";
import { API_BASE_URL } from "@/lib/auth";

interface StepProps {
    data: UserProfileData;
    updateData: (data: Partial<UserProfileData>) => void;
}

export default function Step2Skills({ data, updateData }: StepProps) {
    const [skillInput, setSkillInput] = useState("");
    const [proficiency, setProficiency] = useState<"beginner" | "intermediate" | "advanced">("beginner");
    const [skillError, setSkillError] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Fetch skill suggestions with debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const trimmed = skillInput.trim();
        if (trimmed.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/suggestions/skills?q=${encodeURIComponent(trimmed)}`
                );
                if (res.ok) {
                    const list: string[] = await res.json();
                    // Filter out already-added skills
                    const current = (data.skills || []).map((s) => s.name.toLowerCase());
                    const filtered = list.filter((s) => !current.includes(s.toLowerCase()));
                    setSuggestions(filtered);
                    setShowSuggestions(filtered.length > 0);
                    setHighlightIdx(-1);
                }
            } catch {
                /* network error – silently degrade to free-text */
            }
        }, 250);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [skillInput, data.skills]);

    const commitSkill = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        if (trimmed.length < 2) {
            setSkillError("Skill name must be at least 2 characters.");
            return;
        }
        if (!/[a-zA-Z]/.test(trimmed)) {
            setSkillError("Skill name must contain at least one letter.");
            return;
        }
        if (trimmed.length > 60) {
            setSkillError("Skill name is too long (max 60 characters).");
            return;
        }

        setSkillError("");
        const currentSkills = data.skills || [];
        if (!currentSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
            updateData({ skills: [...currentSkills, { name: trimmed, proficiency }] });
        }
        setSkillInput("");
        setProficiency("beginner");
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const addSkill = () => commitSkill(skillInput);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === "Enter") addSkill();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIdx((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIdx((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
                commitSkill(suggestions[highlightIdx]);
            } else {
                addSkill();
            }
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    const removeSkill = (skillName: string) => {
        updateData({
            skills: (data.skills || []).filter((s) => s.name !== skillName),
        });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold text-text-main tracking-tight">Competence Matrix</h1>
                <p className="text-lg text-text-muted max-w-xl mx-auto">Map your existing capabilities. Our AI uses this vector to calculate your optimal learning trajectory.</p>
            </div>

            <div className="space-y-8">
                {/* Core Skills - Glassmorphism Card */}
                <div className="relative z-10 bg-surface-1/50 backdrop-blur-md border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl shadow-black/5">
                    <div className="flex items-center gap-4 border-b border-border pb-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main">Core Capabilities</h2>
                            <p className="text-xs text-text-muted">Technical, Soft, or Domain Skills</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative" ref={wrapperRef}>
                            <div className="flex gap-2 relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted transition-colors group-focus-within:text-primary z-10">add_reaction</span>
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => { setSkillInput(e.target.value); if (skillError) setSkillError(""); }}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                    className={`flex-1 bg-surface-2 border rounded-xl pl-12 pr-4 py-4 text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-text-muted/40 shadow-inner ${skillError ? "border-error focus:ring-error" : "border-border"}`}
                                    placeholder="Type a skill (e.g. React, Project Management)..."
                                    autoComplete="off"
                                />
                                <select
                                    value={proficiency}
                                    onChange={(e) => setProficiency(e.target.value as "beginner" | "intermediate" | "advanced")}
                                    className="bg-surface-2 border border-border rounded-xl px-3 py-4 text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-sm"
                                    required
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                                <button
                                    onClick={addSkill}
                                    disabled={!skillInput.trim()}
                                    className="px-6 bg-primary hover:bg-primary-hover disabled:bg-surface-2 disabled:text-text-muted disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    <span className="hidden md:inline">Add</span>
                                </button>
                            </div>

                            {/* Suggestions dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-50 left-0 right-16 md:right-[7.5rem] mt-1 max-h-56 overflow-y-auto bg-surface-1 border border-border rounded-xl shadow-2xl shadow-black/20 divide-y divide-border/50">
                                    {suggestions.map((s, idx) => (
                                        <li key={s}>
                                            <button
                                                type="button"
                                                onClick={() => commitSkill(s)}
                                                className={`w-full text-left px-4 py-3 cursor-pointer text-sm transition-colors flex items-center gap-2 ${idx === highlightIdx ? "bg-primary/10 text-primary" : "text-text-main hover:bg-surface-2"}`}
                                            >
                                                <span className="material-symbols-outlined text-base opacity-40">verified</span>
                                                {s}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {skillError && (
                            <p className="text-xs text-error font-medium ml-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {skillError}
                            </p>
                        )}

                        <div className="min-h-[100px] bg-background/50 rounded-xl p-4 border border-dashed border-border flex flex-wrap content-start gap-2">
                            {data.skills?.map((skill) => (
                                <div key={skill.name} className="bg-surface-1 border border-border pl-3 pr-2 py-1.5 rounded-lg flex items-center gap-2 text-sm text-text-main group hover:border-primary/50 transition-all shadow-sm">
                                    <span className="font-medium">{skill.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                                        skill.proficiency === "advanced" ? "bg-success/10 text-success" :
                                        skill.proficiency === "intermediate" ? "bg-warning/10 text-warning" :
                                        "bg-info/10 text-info"
                                    }`}>{skill.proficiency}</span>
                                    <button onClick={() => removeSkill(skill.name)} className="text-text-muted hover:text-error hover:bg-error/10 rounded p-0.5 transition-colors">
                                        <span className="material-symbols-outlined text-base">close</span>
                                    </button>
                                </div>
                            ))}
                            {(!data.skills || data.skills.length === 0) && (
                                <div className="w-full h-full flex flex-col items-center justify-center text-text-muted/40 py-8 gap-2">
                                    <span className="material-symbols-outlined text-4xl">check_box_outline_blank</span>
                                    <span className="text-sm font-medium">No skills mapped yet. Start typing above.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
