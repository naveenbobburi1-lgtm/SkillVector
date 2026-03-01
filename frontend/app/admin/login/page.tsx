"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Login failed");
      }
      const data = await res.json();
      localStorage.setItem("admin_token", data.access_token);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-400/5 rounded-full blur-3xl" />

      <div className="w-full max-w-[420px] animate-fadeInUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-400 mb-5 shadow-xl shadow-primary/20">
            <span className="material-symbols-outlined text-white text-3xl">bolt</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Welcome Back</h1>
          <p className="text-text-dim text-sm mt-1.5">Sign in to the SkillVector Command Center</p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-1 border border-border rounded-2xl p-7 shadow-lg shadow-black/[0.03]">
          {error && (
            <div className="bg-red-50 border border-red-200/80 text-red-600 p-3.5 rounded-xl text-sm mb-5 flex items-center gap-2.5 animate-scaleIn">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email Address</label>
              <div className={`relative rounded-xl border transition-all duration-200 ${focused === "email" ? "border-primary ring-4 ring-primary/10" : "border-border"}`}>
                <span className="material-symbols-outlined text-text-dim text-lg absolute left-3.5 top-1/2 -translate-y-1/2">mail</span>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent text-text-main rounded-xl pl-11 pr-4 py-3.5 focus:outline-none text-sm"
                  placeholder="admin@skillvector.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Password</label>
              <div className={`relative rounded-xl border transition-all duration-200 ${focused === "password" ? "border-primary ring-4 ring-primary/10" : "border-border"}`}>
                <span className="material-symbols-outlined text-text-dim text-lg absolute left-3.5 top-1/2 -translate-y-1/2">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent text-text-main rounded-xl pl-11 pr-11 py-3.5 focus:outline-none text-sm"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors">
                  <span className="material-symbols-outlined text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-primary to-violet-500 hover:from-primary-hover hover:to-violet-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">lock_open</span>
                  Access Command Center
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-text-dim mt-5">Secured with JWT authentication & bcrypt encryption</p>
      </div>
    </div>
  );
}
