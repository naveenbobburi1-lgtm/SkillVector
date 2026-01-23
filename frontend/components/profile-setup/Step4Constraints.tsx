"use client";

import { UserProfileData } from "@/lib/types";

interface StepProps {
    data: UserProfileData;
    updateData: (data: Partial<UserProfileData>) => void;
}

export default function Step4Constraints({ data, updateData }: StepProps) {
    const learningFormats = [
        { name: "Video / Online", icon: "play_circle" },
        { name: "Hands-on", icon: "precision_manufacturing" },
        { name: "On-the-job", icon: "work_history" },
        { name: "Text / Reading", icon: "menu_book" }
    ];

    const toggleFormat = (format: string) => {
        const current = data.learning_format || [];
        if (current.includes(format)) {
            updateData({ learning_format: current.filter((f) => f !== format) });
        } else {
            updateData({ learning_format: [...current, format] });
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold text-text-main tracking-tight">System Constraints</h1>
                <p className="text-lg text-text-muted max-w-xl mx-auto">Calibrate the learning engine to fit your lifestyle parameters.</p>
            </div>

            <div className="space-y-8">

                {/* Target Timeline */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-text-dim uppercase tracking-wider ml-1">Target Timeline</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["1 Month", "3 Months", "6 Months", "1 Year+"].map((time) => (
                            <button
                                key={time}
                                onClick={() => updateData({ timeline: time })}
                                className={`p-4 rounded-xl border text-center font-bold transition-all ${data.timeline === time
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                    : "bg-surface-1 border-border text-text-muted hover:text-text-main hover:bg-surface-2"
                                    }`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Learning Pace */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-text-dim uppercase tracking-wider ml-1">Learning Velocity</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { val: "Slow", label: "Self-Paced", desc: "Relaxed learning, no pressure.", icon: "coffee" },
                            { val: "Moderate", label: "Balanced", desc: "Steady progress, consistent effort.", icon: "speed" },
                            { val: "Fast", label: "Accelerated", desc: "Intensive bootcamp style.", icon: "rocket_launch" }
                        ].map((item) => (
                            <button
                                key={item.val}
                                onClick={() => updateData({ learning_pace: item.val })}
                                className={`p-6 rounded-2xl border text-left transition-all group ${data.learning_pace === item.val
                                    ? "bg-primary/10 border-primary ring-1 ring-primary"
                                    : "bg-surface-1 border-border hover:border-primary/50 hover:bg-surface-2"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg ${data.learning_pace === item.val ? "bg-primary text-white" : "bg-surface-2 text-text-muted"}`}>
                                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                    </div>
                                    {data.learning_pace === item.val && <span className="material-symbols-outlined text-primary">check_circle</span>}
                                </div>

                                <div className={`font-bold text-lg mb-1 ${data.learning_pace === item.val ? "text-primary" : "text-text-main"}`}>{item.label}</div>
                                <div className="text-sm text-text-muted group-hover:text-text-main transition-colors">{item.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Hours per Week */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-bold text-text-dim uppercase tracking-wider ml-1">Time Availability</label>
                            <span className="text-2xl font-bold text-primary tabular-nums">{data.hours_per_week || "10 - 20"} <span className="text-sm text-text-muted font-normal">hrs/week</span></span>
                        </div>
                        <div className="bg-surface-1 p-8 rounded-2xl border border-border shadow-inner">
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="1"
                                className="w-full accent-primary h-3 bg-surface-3 rounded-lg appearance-none cursor-pointer focus:outline-primary/50"
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    let hours = "10 - 20";
                                    if (val === 1) hours = "< 5";
                                    if (val === 2) hours = "10 - 20";
                                    if (val === 3) hours = "40+";
                                    updateData({ hours_per_week: hours });
                                }}
                            />
                            <div className="flex justify-between text-xs text-text-muted mt-4 font-bold uppercase tracking-wide">
                                <span>Casual (&lt;5h)</span>
                                <span>Part-Time</span>
                                <span>Full-Time (40h+)</span>
                            </div>
                        </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-text-dim uppercase tracking-wider ml-1">Instruction Language</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">translate</span>
                            <select
                                value={data.language || ""}
                                onChange={(e) => updateData({ language: e.target.value })}
                                className="w-full bg-surface-1 border border-border rounded-xl pl-12 pr-4 py-4 text-text-main focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer appearance-none shadow-sm"
                            >
                                <option value="" disabled>Select Preferred Language</option>
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Kannada">Kannada</option>
                                <option value="Telugu">Telugu</option>
                                <option value="Tamil">Tamil</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted pointer-events-none">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Learning Format */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-text-dim uppercase tracking-wider ml-1">Content Format (Multiple)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {learningFormats.map((fmt) => (
                            <button
                                key={fmt.name}
                                onClick={() => toggleFormat(fmt.name)}
                                className={`p-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-3 ${data.learning_format?.includes(fmt.name)
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 transform -translate-y-1"
                                    : "bg-surface-1 border-border text-text-muted hover:text-text-main hover:bg-surface-2"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-3xl">{fmt.icon}</span>
                                <span>{fmt.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
