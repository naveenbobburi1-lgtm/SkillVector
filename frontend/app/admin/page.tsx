"use client";

import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "@/lib/auth";

/* ─── Animated number counter ─── */
function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(undefined);
  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);
  return <>{prefix}{display}{suffix}</>;
}

/* ─── SVG Ring chart ─── */
function RingChart({ percent, size = 56, stroke = 5, color = "var(--primary)" }: { percent: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ "--circumference": circumference, "--dash-offset": offset, transition: "stroke-dashoffset 1.2s ease-out" } as any}
        className="chart-ring"
      />
    </svg>
  );
}

/* ─── Mini sparkline ─── */
function Sparkline({ data, color = "var(--primary)", height = 28, width = 80 }: { data: number[]; color?: string; height?: number; width?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * width},${height - (v / max) * (height - 2)}`).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {data.length > 1 && (
        <circle cx={width} cy={height - (data[data.length - 1] / max) * (height - 2)} r="2.5" fill={color} />
      )}
    </svg>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon, label, value, sub, color, sparkData, ringPercent, delay = 0 }: any) {
  const colorMap: Record<string, { icon: string; ring: string }> = {
    violet: { icon: "bg-primary/10 text-primary border-primary/15", ring: "var(--primary)" },
    emerald: { icon: "bg-emerald-500/10 text-emerald-600 border-emerald-500/15", ring: "#059669" },
    blue: { icon: "bg-blue-500/10 text-blue-600 border-blue-500/15", ring: "#2563eb" },
    amber: { icon: "bg-amber-500/10 text-amber-600 border-amber-500/15", ring: "#d97706" },
    rose: { icon: "bg-rose-500/10 text-rose-600 border-rose-500/15", ring: "#e11d48" },
  };
  const c = colorMap[color] || colorMap.violet;
  return (
    <div className={`bg-surface-1 border border-border rounded-2xl p-5 card-hover animate-fadeInUp stagger-${delay}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${c.icon}`}>
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </div>
          <span className="text-[11px] text-text-dim uppercase tracking-wider font-semibold">{label}</span>
        </div>
        {ringPercent !== undefined && <RingChart percent={ringPercent} size={42} stroke={4} color={c.ring} />}
        {sparkData && <Sparkline data={sparkData} color={c.ring} />}
      </div>
      <div className="text-3xl font-bold text-text-main tracking-tight">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </div>
      {sub && <p className="text-xs text-text-dim mt-1.5">{sub}</p>}
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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 skeleton" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-36 skeleton" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton" />)}
      </div>
    </div>
  );

  if (!analytics) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="material-symbols-outlined text-4xl text-text-dim">cloud_off</span>
      <p className="text-text-muted text-sm">Failed to load analytics</p>
    </div>
  );

  const o = analytics.overview;
  const dailyData = (analytics.daily_registrations || []).map((d: any) => d.count);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Real-time platform intelligence</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon="group" label="Total Users" value={o.total_users} sub={`+${o.new_users_week} this week`} color="violet" sparkData={dailyData} delay={1} />
        <StatCard icon="person_check" label="Profiles Done" value={`${o.profile_completion_rate}%`} sub={`${o.total_profiles} profiles`} color="emerald" ringPercent={o.profile_completion_rate} delay={2} />
        <StatCard icon="route" label="Paths Active" value={o.total_paths} sub={`${o.path_generation_rate}% gen rate`} color="blue" ringPercent={o.path_generation_rate} delay={3} />
        <StatCard icon="quiz" label="Test Pass Rate" value={`${o.test_pass_rate}%`} sub={`Avg: ${o.avg_test_score}`} color="amber" ringPercent={o.test_pass_rate} delay={4} />
        <StatCard icon="play_circle" label="Video Completion" value={`${o.video_completion_rate}%`} sub={`${o.total_videos} videos`} color="rose" ringPercent={o.video_completion_rate} delay={5} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6 card-hover animate-fadeInUp stagger-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-text-main">Registration Trend</h3>
              <p className="text-[11px] text-text-dim mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] text-primary font-medium">Live</span>
            </div>
          </div>
          {(analytics.daily_registrations || []).length === 0 ? (
            <div className="h-36 flex items-center justify-center text-text-dim text-sm">No registration data</div>
          ) : (
            <div className="relative">
              <div className="flex items-end gap-[3px] h-36">
                {analytics.daily_registrations.map((d: any, i: number) => {
                  const max = Math.max(...analytics.daily_registrations.map((x: any) => x.count), 1);
                  const height = Math.max((d.count / max) * 100, 3);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] bg-text-main text-white px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-10 pointer-events-none">
                        <div className="font-medium">{d.count} users</div>
                        <div className="text-white/60 text-[9px]">{d.date}</div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-text-main" />
                      </div>
                      <div
                        className="w-full rounded-t-sm bg-primary/20 hover:bg-primary/40 transition-all duration-200 animate-bar-grow"
                        style={{ height: `${height}%`, animationDelay: `${i * 20}ms` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[9px] text-text-dim">
                <span>{analytics.daily_registrations[0]?.date}</span>
                <span>{analytics.daily_registrations[analytics.daily_registrations.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* Top Desired Roles */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6 card-hover animate-fadeInUp stagger-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-text-main">Top Desired Roles</h3>
              <p className="text-[11px] text-text-dim mt-0.5">Most popular career targets</p>
            </div>
            <span className="material-symbols-outlined text-text-dim text-lg">trending_up</span>
          </div>
          <div className="space-y-3">
            {(analytics.top_roles || []).length === 0 ? (
              <p className="text-text-dim text-sm py-8 text-center">No data yet</p>
            ) : analytics.top_roles.slice(0, 6).map((r: any, i: number) => {
              const maxCount = analytics.top_roles[0]?.count || 1;
              const pct = Math.round((r.count / maxCount) * 100);
              const colors = ["bg-primary", "bg-violet-400", "bg-blue-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500"];
              return (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold text-text-dim w-5">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-sm text-text-main group-hover:text-primary transition-colors">{r.role}</span>
                    </div>
                    <span className="text-xs font-semibold text-text-muted">{r.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden ml-7">
                    <div className={`h-full rounded-full animate-bar-grow ${colors[i % colors.length]}`} style={{ width: `${pct}%`, opacity: 0.7 + (pct / 100) * 0.3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase Completion */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6 card-hover animate-fadeInUp stagger-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-text-main">Phase Completion</h3>
              <p className="text-[11px] text-text-dim mt-0.5">Learning path milestones</p>
            </div>
            <span className="material-symbols-outlined text-text-dim text-lg">school</span>
          </div>
          {(analytics.phase_completion || []).length === 0 ? (
            <p className="text-text-dim text-sm py-8 text-center">No data yet</p>
          ) : (
            <div className="space-y-4">
              {analytics.phase_completion.map((p: any) => {
                const rate = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
                const color = rate > 70 ? "#059669" : rate > 40 ? "#d97706" : "var(--primary)";
                return (
                  <div key={p.phase} className="flex items-center gap-4">
                    <RingChart percent={rate} size={40} stroke={3.5} color={color} />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-text-main">Phase {p.phase}</span>
                        <span className="text-xs font-bold" style={{ color }}>{rate}%</span>
                      </div>
                      <div className="w-full h-1 bg-surface-3 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full rounded-full animate-bar-grow" style={{ width: `${rate}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-[10px] text-text-dim mt-0.5 block">{p.completed}/{p.total} completed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Skills Cloud */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6 card-hover animate-fadeInUp stagger-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-text-main">Skills Landscape</h3>
              <p className="text-[11px] text-text-dim mt-0.5">Most common user skills</p>
            </div>
            <span className="material-symbols-outlined text-text-dim text-lg">category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(analytics.top_skills || []).length === 0 ? (
              <p className="text-text-dim text-sm py-8 text-center w-full">No data yet</p>
            ) : analytics.top_skills.map((s: any, i: number) => {
              const maxCount = analytics.top_skills[0]?.count || 1;
              const intensity = 0.4 + (s.count / maxCount) * 0.6;
              const sizes = s.count / maxCount > 0.7 ? "text-sm px-3.5 py-1.5" : s.count / maxCount > 0.4 ? "text-xs px-3 py-1" : "text-[11px] px-2.5 py-1";
              return (
                <span
                  key={i}
                  className={`rounded-full font-medium bg-primary/5 text-primary border border-primary/15 hover:bg-primary/10 transition-colors cursor-default animate-scaleIn ${sizes}`}
                  style={{ opacity: intensity, animationDelay: `${i * 40}ms` }}
                  title={`${s.count} users`}
                >
                  {s.skill}
                  <span className="text-primary/50 ml-1 text-[10px]">{s.count}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface-1 border border-border rounded-2xl card-hover animate-fadeInUp stagger-8">
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h3 className="text-sm font-semibold text-text-main">Recent Admin Activity</h3>
            <p className="text-[11px] text-text-dim mt-0.5">Latest platform actions</p>
          </div>
          <a href="/admin/activity" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
            View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
        <div className="p-6 pt-4">
          {(analytics.recent_activity || []).length === 0 ? (
            <p className="text-text-dim text-sm py-6 text-center">No activity yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analytics.recent_activity.slice(0, 6).map((a: any, i: number) => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2/50 transition-colors animate-slideInRight`} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-text-main capitalize truncate">{a.action.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-text-dim">{a.created_at ? new Date(a.created_at).toLocaleString() : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
