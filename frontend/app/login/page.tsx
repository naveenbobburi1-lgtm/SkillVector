"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";
import { setToken, API_BASE_URL, loginUser } from "@/lib/auth";

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
    <div className="min-h-screen w-full flex bg-[#F5F5F0]">
      {/* Left Side - Login Form */}
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
            <h1 className="text-3xl font-bold text-[#0f172a] mb-2">Welcome back</h1>
            <p className="text-[#64748b]">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Google Sign In */}
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

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#64748b] mb-1.5">
                Email
              </label>
              <input
                id="login-email"
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-[#64748b]">
                  Password
                </label>
                <Link href="#" className="text-sm text-[#7c3aed] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-[#64748b] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#7c3aed] font-medium hover:underline">
              Sign up
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
            Y&apos;all <span className="text-[#7c3aed]">@skillvector</span> + AI learning is amazing! Barely an hour into a proof-of-concept and already have most of the functionality in place.
          </blockquote>
          <div className="flex items-center gap-3 mt-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-violet-400 flex items-center justify-center text-white font-semibold text-sm">
              JD
            </div>
            <div>
              <p className="font-medium text-[#0f172a]">@justinjunodev</p>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
