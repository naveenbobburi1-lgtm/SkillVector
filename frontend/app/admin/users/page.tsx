"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/auth";

type FilterStatus = "all" | "active" | "inactive" | "admin";

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  async function toggleActive(userId: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-active`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchUsers(page, search);
    } catch (e) { console.error(e); }
  }

  async function toggleAdmin(userId: number) {
    if (!confirm("Change this user's admin status?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-admin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchUsers(page, search);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { fetchUsers(page, search); }, [page, search, fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  // Client-side filtering on the fetched page
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">User Management</h1>
          <p className="text-text-muted text-sm mt-1">{total} total users</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined text-text-dim absolute left-3 top-1/2 -translate-y-1/2 text-lg">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="bg-surface-1 border border-border text-text-main rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-72 transition-colors"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-primary/15">
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-surface-2/70 rounded-full border border-border/50 w-fit">
        {(["all", "active", "inactive", "admin"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors capitalize ${
              filterStatus === f
                ? "bg-surface-1 text-text-main font-medium shadow-sm border border-border/50"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {f} {filterCounts[f] > 0 && <span className="text-text-dim text-xs ml-1">({filterCounts[f]})</span>}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-[11px] text-text-dim uppercase tracking-wider font-medium">User</th>
                <th className="text-left px-5 py-3 text-[11px] text-text-dim uppercase tracking-wider font-medium">Role / Goal</th>
                <th className="text-left px-5 py-3 text-[11px] text-text-dim uppercase tracking-wider font-medium">Path Progress</th>
                <th className="text-left px-5 py-3 text-[11px] text-text-dim uppercase tracking-wider font-medium">Tests</th>
                <th className="text-left px-5 py-3 text-[11px] text-text-dim uppercase tracking-wider font-medium">Videos</th>
                <th className="text-left px-5 py-3 text-[11px] text-text-dim uppercase tracking-wider font-medium">Status</th>
                <th className="text-right px-5 py-3 text-[11px] text-text-dim uppercase tracking-wider font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-text-dim text-sm">No users found</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{u.username?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <button onClick={() => router.push(`/admin/users/${u.id}`)} className="text-sm font-medium text-text-main hover:text-primary transition-colors">
                            {u.username}
                          </button>
                          <p className="text-[11px] text-text-dim">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-text-muted">{u.profile?.desired_role || <span className="text-text-dim italic">Not set</span>}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${u.progress.completion_rate}%` }} />
                        </div>
                        <span className="text-xs text-text-dim">{u.progress.completed_phases}/{u.progress.total_phases}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-text-muted">{u.progress.tests_passed}/{u.progress.total_tests} passed</span>
                      {u.progress.avg_test_score > 0 && <span className="text-xs text-text-dim ml-1">({u.progress.avg_test_score}%)</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-text-muted">{u.progress.videos_completed}/{u.progress.videos_assigned}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        {u.is_admin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/8 text-primary border border-primary/15">Admin</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          u.is_active
                            ? "bg-emerald-500/8 text-emerald-600 border border-emerald-500/15"
                            : "bg-red-500/8 text-red-600 border border-red-500/15"
                        }`}>
                          {u.is_active ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/admin/users/${u.id}`)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-main transition-colors" title="View Details">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button onClick={() => toggleActive(u.id)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-amber-600 transition-colors" title="Toggle Active">
                          <span className="material-symbols-outlined text-lg">{u.is_active ? "block" : "check_circle"}</span>
                        </button>
                        <button onClick={() => toggleAdmin(u.id)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-primary transition-colors" title="Toggle Admin">
                          <span className="material-symbols-outlined text-lg">shield_person</span>
                        </button>
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-xs text-text-dim">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
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
                    className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                      page === p
                        ? "bg-primary text-white font-medium shadow-sm"
                        : "bg-surface-2 text-text-muted hover:bg-surface-3"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
