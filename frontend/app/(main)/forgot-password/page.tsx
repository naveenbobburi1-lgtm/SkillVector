"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { requestPasswordReset, verifyOtp, resetPassword, getToken } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = getToken();
    if (token) {
      router.push("/profile");
    }
  }, [router]);

  // Check if email was passed in URL
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      setStep(2);
    }
  }, [searchParams]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      setSuccess("");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await requestPasswordReset(email);
      setError("");
      setSuccess("OTP sent to your email! Please check your inbox.");
      setStep(2);
    } catch (err: any) {
      setSuccess("");
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the OTP");
      setSuccess("");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await verifyOtp(email, otp);
      setError("");
      setSuccess("OTP verified! Now set your new password.");
      setStep(3);
    } catch (err: any) {
      setSuccess("");
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      setSuccess("");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setSuccess("");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setSuccess("");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await resetPassword(email, otp, newPassword);
      setError("");
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setSuccess("");
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await requestPasswordReset(email);
      setError("");
      setSuccess("New OTP sent! Please check your inbox.");
    } catch (err: any) {
      setSuccess("");
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background selection:bg-primary/20">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 pt-16 lg:pt-24 bg-surface-1 relative z-10 shadow-xl lg:shadow-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-sm w-full mx-auto"
        >
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-12 group">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-xl">hub</span>
            </div>
            <span className="font-bold text-2xl text-text-main tracking-tight">SkillVector</span>
          </Link>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-text-main mb-3 tracking-tight">
              {step === 1 && "Reset Password"}
              {step === 2 && "Enter OTP"}
              {step === 3 && "New Password"}
            </h1>
            <p className="text-text-muted text-lg">
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && "We've sent a 6-digit code to your email"}
              {step === 3 && "Enter your new password"}
            </p>
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-error/5 border border-error/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span className="font-medium">{error}</span>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-success/5 border border-success/20 text-success px-4 py-3 rounded-xl text-sm flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span className="font-medium">{success}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-bold text-text-muted ml-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send OTP</span>
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="otp" className="block text-sm font-bold text-text-muted ml-1">
                  Enter 6-Digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 text-center text-2xl tracking-[12px] font-mono"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify OTP</span>
                    <span className="material-symbols-outlined text-lg">verified</span>
                  </>
                )}
              </motion.button>

              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-bold text-text-muted hover:text-primary transition-colors"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={loading}
                  className="text-sm font-bold text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="block text-sm font-bold text-text-muted ml-1">
                  New Password
                </label>
                <div className="relative group">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3.5 pr-12 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors p-1"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="block text-sm font-bold text-text-muted ml-1">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3.5 pr-12 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors p-1"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <span className="material-symbols-outlined text-lg">lock_reset</span>
                  </>
                )}
              </motion.button>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm font-bold text-text-muted hover:text-primary transition-colors"
                >
                  ← Back to OTP
                </button>
              </div>
            </form>
          )}

          {/* Back to login link */}
          <div className="text-center pt-8 mt-4 border-t border-border">
            <p className="text-sm text-text-muted font-medium">
              Remember your password?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest leading-relaxed">
              Secure authentication powered by SkillVector Cloud
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-background flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Animated Shapes / Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-64 -mt-32" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-info/5 rounded-full blur-[80px] -ml-32 -mb-16" />

        {/* Top nav */}
        <div className="relative z-10 flex justify-end">
          <Link href="/documentation" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-1 border border-border rounded-xl text-sm font-bold text-text-muted hover:text-text-main transition-all shadow-sm hover:shadow-md">
            <span className="material-symbols-outlined text-lg">description</span>
            Documentation
          </Link>
        </div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 max-w-lg"
        >
          <div className="h-1 w-20 bg-primary mb-10 rounded-full" />
          <div className="relative">
            <span className="absolute -top-10 -left-6 text-primary/10 text-[120px] font-serif select-none leading-none">"</span>
            <blockquote className="text-3xl xl:text-4xl font-extrabold text-text-main leading-tight mb-8 relative z-10">
              Your career journey starts with a single step. Let's make it count.
            </blockquote>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                SV
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success border-2 border-background rounded-full" />
            </div>
            <div>
              <p className="font-bold text-text-main text-lg tracking-tight">SkillVector Team</p>
              <p className="text-sm text-text-muted font-medium">Building Careers of Tomorrow</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom stats / Info */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="text-sm text-text-dim font-bold uppercase tracking-widest">
            © 2026 SKILLVECTOR INC.
          </div>
          <div className="flex gap-6">
             <div className="flex flex-col">
                <span className="text-text-main font-bold text-lg">12K+</span>
                <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Active Paths</span>
             </div>
             <div className="flex flex-col">
                <span className="text-text-main font-bold text-lg">94%</span>
                <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Success Rate</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-bold text-text-dim uppercase tracking-widest animate-pulse">Initializing Interface...</p>
        </div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
