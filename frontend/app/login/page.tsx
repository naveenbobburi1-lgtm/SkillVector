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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-text-main relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-surface-1 border border-border rounded-3xl overflow-hidden shadow-2xl relative z-10">

        {/* Left Side: Brand/Visual */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-surface-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />

          <div className="relative z-10">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-2xl">hub</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-text-main mb-2">Skillvector</h2>
            <p className="text-text-muted">AI-driven career orchestration for the modern professional.</p>
          </div>

          <div className="relative z-10 space-y-5">
            {[
              { icon: "psychology", color: "text-primary", title: "Intelligent Mapping", desc: "Our AI analyses your skills against millions of market data points." },
              { icon: "trending_up", color: "text-success", title: "Accelerated Growth", desc: "Navigate the fastest path to your goal with real-time adjustments." },
              { icon: "verified_user", color: "text-violet-500", title: "Secure & Private", desc: "Your data is encrypted and never shared with third parties." },
            ].map((f) => (
              <div key={f.title} className="p-4 rounded-xl bg-surface-1 border border-border/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className={`material-symbols-outlined ${f.color} text-xl`}>{f.icon}</span>
                  <span className="font-semibold text-text-main">{f.title}</span>
                </div>
                <p className="text-sm text-text-muted">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 text-xs text-text-dim">© 2025 Skillvector Inc.</div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-14 flex flex-col justify-center bg-surface-1">
          <div className="w-full max-w-sm mx-auto">

            {/* Mobile logo */}
            <div className="flex md:hidden items-center gap-2 mb-10">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-primary/20 shadow-lg">
                <span className="material-symbols-outlined text-white text-lg">hub</span>
              </div>
              <span className="font-bold text-lg">Skillvector</span>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-text-main mb-2">Welcome back</h1>
              <p className="text-text-muted text-sm">Sign in to access your personalized learning ecosystem.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-sm mb-6 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-12 bg-surface-2 border border-border rounded-xl text-text-main placeholder:text-text-dim/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all disabled:opacity-50"
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
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">login</span>
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-dim font-medium tracking-wide">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google Sign-In Button */}
            <button
              onClick={() => googleLogin()}
              disabled={isLoading}
              className="w-full bg-surface-2 hover:bg-surface-3 border border-border hover:border-border-highlight text-text-main font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed py-3.5 px-5 mb-8"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-text-dim/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Sign up link */}
            <p className="text-center text-sm text-text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                Sign up
              </Link>
            </p>

            <p className="text-center text-xs text-text-dim leading-relaxed mt-6">
              By continuing, you agree to Skillvector&apos;s{" "}
              <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
              {" "}and{" "}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
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
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
