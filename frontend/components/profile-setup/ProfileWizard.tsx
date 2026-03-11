"use client";

import { useState, useEffect } from "react";
import { UserProfileData } from "@/lib/types";
import Step1Basic from "./Step1Basic";
import Step2Skills from "./Step2Skills";
import Step3Learning from "./Step3Learning";
import { useRouter } from "next/navigation";
import { saveUserDetails, getUserProfile } from "@/lib/auth";

export default function ProfileWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<UserProfileData>({
        skills: [],
        preferred_industries: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getUserProfile();
                if (profile && profile.is_complete) {
                    setFormData(prev => ({
                        ...prev,
                        education_level: profile.education_level,
                        current_status: profile.current_status,
                        current_role: profile.current_role,
                        current_industry: profile.current_industry,
                        location: profile.location,
                        skills: profile.skills || [],
                        desired_role: profile.desired_role,
                        preferred_industries: profile.preferred_industries || [],
                        language: profile.language,
                        hours_per_week: profile.hours_per_week,
                        learning_pace: profile.learning_pace,
                        budget_sensitivity: profile.budget_sensitivity,
                        timeline: profile.timeline,
                    }));
                }
            } catch (error) {
                console.error("Failed to load existing profile", error);
            }
        }
        loadProfile();
    }, []);

    const updateData = (data: Partial<UserProfileData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await saveUserDetails(formData);
            router.push("/learning-path");
        } catch (error) {
            console.error("Failed to save profile:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const stepLabel = [
        "Career Profile",
        "Competence Matrix",
        "Learning Preferences & Launch"
    ];

    const stepIcon = [
        "person",
        "psychology",
        "rocket_launch"
    ];

    return (
        <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary selection:text-white pb-32">

            {/* Header / Progress */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-lg">hub</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight hidden md:block">Profile Setup</span>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-1 md:gap-4">
                        {[1, 2, 3].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className={`flex flex-col items-center gap-1`}>
                                    <div className={`
                                        h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all duration-300
                                        ${step === s ? "bg-primary text-white shadow-lg shadow-primary/25 scale-110" :
                                            step > s ? "bg-primary/20 text-primary" : "bg-surface-2 text-text-muted"}
                                    `}>
                                        <span className="material-symbols-outlined text-sm md:text-base">
                                            {step > s ? "check" : stepIcon[i]}
                                        </span>
                                    </div>
                                </div>
                                {s < 3 && (
                                    <div className={`h-[2px] w-4 md:w-12 transition-colors duration-300 mx-1 md:mx-2 ${step > s ? "bg-primary" : "bg-surface-2"}`}></div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="w-24 hidden md:block"></div> {/* Spacer for alignment */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Step Content with transitions */}
                <div className="min-h-[400px]">
                    {step === 1 && <Step1Basic data={formData} updateData={updateData} />}
                    {step === 2 && <Step2Skills data={formData} updateData={updateData} />}
                    {step === 3 && <Step3Learning data={formData} updateData={updateData} />}
                </div>
            </main>

            {/* Floating Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
                <div className="max-w-4xl mx-auto flex items-center justify-between pointer-events-auto bg-surface-1/90 backdrop-blur-md border border-border/50 p-4 rounded-2xl shadow-2xl shadow-black/20">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${step === 1
                            ? "opacity-0 cursor-default"
                            : "text-text-muted hover:text-text-main hover:bg-surface-2"
                            }`}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </button>

                    <div className="text-sm font-medium text-text-muted hidden md:block">
                        {step === 3 ? (
                            <span className="text-primary font-bold">Ready to Launch?</span>
                        ) : (
                            <>Step {step} of 3: <span className="text-text-main">{stepLabel[step - 1]}</span></>
                        )}
                    </div>

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                        >
                            Next
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSubmitting ? "Generating..." : "Generate Path"}
                            {!isSubmitting && <span className="material-symbols-outlined">rocket_launch</span>}
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}
