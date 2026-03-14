"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";
import { setToken, API_BASE_URL, registerUser, loginUser } from "@/lib/auth";

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
    <div className="min-h-screen w-full flex bg-[#F5F5F0]">
      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-[#FAFAF5]">
        <div className="max-w-sm w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="h-8 w-8 bg-[#7c3aed] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">hub</span>
            </div>
            <span className="font-bold text-xl text-[#0f172a]">Skillvector</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0f172a] mb-2">Create account</h1>
            <p className="text-[#64748b]">Join thousands of professionals mastering their skills</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Google Sign Up */}
          <button
            onClick={() => googleLogin()}
            disabled={isLoading}
            className="w-full bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] text-[#0f172a] font-medium rounded-lg flex items-center justify-center gap-3 transition-all py-3 px-4 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-[#e2e8f0] border-t-[#7c3aed] rounded-full animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#e2e8f0]" />
            <span className="text-xs text-[#94a3b8] font-medium">or</span>
            <div className="flex-1 h-px bg-[#e2e8f0]" />
          </div>

          {/* Registration Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label htmlFor="signup-username" className="block text-sm font-medium text-[#64748b] mb-1.5">
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
                className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-[#64748b] mb-1.5">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-[#64748b] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 bg-white border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="signup-confirm" className="block text-sm font-medium text-[#64748b] mb-1.5">
                Confirm Password
              </label>
              <input
                id="signup-confirm"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={8}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all disabled:opacity-50"
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">error</span>
                  Passwords do not match
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-[#64748b] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#7c3aed] font-medium hover:underline">
              Sign in
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-xs text-[#94a3b8] mt-8 leading-relaxed">
            By continuing, you agree to Skillvector&apos;s{" "}
            <span className="text-[#7c3aed] cursor-pointer hover:underline">Terms of Service</span>
            {" "}and{" "}
            <span className="text-[#7c3aed] cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* Right Side - Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F5F5F0] flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Documentation link */}
        <div className="relative z-10 flex justify-end">
          <Link href="/documentation" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">
            <span className="material-symbols-outlined text-sm">description</span>
            Documentation
          </Link>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 max-w-lg">
          <div className="text-[#7c3aed]/20 text-7xl font-serif leading-none mb-2">"</div>
          <blockquote className="text-2xl xl:text-3xl font-medium text-[#0f172a] leading-relaxed -mt-4">
            Skillvector helped me identify my skill gaps and land my dream job in just 3 months. The AI-powered learning paths are game-changing!
          </blockquote>
          <div className="flex items-center gap-3 mt-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-violet-400 flex items-center justify-center text-white font-semibold text-sm">
              SK
            </div>
            <div>
              <p className="font-medium text-[#0f172a]">Sarah Kim</p>
              <p className="text-sm text-[#64748b]">Software Engineer at Google</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="relative z-10 text-sm text-[#94a3b8]">
          © 2025 Skillvector Inc.
        </div>
      </div>
    </div>
  );
}
