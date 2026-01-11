"use client";

import { UserProfileData } from "@/lib/types";

interface Step1Props {
    data: UserProfileData;
    updateData: (data: Partial<UserProfileData>) => void;
}

export default function Step1Basic({ data, updateData }: Step1Props) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold text-text-main tracking-tight">Identity Calibration</h1>
                <p className="text-lg text-text-muted max-w-xl mx-auto">Initialize your digital twin. The more precise the inputs, the sharper the learning vector.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Form Fields */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-text-dim uppercase tracking-wider ml-1">Age</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">calendar_today</span>
                            <input
                                type="number"
                                value={data.age || ""}
                                onChange={(e) => updateData({ age: parseInt(e.target.value) || undefined })}
                                className="w-full bg-surface-1 border border-border rounded-xl pl-12 pr-4 py-4 text-text-main focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-text-muted/30 shadow-sm"
                                placeholder="Years"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-text-dim uppercase tracking-wider ml-1">Current Location</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">location_on</span>
                            <input
                                type="text"
                                value={data.location || ""}
                                onChange={(e) => updateData({ location: e.target.value })}
                                className="w-full bg-surface-1 border border-border rounded-xl pl-12 pr-4 py-4 text-text-main focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-text-muted/30 shadow-sm"
                                placeholder="City, Country"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-text-dim uppercase tracking-wider ml-1">Phone (Optional)</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">call</span>
                            <input
                                type="tel"
                                value={data.phone || ""}
                                onChange={(e) => updateData({ phone: e.target.value })}
                                className="w-full bg-surface-1 border border-border rounded-xl pl-12 pr-4 py-4 text-text-main focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-text-muted/30 shadow-sm"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Status Selection */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-text-dim uppercase tracking-wider ml-1">Current Status</label>
                        <div className="grid grid-cols-2 gap-3">
                            {["Student", "Employed", "Unemployed", "Self-Employed"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => updateData({ current_status: status })}
                                    className={`relative p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 group overflow-hidden ${data.current_status === status
                                            ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary transform scale-[1.02]"
                                            : "bg-surface-1 border-border hover:bg-surface-2 hover:border-primary/50"
                                        }`}
                                >
                                    {data.current_status === status && (
                                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                    )}
                                    <span className={`material-symbols-outlined text-3xl transition-colors ${data.current_status === status ? "text-primary " : "text-text-muted group-hover:text-text-main"}`}>
                                        {status === "Student" && "school"}
                                        {status === "Employed" && "work"}
                                        {status === "Unemployed" && "person_off"}
                                        {status === "Self-Employed" && "storefront"}
                                    </span>
                                    <span className={`text-sm font-semibold ${data.current_status === status ? "text-primary" : "text-text-muted group-hover:text-text-main"}`}>
                                        {status}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Education */}
            <div className="space-y-3 pt-4">
                <label className="text-sm font-semibold text-text-dim uppercase tracking-wider ml-1">Highest Education Level</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {["High School", "Diploma", "Undergraduate", "Postgraduate", "PhD"].map((edu) => (
                        <button
                            key={edu}
                            onClick={() => updateData({ education_level: edu })}
                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${data.education_level === edu
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-surface-1 text-text-muted border-border hover:border-primary/50 hover:text-text-main hover:bg-surface-2"
                                }`}
                        >
                            {edu}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
