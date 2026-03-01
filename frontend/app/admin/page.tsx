"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/auth";

function StatCard({ icon, label, value, sub, color = "violet" }: any) {
  const colors: any = {
    violet: "bg-primary/8 text-primary border-primary/15",
    green: "bg-emerald-500/8 text-emerald-600 border-emerald-500/15",
    blue: "bg-blue-500/8 text-blue-600 border-blue-500/15",
    orange: "bg-amber-500/8 text-amber-600 border-amber-500/15",
    red: "bg-red-500/8 text-red-600 border-red-500/15",
  };
  return (
    <div className="bg-surface-1 border border-border rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <span className="text-[11px] text-text-dim uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-text-main">{value}</div>
      {sub && <p className="text-xs text-text-dim mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("admin_token");
      try {
        const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setAnalytics(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!analytics) return <p className="text-text-muted">Failed to load analytics.</p>;
  const o = analytics.overview;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Real-time platform analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard icon="group" label="Total Users" value={o.total_users} sub={`+${o.new_users_week} this week`} color="violet" />
        <StatCard icon="person_check" label="Profiles Done" value={`${o.profile_completion_rate}%`} sub={`${o.total_profiles} profiles`} color="green" />
        <StatCard icon="route" label="Paths Generated" value={o.total_paths} sub={`${o.path_generation_rate}% of profiles`} color="blue" />
        <StatCard icon="quiz" label="Test Pass Rate" value={`${o.test_pass_rate}%`} sub={`Avg score: ${o.avg_test_score}`} color="orange" />
        <StatCard icon="play_circle" label="Video Completion" value={`${o.video_completion_rate}%`} sub={`${o.total_videos} active videos`} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Desired Roles */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6">
          <h3 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-4">Top Desired Roles</h3>
          <div className="space-y-3">
            {analytics.top_roles.length === 0 ? <p className="text-text-dim text-sm">No data yet</p> : analytics.top_roles.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/8 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <span className="text-sm text-text-main">{r.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((r.count / (analytics.top_roles[0]?.count || 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-text-dim w-6 text-right">{r.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6">
          <h3 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-4">Most Common Skills</h3>
          <div className="flex flex-wrap gap-2">
            {analytics.top_skills.length === 0 ? <p className="text-text-dim text-sm">No data yet</p> : analytics.top_skills.map((s: any, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/5 text-primary border border-primary/15" style={{ opacity: 0.5 + (s.count / (analytics.top_skills[0]?.count || 1)) * 0.5 }}>
                {s.skill} ({s.count})
              </span>
            ))}
          </div>
        </div>

        {/* Phase Completion */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6">
          <h3 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-4">Phase Completion Rates</h3>
          <div className="space-y-3">
            {analytics.phase_completion.length === 0 ? <p className="text-text-dim text-sm">No data yet</p> : analytics.phase_completion.map((p: any) => {
              const rate = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
              return (
                <div key={p.phase} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Phase {p.phase}</span>
                    <span className="text-text-dim">{p.completed}/{p.total} ({rate}%)</span>
                  </div>
                  <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: rate > 70 ? "var(--success)" : rate > 40 ? "var(--warning)" : "var(--primary)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6">
          <h3 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-4">Recent Admin Activity</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analytics.recent_activity.length === 0 ? <p className="text-text-dim text-sm">No activity yet</p> : analytics.recent_activity.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="w-7 h-7 rounded-lg bg-blue-500/8 border border-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-blue-600 text-sm">bolt</span>
                </div>
                <div>
                  <p className="text-sm text-text-main capitalize">{a.action.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-text-dim">{a.created_at ? new Date(a.created_at).toLocaleString() : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registration Trend */}
      <div className="bg-surface-1 border border-border rounded-2xl p-6">
        <h3 className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-4">User Registrations (Last 30 Days)</h3>
        {analytics.daily_registrations.length === 0 ? (
          <p className="text-text-dim text-sm">No data yet</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {analytics.daily_registrations.map((d: any, i: number) => {
              const max = Math.max(...analytics.daily_registrations.map((x: any) => x.count), 1);
              const height = (d.count / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-text-muted whitespace-nowrap bg-surface-1 border border-border px-1.5 py-0.5 rounded shadow-sm z-10">
                    {d.date}: {d.count}
                  </div>
                  <div className="w-full bg-primary/20 rounded-t hover:bg-primary/35 transition-colors min-h-[2px]" style={{ height: `${Math.max(height, 2)}%` }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
