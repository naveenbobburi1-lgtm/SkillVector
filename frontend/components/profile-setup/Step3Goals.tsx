"use client";

import { useState, useEffect, useRef } from "react";
import { UserProfileData } from "@/lib/types";
import { API_BASE_URL } from "@/lib/auth";

interface StepProps {
    data: UserProfileData;
    updateData: (data: Partial<UserProfileData>) => void;
}

export default function Step3Goals({ data, updateData }: StepProps) {
    const [roleInput, setRoleInput] = useState(data.desired_role || "");
    const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
    const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
    const [roleHighlightIdx, setRoleHighlightIdx] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const roleWrapperRef = useRef<HTMLDivElement>(null);

    // Sync external data changes into local input
    useEffect(() => {
        setRoleInput(data.desired_role || "");
    }, [data.desired_role]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (roleWrapperRef.current && !roleWrapperRef.current.contains(e.target as Node)) {
                setShowRoleSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Fetch role suggestions with debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const trimmed = roleInput.trim();
        if (trimmed.length < 2) {
            setRoleSuggestions([]);
            setShowRoleSuggestions(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/suggestions/roles?q=${encodeURIComponent(trimmed)}`
                );
                if (res.ok) {
                    const list: string[] = await res.json();
                    setRoleSuggestions(list);
                    setShowRoleSuggestions(list.length > 0);
                    setRoleHighlightIdx(-1);
                }
            } catch {
                /* degrade to free-text */
            }
        }, 250);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [roleInput]);

    const selectRole = (role: string) => {
        setRoleInput(role);
        updateData({ desired_role: role });
        setShowRoleSuggestions(false);
        setRoleSuggestions([]);
    };

    const handleRoleKeyDown = (e: React.KeyboardEvent) => {
        if (!showRoleSuggestions || roleSuggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setRoleHighlightIdx((prev) => (prev + 1) % roleSuggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setRoleHighlightIdx((prev) => (prev <= 0 ? roleSuggestions.length - 1 : prev - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (roleHighlightIdx >= 0 && roleHighlightIdx < roleSuggestions.length) {
                selectRole(roleSuggestions[roleHighlightIdx]);
            }
        } else if (e.key === "Escape") {
            setShowRoleSuggestions(false);
        }
    };

    const industries = [
        { name: "IT & ITES", icon: "computer" },
        { name: "Healthcare", icon: "medical_services" },
        { name: "Manufacturing", icon: "precision_manufacturing" },
        { name: "Retail & Logistics", icon: "shopping_cart" },
        { name: "Construction", icon: "construction" },
        { name: "Tourism", icon: "flight" },
        { name: "Agriculture", icon: "agriculture" },
        { name: "Automotive", icon: "directions_car" }
    ];

    const toggleIndustry = (industry: string) => {
        const current = data.preferred_industries || [];
        if (current.includes(industry)) {
            updateData({ preferred_industries: current.filter((i) => i !== industry) });
        } else {
            if (current.length < 3) {
                updateData({ preferred_industries: [...current, industry] });
            }
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold text-text-main tracking-tight">North Star Configuration</h1>
                <p className="text-lg text-text-muted max-w-xl mx-auto">Define your target coordinates. Where do you want this learning path to take you?</p>
            </div>

            <div className="space-y-8">

                {/* Job Role - Hero Input */}
                <div className="bg-gradient-to-br from-surface-1 to-surface-2 border border-border p-8 rounded-3xl shadow-xl relative overflow-visible group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-focus-within:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-[100px] text-primary">target</span>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <label className="text-sm font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                            Desired Job Role <span className="text-error">*</span>
                        </label>
                        <div className="relative" ref={roleWrapperRef}>
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-4xl text-text-muted group-focus-within:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                value={roleInput}
                                onChange={(e) => {
                                    setRoleInput(e.target.value);
                                    updateData({ desired_role: e.target.value });
                                }}
                                onKeyDown={handleRoleKeyDown}
                                onFocus={() => { if (roleSuggestions.length > 0) setShowRoleSuggestions(true); }}
                                className="w-full bg-transparent border-b-2 border-border py-4 pl-12 text-3xl font-bold text-text-main focus:border-primary outline-none transition-all placeholder:text-text-muted/20"
                                placeholder="e.g. Data Scientist"
                                autoComplete="off"
                            />

                            {/* Role suggestions dropdown */}
                            {showRoleSuggestions && roleSuggestions.length > 0 && (
                                <ul className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-surface-1 border border-border rounded-xl shadow-2xl shadow-black/20 divide-y divide-border/50">
                                    {roleSuggestions.map((role, idx) => (
                                        <li
                                            key={role}
                                            onMouseDown={() => selectRole(role)}
                                            className={`px-5 py-3.5 cursor-pointer transition-colors flex items-center gap-3 ${idx === roleHighlightIdx ? "bg-primary/10 text-primary" : "text-text-main hover:bg-surface-2"}`}
                                        >
                                            <span className="material-symbols-outlined text-lg opacity-40">work</span>
                                            <span className="font-medium">{role}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <p className="text-sm text-text-muted pl-12">Start typing to see matching roles, or enter your own.</p>
                    </div>
                </div>

                {/* Industries - Grid Selection */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-text-dim uppercase tracking-wider ml-1">Preferred Industry Sectors (Max 3)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {industries.map((ind) => {
                            const isSelected = data.preferred_industries?.includes(ind.name);
                            return (
                                <button
                                    key={ind.name}
                                    onClick={() => toggleIndustry(ind.name)}
                                    className={`relative p-4 h-28 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${isSelected
                                            ? "bg-primary text-white border-primary shadow-[0_8px_20px_-6px_rgba(var(--primary-rgb),0.5)] transform -translate-y-1"
                                            : "bg-surface-1 text-text-muted border-border hover:border-primary/50 hover:text-text-main hover:bg-surface-2"
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-3xl ${isSelected ? "text-white" : ""}`}>{ind.icon}</span>
                                    <span className="text-sm font-semibold text-center leading-tight">{ind.name}</span>
                                    {isSelected && <div className="absolute top-2 right-2 h-2 w-2 bg-white rounded-full"></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Row: Income & Relocation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-text-dim uppercase tracking-wider ml-1">Expected Annual Income</label>
                        <div className="bg-surface-1 border border-border rounded-xl px-4 py-3 relative focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-serif italic text-lg opacity-50">₹</span>
                            <select
                                value={data.expected_income || ""}
                                onChange={(e) => updateData({ expected_income: e.target.value })}
                                className="w-full bg-transparent border-none pl-6 text-text-main focus:ring-0 cursor-pointer outline-none appearance-none font-medium"
                            >
                                <option value="" disabled className="bg-surface-1">Select Range</option>
                                <option value="< 2L" className="bg-surface-1">Less than 2 LPA</option>
                                <option value="2L - 5L" className="bg-surface-1">2L - 5L LPA</option>
                                <option value="5L - 10L" className="bg-surface-1">5L - 10L LPA</option>
                                <option value="10L+" className="bg-surface-1">More than 10L LPA</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-text-dim uppercase tracking-wider ml-1">Willingness to Relocate?</label>
                        <div className="flex bg-surface-1 p-1 rounded-xl border border-border">
                            <button
                                onClick={() => updateData({ relocation: true })}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${data.relocation === true
                                        ? "bg-primary text-white shadow-md"
                                        : "text-text-muted hover:text-text-main hover:bg-surface-2"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
                                Yes
                            </button>
                            <button
                                onClick={() => updateData({ relocation: false })}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${data.relocation === false
                                        ? "bg-surface-3 text-text-main shadow-md"
                                        : "text-text-muted hover:text-text-main hover:bg-surface-2"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">home</span>
                                No
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
