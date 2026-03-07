"use client";

import { UserProfileData } from "@/lib/types";

interface Step5Props {
    data: UserProfileData;
    onSubmit: () => void;
    isSubmitting: boolean;
    consentGiven: boolean;
    setConsentGiven: (val: boolean) => void;
}

export default function Step5Review({ data, onSubmit, isSubmitting, consentGiven, setConsentGiven }: Step5Props) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold text-text-main tracking-tight">Final Vector Check</h1>
                <p className="text-lg text-text-muted max-w-xl mx-auto">Verify your parameters. Once confirmed, our AI will generate your personalized learning graph.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Review Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                            <span className="material-symbols-outlined text-primary">person</span>
                            <h3 className="text-sm font-bold text-text-dim uppercase tracking-wider">Identity</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <div className="text-xs text-text-muted uppercase font-semibold">Age</div>
                                <div className="text-text-main font-medium">{data.age || "-"} Years</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-muted uppercase font-semibold">Education</div>
                                <div className="text-text-main font-medium">{data.education_level || "-"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-muted uppercase font-semibold">Status</div>
                                <div className="text-text-main font-medium">{data.current_status || "-"}</div>
                            </div>
                            {(data.current_status === "Employed" || data.current_status === "Self-Employed") && data.current_role && (
                                <div>
                                    <div className="text-xs text-text-muted uppercase font-semibold">Current Role</div>
                                    <div className="text-text-main font-medium">{data.current_role}</div>
                                </div>
                            )}
                            {(data.current_status === "Employed" || data.current_status === "Self-Employed") && data.current_industry && (
                                <div>
                                    <div className="text-xs text-text-muted uppercase font-semibold">Current Industry</div>
                                    <div className="text-text-main font-medium">{data.current_industry}</div>
                                </div>
                            )}
                            <div>
                                <div className="text-xs text-text-muted uppercase font-semibold">Location</div>
                                <div className="text-text-main font-medium">{data.location || "-"}</div>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                            <span className="material-symbols-outlined text-secondary">psychology</span>
                            <h3 className="text-sm font-bold text-text-dim uppercase tracking-wider">Capabilities</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="text-xs text-text-muted uppercase font-semibold mb-2">Core Skills</div>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills?.map(s => (
                                        <span key={s} className="bg-surface-2 border border-border px-3 py-1 rounded-lg text-sm font-medium text-text-main">{s}</span>
                                    )) || <span className="text-text-muted italic">None</span>}
                                </div>
                            </div>
                            {data.certifications && data.certifications.length > 0 && (
                                <div>
                                    <div className="text-xs text-text-muted uppercase font-semibold mb-2">Certifications</div>
                                    <div className="space-y-2">
                                        {data.certifications.map((c, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-text-main bg-surface-2/50 p-2 rounded-lg">
                                                <span className="material-symbols-outlined text-secondary text-base">verified</span>
                                                <span className="font-bold">{c.title}</span>
                                                <span className="text-text-muted">by {c.issuer}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Goals */}
                    <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                            <span className="material-symbols-outlined text-accent">flag</span>
                            <h3 className="text-sm font-bold text-text-dim uppercase tracking-wider">Trajectory</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div className="col-span-2 md:col-span-1">
                                <div className="text-xs text-text-muted uppercase font-semibold">Target Role</div>
                                <div className="text-lg font-bold text-primary">{data.desired_role || "-"}</div>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <div className="text-xs text-text-muted uppercase font-semibold">Target Industries</div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {data.preferred_industries?.map(ind => (
                                        <span key={ind} className="text-xs font-semibold bg-accent/10 text-accent px-2 py-1 rounded">{ind}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-text-muted uppercase font-semibold">Expected Income</div>
                                <div className="text-text-main font-medium">{data.expected_income || "-"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-muted uppercase font-semibold">Relocation</div>
                                <div className="text-text-main font-medium">{data.relocation ? "Yes" : "No"}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Summary Sidebar */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-primary/10 to-surface-1 border border-primary/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <span className="material-symbols-outlined text-9xl text-primary">auto_awesome</span>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                                    <span className="material-symbols-outlined text-2xl">check</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-text-main leading-tight">Ready to<br />Generate</h3>
                                </div>
                            </div>

                            <p className="text-sm text-text-muted mb-6 leading-relaxed">
                                Our AI has analyzed your inputs. We are ready to construct a learning graph tailored to your goal of becoming a <span className="text-primary font-bold">{data.desired_role || "expert"}</span>.
                            </p>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-sm font-medium text-text-main bg-background/50 p-3 rounded-xl border border-border">
                                    <span className="material-symbols-outlined text-secondary">school</span>
                                    <span>{data.skills?.length || 0} Starting Experience Vectors</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-text-main bg-background/50 p-3 rounded-xl border border-border">
                                    <span className="material-symbols-outlined text-accent">trending_up</span>
                                    <span>Optimized for {data.learning_pace || "Moderate"} Pace</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border/50">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-bold text-text-dim uppercase">Profile Completion</span>
                                    <span className="text-xl font-bold text-success">100%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-success w-full rounded-full shadow-[0_0_10px_rgba(var(--success-rgb),0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`bg-surface-1 border rounded-2xl p-6 transition-all duration-300 ${consentGiven ? "border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]" : "border-border"}`}>
                        <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="mt-0.5 relative">
                                <input
                                    type="checkbox"
                                    checked={consentGiven}
                                    onChange={(e) => setConsentGiven(e.target.checked)}
                                    className="peer accent-primary h-5 w-5 rounded cursor-pointer transition-all"
                                />
                                <div className="absolute inset-0 bg-primary/20 rounded-full scale-0 group-hover:scale-150 transition-transform -z-10"></div>
                            </div>
                            <div className="space-y-1 select-none">
                                <p className={`text-sm font-bold transition-colors ${consentGiven ? "text-primary" : "text-text-main"}`}>Data Consent</p>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    By proceeding, you agree to generate a personalized learning path based on the shared data.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
}
