"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const emailFromUrl = searchParams.get("email");
        if (emailFromUrl) {
            setEmail(emailFromUrl);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Validate password strength
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        // Validate OTP format
        if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);

        try {
            await resetPassword(email, otpCode, newPassword);
            setSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/login?reset=true");
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-text-main relative overflow-hidden">
            {/* Subtle Background Glow */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

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
                            password
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-main mb-2">
                        Reset your password
                    </h1>
                    <p className="text-text-muted">
                        Enter the OTP sent to your email and create a new password.
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

                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1.5">
                                    OTP Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-center text-2xl font-bold tracking-[0.5em] font-mono"
                                    placeholder="000000"
                                />
                                <p className="text-xs text-text-dim mt-1.5">Check your email for the 6-digit code</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1.5">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-surface-2 border border-border text-text-main rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>

                            {/* Password Requirements */}
                            <div className="bg-surface-2/50 rounded-xl p-3">
                                <ul className="space-y-1">
                                    <li className={`flex items-center gap-2 text-xs ${otpCode.length === 6 ? 'text-green-500' : 'text-text-muted'}`}>
                                        <span className="material-symbols-outlined text-sm">
                                            {otpCode.length === 6 ? 'check_circle' : 'radio_button_unchecked'}
                                        </span>
                                        6-digit OTP entered
                                    </li>
                                    <li className={`flex items-center gap-2 text-xs ${newPassword.length >= 6 ? 'text-green-500' : 'text-text-muted'}`}>
                                        <span className="material-symbols-outlined text-sm">
                                            {newPassword.length >= 6 ? 'check_circle' : 'radio_button_unchecked'}
                                        </span>
                                        Password at least 6 characters
                                    </li>
                                    <li className={`flex items-center gap-2 text-xs ${newPassword === confirmPassword && confirmPassword.length > 0 ? 'text-green-500' : 'text-text-muted'}`}>
                                        <span className="material-symbols-outlined text-sm">
                                            {newPassword === confirmPassword && confirmPassword.length > 0 ? 'check_circle' : 'radio_button_unchecked'}
                                        </span>
                                        Passwords match
                                    </li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword || otpCode.length !== 6}
                                className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Reset Password</span>
                                        <span className="material-symbols-outlined">lock_reset</span>
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
                                <span className="font-medium">Password reset successful!</span>
                            </div>
                            <p className="text-sm opacity-80">
                                Your password has been updated. Redirecting to login...
                            </p>
                        </div>

                        {/* Loading Indicator */}
                        <div className="flex items-center justify-center gap-3 py-4">
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="text-text-muted text-sm">Redirecting...</span>
                        </div>

                        <Link
                            href="/login"
                            className="w-full h-12 bg-surface-2 hover:bg-border text-text-main font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <span>Go to Login Now</span>
                            <span className="material-symbols-outlined">login</span>
                        </Link>
                    </div>
                )}

                <p className="mt-8 text-center text-sm text-text-muted">
                    Didn&apos;t receive the code?{" "}
                    <Link
                        href="/forgot-password"
                        className="text-primary hover:text-primary-hover font-medium underline-offset-4 hover:underline"
                    >
                        Resend OTP
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
