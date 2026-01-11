"use client";

import { UserProfileData } from "@/lib/types";

interface StepProps {
    data: UserProfileData;
    updateData: (data: Partial<UserProfileData>) => void;
}

export default function Step3Goals({ data, updateData }: StepProps) {
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
                <div className="bg-gradient-to-br from-surface-1 to-surface-2 border border-border p-8 rounded-3xl shadow-xl relative overflow-hidden group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-focus-within:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-[100px] text-primary">target</span>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <label className="text-sm font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                            Desired Job Role <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-4xl text-text-muted group-focus-within:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                value={data.desired_role || ""}
                                onChange={(e) => updateData({ desired_role: e.target.value })}
                                className="w-full bg-transparent border-b-2 border-border py-4 pl-12 text-3xl font-bold text-text-main focus:border-primary outline-none transition-all placeholder:text-text-muted/20"
                                placeholder="e.g. Data Scientist"
                            />
                        </div>
                        <p className="text-sm text-text-muted pl-12">Target specific roles for higher precision matches.</p>
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
