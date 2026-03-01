"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/auth";

const ACTION_META: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  admin_login:   { label: "Admin Login",     icon: "login",            color: "text-primary",      bg: "bg-primary/8",       border: "border-primary/12" },
  toggle_active: { label: "Toggle Active",   icon: "toggle_on",        color: "text-amber-600",    bg: "bg-amber-500/8",     border: "border-amber-500/12" },
  toggle_admin:  { label: "Toggle Admin",    icon: "shield_person",    color: "text-primary",      bg: "bg-primary/8",       border: "border-primary/12" },
  create_video:  { label: "Create Video",    icon: "video_call",       color: "text-emerald-600",  bg: "bg-emerald-500/8",   border: "border-emerald-500/12" },
  delete_video:  { label: "Delete Video",    icon: "delete",           color: "text-red-500",      bg: "bg-red-500/8",       border: "border-red-500/12" },
  assign_video:  { label: "Assign Video",    icon: "assignment_add",   color: "text-blue-600",     bg: "bg-blue-500/8",      border: "border-blue-500/12" },
};

function getActionMeta(action: string) {
  return ACTION_META[action] || { label: action, icon: "info", color: "text-text-muted", bg: "bg-surface-3", border: "border-border" };
}

function relativeTime(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}

export default function AdminActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("all");
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/activity-log?page=${page}&per_page=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          setTotal(data.total || 0);
          setTotalPages(data.total_pages || 1);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchLogs();
  }, [page, token]);

  const actionTypes = ["all", ...Object.keys(ACTION_META)];
  const filtered = actionFilter === "all" ? logs : logs.filter((l) => l.action === actionFilter);

  /* Stats from current data */
  const todayLogs = logs.filter((l) => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const actionCounts = logs.reduce((acc: Record<string, number>, l: any) => { acc[l.action] = (acc[l.action] || 0) + 1; return acc; }, {});

  if (loading && page === 1) return (
    <div className="space-y-6">
      <div className="h-8 skeleton w-48" />
      <div className="grid grid-cols-3 gap-4">{[1,2,3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      <div className="h-12 skeleton w-full" />
      {[1,2,3,4,5].map((i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fadeInUp">
        <h2 className="text-lg font-bold text-text-main">Activity Log</h2>
        <p className="text-xs text-text-dim">{total} total event{total !== 1 && "s"} recorded</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp stagger-1">
        <StatCard icon="receipt_long" label="Total Events" value={total} color="violet" />
        <StatCard icon="today" label="Today" value={todayLogs.length} color="emerald" />
        <StatCard icon="warning" label="Deletions" value={actionCounts.delete_video || 0} color="rose" />
        <StatCard icon="login" label="Logins" value={actionCounts.admin_login || 0} color="blue" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 animate-fadeInUp stagger-2">
        <div className="flex gap-1 p-1 bg-surface-1 border border-border rounded-xl overflow-x-auto admin-scroll">
          {actionTypes.map((a) => {
            const meta = a === "all" ? null : getActionMeta(a);
            const count = a === "all" ? logs.length : (actionCounts[a] || 0);
            return (
              <button key={a} onClick={() => setActionFilter(a)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  actionFilter === a
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-text-muted hover:text-text-main hover:bg-surface-2"
                }`}>
                {meta && <span className="material-symbols-outlined text-sm">{meta.icon}</span>}
                {a === "all" ? "All" : meta!.label}
                {count > 0 && (
                  <span className={`text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold px-1 ${
                    actionFilter === a ? "bg-primary text-white" : "bg-surface-3 text-text-dim"
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Log Entries */}
      <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-text-dim mb-3">history</span>
            <p className="text-text-muted font-medium">No activity found</p>
            <p className="text-text-dim text-xs mt-1">Events will appear here as actions are performed</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((log: any, i: number) => {
              const meta = getActionMeta(log.action);
              return (
                <div key={log.id || i} className="flex items-center gap-4 px-5 py-4 hover:bg-primary/[0.015] transition-colors animate-fadeInUp" style={{ animationDelay: `${i * 25}ms` }}>
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${meta.bg} ${meta.border}`}>
                    <span className={`material-symbols-outlined text-lg ${meta.color}`}>{meta.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${meta.bg} ${meta.color} ${meta.border}`}>
                        {meta.label}
                      </span>
                      {log.admin_username && (
                        <span className="text-[11px] text-text-muted">
                          by <span className="font-medium text-text-main">{log.admin_username}</span>
                        </span>
                      )}
                    </div>
                    {log.details && <p className="text-xs text-text-muted mt-1 truncate">{log.details}</p>}
                    {log.target_user_id && (
                      <p className="text-[10px] text-text-dim mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        Target: User #{log.target_user_id}
                        {log.target_username && <span className="font-medium">({log.target_username})</span>}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-text-muted">{relativeTime(log.created_at)}</p>
                    <p className="text-[10px] text-text-dim">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between animate-fadeInUp">
          <p className="text-xs text-text-dim">
            Page {page} of {totalPages} · {total} events
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="p-2 rounded-xl border border-border hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed text-text-muted hover:text-text-main transition-all">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                    page === p
                      ? "bg-gradient-to-r from-primary to-violet-500 text-white shadow-sm shadow-primary/20"
                      : "border border-border text-text-muted hover:text-text-main hover:bg-surface-2"
                  }`}>{p}</button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="p-2 rounded-xl border border-border hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed text-text-muted hover:text-text-main transition-all">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    violet: "bg-primary/8 text-primary border-primary/12",
    emerald: "bg-emerald-500/8 text-emerald-600 border-emerald-500/12",
    blue: "bg-blue-500/8 text-blue-600 border-blue-500/12",
    rose: "bg-rose-500/8 text-rose-500 border-rose-500/12",
  };
  return (
    <div className="bg-surface-1 border border-border rounded-2xl p-4 card-hover animate-scaleIn">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div>
          <p className="text-xl font-bold text-text-main">{value}</p>
          <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">{label}</p>
        </div>
      </div>
    </div>
  );
}
