"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/auth";

interface LogEntry {
  id: number;
  admin_username: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

const actionConfig: Record<string, { icon: string; color: string; bg: string }> = {
  toggle_active: { icon: "toggle_on", color: "text-amber-600", bg: "bg-amber-500/8 border-amber-500/15" },
  toggle_admin: { icon: "shield_person", color: "text-primary", bg: "bg-primary/8 border-primary/15" },
  create_video: { icon: "video_call", color: "text-emerald-600", bg: "bg-emerald-500/8 border-emerald-500/15" },
  delete_video: { icon: "delete", color: "text-red-500", bg: "bg-red-500/8 border-red-500/15" },
  assign_video: { icon: "assignment", color: "text-blue-600", bg: "bg-blue-500/8 border-blue-500/15" },
  admin_login: { icon: "login", color: "text-text-muted", bg: "bg-surface-3 border-border" },
};

type FilterAction = "all" | string;

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<FilterAction>("all");

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  async function fetchLogs(pg = 1) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/activity-log?page=${pg}&per_page=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchLogs(page); }, [page]);

  function relativeTime(dateStr: string) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  }

  function formatAction(action: string) {
    return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const actionTypes = Array.from(new Set(logs.map(l => l.action)));
  const filtered = filterAction === "all" ? logs : logs.filter(l => l.action === filterAction);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Activity Log</h1>
          <p className="text-text-muted text-sm mt-1">{total} total entries</p>
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-surface-1 border border-border text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary appearance-none cursor-pointer w-fit"
        >
          <option value="all">All Actions</option>
          {actionTypes.map(a => <option key={a} value={a}>{formatAction(a)}</option>)}
        </select>
      </div>

      <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-text-dim text-sm">No activity yet</div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((log) => {
              const cfg = actionConfig[log.action] || { icon: "info", color: "text-text-dim", bg: "bg-surface-3 border-border" };
              return (
                <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-surface-2/30 transition-colors">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <span className="material-symbols-outlined text-lg">{cfg.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-main">{log.admin_username}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                        log.action === "delete_video"
                          ? "bg-red-50 text-red-500 border-red-200"
                          : log.action === "create_video"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : log.action === "assign_video"
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : "bg-surface-2 text-text-muted border-border"
                      }`}>
                        {formatAction(log.action)}
                      </span>
                    </div>
                    <div className="text-xs text-text-dim mt-0.5">
                      {log.target_type && <span className="capitalize">{log.target_type} #{log.target_id}</span>}
                      {log.details && <span className="ml-2">· {log.details}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] text-text-dim flex-shrink-0 mt-0.5">{relativeTime(log.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-xs text-text-dim">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs bg-surface-2 text-text-muted hover:bg-surface-3 rounded-lg disabled:opacity-30 transition-colors border border-border">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs bg-surface-2 text-text-muted hover:bg-surface-3 rounded-lg disabled:opacity-30 transition-colors border border-border">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
