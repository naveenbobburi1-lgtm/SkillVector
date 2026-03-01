"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/admin", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/users", icon: "group", label: "Users" },
  { href: "/admin/videos", icon: "play_circle", label: "Videos" },
  { href: "/admin/activity", icon: "history", label: "Activity Log" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/admin/login");
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAdmin(data);
      } catch {
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }
    checkAdmin();
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background text-text-main flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-surface-1 border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-text-main">SkillVector</h2>
              <p className="text-[10px] text-text-dim uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-text-muted hover:text-text-main hover:bg-surface-2"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{admin?.username?.charAt(0)?.toUpperCase() || "A"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-text-main">{admin?.username}</p>
              <p className="text-[10px] text-text-dim truncate">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-red-50 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-screen">
        {/* Top bar (mobile) */}
        <div className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-14 flex items-center">
          <button onClick={() => setSidebarOpen(true)} className="text-text-muted hover:text-text-main">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="ml-3 font-semibold text-sm">Admin Panel</span>
        </div>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
