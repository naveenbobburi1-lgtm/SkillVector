"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            await requestPasswordReset(email);
            setSuccess(true);
            // Navigate to reset password page with email
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-text-main relative overflow-hidden">
            {/* Subtle Background Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md bg-surface-1 border border-border rounded-3xl overflow-hidden shadow-2xl relative z-10 p-8 md:p-12">
                {/* Back to Login */}
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-text-muted hover:text-text-main transition-colors mb-8"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    <span className="text-sm">Back to login</span>
                </Link>

                <div className="mb-8">
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-primary text-2xl">
                            lock_reset
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-main mb-2">
                        Forgot password?
                    </h1>
                    <p className="text-text-muted">
                        Enter your email and we&apos;ll send you a verification code.
                    </p>
                </div>

                {!success ? (
                    <div className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Send OTP Code</span>
                                        <span className="material-symbols-outlined">mail</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Success State */}
                        <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined">check_circle</span>
                                <span className="font-medium">OTP Sent!</span>
                            </div>
                            <p className="text-sm opacity-80">
                                We&apos;ve sent a 6-digit code to <strong>{email}</strong>. Check your inbox.
                            </p>
                        </div>

                        {/* Redirecting indicator */}
                        <div className="flex items-center justify-center gap-3 py-4">
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="text-text-muted text-sm">Redirecting to enter OTP...</span>
                        </div>
                    </div>
                )}

                <p className="mt-8 text-center text-sm text-text-muted">
                    Remember your password?{" "}
                    <Link
                        href="/login"
                        className="text-primary hover:text-primary-hover font-medium underline-offset-4 hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
