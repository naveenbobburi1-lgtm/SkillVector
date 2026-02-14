"use client";

import { useState } from "react";

interface AddSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (skill: string) => void;
}

export default function AddSkillModal({ isOpen, onClose, onSubmit }: AddSkillModalProps) {
    const [skillName, setSkillName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!skillName.trim()) return;

        setIsSubmitting(true);
        await onSubmit(skillName.trim());
        setSkillName("");
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-surface-1 border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main">Add New Vector</h2>
                            <p className="text-xs text-text-muted">Expand your skill matrix</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg hover:bg-surface-2 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-text-muted">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-dim uppercase tracking-wider mb-2">
                            Skill Name
                        </label>
                        <input
                            type="text"
                            value={skillName}
                            onChange={(e) => setSkillName(e.target.value)}
                            placeholder="e.g., React, Python, Machine Learning"
                            className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            autoFocus
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="bg-surface-2/50 border border-border/50 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Adding a skill will update your profile and may trigger path recalculation to better match your growing expertise.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-text-main rounded-xl font-medium transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!skillName.trim() || isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Add Skill
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
