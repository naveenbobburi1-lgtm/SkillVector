"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/admin", icon: "dashboard", label: "Dashboard", desc: "Overview & analytics" },
  { href: "/admin/users", icon: "group", label: "Users", desc: "Manage accounts" },
  { href: "/admin/videos", icon: "play_circle", label: "Videos", desc: "Content library" },
  { href: "/admin/activity", icon: "history", label: "Activity", desc: "Audit trail" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function checkAdmin() {
      const token = localStorage.getItem("admin_token");
      if (!token) { router.push("/admin/login"); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        setAdmin(await res.json());
      } catch {
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
      } finally { setLoading(false); }
    }
    if (pathname === "/admin/login") { setLoading(false); return; }
    checkAdmin();
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined text-white text-2xl">bolt</span>
            </div>
            <div className="absolute inset-0 w-14 h-14 rounded-2xl border-2 border-primary/30 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-text-main font-semibold text-sm">SkillVector Admin</p>
            <p className="text-text-dim text-xs mt-1">Loading command center...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const greeting = time.getHours() < 12 ? "Good morning" : time.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background text-text-main flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[272px] bg-surface-1 border-r border-border flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-xl">bolt</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-text-main tracking-tight">SkillVector</h2>
              <p className="text-[10px] text-text-dim uppercase tracking-[0.15em] font-medium">Command Center</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto admin-scroll">
          <p className="text-[9px] text-text-dim uppercase tracking-[0.2em] font-semibold px-3 pt-3 pb-2">Navigation</p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5"
                    : "text-text-muted hover:text-text-main hover:bg-surface-2"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isActive ? "bg-primary/15" : "bg-surface-2 group-hover:bg-surface-3"
                }`}>
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[13px]">{item.label}</span>
                  <span className={`block text-[10px] ${isActive ? "text-primary/60" : "text-text-dim"}`}>{item.desc}</span>
                </div>
                {isActive && <div className="w-1.5 h-6 bg-primary rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile */}
        <div className="p-3 border-t border-border">
          <div className="bg-surface-2/50 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-400 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">{admin?.username?.charAt(0)?.toUpperCase() || "A"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-text-main">{admin?.username}</p>
                <p className="text-[10px] text-text-dim truncate">{admin?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-2.5 flex items-center justify-center gap-2 px-3 py-2 text-xs text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-100"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-4 lg:px-8 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-surface-2 transition-colors">
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="hidden sm:block">
                <p className="text-xs text-text-dim">{greeting}, <span className="text-text-muted font-medium">{admin?.username}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-text-dim font-medium">{time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/15">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 font-medium">Online</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
