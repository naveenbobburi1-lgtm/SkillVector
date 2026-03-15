"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";
import { setToken, API_BASE_URL, registerUser, loginUser } from "@/lib/auth";
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

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Client-side validation
  const validate = (): string | null => {
    if (!username.trim()) return "Username is required";
    if (username.trim().length < 3) return "Username must be at least 3 characters";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  // Email/Password signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Register the user
      await registerUser(username.trim(), email.trim(), password);
      // Auto-login after successful registration
      const loginData = await loginUser(email.trim(), password);
      setToken(loginData.access_token);
      router.push("/profile/setup");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth signup
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
        throw new Error(err.detail || "Sign-up failed");
      }
      const data = await res.json();
      setToken(data.access_token);
      router.push("/profile/setup");
    } catch (err: any) {
      setError(err.message || "Google sign-up failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google sign-up was cancelled or failed"),
  });

  const isLoading = loading || googleLoading;

  return (
    <div className="min-h-screen w-full flex bg-background selection:bg-primary/20">
      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-surface-1 relative z-10 shadow-xl lg:shadow-none py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-sm w-full mx-auto"
        >
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-xl">hub</span>
            </div>
            <span className="font-bold text-2xl text-text-main tracking-tight">SkillVector</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-text-main mb-3 tracking-tight">Create account</h1>
            <p className="text-text-muted text-lg">Join 12,000+ professionals mapping their future</p>
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

          {/* Registration Form - Now on TOP */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="signup-username" className="block text-sm font-bold text-text-muted ml-1">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="block text-sm font-bold text-text-muted ml-1">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="block text-sm font-bold text-text-muted ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 char"
                    required
                    minLength={8}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-confirm" className="block text-sm font-bold text-text-muted ml-1">
                  Confirm
                </label>
                <input
                  id="signup-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>
            
            <AnimatePresence>
              {password && confirmPassword && password !== confirmPassword && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-error font-bold flex items-center gap-1.5 ml-1"
                >
                  <span className="material-symbols-outlined text-sm">error</span>
                  Passwords do not match
                </motion.p>
              )}
            </AnimatePresence>

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
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-dim font-bold uppercase tracking-widest">or fast enroll</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Sign Up - Now on BOTTOM */}
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
                <span>Sign up with Google</span>
              </>
            )}
          </motion.button>

          {/* Sign in link */}
          <div className="text-center">
            <p className="text-sm text-text-muted font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center leading-relaxed">
            <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">
              By joining, you agree to our{" "}
              <span className="text-primary cursor-pointer hover:underline">Terms</span>
              {" "}and{" "}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Visual / Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 bg-background flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Animated Shapes / Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-80 -mt-40" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-info/5 rounded-full blur-[100px] -ml-40 -mb-20" />

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
              SkillVector helped me identify my skill gaps and land my dream job in just 3 months. The AI-powered learning paths are <span className="text-primary">game-changing</span>.
            </blockquote>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                SK
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success border-2 border-background rounded-full" />
            </div>
            <div>
              <p className="font-bold text-text-main text-lg tracking-tight">Sarah Kim</p>
              <p className="text-sm text-text-muted font-medium">Software Engineer at Google</p>
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
                <span className="text-text-main font-bold text-lg">94%</span>
                <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Success Rate</span>
             </div>
             <div className="flex flex-col">
                <span className="text-text-main font-bold text-lg">3 MO</span>
                <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Avg Goal Time</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
