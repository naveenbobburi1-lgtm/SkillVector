"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";
import { setToken, API_BASE_URL, loginUser } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Email/Password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(email, password);
      setToken(data.access_token);
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth login
  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    setGoogleLoading(true);
    setError("");
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      if (!userInfoRes.ok) throw new Error("Failed to get Google user info");
      const userInfo = await userInfoRes.json();

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: tokenResponse.access_token, userinfo: userInfo }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Sign-in failed");
      }
      const data = await res.json();
      setToken(data.access_token);
      router.push(data.is_new_user ? "/profile/setup" : "/profile");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google sign-in was cancelled or failed"),
  });

  const isLoading = loading || googleLoading;

  return (
    <div className="min-h-screen w-full flex bg-background selection:bg-primary/20">
      {/* Left Side - Login Form */}
<div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 pt-16 lg:pt-24 bg-surface-1 relative z-10 shadow-xl lg:shadow-none">        <motion.div 
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
            <h1 className="text-4xl font-extrabold text-text-main mb-3 tracking-tight">Welcome back</h1>
            <p className="text-text-muted text-lg">Sign in to your career command center</p>
          </div>

          {/* Error Message */}
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
          </AnimatePresence>

          {/* Email/Password Form - Now on TOP */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-sm font-bold text-text-muted ml-1">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="w-full px-4 py-3.5 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="login-password" className="block text-sm font-bold text-text-muted">
                  Password
                </label>
                <Link href="#" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
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
              disabled={isLoading}
              className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign in</span>
                  <span className="material-symbols-outlined text-lg">login</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-dim font-bold uppercase tracking-widest">or secure sign in</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Sign In - Now on BOTTOM */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => googleLogin()}
            disabled={isLoading}
            className="w-full bg-surface-1 border border-border hover:border-border-highlight text-text-main font-bold rounded-xl flex items-center justify-center gap-3 transition-all py-3.5 px-4 mb-8 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </motion.button>

          {/* Sign up link */}
          <div className="text-center pt-2">
            <p className="text-sm text-text-muted font-medium">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary font-bold hover:underline underline-offset-4">
                Join SkillVector
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

      {/* Right Side - Visual / Testimonial */}
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

        {/* Testimonial Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 max-w-lg"
        >
          <div className="h-1 w-20 bg-primary mb-10 rounded-full" />
          <div className="relative">
            <span className="absolute -top-10 -left-6 text-primary/10 text-[120px] font-serif select-none leading-none">“</span>
            <blockquote className="text-3xl xl:text-4xl font-extrabold text-text-main leading-tight mb-8 relative z-10">
              Y&apos;all <span className="text-primary">@skillvector</span> + AI learning is amazing! Barely an hour in and I have a complete career roadmap.
            </blockquote>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                JD
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success border-2 border-background rounded-full" />
            </div>
            <div>
              <p className="font-bold text-text-main text-lg tracking-tight">Justin Juno</p>
              <p className="text-sm text-text-muted font-medium">Senior Product Developer</p>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-bold text-text-dim uppercase tracking-widest animate-pulse">Initializing Interface...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
