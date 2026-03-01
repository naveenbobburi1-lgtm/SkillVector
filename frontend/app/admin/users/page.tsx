"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/auth";

type FilterStatus = "all" | "active" | "inactive" | "admin";

const filterConfig: Record<FilterStatus, { icon: string; color: string }> = {
  all: { icon: "people", color: "" },
  active: { icon: "check_circle", color: "text-emerald-600" },
  inactive: { icon: "block", color: "text-red-500" },
  admin: { icon: "shield_person", color: "text-primary" },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const fetchUsers = useCallback(async (pg = 1, q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg.toString(), per_page: "12" });
      if (q) params.set("search", q);
      const res = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  async function toggleActive(userId: number) {
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-active`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchUsers(page, search);
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  }

  async function toggleAdmin(userId: number) {
    if (!confirm("Change this user's admin status?")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-admin`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchUsers(page, search);
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  }

  useEffect(() => { fetchUsers(page, search); }, [page, search, fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const filtered = users.filter((u) => {
    if (filterStatus === "active") return u.is_active && !u.is_admin;
    if (filterStatus === "inactive") return !u.is_active;
    if (filterStatus === "admin") return u.is_admin;
    return true;
  });

  const filterCounts = {
    all: users.length,
    active: users.filter(u => u.is_active && !u.is_admin).length,
    inactive: users.filter(u => !u.is_active).length,
    admin: users.filter(u => u.is_admin).length,
  };

  const avatarColors = ["from-primary to-violet-400", "from-blue-500 to-cyan-400", "from-emerald-500 to-teal-400", "from-amber-500 to-orange-400", "from-rose-500 to-pink-400"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeInUp">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">User Management</h1>
          <p className="text-text-muted text-sm mt-1">{total} registered users across the platform</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users..."
              className="bg-surface-1 border border-border text-text-main rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 w-64 transition-all"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-primary to-violet-500 hover:from-primary-hover hover:to-violet-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-primary/15 hover:shadow-md hover:shadow-primary/20">
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-surface-1 rounded-2xl border border-border shadow-sm w-fit animate-fadeInUp stagger-1">
        {(["all", "active", "inactive", "admin"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-200 capitalize ${
              filterStatus === f
                ? "bg-primary/10 text-primary font-semibold shadow-sm"
                : "text-text-muted hover:text-text-main hover:bg-surface-2"
            }`}
          >
            <span className={`material-symbols-outlined text-base ${filterStatus === f ? filterConfig[f].color || "text-primary" : ""}`}>
              {filterConfig[f].icon}
            </span>
            {f}
            <span className={`text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold ${
              filterStatus === f ? "bg-primary text-white" : "bg-surface-3 text-text-dim"
            }`}>{filterCounts[f]}</span>
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-sm animate-fadeInUp stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2/30">
                {["User", "Role / Goal", "Path Progress", "Tests", "Videos", "Status", "Actions"].map((h, i) => (
                  <th key={h} className={`${i === 6 ? "text-right" : "text-left"} px-5 py-3.5 text-[10px] text-text-dim uppercase tracking-[0.12em] font-semibold`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-text-dim">Loading users...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-20 text-center">
                  <span className="material-symbols-outlined text-3xl text-text-dim mb-2 block">person_search</span>
                  <p className="text-text-dim text-sm">No users found</p>
                </td></tr>
              ) : (
                filtered.map((u, idx) => (
                  <tr key={u.id} className={`border-b border-border/40 hover:bg-primary/[0.02] transition-colors animate-fadeInUp`} style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColors[u.id % avatarColors.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-xs font-bold text-white">{u.username?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <button onClick={() => router.push(`/admin/users/${u.id}`)} className="text-sm font-semibold text-text-main hover:text-primary transition-colors flex items-center gap-1 group">
                            {u.username}
                            <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                          </button>
                          <p className="text-[11px] text-text-dim">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-text-muted">{u.profile?.desired_role || <span className="text-text-dim italic text-xs">Not set</span>}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-24 h-2 bg-surface-3 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 animate-bar-grow" style={{ width: `${u.progress.completion_rate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-text-muted min-w-[40px]">{u.progress.completed_phases}/{u.progress.total_phases}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-text-muted">{u.progress.tests_passed}/{u.progress.total_tests}</span>
                        {u.progress.avg_test_score > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            u.progress.avg_test_score >= 80 ? "bg-emerald-500/8 text-emerald-600" :
                            u.progress.avg_test_score >= 60 ? "bg-amber-500/8 text-amber-600" :
                            "bg-red-500/8 text-red-500"
                          }`}>{u.progress.avg_test_score}%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-text-muted">{u.progress.videos_completed}/{u.progress.videos_assigned}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {u.is_admin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/15">
                            <span className="material-symbols-outlined text-[11px]">shield</span>Admin
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.is_active
                            ? "bg-emerald-500/8 text-emerald-600 border border-emerald-500/12"
                            : "bg-red-500/8 text-red-500 border border-red-500/12"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {u.is_active ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-0.5">
                        {actionLoading === u.id ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-4" />
                        ) : (
                          <>
                            <button onClick={() => router.push(`/admin/users/${u.id}`)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-primary transition-all" title="View Details">
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                            <button onClick={() => toggleActive(u.id)} className={`p-1.5 rounded-lg hover:bg-surface-2 transition-all ${u.is_active ? "text-text-dim hover:text-amber-600" : "text-text-dim hover:text-emerald-600"}`} title={u.is_active ? "Disable" : "Enable"}>
                              <span className="material-symbols-outlined text-lg">{u.is_active ? "block" : "check_circle"}</span>
                            </button>
                            <button onClick={() => toggleAdmin(u.id)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-primary transition-all" title="Toggle Admin">
                              <span className="material-symbols-outlined text-lg">shield_person</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-surface-2/20">
            <span className="text-xs text-text-dim">Page <span className="font-semibold text-text-muted">{page}</span> of {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="w-8 h-8 text-xs rounded-lg bg-surface-1 border border-border text-text-muted hover:bg-surface-2 disabled:opacity-30 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) p = i + 1;
                else if (page <= 4) p = i + 1;
                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                else p = page - 3 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg transition-all ${
                      page === p
                        ? "bg-gradient-to-r from-primary to-violet-500 text-white font-semibold shadow-sm shadow-primary/20"
                        : "bg-surface-1 border border-border text-text-muted hover:bg-surface-2"
                    }`}
                  >{p}</button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="w-8 h-8 text-xs rounded-lg bg-surface-1 border border-border text-text-muted hover:bg-surface-2 disabled:opacity-30 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
